import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import CacheService from "@/lib/cache";

function authorize(request: Request): boolean {
  const key = process.env.ME_MANAGER_API_KEY;
  if (!key) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${key}`;
}

function serializeProject(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    content: row.content,
    image: row.image,
    technologies: row.technologies || [],
    live_demo: row.live_demo,
    source_code: row.source_code,
    featured: Boolean(row.featured),
    status: row.status,
    published_at: row.published_at,
    updated_at: row.updated_at,
    created_at: row.created_at,
  };
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
    const result = await query(`SELECT * FROM projects WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      project: serializeProject(result.rows[0]),
      source: "willworkforlunch",
    });
  } catch (error) {
    console.error("me-manager get project failed:", error);
    return NextResponse.json(
      { error: "Failed to get project" },
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

  try {
    const result = await query(
      `UPDATE projects SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        content = COALESCE($4, content),
        image = COALESCE($5, image),
        technologies = COALESCE($6, technologies),
        live_demo = COALESCE($7, live_demo),
        source_code = COALESCE($8, source_code),
        featured = COALESCE($9, featured),
        status = COALESCE($10, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        body.title ?? null,
        body.slug ?? null,
        body.description ?? null,
        body.content ?? null,
        body.image ?? body.featured_image ?? null,
        Array.isArray(body.technologies) ? body.technologies : null,
        body.live_demo ?? body.liveUrl ?? null,
        body.source_code ?? body.repoPath ?? null,
        typeof body.featured === "boolean" ? body.featured : null,
        body.status ?? null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2026-08-16: live-sync fix - without this, ProjectService.getAllProjects()
    // kept serving a stale cached list for up to 30 min after a status change
    // pushed from Me Manager, even though this write to the DB was correct.
    const cache = CacheService.getInstance();
    await Promise.all([
      cache.invalidatePattern("projects:list:*"),
      cache.del(CacheService.getProjectKey(id)),
    ]).catch((e) => console.warn("cache invalidation failed (non-fatal):", e));

    return NextResponse.json({
      ok: true,
      project: serializeProject(result.rows[0]),
      source: "willworkforlunch",
    });
  } catch (error) {
    console.error("me-manager patch project failed:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
