-- ============================================
-- Migration: New 20000 package + multi-spin per day support
-- VPS-এ একবার রান: mysql -u root -p clicktaka < database/migrations/2026_05_spin_packages.sql
-- Idempotent — বারবার চালালেও সমস্যা নেই।
-- ============================================
USE clicktaka;

-- 1) Allow multiple spins per day — drop old unique (user_id, spin_date) constraint
ALTER TABLE daily_spins DROP INDEX uniq_user_date;
ALTER TABLE daily_spins ADD INDEX idx_user_date (user_id, spin_date);

-- 2) Insert new ৳20000 "Royal" package if missing
INSERT INTO packages (name, price, daily_task_limit, daily_earning, validity_days)
SELECT 'Royal', 20000, 80, 2800, 365
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name='Royal');
