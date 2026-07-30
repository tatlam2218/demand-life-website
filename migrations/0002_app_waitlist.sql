-- Migration 0002: App early-adopter waitlist
-- Stores name + email of people who sign up to be notified when the Demain app launches.

CREATE TABLE IF NOT EXISTS app_waitlist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  locale     TEXT    NOT NULL DEFAULT 'en',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Unique constraint on email so the same address can't register twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_waitlist_email ON app_waitlist(email);
