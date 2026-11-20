-- W8/W34 data repair (idempotent). Apply on live only in the approved deploy window, after a backup.
-- Reverting a post to draft used to keep its scheduled_publish_at (and could keep published = true).
-- Live check 2026-11-20 (read-only): 7 drafts carry a stale schedule (the paused campaign's WWFL
-- posts, dated 21-30 Nov); 0 drafts are published. Lunchpail's draft-content edits require
-- scheduled_publish_at IS NULL, so those 7 cannot be edited from Lunchpail until this runs.
-- updated_at is bumped so Lunchpail's sync sees the change and its revision lock moves on.
BEGIN;

UPDATE posts
   SET scheduled_publish_at = NULL,
       published = false,
       updated_at = GREATEST(clock_timestamp(), updated_at + interval '1 millisecond')
 WHERE status = 'draft'
   AND (scheduled_publish_at IS NOT NULL OR published = true);

-- What remains inconsistent (expected: no rows)
SELECT id, title, status, published, scheduled_publish_at
  FROM posts
 WHERE (status = 'draft' AND (published OR scheduled_publish_at IS NOT NULL))
    OR (status = 'scheduled' AND published);

COMMIT;
