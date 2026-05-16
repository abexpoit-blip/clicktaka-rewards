-- ===========================================================
-- Daily task reset support
-- Adds last_reset_date to user_packages so /user/tasks can
-- lazy-reset tasks_done_today=0 when a new day begins.
-- Run on VPS:
--   mysql -u root -p clicktaka < database/migrations/2026_05_daily_reset.sql
-- ===========================================================

USE clicktaka;

-- Add last_reset_date column if missing
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_packages'
    AND COLUMN_NAME = 'last_reset_date'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE user_packages ADD COLUMN last_reset_date DATE NULL AFTER tasks_done_today',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Backfill: assume previous data is from "today" so nothing resets unexpectedly
UPDATE user_packages SET last_reset_date = CURDATE() WHERE last_reset_date IS NULL;
