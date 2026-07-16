-- Truelink Solutions — subscriber/signup table
-- Import this once via hPanel → Databases → phpMyAdmin (or the CLI) before
-- the signup form will work. See DEPLOY.md for the full checklist.

CREATE TABLE IF NOT EXISTS subscribers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NULL,
  email VARCHAR(190) NOT NULL,
  sequence_step TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_sequence_sent_at DATETIME NULL,
  unsubscribed TINYINT(1) NOT NULL DEFAULT 0,
  unsubscribe_token CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_email (email),
  KEY idx_sequence_lookup (unsubscribed, sequence_step, last_sequence_sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
