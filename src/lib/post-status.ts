/**
 * W8/W34: one rule for what a post's status means, applied by every route that changes it.
 *
 * The public blog shows a post when `published = true OR status = 'published'`, and the
 * scheduler publishes `status = 'scheduled'` posts whose `scheduled_publish_at` has passed.
 * Changing only `status` therefore left reverted posts public (published stayed true) and
 * left drafts carrying an old schedule (which also blocks Lunchpail's draft edits).
 *
 *   draft     -> published = false, scheduled_publish_at = NULL
 *   scheduled -> published = false (the schedule itself is set by the schedule routes)
 *   published -> published = true, published_at kept or set now (schedule kept as history)
 *   (no status change) -> fields untouched, except `published` may take `publishedParam`
 *
 * `statusParam` / `publishedParam` are SQL placeholders such as '$5'; either may be NULL.
 */
export function postStatusAssignments(statusParam: string, publishedParam?: string): string {
  const s = `${statusParam}::text`;
  const keepPublished = publishedParam ? `COALESCE(${publishedParam}::boolean, published)` : 'published';
  return [
    `status = COALESCE(${s}, status)`,
    `published = CASE WHEN ${s} = 'published' THEN true WHEN ${s} IN ('draft', 'scheduled') THEN false ELSE ${keepPublished} END`,
    // Only a revert to draft clears the schedule. A published post keeps the date it was
    // planned for, as every publish path (scheduler, Lunchpail, publish-now) already does.
    `scheduled_publish_at = CASE WHEN ${s} = 'draft' THEN NULL ELSE scheduled_publish_at END`,
    `published_at = CASE WHEN ${s} = 'published' THEN COALESCE(published_at, CURRENT_TIMESTAMP) ELSE published_at END`,
  ].join(',\n        ');
}

export const POST_STATUSES = ['draft', 'scheduled', 'published'] as const;

/** null = no status change requested; false = invalid value */
export function parsePostStatus(value: unknown): string | null | false {
  if (value === undefined || value === null || value === '') return null;
  return (POST_STATUSES as readonly string[]).includes(String(value)) ? String(value) : false;
}
