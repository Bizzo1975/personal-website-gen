import { createHash, createPrivateKey, createPublicKey, sign, verify, timingSafeEqual } from "node:crypto";
import { SCHEMA, RENDERER, MAX_BODY_BYTES, MarketingError, readDocument, identity, digest, object, target, type SiteDocument, type Target } from "./contract";
export const sha256 = (v: string | Buffer) => createHash("sha256").update(v).digest("hex");
export type Envelope = { version: typeof SCHEMA; keyId: string; operationId: string; approvalId: string; siteId: string; projectId: string; owner: string; target: Target; canonicalUrl: string; revision: string; evidenceFingerprint: string; action: "publish" | "withdraw"; generation: number; previousGeneration: number; expires: number; signature: string };
export type Delivery = { envelope: Envelope; payload: string };
function signingBytes(e: Omit<Envelope, "signature"> | Envelope) {
  return Buffer.from(JSON.stringify([SCHEMA, e.keyId, e.operationId, e.approvalId, e.siteId, e.projectId, e.owner, e.target, e.canonicalUrl, e.revision, e.evidenceFingerprint, RENDERER, e.action, e.generation, e.previousGeneration, e.expires]));
}
export function secureEqual(actual: string, expected: string) { const a = Buffer.from(actual), b = Buffer.from(expected); return a.length === b.length && timingSafeEqual(a, b); }
export function signDelivery(payload: string, input: Omit<Envelope, "signature" | "revision" | "version">, pem: string): Delivery {
  const e = { ...input, version: SCHEMA, revision: sha256(payload) };
  const key = createPrivateKey(pem); if (key.asymmetricKeyType !== "ed25519") throw new MarketingError("An Ed25519 approval key is required", 503);
  return { payload, envelope: { ...e, signature: sign(null, signingBytes(e), key).toString("base64") } };
}
export function validateAssets(d: SiteDocument) {
  for (const a of d.assets) {
    const b = Buffer.from(a.base64, "base64");
    const mime = b.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" ? "image/png" : b[0] === 255 && b[1] === 216 && b[2] === 255 ? "image/jpeg" : b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" ? "image/webp" : null;
    if (sha256(b) !== a.digest || mime !== a.mime || b.length > 3 * 1024 * 1024 || b.toString("base64") !== a.base64) throw new MarketingError("Image digest, size, canonical encoding or format does not match");
  }
}
export function verifyDelivery(value: unknown, expectedTarget: Target, keys: Record<string, string>, now = Date.now()): { envelope: Envelope; document: SiteDocument } {
  const body = object(value), e = object(body.envelope);
  if (Object.keys(body).some(k => !["envelope", "payload"].includes(k)) || typeof body.payload !== "string" || Buffer.byteLength(body.payload) > MAX_BODY_BYTES) throw new MarketingError("Invalid delivery payload");
  if (Object.keys(e).sort().join() !== ["version", "keyId", "operationId", "approvalId", "siteId", "projectId", "owner", "target", "canonicalUrl", "revision", "evidenceFingerprint", "action", "generation", "previousGeneration", "expires", "signature"].sort().join()) throw new MarketingError("Invalid approval envelope");
  for (const k of ["keyId", "operationId", "approvalId", "siteId", "projectId", "owner"]) identity(e[k]);
  digest(e.revision); digest(e.evidenceFingerprint);
  if (e.version !== SCHEMA || target(e.target) !== expectedTarget || !["publish", "withdraw"].includes(String(e.action)) || !Number.isSafeInteger(e.generation) || !Number.isSafeInteger(e.previousGeneration) || Number(e.previousGeneration) < 0 || Number(e.generation) <= Number(e.previousGeneration) || !Number.isSafeInteger(e.expires) || Number(e.expires) <= now || Number(e.expires) > now + 15 * 60_000 || typeof e.signature !== "string" || !/^[A-Za-z0-9+/]{86}==$/.test(e.signature)) throw new MarketingError("Invalid, expired or misdirected approval", 409);
  if (!Object.hasOwn(keys, String(e.keyId))) throw new MarketingError("Unknown approval signing key", 403);
  const key = createPublicKey(keys[String(e.keyId)]);
  if (key.asymmetricKeyType !== "ed25519" || !verify(null, signingBytes(e as Envelope), key, Buffer.from(e.signature, "base64"))) throw new MarketingError("Invalid approval signature", 403);
  if (sha256(body.payload) !== e.revision) throw new MarketingError("Approved content was altered", 403);
  const d = readDocument(JSON.parse(body.payload)); validateAssets(d);
  for (const k of ["siteId", "projectId", "owner", "target", "canonicalUrl", "evidenceFingerprint"] as const) if (d[k] !== e[k]) throw new MarketingError("Approval does not match the site", 403);
  return { envelope: e as Envelope, document: d };
}
export async function limitedJson(req: Request, max = MAX_BODY_BYTES * 2): Promise<unknown> {
  if (!req.body || Number(req.headers.get("content-length") || 0) > max) throw new MarketingError("Payload exceeds size limit", 413);
  const reader = req.body.getReader(), chunks: Uint8Array[] = []; let size = 0;
  try { for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > max) { await reader.cancel(); throw new MarketingError("Payload exceeds size limit", 413); } chunks.push(value); } }
  finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new MarketingError("Invalid JSON"); }
}
