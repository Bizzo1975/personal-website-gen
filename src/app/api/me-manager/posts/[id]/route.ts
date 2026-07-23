import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function authorize(request: Request): boolean {
  const key = process.env.ME_MANAGER_API_KEY;
  if (!key) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${key}`;
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

  try {
    const result = await query(
      `UPDATE posts SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        content = COALESCE($3, content),
        excerpt = COALESCE($4, excerpt),
        status = COALESCE($5, status),
        published = COALESCE($6, published),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, title, slug, status, published, excerpt, updated_at`,
      [
        body.title ?? null,
        body.slug ?? null,
        body.content ?? null,
        body.excerpt ?? null,
        body.status ?? null,
        typeof body.published === "boolean" ? body.published : null,
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
