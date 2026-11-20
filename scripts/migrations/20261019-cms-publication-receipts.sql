-- Explicit additive PostgreSQL migration; never execute automatically during requests.
CREATE TABLE me_manager_publication_receipts (
  request_id TEXT PRIMARY KEY,
  request_hash TEXT NOT NULL,
  receipt_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
