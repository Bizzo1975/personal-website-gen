import { CMS_PUBLICATION_BODY_MAX_BYTES, parseCmsPublicContent, type CmsPublicContent } from "./cms-publication-protocol";

/** The legacy bridge may create drafts or explicitly revoke visibility. It may
 * never publish, schedule or edit content without the versioned contracts. */
export function parseCmsBridgeDraft(value: unknown): (CmsPublicContent & { author: string; read_time: number }) | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some(key => !["title", "slug", "excerpt", "content", "featured_image", "tags", "author", "read_time", "status", "published"].includes(key)) ||
      (body.status !== undefined && body.status !== "draft") || (body.published !== undefined && body.published !== false) ||
      (body.author !== undefined && (typeof body.author !== "string" || !body.author.trim() || body.author.length > 200)) ||
      (body.read_time !== undefined && (!Number.isInteger(body.read_time) || Number(body.read_time) < 1 || Number(body.read_time) > 240))) return null;
  const title = body.title;
  const content = parseCmsPublicContent({ title, slug: body.slug ?? (typeof title === "string" ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : ""), excerpt: body.excerpt ?? "", content: body.content, featured_image: body.featured_image ?? null, tags: body.tags ?? ["me-manager"] });
  return content ? { ...content, author: typeof body.author === "string" ? body.author : "Author", read_time: typeof body.read_time === "number" ? body.read_time : 3 } : null;
}
export function isCmsReturnToDraft(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  return Object.keys(body).length === 2 && body.status === "draft" && body.published === false;
}
export async function readCmsBridgeJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("CMS bridge body deadline exceeded")), 10000); });
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const part = await Promise.race([reader.read(), deadline]);
      if (part.done) break;
      size += part.value.byteLength;
      if (size > CMS_PUBLICATION_BODY_MAX_BYTES) throw new Error("CMS bridge body limit exceeded");
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch { void reader.cancel().catch(() => undefined); return null; }
  finally { if (timer) clearTimeout(timer); }
}
