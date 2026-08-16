import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Thin ME Manager bridge — list / upsert projects (portfolio).
 * Auth: Authorization: Bearer <ME_MANAGER_API_KEY>
 */
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

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT id, title, slug, description, content, image, technologies,
              live_demo, source_code, featured, status, published_at,
              updated_at, created_at
       FROM projects
       ORDER BY updated_at DESC NULLS LAST, created_at DESC
       LIMIT 100`
    );

    const projects = result.rows.map((row) => serializeProject(row));

    return NextResponse.json({
      projects,
      source: "willworkforlunch",
    });
  } catch (error) {
    console.error("me-manager projects list failed:", error);
    return NextResponse.json(
      { error: "Failed to list projects" },
      { status: 500 }
    );
  }
}

/** Upsert by slug — ME Manager Portfolio → WWFL /projects */
export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const slug =
      body.slug ||
      String(body.title || "project")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const title = body.title || slug;
    const description = body.description ?? null;
    const content = body.content ?? null;
    const image = body.image ?? body.featured_image ?? null;
    const technologies = Array.isArray(body.technologies)
      ? body.technologies
      : [];
    const liveDemo = body.live_demo ?? body.liveUrl ?? body.url ?? null;
    const sourceCode = body.source_code ?? body.repoPath ?? null;
    const featured = Boolean(body.featured);
    const status = body.status || "published";

    const existing = await query(`SELECT id FROM projects WHERE slug = $1`, [
      slug,
    ]);

    let result;
    if (existing.rows.length > 0) {
      result = await query(
        `UPDATE projects SET
          title = $1,
          description = COALESCE($2, description),
          content = COALESCE($3, content),
          image = COALESCE($4, image),
          technologies = COALESCE($5, technologies),
          live_demo = COALESCE($6, live_demo),
          source_code = COALESCE($7, source_code),
          featured = $8,
          status = COALESCE($9, status),
          updated_at = CURRENT_TIMESTAMP
         WHERE slug = $10
         RETURNING *`,
        [
          title,
          description,
          content,
          image,
          technologies,
          liveDemo,
          sourceCode,
          featured,
          status,
          slug,
        ]
      );
    } else {
      result = await query(
        `INSERT INTO projects (
          title, slug, description, content, image, technologies,
          live_demo, source_code, featured, status, published_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          CASE WHEN $10 = 'draft' THEN NULL ELSE CURRENT_TIMESTAMP END,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING *`,
        [
          title,
          slug,
          description,
          content,
          image,
          technologies,
          liveDemo,
          sourceCode,
          featured,
          status,
        ]
      );
    }

    return NextResponse.json({
      ok: true,
      project: serializeProject(result.rows[0]),
      source: "willworkforlunch",
    });
  } catch (error) {
    console.error("me-manager create project failed:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
