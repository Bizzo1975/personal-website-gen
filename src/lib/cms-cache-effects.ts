import { createHash, randomUUID } from "node:crypto";
import { makeCmsPostCommitEffects, type CmsPostCommitEffect, type CmsPostCommitPayload } from "./cms-post-commit-effects";
import {verifiedPublicationEffectSource} from "./cms-effect-source";

export type CmsCacheEffectRow = CmsPostCommitEffect & { attemptCount: number };
export interface CmsCacheEffectStore {
  candidates(now: Date, limit: number, requestId?: string): Promise<CmsCacheEffectRow[]>;
  claim(row: CmsCacheEffectRow, leaseId: string, now: Date, until: Date): Promise<boolean>;
  source(requestId: string): Promise<{ requestHash: string; receiptJson: string | null } | null>;
  settle(id: string, leaseId: string, input: { state: "completed" | "failed"; resultJson: string | null; errorMessage: string | null; nextAttemptAt: Date; at: Date }): Promise<boolean>;
}
export function verifiedCmsCachePayload(row: CmsCacheEffectRow, source: { requestHash: string; receiptJson: string | null } | null): CmsPostCommitPayload | null {
  try {
    if (!source?.receiptJson || row.kind !== "cache" || !Number.isInteger(row.attemptCount) || row.attemptCount < 0 || createHash("sha256").update(row.payloadJson).digest("hex") !== row.payloadHash) return null;
    const receipt = verifiedPublicationEffectSource(JSON.parse(source.receiptJson),source.requestHash);
    if (!receipt || receipt.requestId !== row.requestId) return null;
    const expected = makeCmsPostCommitEffects(receipt, false)[0];
    if (row.id !== expected.id || row.site !== expected.site || row.postId !== expected.postId || row.payloadHash !== expected.payloadHash || row.payloadJson !== expected.payloadJson) return null;
    return JSON.parse(expected.payloadJson) as CmsPostCommitPayload;
  } catch { return null; }
}
export function cmsCachePaths(payload: CmsPostCommitPayload): string[] {
  return ["/", "/blog", `/blog/${encodeURIComponent(payload.slug)}`];
}
async function registerInvalidation(invalidate: (paths: string[]) => void | Promise<void>, paths: string[], timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { await Promise.race([Promise.resolve().then(() => invalidate(paths)), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Cache invalidation deadline exceeded")), timeoutMs); })]); }
  finally { if (timer) clearTimeout(timer); }
}
/** Cache invalidation is idempotent. An expired or lost lease may be retried,
 * but an old owner can never overwrite a later owner's result. */
export async function runCmsCacheEffectBatch(store: CmsCacheEffectStore, invalidate: (paths: string[]) => void | Promise<void>, options: { requestId?: string; limit?: number; now?: () => Date; invalidationTimeoutMs?: number; budgetMs?: number } = {}) {
  const now = options.now ?? (() => new Date());
  const limit = options.limit ?? 20, timeoutMs = options.invalidationTimeoutMs ?? 8000, budgetMs = options.budgetMs ?? 10000;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 8000 || !Number.isFinite(budgetMs) || budgetMs < 1 || budgetMs > 30000) throw new Error("Invalid cache effect batch bounds");
  const result = { claimed: 0, requested: 0, failed: 0, unavailable: 0, lostLease: 0, budgetExceeded: false };
  const started = Date.now();
  const step = async <T>(run: () => Promise<T>): Promise<T> => {
    const remaining = budgetMs - (Date.now() - started);
    if (remaining <= 0) throw new Error("Cache effect batch deadline exceeded");
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { return await Promise.race([Promise.resolve().then(run), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Cache effect storage deadline exceeded")), remaining); })]); }
    finally { if (timer) clearTimeout(timer); }
  };
  const rows = await step(() => store.candidates(now(), limit, options.requestId));
  for (const row of rows) {
    if (Date.now() - started >= budgetMs) { result.budgetExceeded = true; break; }
    const leaseId = randomUUID(), at = now();
    try {
      if (!await step(() => store.claim(row, leaseId, at, new Date(at.getTime() + 30000)))) continue;
      result.claimed++;
      const payload = verifiedCmsCachePayload(row, await step(() => store.source(row.requestId)));
      let failure: string | null = null, completion: string | null = null;
      if (!payload) failure = "Cache effect does not match its original committed publication receipt";
      else {
        try {
          const paths = cmsCachePaths(payload);
          await registerInvalidation(invalidate, paths, Math.min(timeoutMs, Math.max(1, budgetMs - (Date.now() - started))));
          completion = JSON.stringify({ protocol: "cms-cache-effect-v1", status: "invalidation_requested", paths, requestedAt: now().toISOString(), publicDeliveryConfirmed: false });
        } catch { failure = "Cache invalidation could not be registered; retry is scheduled"; }
      }
      const finished = now();
      const delayMs = payload ? Math.min(300000, 1000 * 2 ** Math.min(row.attemptCount, 8)) : 86400000;
      const saved = await step(() => store.settle(row.id, leaseId, { state: failure ? "failed" : "completed", resultJson: completion, errorMessage: failure, nextAttemptAt: new Date(finished.getTime() + delayMs), at: finished }));
      if (!saved) result.lostLease++;
      else if (failure) result.failed++;
      else result.requested++;
    } catch { result.unavailable++; }
  }
  if (Date.now() - started >= budgetMs) result.budgetExceeded = true;
  return result;
}
