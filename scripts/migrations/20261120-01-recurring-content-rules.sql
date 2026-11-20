-- W2: recurring_content_rules is defined in config/init.sql but was never created on the
-- live database (init.sql only runs on an empty database). The Content Scheduler's
-- "Recurring Content" tab and /api/admin/recurring-content fail without it.
-- Idempotent: safe to run more than once. Mirrors config/init.sql exactly.
BEGIN;

CREATE TABLE IF NOT EXISTS recurring_content_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'project', 'newsletter')),
  template_content_id UUID,
  recurrence_pattern VARCHAR(50) NOT NULL CHECK (recurrence_pattern IN ('weekly', 'monthly')),
  recurrence_day INTEGER,
  recurrence_time TIME NOT NULL DEFAULT '09:00:00',
  is_active BOOLEAN DEFAULT true,
  target_access_levels TEXT[] DEFAULT ARRAY['all'],
  permissions JSONB DEFAULT '{"level": "all", "allowedRoles": ["admin", "editor", "author", "subscriber", "guest"], "allowedUsers": [], "restrictedUsers": [], "requiresAuth": false, "customRules": []}',
  next_scheduled_at TIMESTAMP,
  last_created_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recurring_content_rules_active ON recurring_content_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_content_rules_next_scheduled ON recurring_content_rules(next_scheduled_at);

DROP TRIGGER IF EXISTS update_recurring_content_rules_updated_at ON recurring_content_rules;
CREATE TRIGGER update_recurring_content_rules_updated_at BEFORE UPDATE ON recurring_content_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE posts ADD COLUMN IF NOT EXISTS recurring_rule_id UUID REFERENCES recurring_content_rules(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS recurring_rule_id UUID REFERENCES recurring_content_rules(id);
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS recurring_rule_id UUID REFERENCES recurring_content_rules(id);

CREATE INDEX IF NOT EXISTS idx_posts_recurring_rule ON posts(recurring_rule_id);
CREATE INDEX IF NOT EXISTS idx_projects_recurring_rule ON projects(recurring_rule_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_recurring_rule ON newsletter_campaigns(recurring_rule_id);

COMMIT;
