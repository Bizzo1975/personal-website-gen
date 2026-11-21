/**
 * Kecktech instance: mirror published, available projects into the Astro site's
 * demos.json (apps[]), as the old Kecktech CMS did (kecktech-cms/lib/projects.ts, same
 * behaviour). Runs only when DEMOS_JSON_PATH is set, so WWFL is unaffected. The file's
 * hero/section copy is kept; apps[] is rebuilt every time.
 */
import fs from 'node:fs';
import path from 'node:path';
import { query } from '@/lib/db';
import { readProjectResourceLinks } from '@/lib/project-resource-links';

/** CMS / Portfolio slug aliases → canonical marketing id (from the old Kecktech CMS). */
export const DEMO_SLUG_ALIASES: Record<string, string> = {
  'net-ops': 'netops',
  'kecktech-portal': 'portal',
  'chat-kecktech': 'chat',
  sovereign: 'sovereign-hub',
  syll: 'aerocad',
};

export function canonicalizeDemoId(slug: string): string | null {
  const raw = (slug || '').trim().toLowerCase();
  if (!raw) return null;
  return DEMO_SLUG_ALIASES[raw] || raw;
}

type DemoApp = {
  id: string;
  name: string;
  description: string;
  url: string;
  image: string;
  contactEmail: string;
  available: boolean;
  marketingUrl?: string;
  videoUrls?: string[];
  demoUser?: string;
  demoPassword?: string;
};

const DEFAULT_FILE = {
  hero: { h1: 'Live Demos. Real Apps.', subtitle: 'Open the apps we build and host.', cta: 'Talk to Us →', ctaSecondary: 'Browse Demos ↓' },
  demos: { label: 'Built by Kecktech', heading: 'Try the Apps', intro: 'Each card opens a running demo.' },
  apps: [],
  cta: {
    heading: 'Want Something Like This for Your Business?',
    body: 'Tell us what you need — we’ll scope a custom app or adapt one of these patterns to your workflow.',
    button: 'Contact Kecktech →',
  },
};

export type DemosSyncResult = { ok: true; count: number; path: string } | { ok: false; reason: string };

export async function syncProjectsToDemosJson(): Promise<DemosSyncResult> {
  const demosPath = process.env.DEMOS_JSON_PATH;
  if (!demosPath) return { ok: false, reason: 'DEMOS_JSON_PATH unset' };
  try {
    const r = await query(
      `SELECT slug, title, description, content, image, live_demo, contact_email, available
         FROM projects WHERE status = 'published' AND available = true
        ORDER BY updated_at DESC NULLS LAST`
    );
    let existing: Record<string, unknown>;
    if (!fs.existsSync(demosPath)) {
      existing = { ...DEFAULT_FILE };
    } else {
      // The page copy in this file is edited in the Express admin. An unreadable file is
      // reported, never replaced with the defaults (the old CMS overwrote it).
      existing = JSON.parse(fs.readFileSync(demosPath, 'utf8'));
    }
    const prev = Array.isArray(existing.apps) ? (existing.apps as DemoApp[]) : [];
    const curated = new Map<string, DemoApp>();
    for (const app of prev) {
      if (!app || typeof app.id !== 'string') continue;
      const id = canonicalizeDemoId(app.id);
      if (id) curated.set(id, { ...app, id });
    }
    // First row wins per canonical id (newest edit first).
    const apps = new Map<string, DemoApp>();
    for (const p of r.rows) {
      const id = canonicalizeDemoId(p.slug);
      if (!id || apps.has(id)) continue;
      const before = curated.get(id);
      apps.set(id, {
        id,
        name: p.title || before?.name || id,
        description: p.description || before?.description || '',
        url: p.live_demo || before?.url || '#',
        image: p.image || before?.image || `/images/demos/${id}.jpg`,
        contactEmail: p.contact_email || before?.contactEmail || `${id}@kecktech.net`,
        available: p.available !== false,
        ...readProjectResourceLinks(p.content),
        ...(before?.demoUser ? { demoUser: before.demoUser } : {}),
        ...(before?.demoPassword ? { demoPassword: before.demoPassword } : {}),
      });
    }
    const next = { ...existing, apps: [...apps.values()] };
    fs.mkdirSync(path.dirname(demosPath), { recursive: true });
    const tmp = `${demosPath}.${process.pid}.${Date.now()}.tmp`;
    try {
      fs.writeFileSync(tmp, JSON.stringify(next, null, 2) + '\n', { encoding: 'utf8', flag: 'wx', mode: 0o644 });
      fs.renameSync(tmp, demosPath);
    } finally {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
    return { ok: true, count: apps.size, path: demosPath };
  } catch (e) {
    console.error('demos.json sync failed:', e instanceof Error ? e.message : e);
    return { ok: false, reason: e instanceof Error ? e.message : 'demos.json sync failed' };
  }
}
