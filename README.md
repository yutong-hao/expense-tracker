# Expense Tracker

## Project Description
This project is a single-page Expense Tracker web application. It helps users record and manage their daily spending in a simple and clear way. Users can add, edit, delete, and view expenses on the same page without opening a new page.

The website solves a common problem in everyday life, which is that people often forget where their money goes. By using this app, users can keep track of their expenses, see their total spending, and check spending by category and by month.

## Technical Stack
- HTML
- CSS
- JavaScript
- Node.js
- MySQL
- REST API

## Features
- Add a new expense with title, category, amount, date, and description
- View all expenses on the page
- Edit an existing expense
- Delete an expense
- View total spending
- View category summary
- View monthly summary
- Input validation for date and amount
- Single-page dynamic interface
- Responsive layout and user-friendly design

## Folder Structure
- `index.html` — main page structure
- `style.css` — styling, layout, and animations
- `app.js` — frontend logic, rendering, and API requests
- `README.md` — project documentation
- database file / SQL export — database data for the project

## Challenges
One challenge in this project was making the page update dynamically without refreshing. I used JavaScript and API requests to fetch the latest data and render it again after adding, editing, or deleting an expense.

Another challenge was making the website look clean and easy to use. I improved the layout by adding cards, modals, animations, and toast messages so the interaction feels smoother.

I also needed to make sure the user input was more reliable, so I added simple validation for the date format and amount input.

## Running the Project
To run this project, start the backend server and make sure the database is connected. Then open the frontend in the browser and use the app through the main page.

## Summary
Overall, this project shows how HTML, CSS, JavaScript, Node.js, and MySQL can work together to build a practical web application with full CRUD functions. It is designed as a single-page app with a simple interface and useful expense summary features.