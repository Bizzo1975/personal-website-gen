#!/usr/bin/env node
/**
 * One-time move of the old Kecktech CMS (SQLite, Prisma) into the Kecktech instance of this
 * codebase (Postgres). Decision 2026-11-21: one shared codebase.
 *
 * Input: a directory with JSON exports of the SQLite tables, made on VM230 with the
 * sqlite3 CLI (read-only):
 *   sqlite3 -readonly -json kecktech-cms.db 'SELECT * FROM "Post"'    > Post.json
 *   sqlite3 -readonly -json kecktech-cms.db 'SELECT * FROM "Project"' > Project.json
 *   (plus counts of every other table, which must be 0 or be handled; see below)
 *
 * Each row keeps its old id in legacy_id, so Lunchpail's stored ids keep working.
 * Timestamps are kept (Prisma stores SQLite DateTime as epoch ms or ISO text; both read).
 *
 * Usage:
 *   node import-kecktech-cms.mjs --dir <exports> --db <postgres-url>            dry run (default)
 *   node import-kecktech-cms.mjs --dir <exports> --db <postgres-url> --apply    write, one transaction
 * Re-running with --apply refuses rows whose legacy_id or slug already exists (no overwrite).
 */
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

// The target columns are TIMESTAMP (no zone) holding UTC, as the app reads them.
pg.defaults.parseInputDatesAsUTC = true;

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
if (!args.dir || !args.db) {
  console.error('usage: --dir <exports dir> --db <postgres url> [--apply]');
  process.exit(2);
}
const APPLY = args.apply === true;

const read = (name) => {
  const f = path.join(args.dir, `${name}.json`);
  if (!fs.existsSync(f)) throw new Error(`missing export ${f}`);
  const txt = fs.readFileSync(f, 'utf8').trim();
  return txt ? JSON.parse(txt) : []; // sqlite3 -json prints nothing for zero rows
};

export function toDate(v) {
  if (v === null || v === undefined || v === '') return null;
  const d = typeof v === 'number' || /^\d+$/.test(String(v)) ? new Date(Number(v)) : new Date(String(v));
  if (Number.isNaN(d.getTime())) throw new Error(`unreadable timestamp ${v}`);
  return d;
}
export function toArray(v) {
  if (Array.isArray(v)) return v.map(String);
  if (v === null || v === undefined || v === '') return [];
  const parsed = JSON.parse(String(v));
  if (!Array.isArray(parsed)) throw new Error(`not a JSON array: ${v}`);
  return parsed.map(String);
}
const bool = (v) => v === true || v === 1 || v === '1' || v === 'true';
const readTime = (text) => Math.max(1, Math.round(String(text || '').split(/\s+/).filter(Boolean).length / 200));
function fit(value, max, field, id) {
  if (value !== null && value !== undefined && String(value).length > max) throw new Error(`${id}: ${field} longer than ${max}`);
  return value ?? null;
}

const POST_STATUSES = new Set(['draft', 'scheduled', 'published']);
const PROJECT_STATUSES = new Set(['draft', 'scheduled', 'published', 'archived']);

export function mapPost(p) {
  if (!POST_STATUSES.has(p.status)) throw new Error(`${p.id}: post status ${p.status} has no equivalent`);
  const created = toDate(p.createdAt), published = toDate(p.publishedAt);
  return {
    legacy_id: fit(p.id, 64, 'id', p.id),
    title: fit(p.title, 500, 'title', p.id),
    slug: fit(p.slug, 255, 'slug', p.id),
    content: p.content ?? '',
    excerpt: p.excerpt ?? null,
    featured_image: fit(p.featuredImage, 500, 'featuredImage', p.id),
    tags: toArray(p.tags),
    author: fit(p.author || 'Kecktech', 255, 'author', p.id),
    read_time: readTime(p.content),
    date: (published || created || new Date()).toISOString().slice(0, 10),
    permission_level: 'all',
    status: p.status,
    published: bool(p.published),
    scheduled_publish_at: toDate(p.scheduledPublishAt),
    published_at: published,
    created_at: created,
    updated_at: toDate(p.updatedAt),
  };
}

