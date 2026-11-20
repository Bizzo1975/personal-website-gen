-- Additive schedule lookup index. Apply explicitly after publication receipts.
CREATE INDEX me_manager_publication_schedule_lookup_idx
ON me_manager_publication_receipts ((receipt_json::jsonb->>'postId'), created_at DESC, request_id DESC)
WHERE receipt_json IS NOT NULL AND receipt_json::jsonb->>'action' = 'schedule'
  AND receipt_json::jsonb->>'outcome' = 'confirmed';