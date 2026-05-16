-- ============================================
-- Migration: Silver=100, প্রতি tier-এ doubling addition (+500, +1000, +2000, +4000, +8000)
-- VPS-এ একবার রান: mysql -u root -p clicktaka < database/migrations/2026_05_packages_income_v4.sql
-- ============================================
USE clicktaka;

UPDATE packages SET validity_days = 60 WHERE validity_days <> 60;

-- নতুন daily income:
--   Silver    : 100      (base)
--   Silver 2  : 600      (+500)
--   Silver 3  : 1600     (+1000)
--   Gold      : 3600     (+2000)
--   Diamond   : 7600     (+4000)
--   Royal     : 15600    (+8000)
UPDATE packages SET daily_earning = 100,   daily_task_limit = 10 WHERE name = 'Silver';
UPDATE packages SET daily_earning = 600,   daily_task_limit = 15 WHERE name = 'Silver 2';
UPDATE packages SET daily_earning = 1600,  daily_task_limit = 20 WHERE name = 'Silver 3';
UPDATE packages SET daily_earning = 3600,  daily_task_limit = 30 WHERE name = 'Gold';
UPDATE packages SET daily_earning = 7600,  daily_task_limit = 50 WHERE name = 'Diamond';
UPDATE packages SET daily_earning = 15600, daily_task_limit = 80 WHERE name = 'Royal';

SELECT id, name, price, daily_task_limit, daily_earning,
       ROUND(daily_earning / daily_task_limit, 2) AS per_task_tk,
       validity_days,
       (daily_earning * validity_days) AS total_60day_income,
       ROUND((daily_earning * validity_days / price) * 100) AS roi_percent
FROM packages ORDER BY price ASC;
