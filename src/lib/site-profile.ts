/**
 * One codebase, two sites (decision 2026-11-21): this app runs as the WWFL site and as the
 * Kecktech CMS instance. SITE_KEY selects the few behaviours that differ; everything else
 * is identical. Unset means WWFL (the existing deployment needs no new variable).
 */
export type SiteKey = 'wwfl' | 'kecktech';

export function siteKey(): SiteKey {
  return process.env.SITE_KEY === 'kecktech' ? 'kecktech' : 'wwfl';
}

/** Project statuses the site stores. Kecktech keeps 'archived' (hidden like draft); Lunchpail
 *  sends WWFL an archived project as 'draft'. */
export function projectStatuses(): readonly string[] {
  return siteKey() === 'kecktech'
    ? ['draft', 'scheduled', 'published', 'archived']
    : ['draft', 'scheduled', 'published'];
}
