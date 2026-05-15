-- ============================================
-- Migration: spin_settings (singleton) — wheel slices configurable from DB
-- VPS-এ একবার রান:  mysql -u root -p clicktaka < database/migrations/2026_05_spin_settings.sql
-- Idempotent — বারবার চালালেও safe।
-- ============================================
USE clicktaka;

CREATE TABLE IF NOT EXISTS spin_settings (
  id INT PRIMARY KEY DEFAULT 1,
  -- Comma-separated reward values (BDT). Wheel slice count = number of values (recommend 6–12).
  slices TEXT NOT NULL DEFAULT '50,100,150,200,300,400,500,600,800,1000',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (id = 1)
) ENGINE=InnoDB;

INSERT IGNORE INTO spin_settings (id, slices) VALUES (1, '50,100,150,200,300,400,500,600,800,1000');
