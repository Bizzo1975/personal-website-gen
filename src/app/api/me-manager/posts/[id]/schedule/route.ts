import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function authorize(request: Request): boolean {
  const key = process.env.ME_MANAGER_API_KEY;
  if (!key) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${key}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const scheduledDate = body.scheduledDate as string;

  if (!scheduledDate) {
    return NextResponse.json(
      { error: "scheduledDate required" },
      { status: 400 }
    );
  }

  const scheduleTime = new Date(scheduledDate);
  if (scheduleTime <= new Date()) {
    return NextResponse.json(
      { error: "Scheduled date must be in the future" },
      { status: 400 }
    );
  }

  try {
    const existing = await query(
      `SELECT id, title, status FROM posts WHERE id = $1`,
      [id]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const result = await query(
      `UPDATE posts
       SET status = 'scheduled',
           scheduled_publish_at = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, title, slug, status, scheduled_publish_at`,
      [scheduleTime, id]
    );

    return NextResponse.json({
      ok: true,
      post: result.rows[0],
      message: `Scheduled "${result.rows[0].title}" for ${scheduleTime.toISOString()}`,
    });
  } catch (error) {
    console.error("me-manager schedule failed:", error);
    return NextResponse.json(
      { error: "Failed to schedule post" },
      { status: 500 }
    );
  }
}
