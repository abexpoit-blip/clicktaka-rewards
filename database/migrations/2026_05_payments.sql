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

-- Migrate any old data if both tables exist (best-effort)
INSERT IGNORE INTO payment_settings_new (id, bkash_number, nagad_number)
  SELECT 1,
    COALESCE((SELECT number FROM payment_settings WHERE method='bkash' LIMIT 1), ''),
    COALESCE((SELECT number FROM payment_settings WHERE method='nagad' LIMIT 1), '');

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
