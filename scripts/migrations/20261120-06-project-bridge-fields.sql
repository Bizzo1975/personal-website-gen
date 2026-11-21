-- W7: fields Lunchpail sends with every project and reads back to confirm a delivery.
-- Without them the readback can never match: WWFL dropped `available` and `stage_label`
-- ("Beta"), so every such delivery stayed unconfirmed. Idempotent; existing rows keep
-- available = true and no label, which is what the readback reported until now.
BEGIN;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS available BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stage_label VARCHAR(100);

COMMIT;
