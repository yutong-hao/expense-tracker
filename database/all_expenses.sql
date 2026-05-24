CREATE DATABASE IF NOT EXISTS expense_tracker;

USE expense_tracker;

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(255),
  category VARCHAR(100),
  amount DECIMAL(10,2),
  expense_date DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO expenses (id, user_id, title, category, amount, expense_date, description, created_at)
VALUES
  (37, NULL, 'shopping', 'Shopping', 123.00, '2026-05-23', '12121fan', '2026-05-17 12:45:16'),
  (38, NULL, 'eating', 'Transport', 45.00, '2026-04-09', 'happy', '2026-05-17 12:45:52'),
  (40, 1, 'yifu', 'Shopping', 34.00, '2026-05-20', 'iii', '2026-05-17 12:52:34'),
  (42, 3, 'clothes', 'Food', 56.00, '2026-05-13', 'dress', '2026-05-17 14:35:17'),
  (43, NULL, 'Lunch', 'Food', 12.50, '2026-04-01', 'Quick meal', '2026-05-24 13:37:33'),
  (44, NULL, 'Uber', 'Transport', 25.00, '2026-04-02', 'Ride to uni', '2026-05-24 13:37:33'),
  (45, NULL, 'Shoes', 'Shopping', 80.00, '2026-04-03', 'New sneakers', '2026-05-24 13:37:33'),
  (47, 17, 'wupin', 'Shopping', 53.00, '2026-05-07', 'www', '2026-05-24 13:44:07'),
  (48, 17, 'ww', 'Shopping', 23.00, '2026-05-14', 'wwwwe', '2026-05-24 13:44:36'),
  (49, 17, '333', 'Transport', 111.22, '2026-04-09', '232', '2026-05-24 13:44:51'),
  (50, 17, '122', 'Food', 333.00, '2026-03-12', '3344', '2026-05-24 13:45:37')
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id),
  title = VALUES(title),
  category = VALUES(category),
  amount = VALUES(amount),
  expense_date = VALUES(expense_date),
  description = VALUES(description),
  created_at = VALUES(created_at);
