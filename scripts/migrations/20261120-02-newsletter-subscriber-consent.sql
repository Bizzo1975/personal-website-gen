-- W3: the subscriber admin (list filters, analytics, consent actions, create/update)
-- reads and writes gdpr_consent, gdpr_consent_date and data_retention_date on
-- newsletter_subscribers, but no schema file or migration ever created them.
-- Existing subscribers get gdpr_consent = false ("pending"): their consent was never
-- recorded, so it must not be shown as given. Idempotent.
BEGIN;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS gdpr_consent BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS gdpr_consent_date TIMESTAMP;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS data_retention_date TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_gdpr_consent ON newsletter_subscribers(gdpr_consent);
COMMIT;
