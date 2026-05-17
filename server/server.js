const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db");

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "expense-tracker-dev-secret";
const BCRYPT_ROUNDS = 10;
const ADMIN_ACCOUNTS = [
  { username: "admin123", password: "123456" },
  { username: "zzy", password: "654321" }
];

app.use(cors());
app.use(express.json());

function query(sql, params = []) {
  return db.promise().query(sql, params);
}

function isValidDate(dateStr) {
  return /^[1-9]\d{3}-\d{2}-\d{2}$/.test(dateStr);
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function parseBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function verifyPassword(password, storedHash) {
  return bcrypt.compare(password, storedHash || "");
}

function createToken(user) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
  }));
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  const [header, payload, signature] = String(token || "").split(".");
  if (!header || !payload || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (signature.length !== expectedSignature.length) return null;

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const data = JSON.parse(parseBase64Url(payload));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch (err) {
    return null;
  }
}

async function logActivity(userId, action, details = "") {
  if (!userId) return;

  try {
    await query(
      "INSERT INTO user_activity (user_id, action, details) VALUES (?, ?, ?)",
      [userId, action, details]
    );
  } catch (err) {
    console.error("Failed to log user activity:", err);
  }
}

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const [users] = await query(
      "SELECT id, username, role, created_at FROM users WHERE id = ?",
      [payload.id]
    );

    if (!users.length) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    req.user = users[0];
    next();
  } catch (err) {
    console.error("Authentication failed:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

async function initializeAuthTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS user_activity (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      action VARCHAR(100) NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const [expenseColumns] = await query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'expenses'
        AND COLUMN_NAME = 'user_id'
    `
  );

  if (!expenseColumns.length) {
    await query("ALTER TABLE expenses ADD COLUMN user_id INT NULL AFTER id");
  }

  for (const account of ADMIN_ACCOUNTS) {
    const adminHash = await hashPassword(account.password);
    await query(
      `
        INSERT INTO users (username, password_hash, role)
        VALUES (?, ?, 'admin')
        ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin'
      `,
      [account.username, adminHash]
    );
  }
}

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = String(username || "").trim();

  if (!cleanUsername || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const passwordHash = await hashPassword(password);
    const [result] = await query(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'user')",
      [cleanUsername, passwordHash]
    );

    await logActivity(result.insertId, "register", "Registered a new account");

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Username already exists" });
    }

    console.error("Registration failed:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = String(username || "").trim();

  if (!cleanUsername || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const [users] = await query("SELECT * FROM users WHERE username = ?", [cleanUsername]);
    const user = users[0];

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    await logActivity(user.id, "login", "Logged in");

    res.json({
      token: createToken(user),
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/change-password", async (req, res) => {
  const { username, newPassword } = req.body;
  const cleanUsername = String(username || "").trim();

  if (!cleanUsername || !newPassword) {
    return res.status(400).json({ error: "Username and new password are required" });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const passwordHash = await hashPassword(newPassword);
    const [result] = await query(
      "UPDATE users SET password_hash = ? WHERE username = ?",
      [passwordHash, cleanUsername]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Username not found" });
    }

    const [users] = await query("SELECT id FROM users WHERE username = ?", [cleanUsername]);
    await logActivity(users[0]?.id, "change_password", "Changed password from login page");

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Password change failed:", err);
    res.status(500).json({ error: "Password change failed" });
  }
});

app.post("/api/auth/logout", authenticate, async (req, res) => {
  await logActivity(req.user.id, "logout", "Logged out");
  res.json({ message: "Logout recorded" });
});

app.get("/api/expenses", authenticate, (req, res) => {
  const sql = "SELECT * FROM expenses WHERE user_id = ? ORDER BY id DESC";

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("Failed to fetch expenses:", err);
      return res.status(500).json({ error: "Database query failed" });
    }

    res.json(results);
  });
});

app.post("/api/expenses", authenticate, (req, res) => {
  const { title, category, amount, date, description } = req.body;

  if (!title || !category || amount === undefined || !date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!isValidDate(date)) {
    return res.status(400).json({
      error: "Date must be YYYY-MM-DD and year cannot start with 0"
    });
  }

  const sql = `
    INSERT INTO expenses (user_id, title, category, amount, expense_date, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [req.user.id, title, category, amount, date, description || ""], async (err, result) => {
    if (err) {
      console.error("Failed to add expense:", err);
      return res.status(500).json({ error: "Failed to add expense" });
    }

    await logActivity(req.user.id, "create_expense", `Created expense #${result.insertId}: ${title}`);

    res.status(201).json({
      message: "Expense added successfully",
      id: result.insertId
    });
  });
});

app.put("/api/expenses/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { title, category, amount, date, description } = req.body;

  if (!title || !category || amount === undefined || !date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!isValidDate(date)) {
    return res.status(400).json({
      error: "Date must be YYYY-MM-DD and year cannot start with 0"
    });
  }

  const sql = `
    UPDATE expenses
    SET title = ?, category = ?, amount = ?, expense_date = ?, description = ?
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [title, category, amount, date, description || "", id, req.user.id], async (err, result) => {
    if (err) {
      console.error("Failed to update expense:", err);
      return res.status(500).json({ error: "Failed to update expense" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    await logActivity(req.user.id, "update_expense", `Updated expense #${id}: ${title}`);
    res.json({ message: "Expense updated successfully" });
  });
});

