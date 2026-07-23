import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Thin ME Manager bridge — list + create posts.
 * Auth: Authorization: Bearer <ME_MANAGER_API_KEY>
 */
function authorize(request: Request): boolean {
  const key = process.env.ME_MANAGER_API_KEY;
  if (!key) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${key}`;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT id, title, slug, status, published, excerpt, updated_at, created_at
       FROM posts
       ORDER BY updated_at DESC NULLS LAST, created_at DESC
       LIMIT 100`
    );

    return NextResponse.json({
      posts: result.rows,
      source: "willworkforlunch",
    });
  } catch (error) {
    console.error("me-manager posts list failed:", error);
    return NextResponse.json(
      { error: "Failed to list posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const title = body.title as string;
    const slug = (body.slug as string) || title?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const content = (body.content as string) || "";
    const excerpt = (body.excerpt as string) || "";
    const tags = (body.tags as string[]) || ["me-manager"];
    const status = (body.status as string) || "draft";
    const published = Boolean(body.published);

    if (!title || !slug) {
      return NextResponse.json(
        { error: "title and slug required" },
        { status: 400 }
      );
    }

    // Resolve a system user for created_by if possible
    const userRes = await query(
      `SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`
    );
    const createdBy = userRes.rows[0]?.id || null;

    const result = await query(
      `INSERT INTO posts (
        title, slug, content, excerpt, tags, author, read_time, date,
        permission_level, published, status, created_by, featured_image
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, CURRENT_DATE,
        'all', $8, $9, $10, $11
      )
      RETURNING id, title, slug, status, published, excerpt, created_at`,
      [
        title,
        slug,
        content,
        excerpt,
        tags,
        body.author || "ME Manager",
        body.read_time || "3 min",
        published,
        status,
        createdBy,
        body.featured_image || null,
      ]
    );

    return NextResponse.json({
      ok: true,
      post: result.rows[0],
      source: "willworkforlunch",
    });
  } catch (error) {
    console.error("me-manager create post failed:", error);
    return NextResponse.json(
      {
        error: "Failed to create post",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
