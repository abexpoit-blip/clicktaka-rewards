-- ===========================================================
-- Silver package: exactly 10 tasks, সব ad link = arkgleamfox
-- Run: mysql -u root -p clicktaka < database/migrations/2026_05_silver_tasks_fix.sql
-- Idempotent
-- ===========================================================
USE clicktaka;

SET @silver_url := 'https://arkgleamfox.com/s9ufy3v3?key=27a3204151874ee387f13410abebab90';
SET @pid := (SELECT id FROM packages WHERE name = 'Silver' LIMIT 1);

-- 1) Silver package-এর daily limit = 10 নিশ্চিত করি
UPDATE packages SET daily_task_limit = 10 WHERE id = @pid;

-- 2) পুরনো Silver tasks (tag prefix দিয়ে) মুছে আবার বানাই — exactly 10
DELETE tp FROM task_packages tp
  JOIN tasks t ON t.id = tp.task_id
  WHERE t.title LIKE '[pkg:silver]%';
DELETE FROM tasks WHERE title LIKE '[pkg:silver]%';

-- 3) Numbers helper
DROP TEMPORARY TABLE IF EXISTS nums10;
CREATE TEMPORARY TABLE nums10 (n INT PRIMARY KEY);
INSERT INTO nums10 (n) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10);

-- 4) 10 টা ad task insert — সবগুলোর URL একই
INSERT INTO tasks (title, description, type, url, reward, active)
SELECT
  CONCAT('[pkg:silver] Silver Ad #', n),
  'Silver package এর ad task। লিংকে যান, ২৫ সেকেন্ড থাকুন, তারপর Complete করে ৳১০ পান।',
  'ad', @silver_url, 10.00, 1
FROM nums10;

-- 5) Silver package-এর সাথে link
INSERT INTO task_packages (task_id, package_id)
SELECT id, @pid FROM tasks WHERE title LIKE '[pkg:silver]%';

DROP TEMPORARY TABLE IF EXISTS nums10;

-- যাচাই
SELECT 'Silver tasks' AS info, COUNT(*) AS total,
       SUM(CASE WHEN url = @silver_url THEN 1 ELSE 0 END) AS correct_url,
       SUM(reward) AS total_daily_income
FROM tasks WHERE title LIKE '[pkg:silver]%';

SELECT id, title, type, url, reward FROM tasks WHERE title LIKE '[pkg:silver]%' ORDER BY id;
