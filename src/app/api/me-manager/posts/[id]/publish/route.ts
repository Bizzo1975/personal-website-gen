import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

function authorize(request: Request): boolean {
  const key = process.env.ME_MANAGER_API_KEY;
  if (!key) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${key}`;
}

async function notifyMeManagerTeaser(post: {
  title: string;
  excerpt?: string;
  slug?: string;
}) {
  const meUrl = process.env.ME_MANAGER_URL || "http://localhost:3010";
  const ingestKey =
    process.env.ME_MANAGER_INGEST_KEY || process.env.ME_MANAGER_API_KEY;
  if (!ingestKey) return { skipped: true };

  const siteUrl = `${(process.env.NEXTAUTH_URL || "https://willworkforlunch.com").replace(/\/$/, "")}/blog/${post.slug || ""}`;

  try {
    const res = await fetch(`${meUrl.replace(/\/$/, "")}/api/sites/teaser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ingestKey}`,
      },
      body: JSON.stringify({
        title: post.title,
        summary: post.excerpt || post.title,
        url: siteUrl,
        platforms: ["linkedin", "bluesky", "mastodon"],
      }),
    });
    const body = await res.json().catch(() => null);
    return { ok: res.ok, body };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await query(
      `UPDATE posts
       SET published = true,
           status = 'published',
           published_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, title, slug, status, published, published_at, excerpt`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    revalidatePath("/blog");
    revalidatePath("/");

    const post = result.rows[0];
    const teaser = await notifyMeManagerTeaser(post);

    return NextResponse.json({
      ok: true,
      post,
      teaser,
      message: "Published. Social teaser enqueue attempted on ME Manager.",
    });
  } catch (error) {
    console.error("me-manager publish failed:", error);
    return NextResponse.json(
      { error: "Failed to publish post" },
      { status: 500 }
    );
  }
}
