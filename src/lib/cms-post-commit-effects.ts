import { createHash } from "node:crypto";
import type { CmsReceiverPost } from "./cms-publication-receiver";
import { cmsContentDigest } from "./cms-publication-protocol";

export type CmsPostCommitKind = "cache" | "teaser" | "astro";
export type CmsPostCommitPayload = {
  protocol: "cms-post-commit-v1"; effectId: string; kind: CmsPostCommitKind;
  sourceRequestId: string; sourceRequestHash: string; site: string;
  postId: string; revision: string; contentDigest: string;
  title: string; slug: string; excerpt: string; publishedAt: string;
};
export type CmsPostCommitEffect = { id: string; requestId: string; site: string; postId: string; kind: CmsPostCommitKind; payloadHash: string; payloadJson: string };
function effectId(requestId: string, kind: CmsPostCommitKind): string {
  const bytes = createHash("sha256").update(`cms-post-commit-v1:${requestId}:${kind}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString("hex");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
/** Must be persisted inside the same transaction as the publication and its
 * receipt. No network call or cache runtime call belongs in that transaction. */
export function makeCmsPostCommitEffects(input: { requestId: string; requestHash: string; site: string; post: CmsReceiverPost }, astro: boolean): CmsPostCommitEffect[] {
  const { post } = input;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId) || !/^[0-9a-f]{64}$/.test(input.requestHash) || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(input.site) || post.status !== "published" || post.published !== true || !post.id || !post.revision || typeof post.published_at !== "string" || !Number.isFinite(Date.parse(post.published_at))) throw new Error("Post-commit effects require a confirmed publication identity");
  const kinds: CmsPostCommitKind[] = astro ? ["cache", "teaser", "astro"] : ["cache", "teaser"];
  return kinds.map(kind => {
    const id = effectId(input.requestId, kind);
    const payload: CmsPostCommitPayload = { protocol: "cms-post-commit-v1", effectId: id, kind, sourceRequestId: input.requestId, sourceRequestHash: input.requestHash, site: input.site, postId: post.id, revision: post.revision, contentDigest: cmsContentDigest(post), title: post.title, slug: post.slug, excerpt: post.excerpt, publishedAt: post.published_at! };
    const payloadJson = JSON.stringify(payload);
    return { id, requestId: input.requestId, site: input.site, postId: post.id, kind, payloadHash: createHash("sha256").update(payloadJson).digest("hex"), payloadJson };
  });
}
