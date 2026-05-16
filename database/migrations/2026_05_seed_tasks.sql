-- ===========================================================
-- Seed: 8 Ads + 2 Signup + 2 App Install tasks
-- Run on VPS:
--   mysql -u root -p clicktaka < database/migrations/2026_05_seed_tasks.sql
-- Links are placeholders ('#') — admin can edit later from Admin → Tasks.
-- ===========================================================

USE clicktaka;

-- Ensure ENUM supports all types used by the admin UI
ALTER TABLE tasks
  MODIFY COLUMN type ENUM('ad','video','app','social','game','signup','survey')
  NOT NULL DEFAULT 'ad';

-- Ensure description column exists (created in 2026_05_tasks_advanced.sql)
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'description'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE tasks ADD COLUMN description TEXT NULL AFTER title',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ---------- 8 ADS TASKS ----------
INSERT INTO tasks (title, description, type, url, reward, active) VALUES
('Ad Task #1 — Watch & Earn',
 'এই ad টি ক্লিক করে কমপক্ষে ২৫ সেকেন্ড সম্পূর্ণ দেখুন। তারপর Complete বাটনে ক্লিক করে reward নিন।',
 'ad', '#', 1.00, 1),
('Ad Task #2 — Sponsor Promo',
 'Sponsor এর ad পেজে যান, পুরো কন্টেন্ট স্ক্রল করুন। ২৫ সেকেন্ড পর Complete বাটন active হবে।',
 'ad', '#', 1.00, 1),
('Ad Task #3 — Daily Banner',
 'আজকের banner ad টি ভিজিট করুন। পেজটি কমপক্ষে ২৫ সেকেন্ড ওপেন রাখুন।',
 'ad', '#', 1.00, 1),
('Ad Task #4 — Product Showcase',
 'নিচের ad লিঙ্কে গিয়ে product টি দেখুন। ২৫ সেকেন্ড পর Complete করুন।',
 'ad', '#', 1.00, 1),
('Ad Task #5 — Offer Page',
 'Special offer পেজটি ভিজিট করুন এবং পুরো অফারটি পড়ুন।',
 'ad', '#', 1.00, 1),
('Ad Task #6 — Video Ad',
 'Video ad টি সম্পূর্ণ দেখুন (skip করবেন না)। তারপর Complete বাটনে ক্লিক করুন।',
 'ad', '#', 1.50, 1),
('Ad Task #7 — Brand Story',
 'Brand story পেজে গিয়ে কন্টেন্ট পড়ুন। ২৫ সেকেন্ড পর reward পাবেন।',
 'ad', '#', 1.00, 1),
('Ad Task #8 — Bonus Ad',
 'বোনাস ad — সম্পূর্ণ দেখলে বেশি reward। কমপক্ষে ২৫ সেকেন্ড থাকুন।',
 'ad', '#', 2.00, 1);

-- ---------- 2 SIGNUP TASKS ----------
INSERT INTO tasks (title, description, type, url, reward, active) VALUES
('Signup Task #1 — Partner Site Registration',
 'Partner ওয়েবসাইটে নতুন account তৈরি করুন। সঠিক email ও phone ব্যবহার করুন। Signup শেষে Complete বাটনে ক্লিক করুন।',
 'signup', '#', 10.00, 1),
('Signup Task #2 — App / Service Signup',
 'নিচের লিঙ্কে গিয়ে service টিতে register করুন। Verification সম্পন্ন করার পর Complete করুন।',
 'signup', '#', 15.00, 1);

-- ---------- 2 APP INSTALL TASKS ----------
INSERT INTO tasks (title, description, type, url, reward, active) VALUES
('App Install #1 — Download & Open',
 'লিঙ্ক থেকে app টি install করুন। Install শেষে app ওপেন করে কমপক্ষে ৩০ সেকেন্ড ব্যবহার করুন, তারপর Complete করুন।',
 'app', '#', 20.00, 1),
('App Install #2 — Install & Register',
 'App install করার পর সেখানে একটি account তৈরি করুন। Registration complete হলে Complete বাটনে ক্লিক করুন।',
 'app', '#', 25.00, 1);
