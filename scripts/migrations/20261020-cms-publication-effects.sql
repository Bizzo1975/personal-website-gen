BEGIN;
-- Apply explicitly after publication receipts; retain across application rollback.
CREATE TABLE me_manager_publication_effects (
  id TEXT PRIMARY KEY, request_id TEXT NOT NULL, site TEXT NOT NULL, post_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('cache','teaser','astro')),
  payload_hash TEXT NOT NULL, payload_json TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','running','unknown','completed','failed','cancelled')),
  attempt_count INTEGER NOT NULL DEFAULT 0, lease_id TEXT, lease_until TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(), result_json TEXT, error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(), updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(request_id,kind)
);
CREATE INDEX me_manager_publication_effects_due_idx ON me_manager_publication_effects(state,next_attempt_at);
CREATE INDEX me_manager_publication_effects_lease_idx ON me_manager_publication_effects(state,lease_until);
COMMIT;
