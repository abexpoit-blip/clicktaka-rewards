-- ===========================================================
-- Seed: প্রতিটা package-এর জন্য আলাদা task set
-- Run once on VPS:
--   mysql -u root -p clicktaka < database/migrations/2026_05_seed_package_tasks.sql
-- Idempotent — `tag` marker দিয়ে duplicate এড়ানো হয়েছে।
--
-- v4 daily income এর সাথে exactly মিলবে:
--   Silver    : 10 tasks/day × ৳10  = ৳100
--   Silver 2  : 15 tasks/day × ৳40  = ৳600
--   Silver 3  : 20 tasks/day × ৳80  = ৳1600
--   Gold      : 30 tasks/day × ৳120 = ৳3600
--   Diamond   : 50 tasks/day × ৳152 = ৳7600
--   Royal     : 80 tasks/day × ৳195 = ৳15600
-- প্রতিটা package-এ daily limit-এর চেয়ে কিছু বেশি task seed হবে যাতে variety থাকে।
-- ===========================================================
USE clicktaka;

-- ENUM ও description column প্রস্তুত
ALTER TABLE tasks
  MODIFY COLUMN type ENUM('ad','video','app','social','game','signup','survey')
  NOT NULL DEFAULT 'ad';

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'description'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE tasks ADD COLUMN description TEXT NULL AFTER title',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Numbers helper (1..100)
DROP TEMPORARY TABLE IF EXISTS nums;
CREATE TEMPORARY TABLE nums (n INT PRIMARY KEY);
INSERT INTO nums (n)
WITH RECURSIVE seq AS (
  SELECT 1 AS n UNION ALL SELECT n+1 FROM seq WHERE n < 100
)
SELECT n FROM seq;

-- Stored procedure: এক package-এর জন্য N টা task seed + link
DROP PROCEDURE IF EXISTS seed_pkg_tasks;
DELIMITER //
CREATE PROCEDURE seed_pkg_tasks(
  IN p_name VARCHAR(64),
  IN p_count INT,
  IN p_reward DECIMAL(10,2)
)
BEGIN
  DECLARE v_pid INT;
  DECLARE v_tag VARCHAR(64);
  SELECT id INTO v_pid FROM packages WHERE name = p_name LIMIT 1;
  IF v_pid IS NULL THEN
    SELECT CONCAT('SKIP: package not found — ', p_name) AS info;
  ELSE
    SET v_tag = CONCAT('[pkg:', LOWER(REPLACE(p_name,' ','-')), ']');
    -- Already seeded? title prefix দিয়ে check
    IF (SELECT COUNT(*) FROM tasks WHERE title LIKE CONCAT(v_tag, '%')) = 0 THEN
      -- Insert tasks
      INSERT INTO tasks (title, description, type, url, reward, active)
      SELECT
        CONCAT(v_tag, ' ', p_name, ' Ad #', n),
        CONCAT(p_name, ' package এর জন্য বিশেষ ad task। ২৫ সেকেন্ড পেজে থাকুন, তারপর Complete করে ৳',
               FORMAT(p_reward,2), ' পান।'),
        'ad', '#', p_reward, 1
      FROM nums WHERE n <= p_count;
      -- Link them to this package only
      INSERT INTO task_packages (task_id, package_id)
      SELECT t.id, v_pid FROM tasks t WHERE t.title LIKE CONCAT(v_tag, '%');
    END IF;
  END IF;
END //
DELIMITER ;

-- প্রতিটা package-এর জন্য seed (daily limit + কিছু extra variety)
CALL seed_pkg_tasks('Silver',   12, 10.00);
CALL seed_pkg_tasks('Silver 2', 18, 40.00);
CALL seed_pkg_tasks('Silver 3', 24, 80.00);
CALL seed_pkg_tasks('Gold',     35, 120.00);
CALL seed_pkg_tasks('Diamond',  55, 152.00);
CALL seed_pkg_tasks('Royal',    85, 195.00);

DROP PROCEDURE IF EXISTS seed_pkg_tasks;

-- যাচাই: প্রতিটা package-এর task count + per-task reward + projected daily income
SELECT p.name AS package, p.daily_task_limit AS daily_limit, p.daily_earning AS daily_income,
       COUNT(tp.task_id) AS seeded_tasks,
       ROUND(AVG(t.reward),2) AS avg_reward,
       (p.daily_task_limit * ROUND(AVG(t.reward),2)) AS projected_daily
FROM packages p
LEFT JOIN task_packages tp ON tp.package_id = p.id
LEFT JOIN tasks t ON t.id = tp.task_id
GROUP BY p.id, p.name, p.daily_task_limit, p.daily_earning
ORDER BY p.price ASC;
