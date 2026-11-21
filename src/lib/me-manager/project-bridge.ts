/**
 * W7: the Lunchpail project bridge (/api/me-manager/projects).
 *
 * Lunchpail's WWFL lane writes a project and then reads it back; it only marks the
 * delivery confirmed when every field it sent comes back exactly. So a write here must
 * store what was sent, including a null that clears a field (COALESCE kept the old
 * value, so a cleared source_code/image/link could never be confirmed), and must keep
 * `available` and `stage_label` (migration 20261120-06).
 *
 * Rule: a key present in the body is written (null clears it); a missing key is kept.
 */
import { readProjectVideoResources } from '@/lib/project-video-resources';
import CacheService from '@/lib/cache';
import { revalidatePath } from 'next/cache';
import { projectStatuses } from '@/lib/site-profile';
import { syncProjectsToDemosJson, type DemosSyncResult } from '@/lib/kecktech/demos-json';

/** Bearer ME_MANAGER_API_KEY, like the rest of the bridge. */
export function authorizeBridge(request: Request): boolean {
  const key = process.env.ME_MANAGER_API_KEY;
  if (!key) return false;
  return (request.headers.get('authorization') || '') === `Bearer ${key}`;
}

/** After any write: drop cached project lists/rows, re-render the public pages and (Kecktech
 *  instance, DEMOS_JSON_PATH set) rewrite demos.json. Returns the demos.json outcome. */
export async function refreshProjectPages(id: string, slugs: (string | null | undefined)[]): Promise<DemosSyncResult> {
  const cache = CacheService.getInstance();
  await Promise.all([
    cache.invalidatePattern('projects:list:*'),
    cache.del(CacheService.getProjectKey(id)),
  ]).catch(e => console.warn('Project cache invalidation failed (non-fatal):', e instanceof Error ? e.message : e));
  try {
    revalidatePath('/projects');
    revalidatePath('/');
    for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(`/projects/${slug}`);
  } catch (e) {
    console.warn('revalidatePath failed (non-fatal):', e instanceof Error ? e.message : e);
  }
  return syncProjectsToDemosJson();
}


export const PROJECT_COLUMNS = `id, legacy_id, title, slug, description, content, image, technologies,
  live_demo, source_code, contact_email, featured, available, stage_label, status, published_at,
  updated_at, created_at`;

export function serializeProject(row: Record<string, unknown>) {
  return {
    // Lunchpail's external id: the old Kecktech id for migrated rows (see bridge-id.ts).
    id: row.legacy_id ?? row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    content: row.content,
    image: row.image,
    technologies: row.technologies || [],
    live_demo: row.live_demo,
    source_code: row.source_code,
    contact_email: row.contact_email ?? null,
    featured: Boolean(row.featured),
    available: row.available !== false,
    stage_label: row.stage_label ?? null,
    status: row.status,
    published_at: row.published_at,
    updated_at: row.updated_at,
    created_at: row.created_at,
  };
}

export type ProjectFields = Partial<{
  title: string; slug: string; description: string; content: string | null; image: string | null;
  technologies: string[]; live_demo: string | null; source_code: string | null; featured: boolean;
  available: boolean; stage_label: string | null; status: string; contact_email: string | null;
}>;

const has = (o: Record<string, unknown>, k: string) => Object.prototype.hasOwnProperty.call(o, k);
// Lunchpail's own slug rule: non-empty, no whitespace or URL separators.
const validSlug = (s: string) => s.length > 0 && s.length <= 200 && !/[\s/\\?#]/.test(s);

/** Reads the fields a body sets. Returns an error message for the first invalid one. */
export function parseProjectFields(body: unknown): { ok: true; fields: ProjectFields } | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Body must be a JSON object' };
  const b = body as Record<string, unknown>;
  const f: ProjectFields = {};
  const text = (k: string, max: number, nullable: boolean) => {
    const value = b[k];
    if (value === null && nullable) return null;
    if (typeof value !== 'string' || value.length > max) throw new Error(`Invalid ${k} (text up to ${max} characters${nullable ? ' or null' : ''})`);
    return value;
  };
  // Older callers used these names; the canonical key wins when both are sent.
  const alias = (k: string, ...others: string[]) => [k, ...others].find(name => has(b, name));
  try {
    if (has(b, 'title')) { f.title = text('title', 500, false) as string; if (!f.title.trim()) throw new Error('Invalid title'); }
    if (has(b, 'slug')) { f.slug = text('slug', 200, false) as string; if (!validSlug(f.slug)) throw new Error('Invalid slug'); }
    if (has(b, 'description')) f.description = b.description === null ? '' : text('description', 100000, false) as string;
    if (has(b, 'content')) {
      f.content = text('content', 2000000, true);
      try { readProjectVideoResources(f.content); } catch { throw new Error('Invalid project video information'); }
    }
    const image = alias('image', 'featured_image');
    if (image) f.image = text(image, 500, true);
    const demo = alias('live_demo', 'liveUrl', 'url');
    if (demo) f.live_demo = text(demo, 500, true);
    const source = alias('source_code', 'repoPath');
    if (source) f.source_code = text(source, 500, true);
    if (has(b, 'technologies')) {
      if (!Array.isArray(b.technologies) || b.technologies.length > 200 || b.technologies.some(t => typeof t !== 'string' || t.length > 200)) throw new Error('Invalid technologies');
      f.technologies = b.technologies as string[];
    }
    for (const k of ['featured', 'available'] as const) {
      if (has(b, k)) { if (typeof b[k] !== 'boolean') throw new Error(`Invalid ${k}`); f[k] = b[k] as boolean; }
    }
    if (has(b, 'stage_label')) f.stage_label = text('stage_label', 100, true);
    const contact = alias('contact_email', 'contactEmail');
    if (contact) {
      f.contact_email = text(contact, 255, true);
      if (f.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contact_email)) throw new Error('Invalid contact_email');
    }
    if (has(b, 'status')) {
      const allowed = projectStatuses();
      if (!allowed.includes(String(b.status))) throw new Error(`Invalid status (allowed: ${allowed.join(', ')})`);
      f.status = String(b.status);
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid project' };
  }
  return { ok: true, fields: f };
}

const COLUMNS = ['title', 'slug', 'description', 'content', 'image', 'technologies', 'live_demo',
  'source_code', 'contact_email', 'featured', 'available', 'stage_label', 'status'] as const;

/** SET list + values for an UPDATE; placeholders start at $<offset>. */
export function projectUpdateSet(f: ProjectFields, offset = 1): { set: string; values: unknown[] } {
  const parts: string[] = [];
  const values: unknown[] = [];
  let statusParam = '';
  for (const key of COLUMNS) {
    if (!(key in f)) continue;
    values.push(f[key]);
    const p = `$${offset + values.length - 1}`;
    // The status placeholder is reused below, so it needs one type everywhere.
    if (key === 'status') statusParam = `${p}::text`;
    parts.push(key === 'status' ? `status = ${statusParam}` : `${key} = ${p}`);
  }
  if (statusParam) {
    // Same meaning as the post rule: published keeps or sets its date; draft drops a schedule.
    parts.push(`published_at = CASE WHEN ${statusParam} = 'published' THEN COALESCE(published_at, CURRENT_TIMESTAMP) ELSE published_at END`);
    parts.push(`scheduled_publish_at = CASE WHEN ${statusParam} = 'draft' THEN NULL ELSE scheduled_publish_at END`);
  }
  parts.push('updated_at = CURRENT_TIMESTAMP');
  return { set: parts.join(',\n          '), values };
}
