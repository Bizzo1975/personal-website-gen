import { createHash } from "node:crypto";

export const CMS_PUBLICATION_PROTOCOL = "reviewed-publication-v1" as const;
export const CMS_PUBLICATION_BODY_MAX_BYTES = 12 * 1024 * 1024;
export type CmsPublicContent = { title: string; slug: string; excerpt: string; content: string; featured_image: string | null; tags: string[] };
export type CmsPublicationRequest = {
  protocol: typeof CMS_PUBLICATION_PROTOCOL;
  requestId: string;
  site: string;
  postId: string;
  action: "publish" | "schedule";
  expectedRevision: string;
  scheduledFor: string | null;
  content: CmsPublicContent;
  contentDigest: string;
};
export type CmsPublicationReceipt = {
  protocol: typeof CMS_PUBLICATION_PROTOCOL;
  requestId: string;
  site: string;
  requestHash: string;
  postId: string;
  action: "publish" | "schedule";
  expectedRevision: string;
  contentDigest: string;
  scheduledFor: string | null;
  outcome: "confirmed" | "rejected";
  reason: string | null;
  post: (CmsPublicContent & { id: string; status: string; published: boolean; revision: string; published_at: string | null; scheduled_publish_at: string | null }) | null;
};

function digest(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
export function cmsContentDigest(content: CmsPublicContent): string {
  return digest([content.title, content.slug, content.excerpt, content.content, content.featured_image, [...new Set(content.tags)].sort()]);
}
export function cmsPublicationRequestHash(request: CmsPublicationRequest): string {
  return digest([request.protocol, request.requestId, request.site, request.postId, request.action, request.expectedRevision, request.scheduledFor, request.contentDigest]);
}
function object(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
export function parseCmsPublicContent(value: unknown): CmsPublicContent | null {
  if (!object(value) || Object.keys(value).some(key => !["title", "slug", "excerpt", "content", "featured_image", "tags"].includes(key))) return null;
  if (typeof value.title !== "string" || !value.title.trim() || value.title.length > 1000 || typeof value.slug !== "string" || !value.slug || value.slug.length > 200 || typeof value.excerpt !== "string" || value.excerpt.length > 20000 || typeof value.content !== "string" || !value.content.trim() || value.content.length > 2000000) return null;
  if (value.featured_image !== null) {
    if (typeof value.featured_image !== "string" || value.featured_image.length > 4096) return null;
    try { const url = new URL(value.featured_image); if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null; } catch { return null; }
  }
  if (!Array.isArray(value.tags) || value.tags.length > 100 || value.tags.some(tag => typeof tag !== "string" || !tag.trim() || tag.length > 200)) return null;
  return value as CmsPublicContent;
}
export function parseCmsPublicationRequest(value: unknown): CmsPublicationRequest | null {
  if (!object(value) || Object.keys(value).some(key => !["protocol", "requestId", "site", "postId", "action", "expectedRevision", "scheduledFor", "content", "contentDigest"].includes(key))) return null;
  if (typeof value.site !== "string" || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(value.site)) return null;
  if (value.protocol !== CMS_PUBLICATION_PROTOCOL || typeof value.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.requestId) || typeof value.postId !== "string" || !value.postId || value.postId.length > 200 || typeof value.expectedRevision !== "string" || !value.expectedRevision || value.expectedRevision.length > 100 || (value.action !== "publish" && value.action !== "schedule")) return null;
  const content = parseCmsPublicContent(value.content);
  if (!content || value.contentDigest !== cmsContentDigest(content)) return null;
  if (value.action === "publish" ? value.scheduledFor !== null : typeof value.scheduledFor !== "string" || !Number.isFinite(Date.parse(value.scheduledFor)) || new Date(value.scheduledFor).toISOString() !== value.scheduledFor) return null;
  return value as CmsPublicationRequest;
}

/** A status-only response cannot acknowledge a reviewed visibility write. */
export function matchingCmsPublicationReceipt(value: unknown, request: CmsPublicationRequest): CmsPublicationReceipt | null {
  if (!object(value) || value.protocol !== request.protocol || value.requestId !== request.requestId || value.site !== request.site || value.requestHash !== cmsPublicationRequestHash(request) || value.postId !== request.postId || value.action !== request.action || value.expectedRevision !== request.expectedRevision || value.contentDigest !== request.contentDigest || value.scheduledFor !== request.scheduledFor) return null;
  if (value.outcome === "rejected" && value.post === null && typeof value.reason === "string" && value.reason.length > 0) return value as CmsPublicationReceipt;
  if (value.outcome !== "confirmed" || !object(value.post)) return null;
  const post = value.post;
  const content = parseCmsPublicContent({ title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, featured_image: post.featured_image, tags: post.tags });
  if (!content || cmsContentDigest(content) !== request.contentDigest || post.id !== request.postId || typeof post.revision !== "string" || !post.revision || post.revision === request.expectedRevision) return null;
  if (request.action === "publish") {
    if (post.status !== "published" || post.published !== true || typeof post.published_at !== "string" || !Number.isFinite(Date.parse(post.published_at)) || post.scheduled_publish_at !== null) return null;
  } else if (post.status !== "scheduled" || post.published !== false || post.scheduled_publish_at !== request.scheduledFor) return null;
  return value as CmsPublicationReceipt;
}

/** The receiver accepts bounded JSON only; cancellation does not wait on a stalled peer. */
export async function readCmsPublicationRequest(request: Request): Promise<CmsPublicationRequest | null> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Publication request body deadline exceeded")), 10_000); });
    const parts: Uint8Array[] = []; let size = 0;
    while (true) {
      const part = await Promise.race([reader.read(), deadline]);
      if (part.done) break;
      size += part.value.byteLength;
      if (size > CMS_PUBLICATION_BODY_MAX_BYTES) throw new Error("Publication request body exceeds limit");
      parts.push(part.value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    return parseCmsPublicationRequest(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
  } catch { void reader.cancel().catch(() => undefined); return null; }
  finally { if (timer) clearTimeout(timer); }
}
