# Expense Tracker

## Project Description

Expense Tracker is a single-page website for recording, organizing, searching, and reviewing personal spending.

The problem this website solves is that users often keep bills in scattered places, making it hard to understand where their money goes, find old records, or review spending patterns. This app provides one place to create expense records, group them into ledgers by category, filter and search bills, review monthly summaries, and manage user accounts through an admin panel.

## Main Features

- User registration and login
- Secure password hashing with `bcrypt`
- JWT-style token authentication using Node's built-in `crypto` module
- User profile editing, password change, account switching, and logout
- Expense create, read, update, and delete functionality
- Category-based ledger view for grouped bills
- Live expense search and filtering by title, category, description, amount range, month, and selected bill
- Monthly summary panel with interactive year, month, and bill filters
- Custom ledger category management with stored category colors
- Admin user management, role editing, user deletion, and activity monitoring
- Admin activity search, date/action filtering, and pagination

## Technical Stack

```text
Browser
  |
  | HTML + CSS + Vanilla JavaScript
  | fetch() API sends REST requests
  v
Node.js Backend
  |
  | Express routes and JSON request handling
  | bcrypt password hashing
  | crypto-based token signing and verification
  | mysql2 database queries
  v
MySQL Database
  |
  | users
  | expenses
  | user_activity
  | categories
```

### Frontend

- `HTML` for page structure
- `CSS` for responsive layout, modals, ledgers, admin tables, and summary UI
- Vanilla `JavaScript` for state management, rendering, form handling, filtering, and API requests
- Browser `localStorage` for storing the login token and current user session

### Backend

- `Node.js`
- `Express`
- `mysql2`
- `bcrypt`
- Node built-in `crypto`
- `cors`

### Database

- MySQL database named `expense_tracker`
- Main tables: `users`, `expenses`, `user_activity`, and `categories`

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

The token system uses Node's built-in `crypto` module, so no external JWT package is required.

## Setup Notes

If a working `.env` file is already provided with the submitted project, the environment variable setup does not need to be repeated manually. However, `.env` only stores connection settings and secrets; it does not create the MySQL database or import table data.

To restore the database, load the full SQL dump:

```bash
mysql -u <your_mysql_user> -p < database/expense_tracker_full.sql
```

The backend reads these values from `.env`:

```text
DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
DB_PORT
JWT_SECRET
```

Example:

```text
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<your_mysql_password>
DB_NAME=expense_tracker
DB_PORT=3306
JWT_SECRET=<your_local_jwt_secret>
```

Do not publish real `.env` files, real passwords, or private database dumps in a public repository.

## How To Run The App

### 1. Install dependencies

```bash
npm install
```

### 2. Load the database

```bash
mysql -u <your_mysql_user> -p < database/expense_tracker_full.sql
```

### 3. Start the backend

```bash
node --env-file=.env server/server.js
```

The backend runs at:

```text
http://localhost:3000
```

### 4. Start the frontend

In another terminal, serve the `public` folder with a static file server:

```bash
python3 -m http.server 8080 -d public
```

The frontend runs at:

```text
http://localhost:8080
```

Open `http://localhost:8080` in the browser.

## Frontend And Backend Communication

The frontend loads from `localhost:8080`, while the backend API runs at `localhost:3000/api`.

For register and login, the frontend sends username and password data to the backend through `POST` requests because the data must be sent in the JSON request body instead of in the URL. The backend uses `express.json()` to read the request body from `req.body`, hashes passwords with `bcrypt`, stores data in MySQL through `mysql2`, and returns a signed authentication token after successful login.

For search and filtering, the frontend reads the user's selected filters, builds query parameters, and sends them to backend API endpoints such as `/api/expenses`, `/api/admin/users`, and `/api/admin/activities`. The backend converts those query parameters into SQL conditions, queries MySQL, and returns only the matching records, so the interface and database stay connected through live API communication.

## Folder Structure

```text
expense-tracker/
|-- README.md
|-- package.json
|-- package-lock.json
|-- database/
|   |-- expense_tracker.sql
|   |-- expense_tracker_full.sql
|   `-- other local export files
|-- public/
|   |-- index.html
|   |-- style.css
|   `-- app.js
`-- server/
    |-- db.js
    `-- server.js
```

## What Each Folder Contains

- `public/` contains the frontend files served in the browser.
- `public/index.html` defines the page structure for authentication, expenses, ledgers, summary, admin tables, and modals.
- `public/style.css` defines the visual layout, responsive behavior, ledgers, summary panel, admin controls, and modal styling.
- `public/app.js` handles frontend state, rendering, validation, live search/filtering, forms, authentication flow, and API requests.
- `server/` contains the backend Node.js code.
- `server/server.js` defines Express routes for authentication, profile updates, expenses, summaries, categories, admin users, and activity logs.
- `server/db.js` creates the MySQL connection using environment variables.
- `database/` contains SQL files used to set up or restore the MySQL database.
- `database/expense_tracker_full.sql` is the full database dump with users, expenses, activity logs, and categories.
- `database/expense_tracker.sql` is a smaller starter database file.

## Team Contribution

### Yutong

- Implemented register and login so the frontend sends username and password to the backend through `POST` API requests, while Express reads the JSON body with `express.json()`.
- Added secure password storage with `bcrypt` so real passwords are not saved as plain text in MySQL.
- Built JWT-style authentication with Node's built-in `crypto` module so protected requests can verify the logged-in user.
- Created user profile settings so users can update their username, change password with current-password validation, switch accounts, and log out.
- Implemented admin access so admin users can manage accounts, change roles, delete users, and review activity logs.
- Added activity logging for login, logout, register, expense changes, and category changes.
- Built admin search, role filtering, activity date/action filtering, and pagination, with time filters showing only dates that actually have activity.

### Ziyi

- Implemented bill creation and category-based ledgers so expenses are stored and displayed under their related categories.
- Built expense live search and filtering so users can search by title, category, or description and combine category, amount, sorting, month, and bill filters.
- Connected frontend search controls to backend API queries so filter choices in the browser return matching records from MySQL.
- Built the summary panel so users can select a year, click a month to filter bills, click again to clear it, and select a specific bill inside a month.
- Made normal search filters and summary filters work together so the ledger area only shows bills that match all active conditions.
- Implemented Ledger Settings so users can create, rename, and delete custom ledger categories.
- Stored ledger color data in the database so each category can appear as a separate visual ledger in the UI.

## Overall Result

This website demonstrates user authentication, secure password hashing, token-based authorization, expense CRUD, live frontend-backend search and filtering, admin management, user profile settings, activity logs, summary filtering, and ledger category settings.
