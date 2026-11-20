import { isCmsReturnToDraft, readCmsBridgeJson } from '@/lib/cms-legacy-bridge';
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
              featured_image, tags, author, updated_at, created_at
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

export async function PATCH(request: Request, {params}: {params:Promise<{id:string}>}) {
  if(!authorize(request)) return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await readCmsBridgeJson(request);
  if(!isCmsReturnToDraft(body)) return NextResponse.json({error:'Generic updates permit only explicit return to draft; use draft-content or reviewed-publication',code:'VERSIONED_MUTATION_REQUIRED'},{status:428,headers:{'Cache-Control':'no-store'}});
  const {id}=await params;
  try {
    
    const result=await query(`UPDATE posts SET status='draft',published=false,published_at=NULL,scheduled_publish_at=NULL,
      updated_at=GREATEST(timezone('UTC',clock_timestamp()),updated_at+interval '1 millisecond') WHERE id=$1
      RETURNING id,title,slug,status,published,excerpt,updated_at,scheduled_publish_at,published_at`,[id]);
    if(!result.rows[0]) return NextResponse.json({error:'Post not found'},{status:404});
    return NextResponse.json({ok:true,post:result.rows[0]},{headers:{'Cache-Control':'no-store'}});
  } catch {
    return NextResponse.json({error:'Return-to-draft outcome unconfirmed; reload before retrying',code:'DRAFT_RESET_UNCONFIRMED'},{status:503,headers:{'Cache-Control':'no-store'}});
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
