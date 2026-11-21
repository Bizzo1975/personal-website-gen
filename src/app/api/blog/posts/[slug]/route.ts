import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { EXTERNAL_ID } from '@/lib/me-manager/bridge-id';
import { PUBLIC_POST_WHERE } from '@/lib/kecktech/public-posts';

export const dynamic = 'force-dynamic';

/** One public post for the Kecktech Astro build; 404 when it is not public. */
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const r = await query(
      `SELECT ${EXTERNAL_ID} AS id, title, slug, excerpt, content, published_at
         FROM posts WHERE slug = $1 AND ${PUBLIC_POST_WHERE}`,
      [slug]
    );
    if (!r.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ post: r.rows[0] });
  } catch (error) {
    console.error('public blog get failed:', error);
    return NextResponse.json({ error: 'Failed to load post' }, { status: 500 });
  }
}
