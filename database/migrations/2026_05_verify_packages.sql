-- ===========================================================
-- Verification: প্রতিটা package-এ duplicate task আছে কিনা চেক
-- Run: mysql -u root -p clicktaka < database/migrations/2026_05_verify_packages.sql
-- কোনো data পরিবর্তন করে না — শুধু report দেখায়
-- ===========================================================
USE clicktaka;

-- 1) প্রতিটা package-এর summary
SELECT '=== PACKAGE SUMMARY ===' AS section;
SELECT p.id, p.name, p.price, p.daily_task_limit, p.daily_earning, p.validity_days, p.active,
       COUNT(tp.task_id) AS linked_tasks
FROM packages p
LEFT JOIN task_packages tp ON tp.package_id = p.id
GROUP BY p.id, p.name, p.price, p.daily_task_limit, p.daily_earning, p.validity_days, p.active
ORDER BY p.price ASC;

-- 2) Silver package detail
SELECT '=== SILVER TASK BREAKDOWN ===' AS section;
SELECT t.id, t.type, t.title, t.url, t.reward, t.active
FROM tasks t
JOIN task_packages tp ON tp.task_id = t.id
JOIN packages p ON p.id = tp.package_id
WHERE p.name = 'Silver'
ORDER BY FIELD(t.type,'ad','app','signup','video','social','game','survey'), t.id;

-- 3) Silver type counts
SELECT '=== SILVER TYPE COUNTS ===' AS section;
SELECT t.type, COUNT(*) AS count, SUM(t.reward) AS reward_sum
FROM tasks t
JOIN task_packages tp ON tp.task_id = t.id
JOIN packages p ON p.id = tp.package_id
WHERE p.name = 'Silver'
GROUP BY t.type;

-- 4) Duplicate task→package link check (একই task একই package-এ ২ বার)
SELECT '=== DUPLICATE LINKS (should be empty) ===' AS section;
SELECT task_id, package_id, COUNT(*) AS dup_count
FROM task_packages
GROUP BY task_id, package_id
HAVING COUNT(*) > 1;

-- 5) একই title একাধিকবার (পুরনো seed-এর leftover)
SELECT '=== DUPLICATE TITLES (should be empty) ===' AS section;
SELECT title, COUNT(*) AS cnt
FROM tasks
GROUP BY title
HAVING COUNT(*) > 1;

-- 6) Orphan tasks (কোনো package-এ link নেই)
SELECT '=== ORPHAN TASKS (no package link) ===' AS section;
SELECT t.id, t.type, t.title FROM tasks t
LEFT JOIN task_packages tp ON tp.task_id = t.id
WHERE tp.task_id IS NULL AND t.active = 1;
