-- W26: what the recurring-content processor needs. Idempotent. Requires 20261120-01.
-- time_zone: the rule's times are wall-clock times in this IANA zone (live runs UTC).
-- last_error / last_created_content_id: each run's real outcome, shown in the admin.
BEGIN;

ALTER TABLE recurring_content_rules ADD COLUMN IF NOT EXISTS time_zone VARCHAR(64) NOT NULL DEFAULT 'UTC';
ALTER TABLE recurring_content_rules ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE recurring_content_rules ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP;
ALTER TABLE recurring_content_rules ADD COLUMN IF NOT EXISTS last_created_content_id UUID;

COMMIT;
