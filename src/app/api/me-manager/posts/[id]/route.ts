import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { parsePostStatus, postStatusAssignments } from "@/lib/post-status";

function authorize(request: Request): boolean {
  const key = process.env.ME_MANAGER_API_KEY;
  if (!key) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${key}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await query(
      `SELECT id, title, slug, content, excerpt, status, published,
              featured_image, tags, author, updated_at, created_at,
              published_at, scheduled_publish_at
       FROM posts
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      ok: true,
      post: {
        id: row.id,
        title: row.title,
        slug: row.slug,
        content: row.content,
        excerpt: row.excerpt,
        status: row.status,
        published: row.published,
        featured_image: row.featured_image,
        tags: row.tags,
        author: row.author,
        updated_at: row.updated_at,
        created_at: row.created_at,
        // W8: Lunchpail verifies an unschedule by reading these back
        published_at: row.published_at,
        scheduled_publish_at: row.scheduled_publish_at,
      },
      source: "willworkforlunch",
    });
  } catch (error) {
    console.error("me-manager get post failed:", error);
    return NextResponse.json(
      { error: "Failed to get post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const status = parsePostStatus(body.status);
  if (status === false) {
    return NextResponse.json({ error: "status must be draft, scheduled or published" }, { status: 400 });
  }
  if (status === null && typeof body.published === "boolean") {
    // `published` follows the status; publishing goes through POST /publish.
    return NextResponse.json({ error: "Send status with published (or use POST /api/me-manager/posts/:id/publish)" }, { status: 400 });
  }
  if (status === "scheduled") {
    // A schedule needs a date; that is what POST /schedule is for.
    return NextResponse.json({ error: "Use POST /api/me-manager/posts/:id/schedule to schedule a post" }, { status: 400 });
  }

  try {
    const result = await query(
      `UPDATE posts SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        content = COALESCE($3, content),
        excerpt = COALESCE($4, excerpt),
        ${postStatusAssignments("$5")},
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, title, slug, status, published, excerpt, updated_at, published_at, scheduled_publish_at`,
      [
        body.title ?? null,
        body.slug ?? null,
        body.content ?? null,
        body.excerpt ?? null,
        status,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, post: result.rows[0] });
  } catch (error) {
    console.error("me-manager patch failed:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}


/**
 * DELETE /api/me-manager/posts/:id — ME Manager "delete everywhere".
 * Removes the post row (draft, scheduled or published) and revalidates the
 * blog pages. 404 when the post does not exist: ME Manager treats that as
 * "already gone". Bearer ME_MANAGER_API_KEY, like the rest of this bridge.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await query(
      `DELETE FROM posts WHERE id = $1
       RETURNING id, title, slug, status, published`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = result.rows[0];
    revalidatePath("/blog");
    revalidatePath("/");
    if (post.slug) revalidatePath(`/blog/${post.slug}`);

    return NextResponse.json({ ok: true, deleted: post, source: "willworkforlunch" });
  } catch (error) {
    console.error("me-manager delete post failed:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
