export type DraftContentInput = { expectedRevision: string; title: string; excerpt: string; content: string; slug?: string; tags?: string[]; featured_image?: string | null };
export function parseDraftContent(value: unknown): DraftContentInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !['expectedRevision', 'title', 'excerpt', 'content', 'featured_image', 'slug', 'tags'].includes(key))) return null;
  if (typeof row.expectedRevision !== 'string' || !row.expectedRevision || row.expectedRevision.length > 100) return null;
  if (typeof row.title !== 'string' || !row.title.trim() || row.title.length > 1000) return null;
  if (typeof row.content !== 'string' || !row.content.trim() || row.content.length > 2000000) return null;
  if (typeof row.excerpt !== 'string' || row.excerpt.length > 20000) return null;
  if (row.slug !== undefined && (typeof row.slug !== 'string' || row.slug.length > 200 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug))) return null;
  if (row.featured_image !== undefined && row.featured_image !== null) {
    if (typeof row.featured_image !== 'string' || row.featured_image.length > 4096) return null;
    try { const url = new URL(row.featured_image); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null; } catch { return null; }
  }
  if (row.tags !== undefined && (!Array.isArray(row.tags) || row.tags.length > 100 || row.tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.length > 200))) return null;
  return row as DraftContentInput;
}
export const readDraftContentSql = `SELECT id, title, slug, content, excerpt, status, published, featured_image, tags, published_at, scheduled_publish_at, updated_at::text AS revision FROM posts WHERE id = $1`;
export const replaceDraftContentSql = `UPDATE posts SET title = $1, excerpt = $2, content = $3, slug = CASE WHEN $8::boolean THEN $9::text ELSE slug END,
  featured_image = CASE WHEN $4::boolean THEN $5::text ELSE featured_image END,
  tags = CASE WHEN $10::boolean THEN $11::text[] ELSE tags END,
  updated_at = GREATEST(clock_timestamp(), updated_at + interval '1 millisecond')
  WHERE id = $6 AND updated_at::text = $7 AND status = 'draft'
    AND published = false AND scheduled_publish_at IS NULL
  RETURNING id, title, slug, content, excerpt, status, published, featured_image, tags, published_at, scheduled_publish_at, updated_at::text AS revision`;
export function draftContentParameters(id: string, body: DraftContentInput): unknown[] {
  return [body.title, body.excerpt, body.content, Object.prototype.hasOwnProperty.call(body, 'featured_image'), body.featured_image ?? null, id, body.expectedRevision, Object.prototype.hasOwnProperty.call(body, 'slug'), body.slug ?? null, Object.prototype.hasOwnProperty.call(body, 'tags'), body.tags ?? []];
}
