import { createHash } from "node:crypto";
import {
  cmsContentDigest, matchingCmsPublicationReceipt, parseCmsPublicationRequest,
  parseCmsPublicContent, type CmsPublicationReceipt, type CmsPublicationRequest,
} from "./cms-publication-protocol";

/** Validate the committed approval using its original immutable request hash. */
export function confirmedCmsSchedule(value: unknown, storedRequestHash: string): CmsPublicationReceipt {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Stored schedule approval is invalid");
  const receipt = value as CmsPublicationReceipt;
  const post = receipt.post;
  const content = post && parseCmsPublicContent({ title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, featured_image: post.featured_image, tags: post.tags });
  const original = content && parseCmsPublicationRequest({ protocol: receipt.protocol, requestId: receipt.requestId, site: receipt.site, postId: receipt.postId, action: receipt.action, expectedRevision: receipt.expectedRevision, scheduledFor: receipt.scheduledFor, content, contentDigest: receipt.contentDigest });
  if (!original || original.action !== "schedule" || receipt.outcome !== "confirmed" || storedRequestHash !== receipt.requestHash || !matchingCmsPublicationReceipt(receipt, original)) throw new Error("Stored schedule approval is invalid");
  return receipt;
}

/** A schedule has one deterministic, durable execution identity across workers.
 * Publication still requires an atomic current scheduled-time/revision/content CAS. */
export function dueCmsPublicationRequest(schedule: CmsPublicationReceipt, now: Date): CmsPublicationRequest | null {
  const approved = confirmedCmsSchedule(schedule, schedule.requestHash);
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid scheduler time");
  if (Date.parse(approved.scheduledFor!) > now.getTime()) return null;
  const bytes = createHash("sha256").update("reviewed-schedule-execution-v1:" + approved.requestId).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  const requestId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  const post = approved.post!;
  const content = { title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, featured_image: post.featured_image, tags: post.tags };
  const request = parseCmsPublicationRequest({ protocol: approved.protocol, requestId, site: approved.site, postId: approved.postId, action: "publish", expectedRevision: post.revision, scheduledFor: null, content, contentDigest: cmsContentDigest(content) });
  if (!request) throw new Error("Scheduled execution request is invalid");
  return request;
}
