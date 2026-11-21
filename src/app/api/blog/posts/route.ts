import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { EXTERNAL_ID } from '@/lib/me-manager/bridge-id';
import { PUBLIC_POST_WHERE } from '@/lib/kecktech/public-posts';

export const dynamic = 'force-dynamic';

/**
 * Public published-post feed read by the Kecktech Astro build (dashboard/website
 * src/lib/cms-blog.ts), same response shape as the old Kecktech CMS. Only public posts
 * (permission 'all'); a gated post never ends up in the static site.
 */
export async function GET() {
  try {
    const r = await query(
      `SELECT ${EXTERNAL_ID} AS id, title, slug, excerpt, published_at
         FROM posts WHERE ${PUBLIC_POST_WHERE}
        ORDER BY published_at DESC NULLS LAST, created_at DESC`
    );
    return NextResponse.json({ posts: r.rows });
  } catch (error) {
    console.error('public blog list failed:', error);
    return NextResponse.json({ error: 'Failed to list posts' }, { status: 500 });
  }
}
