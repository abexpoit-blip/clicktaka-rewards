-- ============================================
-- Migration: 60-দিনের validity + বড় package-এ বেশি দৈনিক income
-- VPS-এ একবার রান: mysql -u root -p clicktaka < database/migrations/2026_05_packages_60days.sql
-- Idempotent — বারবার চালালেও ক্ষতি নেই।
-- ============================================
USE clicktaka;

-- সব package এর validity 60 দিন করুন
UPDATE packages SET validity_days = 60 WHERE validity_days <> 60;

-- বড় package = বেশি দৈনিক income (tier-wise upgrade)
-- name অনুযায়ী update — নতুন user-দেরও same value পাবে
UPDATE packages SET daily_earning = 15,  daily_task_limit = 10 WHERE name = 'Silver';
UPDATE packages SET daily_earning = 35,  daily_task_limit = 15 WHERE name = 'Silver 2';
UPDATE packages SET daily_earning = 75,  daily_task_limit = 20 WHERE name = 'Silver 3';
UPDATE packages SET daily_earning = 200, daily_task_limit = 30 WHERE name = 'Gold';
UPDATE packages SET daily_earning = 420, daily_task_limit = 50 WHERE name = 'Diamond';
UPDATE packages SET daily_earning = 900, daily_task_limit = 80 WHERE name = 'Royal';

-- চলমান user_packages-এর expiry আনুপাতিকভাবে কমাবে না — শুধু ভবিষ্যৎ কেনায় effect পড়বে।
-- কিন্তু পুরোনো 365-দিনের active package গুলোকে 60 দিনে কমাতে চাইলে নিচের লাইন uncomment করুন:
-- UPDATE user_packages SET expires_at = DATE_ADD(DATE(created_at), INTERVAL 60 DAY) WHERE expires_at > DATE_ADD(DATE(created_at), INTERVAL 60 DAY);

SELECT id, name, price, daily_task_limit, daily_earning, validity_days,
       (daily_earning * validity_days) AS total_income,
       ROUND((daily_earning * validity_days / price) * 100) AS roi_percent
FROM packages ORDER BY price ASC;
