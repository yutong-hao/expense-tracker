const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const db = require("./db");

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const BCRYPT_ROUNDS = 10;
const DEFAULT_CATEGORIES = [
  { name: "Food", bg: "#ead5be", border: "#d4b896" },
  { name: "Shopping", bg: "hsl(207 51% 83%)", border: "hsl(207 40% 71%)" },
  { name: "Transport", bg: "hsl(184 51% 83%)", border: "hsl(184 40% 71%)" },
  { name: "Utilities", bg: "hsl(350 51% 83%)", border: "hsl(350 40% 71%)" }
];
const EXPENSE_SORTS = {
  "date-desc": "expense_date DESC, id DESC",
  "date-asc": "expense_date ASC, id ASC",
  "amount-desc": "CAST(amount AS DECIMAL(10,2)) DESC, id DESC",
  "amount-asc": "CAST(amount AS DECIMAL(10,2)) ASC, id ASC",
  "title-asc": "title ASC, id ASC"
};
const ADMIN_ACCOUNTS = parseAdminAccounts();

app.use(cors());
app.use(express.json());

function query(sql, params = []) {
  return db.promise().query(sql, params);
}

function parseAdminAccounts() {
  if (process.env.ADMIN_ACCOUNTS) {
    return process.env.ADMIN_ACCOUNTS
      .split(";")
      .map(entry => {
        const [username, password] = entry.split(":");
        return { username: username?.trim(), password: password?.trim() };
      })
      .filter(account => account.username && account.password);
  }

  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    return [{
      username: process.env.ADMIN_USERNAME.trim(),
      password: process.env.ADMIN_PASSWORD
    }];
  }

  return [];
}

function normalizeCategoryName(name) {
  return String(name || "").trim();
}

function extractHslHue(color) {
  const match = String(color || "").match(/^hsl\((\d{1,3})\s+/);
  return match ? Number(match[1]) : null;
}

function hueDistance(a, b) {
  const distance = Math.abs(a - b);
  return Math.min(distance, 360 - distance);
}

function createRandomCategoryColors(existingCategories = []) {
  const existingHues = existingCategories
    .map(category => extractHslHue(category.bg_color))
    .filter(hue => Number.isFinite(hue));

  let hue = Math.floor(Math.random() * 360);

  for (let attempt = 0; attempt < 36; attempt += 1) {
    const candidate = (hue + attempt * 47) % 360;
    const differentEnough = existingHues.every(existingHue => hueDistance(candidate, existingHue) >= 28);

    if (differentEnough) {
      hue = candidate;
      break;
    }
  }

  return {
    bg: `hsl(${hue} 51% 83%)`,
    border: `hsl(${hue} 40% 71%)`
  };
}

async function categoryExists(category) {
  const [rows] = await query("SELECT id FROM categories WHERE name = ? LIMIT 1", [category]);
  return rows.length > 0;
}

function isValidDate(dateStr) {
  return /^[1-9]\d{3}-\d{2}-\d{2}$/.test(dateStr);
}

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isFutureDate(dateStr) {
  return isValidDate(dateStr) && dateStr > getTodayDateString();
}

function isPositiveAmount(value) {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) && amount > 0;
}

function getPagination(queryParams) {
  const page = Math.max(1, Number.parseInt(queryParams.page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(queryParams.pageSize, 10) || 10));

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize
  };
}

function createPagination(total, page, pageSize) {
  return {
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    total
  };
}

function getExpenseSort(sort) {
  return EXPENSE_SORTS[sort] || EXPENSE_SORTS["date-desc"];
}

function addExpenseFilterConditions(where, params, filters) {
  const {
    search = "",
    category = "",
    minAmount = "",
    maxAmount = ""
  } = filters;
  const searchText = String(search).trim();
  const minValue = Number.parseFloat(minAmount);
  const maxValue = Number.parseFloat(maxAmount);

  if (searchText) {
    where.push("(title LIKE ? OR category LIKE ? OR description LIKE ?)");
    params.push(`%${searchText}%`, `%${searchText}%`, `%${searchText}%`);
  }

  if (category) {
    where.push("category = ?");
    params.push(category);
  }

  if (Number.isFinite(minValue)) {
    where.push("CAST(amount AS DECIMAL(10,2)) >= ?");
    params.push(minValue);
  }

  if (Number.isFinite(maxValue)) {
    where.push("CAST(amount AS DECIMAL(10,2)) <= ?");
    params.push(maxValue);
  }
}

