import { getPosts } from '@/lib/services/post-service';
import { NextResponse } from 'next/server';

export async function GET() {
  // Fetch the latest posts for the feed
  const posts = await getPosts({ 
    published: true, 
    limit: 20,
    sort: { date: -1 } 
  });

  // Generate the base site URL from environment or use fallback
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
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

  // Return the XML with the appropriate content type
  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=21600' // Cache for 1 hour on client, 6 hours on CDN
    }
  });
} 