-- Migration 01: Database Tables Initialization

-- 1. Create sports_event_sponsorship_kit_donation Table
CREATE TABLE IF NOT EXISTS sports_event_sponsorship_kit_donation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_limit REAL NOT NULL DEFAULT 0.0,
  items_donated TEXT NOT NULL,
  brand_visibility_received TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Approved',
  notes TEXT,
  total_cost REAL NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create audit_logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sponsorship_id INTEGER NOT NULL,
  items_donated TEXT,
  brand_visibility_received TEXT,
  status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'Staff/System',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(sponsorship_id) REFERENCES sports_event_sponsorship_kit_donation(id)
);