function validateExpensePayload({ title, category, amount, date }) {
  if (!title || !category || amount === undefined || !date) {
    return "Missing required fields";
  }

  if (!isPositiveAmount(amount)) {
    return "Amount must be greater than 0";
  }

  if (!isValidDate(date)) {
    return "Date must be YYYY-MM-DD and year cannot start with 0";
  }

  if (isFutureDate(date)) {
    return "Future dates cannot be selected";
  }

  return "";
}

function getActivityActionPattern(action) {
  if (!action) return "";
  if (["create", "update", "delete"].includes(action)) return `${action}%`;
  return action;
}

function getActivityDateFilter(queryParams) {
  if (isValidDate(queryParams.date)) {
    const [year, month, day] = String(queryParams.date).split("-");
    return { year, month, day };
  }

  const year = String(queryParams.dateYear || "");
  const month = String(queryParams.dateMonth || "");
  const day = String(queryParams.dateDay || "");

  if (!/^[1-9]\d{3}$/.test(year)) return null;
  if (!/^(0[1-9]|1[0-2])$/.test(month)) return { year, month: "", day: "" };
  if (!/^(0[1-9]|[12]\d|3[01])$/.test(day)) return { year, month, day: "" };

  return { year, month, day };
}

function createActivityDateCondition(column, queryParams) {
  const filter = getActivityDateFilter(queryParams);

  if (!filter) return null;

  if (filter.year && filter.month && filter.day) {
    return {
      sql: `DATE(${column}) = ?`,
      params: [`${filter.year}-${filter.month}-${filter.day}`]
    };
  }

  if (filter.year && filter.month) {
    return {
      sql: `DATE_FORMAT(${column}, '%Y-%m') = ?`,
      params: [`${filter.year}-${filter.month}`]
    };
  }

  return {
    sql: `YEAR(${column}) = ?`,
    params: [filter.year]
  };
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

async function verifyPassword(password, storedHash) {
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

  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      bg_color VARCHAR(40) NOT NULL,
      border_color VARCHAR(40) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const category of DEFAULT_CATEGORIES) {
    await query(
      `
        INSERT INTO categories (name, bg_color, border_color)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          bg_color = VALUES(bg_color),
          border_color = VALUES(border_color)
      `,
      [category.name, category.bg, category.border]
    );
  }

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

  if (ADMIN_ACCOUNTS.length) {
    for (const account of ADMIN_ACCOUNTS) {
      const adminHash = await hashPassword(account.password);
      await query(
        `
          INSERT INTO users (username, password_hash, role)
          VALUES (?, ?, 'admin')
          ON DUPLICATE KEY UPDATE role = 'admin'
        `,
        [account.username, adminHash]
      );
    }
  } else {
    console.warn("No admin seed account configured. Set ADMIN_USERNAME/ADMIN_PASSWORD if you need one.");
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

app.put("/api/auth/profile", authenticate, async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  const cleanUsername = String(username || "").trim();
  const wantsPasswordChange = Boolean(newPassword);

  if (!cleanUsername) {
    return res.status(400).json({ error: "Username is required" });
  }

  if (wantsPasswordChange) {
    if (!currentPassword) {
      return res.status(400).json({ error: "Current password is required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
  }

  try {
    const [users] = await query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (wantsPasswordChange) {
      if (!(await verifyPassword(currentPassword, user.password_hash))) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      if (String(newPassword) === String(currentPassword)) {
        return res.status(400).json({ error: "New password must be different from current password" });
      }
    }

    const updates = ["username = ?"];
    const params = [cleanUsername];

    if (wantsPasswordChange) {
      updates.push("password_hash = ?");
      params.push(await hashPassword(newPassword));
    }

    params.push(req.user.id);
    await query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);

    const [updatedUsers] = await query(
      "SELECT id, username, role FROM users WHERE id = ?",
      [req.user.id]
    );
    const updatedUser = updatedUsers[0];

    await logActivity(
      req.user.id,
      wantsPasswordChange ? "update_profile_password" : "update_profile",
      wantsPasswordChange ? "Updated username/password settings" : "Updated username"
    );

    res.json({
      token: createToken(updatedUser),
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role
      }
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Username already exists" });
    }

    console.error("Profile update failed:", err);
    res.status(500).json({ error: "Profile update failed" });
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
    const [users] = await query("SELECT * FROM users WHERE username = ?", [cleanUsername]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ error: "Username not found" });
    }

    await query("UPDATE users SET password_hash = ? WHERE id = ?", [await hashPassword(newPassword), user.id]);
    await logActivity(user.id, "change_password", "Changed password from login page");

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

app.get("/api/categories", authenticate, async (req, res) => {
  try {
    const [categories] = await query(
      "SELECT id, name, bg_color, border_color, created_at FROM categories ORDER BY name ASC"
    );
    res.json(categories);
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.post("/api/categories", authenticate, async (req, res) => {
  const name = normalizeCategoryName(req.body.name);

  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    const [existingCategories] = await query("SELECT bg_color FROM categories");
    const colors = createRandomCategoryColors(existingCategories);
    const [result] = await query(
      "INSERT INTO categories (name, bg_color, border_color) VALUES (?, ?, ?)",
      [name, colors.bg, colors.border]
    );
    await logActivity(req.user.id, "create_category", `Created ledger ${name}`);
    res.status(201).json({
      id: result.insertId,
      name,
      bg_color: colors.bg,
      border_color: colors.border
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Ledger already exists" });
    }

    console.error("Failed to create ledger:", err);
    res.status(500).json({ error: "Failed to create ledger" });
  }
});

app.put("/api/categories/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const name = normalizeCategoryName(req.body.name);

  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    const [existingRows] = await query("SELECT name FROM categories WHERE id = ?", [id]);
    const existing = existingRows[0];

    if (!existing) {
      return res.status(404).json({ error: "Ledger not found" });
    }

    const [result] = await query(
      "UPDATE categories SET name = ? WHERE id = ?",
      [name, id]
    );

    if (existing.name !== name) {
      await query("UPDATE expenses SET category = ? WHERE category = ?", [name, existing.name]);
    }

    await logActivity(req.user.id, "update_category", `Renamed ledger ${existing.name} to ${name}`);
    res.json({ message: "Ledger updated successfully", changed: result.changedRows });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Ledger already exists" });
    }

    console.error("Failed to update ledger:", err);
    res.status(500).json({ error: "Failed to update ledger" });
  }
});

app.delete("/api/categories/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  let transactionStarted = false;

  try {
    const [categories] = await query("SELECT name FROM categories WHERE id = ?", [id]);
    const category = categories[0];

    if (!category) {
      return res.status(404).json({ error: "Ledger not found" });
    }

    const [expenseRows] = await query(
      "SELECT COUNT(*) AS total FROM expenses WHERE category = ?",
      [category.name]
    );
    const deletedExpenseCount = Number(expenseRows[0]?.total || 0);

    await query("START TRANSACTION");
    transactionStarted = true;
    await query("DELETE FROM expenses WHERE category = ?", [category.name]);
    await query("DELETE FROM categories WHERE id = ?", [id]);
    await query("COMMIT");
    transactionStarted = false;

    await logActivity(
      req.user.id,
      "delete_category",
      `Deleted ledger ${category.name} and ${deletedExpenseCount} ${deletedExpenseCount === 1 ? "bill" : "bills"}`
    );
    res.json({
      message: "Ledger deleted successfully",
      deletedExpenses: deletedExpenseCount
    });
  } catch (err) {
    if (transactionStarted) {
      try {
        await query("ROLLBACK");
      } catch (rollbackErr) {
        console.error("Failed to roll back ledger deletion:", rollbackErr);
      }
    }

    console.error("Failed to delete ledger:", err);
    res.status(500).json({ error: "Failed to delete ledger" });
  }
});

app.get("/api/expenses", authenticate, async (req, res) => {
  const { sort = "date-desc", month = "", id = "" } = req.query;
  const { page, pageSize, offset } = getPagination({
    ...req.query,
    pageSize: req.query.pageSize || 24
  });
  const where = ["user_id = ?"];
  const params = [req.user.id];
  const expenseId = Number.parseInt(id, 10);

  addExpenseFilterConditions(where, params, req.query);

  if (/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(String(month))) {
    where.push("SUBSTRING(expense_date, 1, 7) = ?");
    params.push(month);
  }

  if (Number.isInteger(expenseId) && expenseId > 0) {
    where.push("id = ?");
    params.push(expenseId);
  }

  try {
    const [countRows] = await query(
      `
        SELECT COUNT(*) AS total
        FROM expenses
        WHERE ${where.join(" AND ")}
      `,
      params
    );
    const total = Number(countRows[0]?.total || 0);
    const [expenses] = await query(
      `
        SELECT *
        FROM expenses
        WHERE ${where.join(" AND ")}
        ORDER BY ${getExpenseSort(sort)}
        LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    res.json({
      expenses,
      pagination: createPagination(total, page, pageSize)
    });
  } catch (err) {
    console.error("Failed to fetch expenses:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.post("/api/expenses", authenticate, async (req, res) => {
  const { title, category, amount, date, description } = req.body;
  const validationError = validateExpensePayload(req.body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    if (!(await categoryExists(category))) {
      return res.status(400).json({ error: "Category does not exist" });
    }

    const [result] = await query(
      `
        INSERT INTO expenses (user_id, title, category, amount, expense_date, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [req.user.id, title, category, amount, date, description || ""]
    );

    await logActivity(req.user.id, "create_expense", `Created expense #${result.insertId}: ${title}`);
    res.status(201).json({
      message: "Expense added successfully",
      id: result.insertId
    });
  } catch (err) {
    console.error("Failed to add expense:", err);
    res.status(500).json({ error: "Failed to add expense" });
  }
});

app.put("/api/expenses/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, category, amount, date, description } = req.body;
  const validationError = validateExpensePayload(req.body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    if (!(await categoryExists(category))) {
      return res.status(400).json({ error: "Category does not exist" });
    }

    const [result] = await query(
      `
        UPDATE expenses
        SET title = ?, category = ?, amount = ?, expense_date = ?, description = ?
        WHERE id = ? AND user_id = ?
      `,
      [title, category, amount, date, description || "", id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    await logActivity(req.user.id, "update_expense", `Updated expense #${id}: ${title}`);
    res.json({ message: "Expense updated successfully" });
  } catch (err) {
    console.error("Failed to update expense:", err);
    res.status(500).json({ error: "Failed to update expense" });
  }
});

app.delete("/api/expenses/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await query("DELETE FROM expenses WHERE id = ? AND user_id = ?", [id, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    await logActivity(req.user.id, "delete_expense", `Deleted expense #${id}`);
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Failed to delete expense:", err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

app.get("/api/summary/category", authenticate, async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT category, SUM(amount) AS total
      FROM expenses
      WHERE user_id = ?
      GROUP BY category
      ORDER BY total DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch category summary:", err);
    res.status(500).json({ error: "Database query failed" });
  }
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

app.get("/api/summary/month-expenses", authenticate, async (req, res) => {
  const month = String(req.query.month || "");
  const { sort = "date-desc" } = req.query;
  const where = ["user_id = ?", "SUBSTRING(expense_date, 1, 7) = ?"];
  const params = [req.user.id, month];

  if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month)) {
    return res.status(400).json({ error: "Month must be in YYYY-MM format" });
  }

  addExpenseFilterConditions(where, params, req.query);

  try {
    const [rows] = await query(`
      SELECT id, title, category, amount, expense_date, description, created_at
      FROM expenses
      WHERE ${where.join(" AND ")}
      ORDER BY ${getExpenseSort(sort)}
    `, params);

    res.json(rows);
  } catch (err) {
    console.error("MONTH EXPENSES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch month expenses" });
  }
});

app.get("/api/admin/activity-dates", authenticate, requireAdmin, async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT DISTINCT DATE_FORMAT(created_at, '%Y-%m-%d') AS activity_date
      FROM user_activity
      ORDER BY activity_date DESC
    `);

    res.json({
      dates: rows.map(row => row.activity_date).filter(Boolean)
    });
  } catch (err) {
    console.error("Failed to fetch activity dates:", err);
    res.status(500).json({ error: "Failed to fetch activity dates" });
  }
});

app.get("/api/admin/users", authenticate, requireAdmin, async (req, res) => {
  const { search = "", role = "", action = "" } = req.query;
  const { page, pageSize, offset } = getPagination(req.query);
  const where = [];
  const params = [];
  const searchText = String(search).trim();
  const actionPattern = getActivityActionPattern(action);
  const dateCondition = createActivityDateCondition("ax.created_at", req.query);
  const activityWhere = [];
  const activityParams = [];

  if (searchText) {
    const searchPattern = `%${searchText}%`;
    where.push(`(
      u.username LIKE ?
      OR u.role LIKE ?
      OR EXISTS (
        SELECT 1
        FROM user_activity sx
        WHERE sx.user_id = u.id
          AND (sx.action LIKE ? OR sx.details LIKE ?)
      )
    )`);
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (["user", "admin"].includes(role)) {
    where.push("u.role = ?");
    params.push(role);
  }

  if (dateCondition) {
    activityWhere.push(dateCondition.sql);
    activityParams.push(...dateCondition.params);
  }

  if (actionPattern) {
    activityWhere.push("ax.action LIKE ?");
    activityParams.push(actionPattern);
  }

  if (activityWhere.length) {
    where.push(`EXISTS (SELECT 1 FROM user_activity ax WHERE ax.user_id = u.id AND ${activityWhere.join(" AND ")})`);
    params.push(...activityParams);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [countRows] = await query(
      `
        SELECT COUNT(*) AS total
        FROM users u
        ${whereSql}
      `,
      params
    );

    const total = Number(countRows[0]?.total || 0);
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
      ${whereSql}
      GROUP BY u.id, u.username, u.role, u.created_at
      ORDER BY u.id ASC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    res.json({
      users,
      pagination: createPagination(total, page, pageSize)
    });
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
  const { search = "", role = "", action = "" } = req.query;
  const { page, pageSize, offset } = getPagination(req.query);
  const where = [];
  const params = [];
  const searchText = String(search).trim();
  const actionPattern = getActivityActionPattern(action);
  const dateCondition = createActivityDateCondition("a.created_at", req.query);

  if (searchText) {
    const searchPattern = `%${searchText}%`;
    where.push("(u.username LIKE ? OR u.role LIKE ? OR a.action LIKE ? OR a.details LIKE ?)");
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (["user", "admin"].includes(role)) {
    where.push("u.role = ?");
    params.push(role);
  }

  if (dateCondition) {
    where.push(dateCondition.sql);
    params.push(...dateCondition.params);
  }

  if (actionPattern) {
    where.push("a.action LIKE ?");
    params.push(actionPattern);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [countRows] = await query(`
      SELECT COUNT(*) AS total
      FROM user_activity a
      JOIN users u ON u.id = a.user_id
      ${whereSql}
    `, params);

    const total = Number(countRows[0]?.total || 0);
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
      ${whereSql}
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    res.json({
      activities,
      pagination: createPagination(total, page, pageSize)
    });
  } catch (err) {
    console.error("Failed to fetch user activity:", err);
    res.status(500).json({ error: "Failed to fetch user activity" });
  }
});

initializeAuthTables()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      if (!process.env.JWT_SECRET) {
        console.warn("JWT_SECRET is not set; using a temporary development secret for this server run.");
      }
      console.log(`Admin seed accounts configured: ${ADMIN_ACCOUNTS.length}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize authentication tables:", err);
  });
