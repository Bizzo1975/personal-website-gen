CREATE TABLE marketing_site_states (site_id TEXT PRIMARY KEY,project_id TEXT NOT NULL,owner_key TEXT NOT NULL,target TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,generation INTEGER NOT NULL DEFAULT 0,withdrawn INTEGER NOT NULL DEFAULT 1,published_revision TEXT);
CREATE TABLE marketing_site_revisions (site_id TEXT NOT NULL REFERENCES marketing_site_states(site_id),revision TEXT NOT NULL,payload_json TEXT NOT NULL,payload_digest TEXT NOT NULL,PRIMARY KEY(site_id,revision));
CREATE TABLE marketing_operations (operation_id TEXT PRIMARY KEY,envelope_digest TEXT NOT NULL,site_id TEXT NOT NULL REFERENCES marketing_site_states(site_id),result_json TEXT NOT NULL);
CREATE TABLE marketing_site_assets (project_id TEXT NOT NULL,digest TEXT NOT NULL,base64 TEXT NOT NULL,PRIMARY KEY(project_id,digest));
