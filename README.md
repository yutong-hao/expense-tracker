<div align="center">

# 💰 Expense Tracker

**A personal finance web app that makes it easy to log, organise, and review every dollar you spend.**

Most people lose track of daily spending because there is no single place to capture, filter, and reflect on it. Expense Tracker solves this by combining a category-based ledger, powerful live search, and monthly summaries in one lightweight single-page application — with an admin interface for multi-user environments.

![JavaScript](https://img.shields.io/badge/JavaScript-ES6-f7df1e?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/Database-MySQL-4479a1?logo=mysql&logoColor=white)

</div>

---

## ✨ Features at a Glance

| Area | What you can do |
|---|---|
| **Auth** | Register, log in, change password, switch accounts |
| **Expenses** | Create, edit, delete, and search bills by title / category / amount / date |
| **Ledgers** | View bills grouped by colour-coded category; manage custom categories |
| **Summary** | Filter spending by year → month → individual bill; filters stack with search |
| **Admin** | Manage users and roles; browse a paginated, filterable activity log |

---

## 🗂 Folder Structure

```
expense-tracker/
│
├── public/                   # Frontend — everything the browser loads
│   ├── index.html            #   Page structure and modal scaffolding
│   ├── style.css             #   Layout, ledger UI, summary UI, responsive styles
│   └── app.js                #   State management, rendering, search/filter logic, API calls
│
├── server/                   # Backend — Node.js + Express
│   ├── server.js             #   All API routes: auth, expenses, categories, summary, admin
│   └── db.js                 #   MySQL connection pool (reads from .env)
│
├── database/                 # SQL files for setup and sample data
│   ├── expense_tracker_full.sql   #   ← Recommended: full dump with users, expenses, categories
│   ├── expense_tracker.sql        #   Minimal schema-only starter
│   ├── all_expenses.sql           #   Expense data export
│   └── qaz_user_activity.sql      #   Single-user activity export
│
├── .env                      # Local config — create this before running (see below)
├── package.json
└── README.md
```

---

## 🛠 Technical Stack

### Frontend
- **HTML / CSS / Vanilla JavaScript** — no framework, fully static
- **`fetch()` API** — sends JSON requests to the backend REST API
- **`localStorage`** — persists the auth token and current user session across page loads

### Backend
- **Node.js + Express** — HTTP server and routing
- **`mysql2`** — MySQL connection and query execution
- **`bcrypt`** — hashes passwords before storing; plain-text passwords are never saved
- **Node `crypto`** — signs and verifies JWT-style auth tokens without an external package
- **`cors`** — allows the frontend (`:8080`) to call the backend (`:3000`)

### Database
- **MySQL** — database name `expense_tracker`
- Tables: `users` · `expenses` · `categories` · `user_activity`

### Dependencies

```bash
npm install        # installs express, cors, mysql2, bcrypt
```

> Node's built-in `crypto` is used for token signing — no `jsonwebtoken` package required.

---

## 🚀 Getting Started

### 1 — Install dependencies

```bash
npm install
```

### 2 — Create a `.env` file

Create `.env` in the project root:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=expense_tracker
DB_PORT=3306
JWT_SECRET=expense-tracker-dev-secret
```

Adjust `DB_USER`, `DB_PASSWORD`, and `DB_PORT` to match your local MySQL setup.
Use a stable `JWT_SECRET` during demos so existing tokens stay valid while the server is running.

### 3 — Load the database

```bash
mysql -u root < database/expense_tracker_full.sql

# If your MySQL user has a password:
mysql -u root -p < database/expense_tracker_full.sql
```

> ⚠️ The full dump contains `DROP TABLE IF EXISTS` — it will **replace** any existing data in `users`, `expenses`, `categories`, and `user_activity`.

The dump includes these ready-to-use sample accounts:

| Username | Password | Role  |
|----------|----------|-------|
| admin123 | 123456   | Admin |
| qaz      | qaz123   | User  |

### 4 — Start the backend

```bash
node server/server.js
```

→ Runs at **http://localhost:3000**

### 5 — Start the frontend

Open a second terminal:

```bash
python3 -m http.server 8080 -d public
```

→ Open **http://localhost:8080** in the browser.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Verify password; return signed auth token |
| `PUT`  | `/api/auth/profile` | Update username or password |
| `GET`  | `/api/expenses` | Fetch expenses — supports `search`, `category`, `minAmount`, `maxAmount`, `month`, `sort` query params |
| `POST` | `/api/expenses` | Create a new expense |
| `PUT`  | `/api/expenses/:id` | Update an existing expense |
| `DELETE` | `/api/expenses/:id` | Delete an expense |
| `GET`  | `/api/summary/monthly` | Monthly spending totals |
| `GET`  | `/api/summary/month-expenses` | Expenses for a selected month with filters applied |
| `GET`  | `/api/categories` | List all categories for the current user |
| `POST / PUT / DELETE` | `/api/categories` | Create, rename, or delete a custom category |
| `GET`  | `/api/admin/users` | Admin: paginated user list with search and role filter |
| `GET`  | `/api/admin/activities` | Admin: paginated activity log with date and action filter |

All protected routes require an `Authorization: Bearer <token>` header.

---

## 👥 Team Contributions

### Yutong — Auth · User Profile · Admin Panel

- **Registration & login** — Frontend sends credentials via `POST`; backend reads them with `express.json()`, hashes the password with `bcrypt`, and returns a signed token on success.
- **Secure password storage** — Passwords are never stored in plain text; `bcrypt` hashing ensures the database alone cannot expose real credentials.
- **Token-based auth** — After login, the backend signs a JWT-style token with Node `crypto`; the frontend stores it in `localStorage` and attaches it to every subsequent API request.
- **User profile** — Users can update their username or change their password; the frontend pre-validates that the new password differs from the old one before the backend also enforces the same rule.
- **Admin user management** — Admins can view all users, change roles, and delete accounts via a live-search panel with role filtering and pagination.
- **Activity log** — Every significant action (login, logout, register, expense changes, category changes) is recorded; admins can filter by date or action type, with pagination and date options limited to days that actually have activity.

---

### Ziyi — Expense Ledger · Search & Filter · Category Management

- **Category ledger view** — Bills are automatically sorted into colour-coded ledgers when added, giving users a visual per-category breakdown at a glance.
- **Live search with backend filtering** — As the user types or adjusts filters (title, category, description, min/max amount, sort order), the frontend sends updated query parameters to `GET /api/expenses` and re-renders results without a page reload, keeping the UI in sync with the database at all times.
- **Stacked summary filters** — Users can drill down from year → month → individual bill in the summary panel; summary filters and search filters are applied together so every combination works correctly.
- **Ledger category management** — Users can create, rename, and delete custom ledger categories; category colours are persisted in the database so they survive page reloads.

---

## 📝 Notes

- The frontend is a fully static site — it must be served by a file server (e.g. `python3 -m http.server`); simply opening `index.html` in a browser will not work due to CORS.
- The backend must be running before any API-dependent feature (login, expenses, summary, admin) will work.
- `server/db.js` reads all database settings from `.env` — ensure the file exists before starting the server.