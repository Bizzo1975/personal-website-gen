import {
  cmsContentDigest, cmsPublicationRequestHash, matchingCmsPublicationReceipt,
  type CmsPublicationReceipt, type CmsPublicationRequest,
} from "./cms-publication-protocol";

export type CmsReceiverPost = NonNullable<CmsPublicationReceipt["post"]>;
export type CmsPublicationCondition = { scheduledFor: string };
export interface CmsPublicationTransaction {
  /** Reserve and lock this request identity until the transaction commits. */
  reserve(requestId: string, requestHash: string): Promise<{ requestHash: string; receiptJson: string | null }>;
  readPost(postId: string): Promise<CmsReceiverPost | null>;
  /** Atomic compare-and-set of revision, unpublished state and permitted status. */
  changeVisibility(request: CmsPublicationRequest, condition?: CmsPublicationCondition): Promise<CmsReceiverPost | null>;
  saveReceipt(requestId: string, receiptJson: string): Promise<void>;
  /** Persist follow-up work atomically; an insertion failure must roll visibility back. */
  enqueuePostCommit(receipt: CmsPublicationReceipt): Promise<void>;
}
export interface CmsPublicationStore {
  transaction<T>(run: (tx: CmsPublicationTransaction) => Promise<T>): Promise<T>;
}
export class CmsRequestIdentityConflict extends Error {}

/** Real adapters must commit visibility and its receipt together. No external hooks
 * run inside this transaction, and a replay never performs a second visibility write. */
export async function executeReviewedCmsPublication(
  request: CmsPublicationRequest, store: CmsPublicationStore, condition?: CmsPublicationCondition,
): Promise<{ receipt: CmsPublicationReceipt; newlyApplied: boolean }> {
  const requestHash = cmsPublicationRequestHash(request);
  return store.transaction(async tx => {
    const reserved = await tx.reserve(request.requestId, requestHash);
    if (reserved.requestHash !== requestHash) throw new CmsRequestIdentityConflict("Request identity was already used for different publication content");
    if (reserved.receiptJson) {
      const receipt = matchingCmsPublicationReceipt(JSON.parse(reserved.receiptJson), request);
      if (!receipt) throw new Error("Stored CMS publication receipt is invalid");
      return { receipt, newlyApplied: false };
    }
    const current = await tx.readPost(request.postId);
    let reason: string | null = null;
    if (!current) reason = "POST_NOT_FOUND";
    else if (current.revision !== request.expectedRevision || cmsContentDigest(current) !== request.contentDigest || current.published !== false || !["draft", "scheduled"].includes(current.status)) reason = "REVIEWED_REVISION_CONFLICT";
    else if (condition && (current.status !== "scheduled" || current.scheduled_publish_at !== condition.scheduledFor)) reason = "REVIEWED_SCHEDULE_CONFLICT";
    else if (request.action === "schedule" && Date.parse(request.scheduledFor!) <= Date.now()) reason = "SCHEDULE_TIME_PASSED";
    let post: CmsReceiverPost | null = null;
    if (!reason) {
      post = await tx.changeVisibility(request, condition);
      if (!post) reason = "REVIEWED_REVISION_CONFLICT";
    }
    const receipt: CmsPublicationReceipt = {
      protocol: request.protocol, requestId: request.requestId, site: request.site, requestHash,
      postId: request.postId, action: request.action, expectedRevision: request.expectedRevision,
      contentDigest: request.contentDigest, scheduledFor: request.scheduledFor,
      outcome: reason ? "rejected" : "confirmed", reason, post,
    };
    if (!matchingCmsPublicationReceipt(receipt, request)) throw new Error("Visibility write did not produce its exact reviewed publication receipt");
    await tx.saveReceipt(request.requestId, JSON.stringify(receipt));
    if (receipt.outcome === "confirmed" && receipt.action === "publish") await tx.enqueuePostCommit(receipt);
    return { receipt, newlyApplied: !reason };
  });
}
