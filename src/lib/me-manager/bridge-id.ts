/**
 * Lunchpail stores each website row's id as its "external id" and calls the bridge with
 * it. WWFL ids are UUIDs. Kecktech rows were created by the old Kecktech CMS with cuid
 * ids; when they are migrated into this codebase they keep that id in `legacy_id`
 * (migration 20261121-07) so every existing Lunchpail link keeps working.
 *
 * External id = legacy_id when present, else the UUID. Every bridge route resolves the
 * id it is called with through here and answers with the external id, never the UUID
 * of a migrated row.
 */
import { query } from '@/lib/db';
import { siteKey } from '@/lib/site-profile';

export type BridgeTable = 'posts' | 'projects';

/** SQL expression for the external id of a row (use with `AS id`). */
export const EXTERNAL_ID = 'COALESCE(legacy_id, id::text)';

/** Internal UUID for an external id, or null when no row matches. */
export async function resolveBridgeId(table: BridgeTable, externalId: string): Promise<string | null> {
  if (!externalId || externalId.length > 255) return null;
  const r = await query(
    `SELECT id FROM ${table} WHERE id::text = $1 OR legacy_id = $1 LIMIT 2`,
    [externalId]
  );
  if (r.rows.length === 1) return r.rows[0].id;
  // The old Kecktech CMS also accepted a project's slug in place of its id; the Kecktech
  // instance keeps that, WWFL never did.
  if (table === 'projects' && siteKey() === 'kecktech' && r.rows.length === 0) {
    const s = await query(`SELECT id FROM projects WHERE slug = $1`, [externalId]);
    if (s.rows.length === 1) return s.rows[0].id;
  }
  return null;
}

/** Replace a row's UUID with its external id (and drop legacy_id) before replying. */
export function externalize<T extends Record<string, unknown>>(row: T): T {
  const { legacy_id, ...rest } = row as Record<string, unknown>;
  return { ...rest, id: legacy_id ?? row.id } as unknown as T;
}

/** The `source` label the bridge reports (informational; Lunchpail does not check it). */
export function bridgeSource(): string {
  return siteKey() === 'kecktech' ? 'kecktech' : 'willworkforlunch';
}
