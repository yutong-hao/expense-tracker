const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

function isValidDate(dateStr) {
  return /^[1-9]\d{3}-\d{2}-\d{2}$/.test(dateStr);
}

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/api/expenses", (req, res) => {
  const sql = "SELECT * FROM expenses ORDER BY id DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Failed to fetch expenses:", err);
      return res.status(500).json({ error: "Database query failed" });
    }

    res.json(results);
  });
});

app.post("/api/expenses", (req, res) => {
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
    INSERT INTO expenses (title, category, amount, expense_date, description)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [title, category, amount, date, description || ""], (err, result) => {
    if (err) {
      console.error("Failed to add expense:", err);
      return res.status(500).json({ error: "Failed to add expense" });
    }

    res.status(201).json({
      message: "Expense added successfully",
      id: result.insertId
    });
  });
});

app.put("/api/expenses/:id", (req, res) => {
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
    WHERE id = ?
  `;

  db.query(sql, [title, category, amount, date, description || "", id], (err, result) => {
    if (err) {
      console.error("Failed to update expense:", err);
      return res.status(500).json({ error: "Failed to update expense" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense updated successfully" });
  });
});

app.delete("/api/expenses/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM expenses WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Failed to delete expense:", err);
      return res.status(500).json({ error: "Failed to delete expense" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.get("/api/summary/category", (req, res) => {
  const sql = `
    SELECT category, SUM(amount) AS total
    FROM expenses
    GROUP BY category
    ORDER BY total DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Failed to fetch category summary:", err);
      return res.status(500).json({ error: "Database query failed" });
    }

    res.json(results);
  });
});

app.get("/api/summary/monthly", async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        SUBSTRING(expense_date, 1, 7) AS month,
        SUM(CAST(amount AS DECIMAL(10,2))) AS total
      FROM expenses
      GROUP BY SUBSTRING(expense_date, 1, 7)
      ORDER BY month DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("🔥 MONTHLY ERROR:", err);
    res.status(500).json({ error: "Failed to fetch monthly summary" });
  }
});