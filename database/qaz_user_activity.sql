USE expense_tracker;

INSERT INTO users (username, password_hash, role, created_at)
VALUES ('qaz', '$2b$10$0xXlyD5FvQhLsBEWRUnb9epq/3sqsxgZ46m8gG.UqESGoWnSo7DjG', 'user', '2026-05-24 13:42:42')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  role = VALUES(role);

SET @qaz_user_id = (SELECT id FROM users WHERE username = 'qaz' LIMIT 1);

INSERT INTO user_activity (user_id, action, details, created_at)
SELECT @qaz_user_id, 'register', 'Registered a new account', '2026-05-24 13:42:42'
WHERE NOT EXISTS (
  SELECT 1 FROM user_activity
  WHERE user_id = @qaz_user_id AND action = 'register' AND details = 'Registered a new account' AND created_at = '2026-05-24 13:42:42'
);

INSERT INTO user_activity (user_id, action, details, created_at)
SELECT @qaz_user_id, 'login', 'Logged in', '2026-05-24 13:42:59'
WHERE NOT EXISTS (
  SELECT 1 FROM user_activity
  WHERE user_id = @qaz_user_id AND action = 'login' AND details = 'Logged in' AND created_at = '2026-05-24 13:42:59'
);

INSERT INTO user_activity (user_id, action, details, created_at)
SELECT @qaz_user_id, 'create_expense', 'Created expense #46: shiwu', '2026-05-24 13:43:39'
WHERE NOT EXISTS (
  SELECT 1 FROM user_activity
  WHERE user_id = @qaz_user_id AND action = 'create_expense' AND details = 'Created expense #46: shiwu' AND created_at = '2026-05-24 13:43:39'
);

INSERT INTO user_activity (user_id, action, details, created_at)
SELECT @qaz_user_id, 'create_expense', 'Created expense #47: wupin', '2026-05-24 13:44:07'
WHERE NOT EXISTS (
  SELECT 1 FROM user_activity
  WHERE user_id = @qaz_user_id AND action = 'create_expense' AND details = 'Created expense #47: wupin' AND created_at = '2026-05-24 13:44:07'
);

INSERT INTO user_activity (user_id, action, details, created_at)
SELECT @qaz_user_id, 'delete_expense', 'Deleted expense #46', '2026-05-24 13:44:13'
WHERE NOT EXISTS (
  SELECT 1 FROM user_activity
  WHERE user_id = @qaz_user_id AND action = 'delete_expense' AND details = 'Deleted expense #46' AND created_at = '2026-05-24 13:44:13'
);

INSERT INTO user_activity (user_id, action, details, created_at)
SELECT @qaz_user_id, 'update_expense', 'Updated expense #47: wupin', '2026-05-24 13:44:17'
WHERE NOT EXISTS (
  SELECT 1 FROM user_activity
  WHERE user_id = @qaz_user_id AND action = 'update_expense' AND details = 'Updated expense #47: wupin' AND created_at = '2026-05-24 13:44:17'
);

INSERT INTO user_activity (user_id, action, details, created_at)
SELECT @qaz_user_id, 'create_expense', 'Created expense #48: ww', '2026-05-24 13:44:36'
WHERE NOT EXISTS (
  SELECT 1 FROM user_activity
  WHERE user_id = @qaz_user_id AND action = 'create_expense' AND details = 'Created expense #48: ww' AND created_at = '2026-05-24 13:44:36'
);

INSERT INTO user_activity (user_id, action, details, created_at)
SELECT @qaz_user_id, 'create_expense', 'Created expense #49: 333', '2026-05-24 13:44:51'
WHERE NOT EXISTS (
  SELECT 1 FROM user_activity
  WHERE user_id = @qaz_user_id AND action = 'create_expense' AND details = 'Created expense #49: 333' AND created_at = '2026-05-24 13:44:51'
);

INSERT INTO user_activity (user_id, action, details, created_at)
SELECT @qaz_user_id, 'create_expense', 'Created expense #50: 122', '2026-05-24 13:45:37'
WHERE NOT EXISTS (
  SELECT 1 FROM user_activity
  WHERE user_id = @qaz_user_id AND action = 'create_expense' AND details = 'Created expense #50: 122' AND created_at = '2026-05-24 13:45:37'
);

INSERT INTO user_activity (user_id, action, details, created_at)
SELECT @qaz_user_id, 'login', 'Logged in', '2026-05-24 13:46:57'
WHERE NOT EXISTS (
  SELECT 1 FROM user_activity
  WHERE user_id = @qaz_user_id AND action = 'login' AND details = 'Logged in' AND created_at = '2026-05-24 13:46:57'
);

INSERT INTO user_activity (user_id, action, details, created_at)
SELECT @qaz_user_id, 'login', 'Logged in', '2026-05-24 13:55:37'
WHERE NOT EXISTS (
  SELECT 1 FROM user_activity
  WHERE user_id = @qaz_user_id AND action = 'login' AND details = 'Logged in' AND created_at = '2026-05-24 13:55:37'
);

INSERT INTO user_activity (user_id, action, details, created_at)
SELECT @qaz_user_id, 'login', 'Logged in', '2026-05-24 14:02:08'
WHERE NOT EXISTS (
  SELECT 1 FROM user_activity
  WHERE user_id = @qaz_user_id AND action = 'login' AND details = 'Logged in' AND created_at = '2026-05-24 14:02:08'
);

INSERT INTO user_activity (user_id, action, details, created_at)
SELECT @qaz_user_id, 'logout', 'Logged out', '2026-05-24 15:04:10'
WHERE NOT EXISTS (
  SELECT 1 FROM user_activity
  WHERE user_id = @qaz_user_id AND action = 'logout' AND details = 'Logged out' AND created_at = '2026-05-24 15:04:10'
);
