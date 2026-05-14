CREATE DATABASE expense_tracker;

USE expense_tracker;

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  category VARCHAR(100),
  amount DECIMAL(10,2),
  expense_date DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO expenses (title, category, amount, expense_date, description)
VALUES 
('Lunch', 'Food', 12.50, '2026-04-01', 'Quick meal'),
('Uber', 'Transport', 25.00, '2026-04-02', 'Ride to uni'),
('Shoes', 'Shopping', 80.00, '2026-04-03', 'New sneakers');