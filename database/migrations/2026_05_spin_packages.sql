-- ============================================
-- Migration: New 20000 package + multi-spin per day support
-- VPS-এ একবার রান: mysql -u root -p clicktaka < database/migrations/2026_05_spin_packages.sql
-- Idempotent — বারবার চালালেও সমস্যা নেই।
-- ============================================
USE clicktaka;

-- 1) Ensure spin table exists, then allow multiple spins per day
CREATE TABLE IF NOT EXISTS daily_spins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  spin_date DATE NOT NULL,
  reward DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, spin_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Add a replacement non-unique index first. MySQL requires an index on columns
-- used by the foreign key, so dropping uniq_user_date before this can fail.
SET @create_index_sql := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'daily_spins'
        AND index_name = 'idx_user_date'
    ),
    'SELECT 1',
    'ALTER TABLE daily_spins ADD INDEX idx_user_date (user_id, spin_date)'
  )
);
PREPARE create_index_stmt FROM @create_index_sql;
EXECUTE create_index_stmt;
DEALLOCATE PREPARE create_index_stmt;

-- Drop the old unique index if a previous install limited users to one spin/day.
SET @drop_unique_sql := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'daily_spins'
        AND index_name = 'uniq_user_date'
    ),
    'ALTER TABLE daily_spins DROP INDEX uniq_user_date',
    'SELECT 1'
  )
);
PREPARE drop_unique_stmt FROM @drop_unique_sql;
EXECUTE drop_unique_stmt;
DEALLOCATE PREPARE drop_unique_stmt;

-- 2) Insert new ৳20000 "Royal" package if missing
INSERT INTO packages (name, price, daily_task_limit, daily_earning, validity_days)
SELECT 'Royal', 20000, 80, 2800, 365
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name='Royal');
