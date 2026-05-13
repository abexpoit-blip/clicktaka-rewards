-- ============================================
-- Migration: Restructure payment_settings to singleton + ensure deposits/withdrawals shape
-- Run on VPS once: mysql -u root -p clicktaka < database/migrations/2026_05_payments.sql
-- Idempotent — safe to re-run.
-- ============================================
USE clicktaka;

-- 1) Drop old multi-row payment_settings (was: id, method, number, instructions, active)
DROP TABLE IF EXISTS payment_settings_old;
CREATE TABLE IF NOT EXISTS payment_settings_new (
  id INT PRIMARY KEY DEFAULT 1,
  bkash_number VARCHAR(50) NOT NULL DEFAULT '',
  nagad_number VARCHAR(50) NOT NULL DEFAULT '',
  min_deposit DECIMAL(10,2) NOT NULL DEFAULT 500,
  min_withdraw DECIMAL(10,2) NOT NULL DEFAULT 500,
  referral_percent DECIMAL(5,2) NOT NULL DEFAULT 10,
  CHECK (id = 1)
) ENGINE=InnoDB;

-- Keep this migration idempotent across both old and already-new installs.
-- Payment numbers can be re-entered from the admin payment settings screen.
INSERT IGNORE INTO payment_settings_new (id) VALUES (1);

-- Swap tables
DROP TABLE IF EXISTS payment_settings;
RENAME TABLE payment_settings_new TO payment_settings;

-- Ensure singleton row exists
INSERT IGNORE INTO payment_settings (id) VALUES (1);

-- 2) Make sure deposits has all expected columns (txn_id we map as transaction_id in API)
--    No change needed if schema.sql was applied; this is a guard.
ALTER TABLE deposits
  MODIFY status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending';

-- 3) Make sure withdrawals.account stores user phone (we expose as payment_number in API)
ALTER TABLE withdrawals
  MODIFY status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending';

-- 4) Ensure daily spin table exists for /api/user/spin/status and /api/user/spin
CREATE TABLE IF NOT EXISTS daily_spins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  spin_date DATE NOT NULL,
  reward DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_date (user_id, spin_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
