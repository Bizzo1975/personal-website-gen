import { createHash, randomUUID } from "node:crypto";
import { cmsContentDigest, type CmsPublicContent } from "./cms-publication-protocol";
import type { CmsReceiverPost } from "./cms-publication-receiver";

export type NativeScheduleApproval = {
  protocol: "website-native-schedule-v1";
  requestId: string; postId: string; action: "schedule"; outcome: "confirmed";
  revision: string; scheduledFor: string; content: CmsPublicContent;
  contentDigest: string; requestHash: string;
};
function contentOf(post: CmsReceiverPost): CmsPublicContent {
  return { title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, featured_image: post.featured_image, tags: post.tags };
}
/** Native editors retain their own stored image representations (including
 * relative URLs). This contract never authorizes a Lunchpail publication request. */
function nativeContent(value: unknown): value is CmsPublicContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const c = value as CmsPublicContent;
  return typeof c.title === "string" && typeof c.slug === "string" && typeof c.excerpt === "string" && typeof c.content === "string" && (c.featured_image === null || typeof c.featured_image === "string") && Array.isArray(c.tags) && c.tags.every(tag => typeof tag === "string");
}
function approvalHash(value: Omit<NativeScheduleApproval, "requestHash">): string {
  return createHash("sha256").update(JSON.stringify([value.protocol, value.requestId, value.postId, value.action, value.outcome, value.revision, value.scheduledFor, value.contentDigest])).digest("hex");
}
export function makeNativeScheduleApproval(post: CmsReceiverPost): NativeScheduleApproval {
  if (!post.id || !post.revision || post.status !== "scheduled" || post.published !== false || typeof post.scheduled_publish_at !== "string" || !Number.isFinite(Date.parse(post.scheduled_publish_at)) || new Date(post.scheduled_publish_at).toISOString() !== post.scheduled_publish_at || Date.parse(post.scheduled_publish_at) <= Date.now()) throw new Error("Native scheduling requires an unpublished post and a valid future time");
  const content = contentOf(post);
  if (!nativeContent(content)) throw new Error("Native scheduled content is invalid");
  const value: Omit<NativeScheduleApproval, "requestHash"> = { protocol: "website-native-schedule-v1", requestId: randomUUID(), postId: post.id, action: "schedule", outcome: "confirmed", revision: post.revision, scheduledFor: post.scheduled_publish_at, content, contentDigest: cmsContentDigest(content) };
  return { ...value, requestHash: approvalHash(value) };
}
export function readNativeScheduleApproval(value: unknown, storedHash: string): NativeScheduleApproval {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Native schedule approval is invalid");
  const approval = value as NativeScheduleApproval;
  if (approval.protocol !== "website-native-schedule-v1" || typeof approval.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(approval.requestId) || typeof approval.postId !== "string" || !approval.postId || approval.action !== "schedule" || approval.outcome !== "confirmed" || typeof approval.revision !== "string" || !approval.revision || typeof approval.scheduledFor !== "string" || !Number.isFinite(Date.parse(approval.scheduledFor)) || new Date(approval.scheduledFor).toISOString() !== approval.scheduledFor || !nativeContent(approval.content) || approval.contentDigest !== cmsContentDigest(approval.content) || storedHash !== approval.requestHash || approval.requestHash !== approvalHash(approval)) throw new Error("Native schedule approval is invalid");
  return approval;
}
export function nativeScheduleMatches(approval: NativeScheduleApproval, post: CmsReceiverPost | null): boolean {
  return Boolean(post && post.id === approval.postId && post.revision === approval.revision && post.status === "scheduled" && post.published === false && post.scheduled_publish_at === approval.scheduledFor && cmsContentDigest(contentOf(post)) === approval.contentDigest);
}
