# Expense Tracker

## Project Description

Expense Tracker is a single-page web application for recording, managing, searching, and reviewing personal spending.

The problem this website solves is that users often lose track of small daily expenses and cannot easily see where their money goes. This app gives users one place to create bills, edit or delete them, organize them by category, search and filter records, and review monthly spending summaries. It also includes an admin interface for managing users and monitoring user activity.

## Main Features

- User registration and login
- Password hashing with `bcrypt`
- JWT-style token authentication for protected API requests
- Add, view, edit, and delete expense records
- Category ledger view for grouped bills
- Live search and filtering by title, category, amount range, month, and selected bill
- Monthly summary and chart-based summary filtering
- User profile panel for username/password updates, account switching, and logout
- Admin user management
- Admin activity log with filtering and pagination
- Category management and category color data

## Technical Stack

### Frontend

- HTML
- CSS
- Vanilla JavaScript
- Browser `fetch()` API for REST requests
- Local storage for keeping the login token and current user session

### Backend

- Node.js
- Express
- MySQL
- `mysql2` for database connection
- `bcrypt` for password hashing
- Node `crypto` for JWT-style token signing and verification
- `cors` for allowing frontend requests to the backend API

### Database

- MySQL database named `expense_tracker`
- Tables include:
  - `users`
  - `expenses`
  - `user_activity`
  - `categories`

## Dependencies

Install Node dependencies with:

```bash
npm install
```

Main dependencies from `package.json`:

- `express`
- `cors`
- `mysql2`
- `bcrypt`

The latest server code uses Node's built-in `crypto` module for token signing and verification, so no external JWT package is required.

## Folder Structure

```text
expense-tracker/
├── README.md
├── package.json
├── package-lock.json
├── database/
│   ├── expense_tracker.sql
│   ├── expense_tracker_full.sql
│   ├── all_expenses.sql
│   └── qaz_user_activity.sql
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── server/
    ├── db.js
    └── server.js
```

### What Each Folder Contains

- `public/`
  - Frontend files served in the browser.
  - `index.html` contains the page structure.
  - `style.css` contains the layout, responsive styling, modals, ledger UI, and summary UI.
  - `app.js` contains frontend state, rendering logic, live search/filtering, form handling, and API requests.

- `server/`
  - Backend Node.js code.
  - `server.js` defines Express routes, authentication, user management, expenses CRUD, category CRUD, summary APIs, and admin APIs.
  - `db.js` creates the MySQL connection using environment variables or local defaults.

- `database/`
  - SQL files for setting up and restoring data.
  - `expense_tracker.sql` is a smaller starter database file.
  - `expense_tracker_full.sql` is the full database dump with users, expenses, activities, and categories.
  - `all_expenses.sql` exports expense data.
  - `qaz_user_activity.sql` exports one user's activity data.

## Database Setup

The recommended setup is to load the full database dump:

```bash
mysql -u root < database/expense_tracker_full.sql
```

If your MySQL root user has a password, use:

```bash
mysql -u root -p < database/expense_tracker_full.sql
```

Important: `database/expense_tracker_full.sql` contains `DROP TABLE IF EXISTS` statements. Loading it will rebuild the project tables and replace existing local data in:

- `categories`
- `expenses`
- `user_activity`
- `users`

The full dump includes sample accounts such as:

```text
admin123 / 123456
zzy      / 654321
qaz      / qaz123
```

## Environment Variables

The backend reads database settings from environment variables. If not provided, it uses local defaults.

```text
DB_HOST      default: localhost
DB_USER      default: root
DB_PASSWORD  default: empty string
DB_NAME      default: expense_tracker
DB_PORT      default: 3306
JWT_SECRET   recommended: set a stable secret for local runs
```

Recommended local backend startup:

```bash
JWT_SECRET=expense-tracker-dev-secret node server/server.js
```

Optional admin seed variables:

```text
ADMIN_USERNAME
ADMIN_PASSWORD
ADMIN_ACCOUNTS
```

If the full SQL dump has already been loaded, admin users already exist in the database, so admin seed variables are not required.

## How To Run The App

### 1. Install dependencies

```bash
npm install
```

### 2. Load the database

```bash
mysql -u root < database/expense_tracker_full.sql
```

Use `-p` if your MySQL user requires a password.

### 3. Start the backend

```bash
JWT_SECRET=expense-tracker-dev-secret node server/server.js
```

The backend runs at:

```text
http://localhost:3000
```

### 4. Start the frontend

In another terminal:

```bash
python3 -m http.server 8080 -d public
```

The frontend runs at:

```text
http://localhost:8080
```

Open `http://localhost:8080` in the browser.

## Frontend And Backend Running Flow

1. The browser loads `public/index.html`, `public/style.css`, and `public/app.js` from the frontend server at `localhost:8080`.
2. The frontend JavaScript sends API requests to the backend at `http://localhost:3000/api`.
3. Register and login requests are sent as JSON with `POST` requests.
4. The backend uses `express.json()` to read JSON request bodies.
5. Passwords are hashed with `bcrypt` before being stored.
6. After login, the backend creates a signed token that contains the user ID, username, role, and expiry time.
7. The frontend stores the token in local storage and sends it in the `Authorization` header for protected requests.
8. The backend verifies the token before allowing access to expenses, summaries, profile actions, and admin APIs.
9. The backend reads and writes data in MySQL through `mysql2`.
10. The frontend updates the page dynamically after API responses, without a full page reload.

## API And Business Logic Overview

- `POST /api/auth/register`
  - Creates a user account.

- `POST /api/auth/login`
  - Verifies the password and returns an auth token.

- `PUT /api/auth/profile`
  - Updates username and optionally password.

- `GET /api/expenses`
  - Returns expenses for the logged-in user.
  - Supports search, category, amount range, month, selected bill, and sorting filters.

- `POST /api/expenses`
  - Creates a new expense.

- `PUT /api/expenses/:id`
  - Updates an existing expense.

- `DELETE /api/expenses/:id`
  - Deletes an expense.

- `GET /api/summary/monthly`
  - Returns monthly spending totals.

- `GET /api/summary/month-expenses`
  - Returns expenses for a selected month, with normal filters applied.

- `GET /api/admin/users`
  - Admin-only user list with filtering and pagination.

- `GET /api/admin/activities`
  - Admin-only activity log with filtering and pagination.

- Category APIs
  - Used for custom ledger categories and category colors.

## Notes

- The frontend is a static site, so it needs a static file server such as Python's `http.server`.
- The backend must be running before login, register, expense CRUD, summary, and admin actions can work.
- Use a stable `JWT_SECRET` during demos so login tokens remain valid while the backend is running.
- Loading `database/expense_tracker_full.sql` is the easiest way to reproduce the complete demo database.
