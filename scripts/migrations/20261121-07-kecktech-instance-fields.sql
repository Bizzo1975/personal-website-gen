-- Kecktech instance (one shared codebase, decision 2026-11-21). Additive and idempotent;
-- on WWFL every new column stays NULL and nothing changes.
--   legacy_id      the old Kecktech CMS id (cuid) of a migrated row; Lunchpail keeps using it
--   contact_email  per-project contact address shown on Kecktech demos
--   'archived'     project status Kecktech stores (hidden like draft)
BEGIN;

ALTER TABLE posts    ADD COLUMN IF NOT EXISTS legacy_id VARCHAR(64);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS legacy_id VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS posts_legacy_id_key    ON posts (legacy_id)    WHERE legacy_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS projects_legacy_id_key ON projects (legacy_id) WHERE legacy_id IS NOT NULL;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('draft', 'scheduled', 'published', 'archived'));

COMMIT;
