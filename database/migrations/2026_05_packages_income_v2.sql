-- ============================================
-- Migration: Silver থেকে ১০০৳/দিন শুরু, per-task ৫-২০৳, বড় package = অনেক বেশি income
-- VPS-এ একবার রান: mysql -u root -p clicktaka < database/migrations/2026_05_packages_income_v2.sql
-- Idempotent — বারবার চালালেও সমস্যা নেই।
-- ============================================
USE clicktaka;

-- সব package validity 60 দিন
UPDATE packages SET validity_days = 60 WHERE validity_days <> 60;

-- নতুন income structure (per-task reward ৫-২০৳ range এর মধ্যে):
--   Silver    : 10 task × ৳10 = ৳100/day   (min দৈনিক income)
--   Silver 2  : 15 task × ৳12 = ৳180/day
--   Silver 3  : 20 task × ৳15 = ৳300/day
--   Gold      : 30 task × ৳18 = ৳540/day
--   Diamond   : 50 task × ৳20 = ৳1000/day
--   Royal     : 80 task × ৳20 = ৳1600/day  (Silver-এর 16x)
UPDATE packages SET daily_earning = 100,  daily_task_limit = 10 WHERE name = 'Silver';
UPDATE packages SET daily_earning = 180,  daily_task_limit = 15 WHERE name = 'Silver 2';
UPDATE packages SET daily_earning = 300,  daily_task_limit = 20 WHERE name = 'Silver 3';
UPDATE packages SET daily_earning = 540,  daily_task_limit = 30 WHERE name = 'Gold';
UPDATE packages SET daily_earning = 1000, daily_task_limit = 50 WHERE name = 'Diamond';
UPDATE packages SET daily_earning = 1600, daily_task_limit = 80 WHERE name = 'Royal';

-- যাচাই করার জন্য
SELECT id, name, price, daily_task_limit, daily_earning,
       ROUND(daily_earning / daily_task_limit, 2) AS per_task_tk,
       validity_days,
       (daily_earning * validity_days) AS total_60day_income,
       ROUND((daily_earning * validity_days / price) * 100) AS roi_percent
FROM packages ORDER BY price ASC;
