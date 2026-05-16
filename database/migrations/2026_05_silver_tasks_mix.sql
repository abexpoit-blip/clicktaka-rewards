-- ===========================================================
-- Silver package: 10 tasks = 7 ad + 1 app + 2 signup
-- Run: mysql -u root -p clicktaka < database/migrations/2026_05_silver_tasks_mix.sql
-- Idempotent
-- ===========================================================
USE clicktaka;

-- ENUM-এ signup আছে কিনা নিশ্চিত
ALTER TABLE tasks
  MODIFY COLUMN type ENUM('ad','video','app','social','game','signup','survey')
  NOT NULL DEFAULT 'ad';

SET @ad_url    := 'https://arkgleamfox.com/s9ufy3v3?key=27a3204151874ee387f13410abebab90';
SET @app_url   := 'https://www.mobtrk.link/view.php?id=5544825&pub=856633';
SET @sign1_url := 'https://arkgleamfox.com/s9ufy3v3?key=27a3204151874ee387f13410abebab90';
SET @sign2_url := 'https://singingfiles.com/show.php?l=0&u=165410&id=54746';
SET @pid       := (SELECT id FROM packages WHERE name = 'Silver' LIMIT 1);

-- Silver daily limit = 10
UPDATE packages SET daily_task_limit = 10 WHERE id = @pid;

-- পুরনো Silver tasks মুছে আবার বানাই
DELETE tp FROM task_packages tp
  JOIN tasks t ON t.id = tp.task_id
  WHERE t.title LIKE '[pkg:silver]%';
DELETE FROM tasks WHERE title LIKE '[pkg:silver]%';

-- 7 টা Ad task (একই URL)
INSERT INTO tasks (title, description, type, url, reward, active) VALUES
('[pkg:silver] Silver Ad #1', 'Ad লিংকে যান, ২৫ সেকেন্ড থাকুন, তারপর Complete করে ৳১০ পান।', 'ad', @ad_url, 10.00, 1),
('[pkg:silver] Silver Ad #2', 'Ad লিংকে যান, ২৫ সেকেন্ড থাকুন, তারপর Complete করে ৳১০ পান।', 'ad', @ad_url, 10.00, 1),
('[pkg:silver] Silver Ad #3', 'Ad লিংকে যান, ২৫ সেকেন্ড থাকুন, তারপর Complete করে ৳১০ পান।', 'ad', @ad_url, 10.00, 1),
('[pkg:silver] Silver Ad #4', 'Ad লিংকে যান, ২৫ সেকেন্ড থাকুন, তারপর Complete করে ৳১০ পান।', 'ad', @ad_url, 10.00, 1),
('[pkg:silver] Silver Ad #5', 'Ad লিংকে যান, ২৫ সেকেন্ড থাকুন, তারপর Complete করে ৳১০ পান।', 'ad', @ad_url, 10.00, 1),
('[pkg:silver] Silver Ad #6', 'Ad লিংকে যান, ২৫ সেকেন্ড থাকুন, তারপর Complete করে ৳১০ পান।', 'ad', @ad_url, 10.00, 1),
('[pkg:silver] Silver Ad #7', 'Ad লিংকে যান, ২৫ সেকেন্ড থাকুন, তারপর Complete করে ৳১০ পান।', 'ad', @ad_url, 10.00, 1);

-- 1 টা App Install task
INSERT INTO tasks (title, description, type, url, reward, active) VALUES
('[pkg:silver] App Install Offer', 'App install করুন offer page থেকে, তারপর ফিরে এসে Complete করে ৳১০ নিন।', 'app', @app_url, 10.00, 1);

-- 2 টা Signup task
INSERT INTO tasks (title, description, type, url, reward, active) VALUES
('[pkg:silver] Signup Bonus #1', 'Signup page-এ গিয়ে account খুলুন, তারপর Complete করে ৳১০ পান।', 'signup', @sign1_url, 10.00, 1),
('[pkg:silver] Signup Bonus #2', 'Signup page-এ গিয়ে account খুলুন, তারপর Complete করে ৳১০ পান।', 'signup', @sign2_url, 10.00, 1);

-- সবগুলো Silver package-এর সাথে link
INSERT INTO task_packages (task_id, package_id)
SELECT id, @pid FROM tasks WHERE title LIKE '[pkg:silver]%';

-- যাচাই
SELECT 'Silver tasks' AS info, COUNT(*) AS total,
       SUM(CASE WHEN type='ad' THEN 1 ELSE 0 END) AS ads,
       SUM(CASE WHEN type='app' THEN 1 ELSE 0 END) AS apps,
       SUM(CASE WHEN type='signup' THEN 1 ELSE 0 END) AS signups,
       SUM(reward) AS total_daily_income
FROM tasks WHERE title LIKE '[pkg:silver]%';

SELECT id, type, title, url, reward FROM tasks WHERE title LIKE '[pkg:silver]%' ORDER BY FIELD(type,'ad','app','signup'), id;
