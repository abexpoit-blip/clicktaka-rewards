-- ============================================
-- ClickTaka MySQL Schema
-- VPS-এ একবার রান করুন: mysql -u root -p clicktaka < database/schema.sql
-- ============================================

CREATE DATABASE IF NOT EXISTS clicktaka CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clicktaka;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) DEFAULT NULL,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  refer_code VARCHAR(20) UNIQUE NOT NULL,
  refer_by INT DEFAULT NULL,
  status ENUM('active','blocked') NOT NULL DEFAULT 'active',
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_refer (refer_code)
) ENGINE=InnoDB;

-- PACKAGES
CREATE TABLE IF NOT EXISTS packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  daily_task_limit INT NOT NULL DEFAULT 10,
  daily_earning DECIMAL(10,2) NOT NULL,
  validity_days INT NOT NULL DEFAULT 365,
  image VARCHAR(255) DEFAULT NULL,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- USER PACKAGES
CREATE TABLE IF NOT EXISTS user_packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  package_id INT NOT NULL,
  expires_at DATE NOT NULL,
  tasks_done_today INT DEFAULT 0,
  last_reset DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (package_id) REFERENCES packages(id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- TASKS (admin manages)
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type ENUM('ad','video','app','social','game') NOT NULL DEFAULT 'ad',
  url VARCHAR(500) DEFAULT NULL,
  reward DECIMAL(10,2) NOT NULL,
  package_required INT DEFAULT NULL,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TASK COMPLETIONS
CREATE TABLE IF NOT EXISTS task_completions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  task_id INT NOT NULL,
  reward DECIMAL(10,2) NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  INDEX idx_user_date (user_id, completed_at)
) ENGINE=InnoDB;

-- DEPOSITS
CREATE TABLE IF NOT EXISTS deposits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('bkash','nagad','rocket','upay','bank') NOT NULL,
  txn_id VARCHAR(100) NOT NULL,
  sender_number VARCHAR(20) DEFAULT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_note TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- WITHDRAWALS
CREATE TABLE IF NOT EXISTS withdrawals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('bkash','nagad','rocket','upay','bank') NOT NULL,
  account VARCHAR(50) NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_note TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrer_id INT NOT NULL,
  referred_id INT NOT NULL,
  commission DECIMAL(10,2) DEFAULT 0,
  level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_referrer (referrer_id)
) ENGINE=InnoDB;

-- TRANSACTIONS (audit log)
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('deposit','withdraw','task','refer','package','admin','refund') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(12,2) DEFAULT NULL,
  note VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id, created_at)
) ENGINE=InnoDB;

-- DAILY SPINS (Spin Wheel — limit per day depends on user's active package)
CREATE TABLE IF NOT EXISTS daily_spins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  spin_date DATE NOT NULL,
  reward DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, spin_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- NOTICES
CREATE TABLE IF NOT EXISTS notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- PAYMENT SETTINGS (singleton row — admin sets bKash/Nagad numbers + limits)
CREATE TABLE IF NOT EXISTS payment_settings (
  id INT PRIMARY KEY DEFAULT 1,
  bkash_number VARCHAR(50) NOT NULL DEFAULT '',
  nagad_number VARCHAR(50) NOT NULL DEFAULT '',
  min_deposit DECIMAL(10,2) NOT NULL DEFAULT 500,
  min_withdraw DECIMAL(10,2) NOT NULL DEFAULT 500,
  referral_percent DECIMAL(5,2) NOT NULL DEFAULT 10,
  CHECK (id = 1)
) ENGINE=InnoDB;

-- ADMIN LOGS
CREATE TABLE IF NOT EXISTS admin_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  target VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================
-- SEED DATA: 5 packages (bdt69 style)
-- ============================================
INSERT INTO packages (name, price, daily_task_limit, daily_earning, validity_days)
SELECT 'Silver', 500, 10, 50, 365 WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name='Silver')
UNION ALL SELECT 'Silver 2', 1000, 15, 110, 365 WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name='Silver 2')
UNION ALL SELECT 'Silver 3', 2000, 20, 230, 365 WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name='Silver 3')
UNION ALL SELECT 'Gold', 5000, 30, 600, 365 WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name='Gold')
UNION ALL SELECT 'Diamond', 10000, 50, 1300, 365 WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name='Diamond')
UNION ALL SELECT 'Royal', 20000, 80, 2800, 365 WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name='Royal');

INSERT IGNORE INTO payment_settings (id) VALUES (1);

INSERT INTO notices (title, body)
SELECT 'স্বাগতম ClickTaka-তে!', 'Task complete করে দৈনিক income করুন।'
WHERE NOT EXISTS (SELECT 1 FROM notices WHERE title='স্বাগতম ClickTaka-তে!');
