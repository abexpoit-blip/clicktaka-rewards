-- ============================================
-- Migration: Silver=১০০৳/দিন, বড় package গুলো scale up → Royal = Silver-এর 10x (১০০০৳/দিন)
-- VPS-এ একবার রান: mysql -u root -p clicktaka < database/migrations/2026_05_packages_income_v3.sql
-- Idempotent — বারবার চালালেও সমস্যা নেই।
-- ============================================
USE clicktaka;

-- সব package validity 60 দিন
UPDATE packages SET validity_days = 60 WHERE validity_days <> 60;

-- নতুন income (Silver=100, Royal=Silver×10):
--   Silver    : 10 task × ৳10  = ৳100/day   (1.0x)
--   Silver 2  : 15 task × ৳13  = ৳200/day   (2.0x)
--   Silver 3  : 20 task × ৳20  = ৳400/day   (4.0x)
--   Gold      : 35 task × ৳20  = ৳700/day   (7.0x)
--   Diamond   : 50 task × ৳18  = ৳900/day   (9.0x)
--   Royal     : 80 task × ৳12.5= ৳1000/day  (10.0x ← Silver-এর ঠিক ১০ গুণ)
UPDATE packages SET daily_earning = 100,  daily_task_limit = 10 WHERE name = 'Silver';
UPDATE packages SET daily_earning = 200,  daily_task_limit = 15 WHERE name = 'Silver 2';
UPDATE packages SET daily_earning = 400,  daily_task_limit = 20 WHERE name = 'Silver 3';
UPDATE packages SET daily_earning = 700,  daily_task_limit = 35 WHERE name = 'Gold';
UPDATE packages SET daily_earning = 900,  daily_task_limit = 50 WHERE name = 'Diamond';
UPDATE packages SET daily_earning = 1000, daily_task_limit = 80 WHERE name = 'Royal';

-- যাচাই
SELECT id, name, price, daily_task_limit, daily_earning,
       ROUND(daily_earning / daily_task_limit, 2) AS per_task_tk,
       validity_days,
       (daily_earning * validity_days) AS total_60day_income,
       ROUND((daily_earning * validity_days / price) * 100) AS roi_percent
FROM packages ORDER BY price ASC;
