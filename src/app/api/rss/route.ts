import { getPosts } from '@/lib/services/post-service';
import { config } from '@/lib/config';

// Public RSS 2.0 feed of published, public (permission_level = 'all') posts.
// Served at /rss.xml (canonical), /api/rss, and /rss (redirects to /rss.xml).
export const dynamic = 'force-dynamic';

const SITE_NAME = 'Will Work For Lunch';
const SITE_DESCRIPTION =
  'Jon Keck builds things, runs Kecktech IT in Park City, Kansas, and writes about what he builds.';

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(value: unknown): string {
  return `<![CDATA[${String(value ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

export async function GET() {
  try {
    const posts = await getPosts({ limit: 20 });

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      config.urls.frontend ||
      'https://willworkforlunch.com'
    ).replace(/\/+$/, '');

    const items = posts
      .map((post) => {
        const link = `${siteUrl}/blog/${encodeURIComponent(post.slug)}`;
        const date = new Date(post.date);
        const pubDate = isNaN(date.getTime()) ? '' : `\n      <pubDate>${date.toUTCString()}</pubDate>`;
        const categories = (post.tags || [])
          .map((tag) => `\n      <category>${escapeXml(tag)}</category>`)
          .join('');
        return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>${pubDate}
      <description>${cdata(post.excerpt)}</description>${categories}
    </item>`;
      })
      .join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(siteUrl)}/rss.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>
`;

    return new Response(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
}
