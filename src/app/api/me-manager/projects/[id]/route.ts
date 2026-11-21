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

/**
 * ME Manager bridge for one project: read, update, delete.
 * Auth: Authorization: Bearer <ME_MANAGER_API_KEY>
 * Write rules (W7): see lib/me-manager/project-bridge.ts.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notFound = () => NextResponse.json({ error: "Project not found" }, { status: 404 });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorizeBridge(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!UUID_RE.test(id)) return notFound();

  try {
    const result = await query(`SELECT ${PROJECT_COLUMNS} FROM projects WHERE id = $1`, [id]);
    if (result.rows.length === 0) return notFound();
    return NextResponse.json({
      ok: true,
      project: serializeProject(result.rows[0]),
      source: "willworkforlunch",
    });
  } catch (error) {
    console.error("me-manager get project failed:", error);
    return NextResponse.json({ error: "Failed to get project" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorizeBridge(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!UUID_RE.test(id)) return notFound();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const parsed = parseProjectFields(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const before = await query(`SELECT slug FROM projects WHERE id = $1`, [id]);
    if (before.rows.length === 0) return notFound();
    const { set, values } = projectUpdateSet(parsed.fields, 2);
    const result = await query(
      `UPDATE projects SET
          ${set}
       WHERE id = $1
       RETURNING ${PROJECT_COLUMNS}`,
      [id, ...values]
    );
    if (result.rows.length === 0) return notFound();
    const row = result.rows[0];

    // A renamed slug must also re-render the page at its old address.
    await refreshProjectPages(id, [before.rows[0].slug, row.slug]);
    return NextResponse.json({
      ok: true,
      project: serializeProject(row),
      source: "willworkforlunch",
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Another project already uses this slug" }, { status: 409 });
    }
    console.error("me-manager patch project failed:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

/**
 * DELETE /api/me-manager/projects/:id — ME Manager "delete everywhere" for
 * portfolio projects. Removes only that project row and refreshes the project
 * caches/pages. 404 when the project does not exist (or the id is not a UUID):
 * ME Manager treats that as "already gone".
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorizeBridge(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!UUID_RE.test(id)) return notFound();

  try {
    const result = await query(
      `DELETE FROM projects WHERE id = $1
       RETURNING id, title, slug, status`,
      [id]
    );
    if (result.rows.length === 0) return notFound();

    const project = result.rows[0];
    await refreshProjectPages(id, [project.slug]);
    return NextResponse.json({ ok: true, deleted: project, source: "willworkforlunch" });
  } catch (error) {
    console.error("me-manager delete project failed:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
