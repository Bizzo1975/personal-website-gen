import { getPosts } from '@/lib/services/post-service';
import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET() {
  try {
    const posts = await getPosts({ 
      published: true, 
      limit: 20,
      sort: { date: -1 } 
    });
    
    // Use config for site URL with fallback
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || config.urls.frontend;
    
    // Basic site information
    const siteName = 'My Personal Website';
    const siteDescription = 'A blog about web development, technology, and personal projects';
    
    // Build the RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${siteUrl}</link>
    <description>${siteDescription}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml" />
    ${posts.map(post => `
    <item>
      <title>${post.title}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid>${siteUrl}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt}]]></description>
      ${post.tags.map(tag => `<category>${tag}</category>`).join('\n      ')}
    </item>`).join('\n    ')}
  </channel>
</rss>`;

    return new Response(rssXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
} 