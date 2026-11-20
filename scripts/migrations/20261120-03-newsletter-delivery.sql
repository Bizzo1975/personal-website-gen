-- W14-W18: real newsletter delivery through Microsoft Graph (operator decision 2026-11-20).
-- Double opt-in: a subscriber receives campaigns only after confirming by email.
-- Campaign send results are recorded, never assumed. Idempotent.
BEGIN;

ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS confirmation_token UUID;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscribers_confirmation_token
  ON newsletter_subscribers(confirmation_token) WHERE confirmation_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscribers_unsubscribe_token
  ON newsletter_subscribers(unsubscribe_token) WHERE unsubscribe_token IS NOT NULL;
UPDATE newsletter_subscribers SET unsubscribe_token = uuid_generate_v4() WHERE unsubscribe_token IS NULL;

ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS sent_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS failed_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS send_started_at TIMESTAMP;
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS last_error TEXT;

-- A send that Graph rejects is recorded as 'failed' (it is not a bounce).
ALTER TABLE newsletter_analytics DROP CONSTRAINT IF EXISTS newsletter_analytics_event_type_check;
ALTER TABLE newsletter_analytics ADD CONSTRAINT newsletter_analytics_event_type_check
  CHECK (event_type IN ('sent','failed','delivered','opened','clicked','bounced','unsubscribed','complained'));

COMMIT;
