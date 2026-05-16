-- ===========================================================
-- Silver package: যেসব task-এর url missing/placeholder সেগুলোতে valid link বসাই
-- Run: mysql -u root -p clicktaka < database/migrations/2026_05_silver_url_fix.sql
-- ===========================================================
USE clicktaka;

SET @ad_url    := 'https://arkgleamfox.com/s9ufy3v3?key=27a3204151874ee387f13410abebab90';
SET @app_url   := 'https://www.mobtrk.link/view.php?id=5544825&pub=856633';
SET @sign1_url := 'https://arkgleamfox.com/s9ufy3v3?key=27a3204151874ee387f13410abebab90';
SET @sign2_url := 'https://singingfiles.com/show.php?l=0&u=165410&id=54746';
SET @pid       := (SELECT id FROM packages WHERE name = 'Silver' LIMIT 1);

-- ১) Before snapshot
SELECT '=== BEFORE: Silver tasks with missing url ===' AS section;
SELECT t.id, t.type, t.title, t.url
FROM tasks t JOIN task_packages tp ON tp.task_id=t.id
WHERE tp.package_id=@pid AND (t.url IS NULL OR t.url='' OR t.url='#');

-- ২) সব Ad task → ad_url
UPDATE tasks t
JOIN task_packages tp ON tp.task_id = t.id
SET t.url = @ad_url
WHERE tp.package_id = @pid
  AND t.type = 'ad'
  AND (t.url IS NULL OR t.url = '' OR t.url = '#' OR t.url NOT LIKE 'http%');

-- ৩) সব App-install task → app_url
UPDATE tasks t
JOIN task_packages tp ON tp.task_id = t.id
SET t.url = @app_url
WHERE tp.package_id = @pid
  AND t.type = 'app'
  AND (t.url IS NULL OR t.url = '' OR t.url = '#' OR t.url NOT LIKE 'http%');

-- ৪) Signup tasks → একটাকে sign1, বাকিগুলোকে sign2 (id ভিত্তিক alternation)
UPDATE tasks t
JOIN task_packages tp ON tp.task_id = t.id
SET t.url = CASE WHEN (t.id % 2) = 0 THEN @sign1_url ELSE @sign2_url END
WHERE tp.package_id = @pid
  AND t.type = 'signup'
  AND (t.url IS NULL OR t.url = '' OR t.url = '#' OR t.url NOT LIKE 'http%');

-- ৫) সব task active করি
UPDATE tasks t
JOIN task_packages tp ON tp.task_id = t.id
SET t.active = 1
WHERE tp.package_id = @pid;

-- ৬) After snapshot — verify সব valid
SELECT '=== AFTER: Silver tasks full list ===' AS section;
SELECT t.id, t.type, t.title, t.url, t.reward, t.active
FROM tasks t JOIN task_packages tp ON tp.task_id=t.id
WHERE tp.package_id=@pid
ORDER BY FIELD(t.type,'ad','app','signup','video','social','game','survey'), t.id;

SELECT '=== AFTER: by type counts ===' AS section;
SELECT t.type, COUNT(*) AS total,
       SUM(CASE WHEN t.url LIKE 'http%' THEN 1 ELSE 0 END) AS with_valid_url,
       SUM(CASE WHEN t.url IS NULL OR t.url='' OR t.url='#' THEN 1 ELSE 0 END) AS missing_url
FROM tasks t JOIN task_packages tp ON tp.task_id=t.id
WHERE tp.package_id=@pid
GROUP BY t.type;