export function mapProject(p) {
  if (!PROJECT_STATUSES.has(p.status)) throw new Error(`${p.id}: project status ${p.status} has no equivalent`);
  return {
    legacy_id: fit(p.id, 64, 'id', p.id),
    title: fit(p.title, 500, 'title', p.id),
    slug: fit(p.slug, 255, 'slug', p.id),
    description: p.description ?? '',
    content: p.content ?? null,
    image: fit(p.image, 500, 'image', p.id),
    technologies: toArray(p.technologies),
    live_demo: fit(p.liveDemo, 500, 'liveDemo', p.id),
    source_code: fit(p.sourceCode, 500, 'sourceCode', p.id),
    contact_email: fit(p.contactEmail, 255, 'contactEmail', p.id),
    featured: bool(p.featured),
    available: p.available === undefined ? true : bool(p.available),
    status: p.status,
    published_at: toDate(p.publishedAt),
    created_at: toDate(p.createdAt),
    updated_at: toDate(p.updatedAt),
  };
}

async function insert(client, table, row) {
  const cols = Object.keys(row);
  const r = await client.query(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING id`,
    cols.map(c => row[c])
  );
  return r.rows[0].id;
}

async function main() {
  const posts = read('Post').map(mapPost);
  const projects = read('Project').map(mapProject);
  // Tables this import does not carry: they must be empty (verified live 2026-11-20:
  // Page, Media, Setting, Slideshow, Newsletter* = 0 rows). Users are not moved: the
  // Kecktech admin signs in through Kecktech SSO.
  const mustBeEmpty = ['Page', 'MediaFile', 'Setting', 'SlideshowSlide', 'NewsletterCampaign', 'NewsletterSubscriber'];
  const notEmpty = mustBeEmpty.filter(t => fs.existsSync(path.join(args.dir, `${t}.json`)) && read(t).length > 0);
  if (notEmpty.length) throw new Error(`these tables have rows the import does not move: ${notEmpty.join(', ')}`);

  const client = new pg.Client({ connectionString: args.db });
  await client.connect();
  try {
    const clash = async (table, rows) => {
      if (!rows.length) return [];
      const r = await client.query(
        `SELECT slug, legacy_id FROM ${table} WHERE slug = ANY($1) OR legacy_id = ANY($2)`,
        [rows.map(r => r.slug), rows.map(r => r.legacy_id)]
      );
      return r.rows;
    };
    const postClash = await clash('posts', posts), projectClash = await clash('projects', projects);
    console.log(JSON.stringify({
      mode: APPLY ? 'apply' : 'dry-run',
      posts: { rows: posts.length, byStatus: count(posts, 'status'), clashes: postClash.length },
      projects: { rows: projects.length, byStatus: count(projects, 'status'), clashes: projectClash.length },
    }, null, 2));
    if (postClash.length || projectClash.length) {
      console.error('Refusing: some slugs or legacy ids already exist in the target:', [...postClash, ...projectClash]);
      process.exitCode = 1;
      return;
    }
    if (!APPLY) return;

    await client.query('BEGIN');
    for (const p of posts) await insert(client, 'posts', p);
    for (const p of projects) await insert(client, 'projects', p);
    // Verify inside the transaction before committing.
    const v = await client.query(
      `SELECT (SELECT count(*)::int FROM posts WHERE legacy_id = ANY($1)) AS posts,
              (SELECT count(*)::int FROM projects WHERE legacy_id = ANY($2)) AS projects`,
      [posts.map(p => p.legacy_id), projects.map(p => p.legacy_id)]
    );
    if (v.rows[0].posts !== posts.length || v.rows[0].projects !== projects.length) {
      await client.query('ROLLBACK');
      throw new Error(`verification failed: ${JSON.stringify(v.rows[0])}`);
    }
    await client.query('COMMIT');
    console.log(`Imported ${posts.length} posts and ${projects.length} projects.`);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw e;
  } finally {
    await client.end();
  }
}

function count(rows, key) {
  return rows.reduce((m, r) => ({ ...m, [r[key]]: (m[r[key]] || 0) + 1 }), {});
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('import-kecktech-cms.mjs')) {
  main().catch(e => { console.error('Import failed:', e.message); process.exit(1); });
}
