-- Migration 0001: KV compatibility store
-- This table replicates Cloudflare KV semantics using D1 (SQLite).
-- All application data (bookings, rooms, orders, sessions, content, sheet IDs, folder IDs)
-- is stored here as key→value pairs, matching the original KV key schema exactly.

CREATE TABLE IF NOT EXISTS kv_store (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Index for prefix scans (used by list() with prefix)
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store(key);
