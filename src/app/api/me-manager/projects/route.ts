import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  authorizeBridge,
  parseProjectFields,
  projectUpdateSet,
  refreshProjectPages,
  serializeProject,
  PROJECT_COLUMNS,
} from "@/lib/me-manager/project-bridge";
import { bridgeSource } from "@/lib/me-manager/bridge-id";

/**
 * Thin ME Manager bridge — list / create projects (portfolio).
 * Auth: Authorization: Bearer <ME_MANAGER_API_KEY>
 * Write rules (W7): see lib/me-manager/project-bridge.ts.
 */
export async function GET(request: Request) {
  if (!authorizeBridge(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Lunchpail matches projects by slug in this list, so it must hold every project.
    const result = await query(
      `SELECT ${PROJECT_COLUMNS}
       FROM projects
       ORDER BY updated_at DESC NULLS LAST, created_at DESC`
    );
    return NextResponse.json({
      projects: result.rows.map((row) => serializeProject(row)),
      source: bridgeSource(),
    });
  } catch (error) {
    console.error("me-manager projects list failed:", error);
    return NextResponse.json({ error: "Failed to list projects" }, { status: 500 });
  }
}

/**
 * Create a project. A body whose slug already exists updates that project instead
 * (the older upsert-by-slug behaviour), with the same present-key rule as PATCH.
 */
export async function POST(request: Request) {
  if (!authorizeBridge(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const parsed = parseProjectFields(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const fields = { ...parsed.fields };

  if (!fields.title && !fields.slug) {
    return NextResponse.json({ error: "A title or slug is required" }, { status: 400 });
  }
  fields.slug ??= String(fields.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!fields.slug) return NextResponse.json({ error: "Could not derive a slug from the title" }, { status: 400 });
  fields.title ??= fields.slug;

  try {
    const existing = await query(`SELECT id FROM projects WHERE slug = $1`, [fields.slug]);
    let row: Record<string, unknown>;
    let created = false;
    if (existing.rows.length > 0) {
      const { set, values } = projectUpdateSet(fields, 2);
      const result = await query(
        `UPDATE projects SET
          ${set}
         WHERE id = $1
         RETURNING ${PROJECT_COLUMNS}`,
        [existing.rows[0].id, ...values]
      );
      row = result.rows[0];
    } else {
      const status = fields.status ?? "draft";
      const result = await query(
        `INSERT INTO projects (
          title, slug, description, content, image, technologies, live_demo, source_code,
          featured, available, stage_label, status, contact_email, published_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::varchar, $13,
          CASE WHEN $12::varchar = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING ${PROJECT_COLUMNS}`,
        [
          fields.title,
          fields.slug,
          fields.description ?? "",
          fields.content ?? null,
          fields.image ?? null,
          fields.technologies ?? [],
          fields.live_demo ?? null,
          fields.source_code ?? null,
          fields.featured ?? false,
          fields.available ?? true,
          fields.stage_label ?? null,
          status,
          fields.contact_email ?? null,
        ]
      );
      row = result.rows[0];
      created = true;
    }

    const demos = await refreshProjectPages(String(row.id), [String(row.slug)]);
    return NextResponse.json(
      { ok: true, created, project: serializeProject(row), source: bridgeSource(), ...(demos.ok || demos.reason !== 'DEMOS_JSON_PATH unset' ? { demos } : {}) },
      { status: created ? 201 : 200 }
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Another project already uses this slug" }, { status: 409 });
    }
    console.error("me-manager create project failed:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