app.delete("/api/expenses/:id", authenticate, (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM expenses WHERE id = ? AND user_id = ?";

  db.query(sql, [id, req.user.id], async (err, result) => {
    if (err) {
      console.error("Failed to delete expense:", err);
      return res.status(500).json({ error: "Failed to delete expense" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    await logActivity(req.user.id, "delete_expense", `Deleted expense #${id}`);
    res.json({ message: "Expense deleted successfully" });
  });
});

app.get("/api/summary/category", authenticate, (req, res) => {
  const sql = `
    SELECT category, SUM(amount) AS total
    FROM expenses
    WHERE user_id = ?
    GROUP BY category
    ORDER BY total DESC
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("Failed to fetch category summary:", err);
      return res.status(500).json({ error: "Database query failed" });
    }

    res.json(results);
  });
});

app.get("/api/summary/monthly", authenticate, async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT
        SUBSTRING(expense_date, 1, 7) AS month,
        SUM(CAST(amount AS DECIMAL(10,2))) AS total
      FROM expenses
      WHERE user_id = ?
      GROUP BY SUBSTRING(expense_date, 1, 7)
      ORDER BY month DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error("MONTHLY ERROR:", err);
    res.status(500).json({ error: "Failed to fetch monthly summary" });
  }
});

app.get("/api/admin/users", authenticate, requireAdmin, async (req, res) => {
  try {
    const [users] = await query(`
      SELECT
        u.id,
        u.username,
        u.role,
        u.created_at,
        MAX(a.created_at) AS last_activity_at,
        COUNT(a.id) AS activity_count
      FROM users u
      LEFT JOIN user_activity a ON a.user_id = u.id
      GROUP BY u.id, u.username, u.role, u.created_at
      ORDER BY u.id ASC
    `);

    res.json(users);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.put("/api/admin/users/:id", authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ error: "Role must be user or admin" });
  }

  try {
    const [result] = await query("UPDATE users SET role = ? WHERE id = ?", [role, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await logActivity(req.user.id, "update_user", `Changed user #${id} role to ${role}`);
    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Failed to update user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/api/admin/users/:id", authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (Number(id) === Number(req.user.id)) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }

  try {
    const [result] = await query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await logActivity(req.user.id, "delete_user", `Deleted user #${id}`);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Failed to delete user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.get("/api/admin/activities", authenticate, requireAdmin, async (req, res) => {
  try {
    const [activities] = await query(`
      SELECT
        a.id,
        a.action,
        a.details,
        a.created_at,
        u.username,
        u.role
      FROM user_activity a
      JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT 100
    `);

    res.json(activities);
  } catch (err) {
    console.error("Failed to fetch user activity:", err);
    res.status(500).json({ error: "Failed to fetch user activity" });
  }
});

initializeAuthTables()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log("Admin accounts ready: admin123 / 123456, zzy / 654321");
    });
  })
  .catch((err) => {
    console.error("Failed to initialize authentication tables:", err);
  });
