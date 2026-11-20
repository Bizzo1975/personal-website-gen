BEGIN;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS available BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stage_label TEXT;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK(status IN ('draft','scheduled','published','archived'));
CREATE TABLE me_manager_project_heads (
 id TEXT NOT NULL PRIMARY KEY,site TEXT NOT NULL,project_identity TEXT NOT NULL,
 intent_revision INTEGER NOT NULL DEFAULT 0,external_id UUID,last_slug TEXT,
 hidden BOOLEAN NOT NULL DEFAULT true,export_pending BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(site,project_identity),UNIQUE(site,external_id)
);
CREATE INDEX me_manager_project_heads_export_pending ON me_manager_project_heads(export_pending);
COMMIT;
