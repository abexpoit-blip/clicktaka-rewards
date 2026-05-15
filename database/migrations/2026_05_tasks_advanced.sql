-- ===========================================================
-- Tasks: description + multi-package targeting
-- Run once on VPS:
--   mysql -u root -p clicktaka < database/migrations/2026_05_tasks_advanced.sql
-- ===========================================================

USE clicktaka;

-- 1) Add description column to tasks (idempotent)
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'description'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE tasks ADD COLUMN description TEXT NULL AFTER title',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 2) Join table: which packages a task is restricted to.
--    Empty rows for a task = available to ALL active packages.
CREATE TABLE IF NOT EXISTS task_packages (
  task_id INT NOT NULL,
  package_id INT NOT NULL,
  PRIMARY KEY (task_id, package_id),
  INDEX idx_pkg (package_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
) ENGINE=InnoDB;
