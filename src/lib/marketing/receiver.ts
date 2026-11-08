import { MarketingError, SCHEMA, RENDERER, MAX_BODY_BYTES, readDocument, type Target, type SiteDocument } from "./contract";
import { limitedJson, secureEqual, sha256, verifyDelivery } from "./protocol";
import { renderSiteHtml, SITE_HEADERS } from "./html";
import contractVersion from "./contract-version.json";
export type Sql = { rows: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>; run: (sql: string, params?: unknown[]) => Promise<void> };
export type Store = { transaction: <T>(work: (sql: Sql) => Promise<T>) => Promise<T>; read: Sql["rows"]; target: Target };
const headers = { "Cache-Control": "private, no-store" };
export function receiverError(error: unknown): Response { return Response.json({ error: error instanceof MarketingError ? error.message : "Marketing publication failed; inspect the service error record" }, { status: error instanceof MarketingError ? error.status : 503, headers }); }
export function machineAllowed(req: Request) { const key = process.env.ME_MANAGER_API_KEY; return Boolean(key && secureEqual(req.headers.get("authorization") || "", `Bearer ${key}`)); }
function publicKeys(): Record<string, string> { try { const keys = JSON.parse(process.env.MARKETING_APPROVAL_PUBLIC_KEYS_JSON || "{}"); if (!keys || typeof keys !== "object" || Array.isArray(keys) || Object.values(keys).some(v => typeof v !== "string")) throw new Error(); return keys; } catch { throw new MarketingError("Approval verification is not configured", 503); } }
export async function receiverGet(req: Request, store: Store) {
  if (!machineAllowed(req)) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  try {
    const op = new URL(req.url).searchParams.get("operationId");
    if (op) { const rows = await store.read('SELECT result_json FROM marketing_operations WHERE operation_id=?', [op]); return rows.length ? Response.json(JSON.parse(String(rows[0].result_json)), { headers }) : Response.json({ error: "Operation not found" }, { status: 404, headers }); }
    return Response.json({ schema: SCHEMA, renderer: RENDERER, contractFingerprint: contractVersion.fingerprint, target: store.target, configured: Object.keys(publicKeys()).length > 0, maxRequestBytes: MAX_BODY_BYTES }, { headers });
  } catch (e) { return receiverError(e); }
}
export async function receiverPost(req: Request, store: Store) {
  if (!machineAllowed(req)) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  try {
    const { envelope: e, document: d } = verifyDelivery(await limitedJson(req, MAX_BODY_BYTES), store.target, publicKeys());
    // Stable operation identity permits a freshly signed retry after a lost response/expiry.
    const operationDigest = sha256(JSON.stringify([e.operationId, e.approvalId, e.siteId, e.projectId, e.owner, e.target, e.canonicalUrl, e.revision, e.action, e.generation, e.previousGeneration]));
    const result = await store.transaction(async sql => {
      const prior = await sql.rows('SELECT envelope_digest,result_json FROM marketing_operations WHERE operation_id=?', [e.operationId]);
      if (prior.length) { if (prior[0].envelope_digest !== operationDigest) throw new MarketingError("Operation identity already used for different content", 409); return JSON.parse(String(prior[0].result_json)); }
      const rows = await sql.rows('SELECT * FROM marketing_site_states WHERE site_id=?', [e.siteId]);
      const state = rows[0];
      const slugOwner = (await sql.rows('SELECT site_id FROM marketing_site_states WHERE slug=?', [d.slug]))[0];
      if (slugOwner && slugOwner.site_id !== d.siteId) throw new MarketingError("This marketing slug belongs to another site", 409);
      if (state && (state.project_id !== d.projectId || state.owner_key !== d.owner || state.slug !== d.slug || state.target !== d.target)) throw new MarketingError("Site identity/ownership cannot be reassigned", 409);
      if (Number(state?.generation ?? 0) !== e.previousGeneration) throw new MarketingError("Publication generation is stale", 409);
      if (!state) await sql.run('INSERT INTO marketing_site_states(site_id,project_id,owner_key,target,slug,generation,withdrawn,published_revision) VALUES(?,?,?,?,?,0,1,NULL)', [d.siteId, d.projectId, d.owner, d.target, d.slug]);
      const saved = await sql.rows('SELECT revision FROM marketing_site_revisions WHERE site_id=? AND revision=?', [e.siteId, e.revision]);
      for (const a of d.assets) {
        const image = await sql.rows('SELECT digest FROM marketing_site_assets WHERE project_id=? AND digest=?', [d.projectId, a.digest]);
        if (!image.length) await sql.run('INSERT INTO marketing_site_assets(project_id,digest,base64) VALUES(?,?,?)', [d.projectId, a.digest, a.base64]);
      }
      if (!saved.length) { const metadata = JSON.stringify({ ...d, assets: d.assets.map(a => ({ ...a, base64: "" })) }); await sql.run('INSERT INTO marketing_site_revisions(site_id,revision,payload_json,payload_digest) VALUES(?,?,?,?)', [d.siteId, e.revision, metadata, sha256(metadata)]); }
      await sql.run('UPDATE marketing_site_states SET generation=?,withdrawn=?,published_revision=? WHERE site_id=? AND generation=?', [e.generation, e.action === "withdraw" ? 1 : 0, e.revision, d.siteId, e.previousGeneration]);
      const applied = (await sql.rows('SELECT generation FROM marketing_site_states WHERE site_id=?', [d.siteId]))[0];
      if (Number(applied?.generation) !== e.generation) throw new MarketingError("Concurrent publication conflict", 409);
      const observation = { operationId: e.operationId, siteId: d.siteId, revision: e.revision, generation: e.generation, state: e.action === "withdraw" ? "withdrawn" : "applied", url: `https://${store.target === "kecktech" ? "www.kecktech.net" : "willworkforlunch.com"}/products/${d.slug}` };
      await sql.run('INSERT INTO marketing_operations(operation_id,envelope_digest,site_id,result_json) VALUES(?,?,?,?)', [e.operationId, operationDigest, d.siteId, JSON.stringify(observation)]);
      return observation;
    });
    return Response.json(result, { headers });
  } catch (e) { return receiverError(e); }
}
export async function publishedSite(store: Store, slug: string): Promise<{ document: SiteDocument; revision: string; generation: number } | "withdrawn" | null> {
  const states = await store.read('SELECT * FROM marketing_site_states WHERE slug=? AND target=?', [slug, store.target]);
  if (!states.length) return null;
  if (Number(states[0].withdrawn)) return "withdrawn";
  const rows = await store.read('SELECT payload_json,payload_digest FROM marketing_site_revisions WHERE site_id=? AND revision=?', [states[0].site_id, states[0].published_revision]);
  if (!rows.length) throw new MarketingError("Published revision is missing", 503);
  if (sha256(String(rows[0].payload_json)) !== rows[0].payload_digest) throw new MarketingError("Published metadata integrity verification failed", 503);
  return { document: readDocument(JSON.parse(String(rows[0].payload_json)), "stored-metadata"), revision: String(states[0].published_revision), generation: Number(states[0].generation) };
}
export async function publicResponse(req: Request, store: Store, parts: string[]) {
  if (parts.length === 1 && parts[0] === "sitemap.xml") {
    const rows = await store.read('SELECT r.payload_json,r.payload_digest FROM marketing_site_states s JOIN marketing_site_revisions r ON r.site_id=s.site_id AND r.revision=s.published_revision WHERE s.withdrawn=0 AND s.target=?', [store.target]);
    const urls = rows.flatMap(r => { if (sha256(String(r.payload_json)) !== r.payload_digest) throw new MarketingError("Published metadata integrity verification failed", 503); const d = readDocument(JSON.parse(String(r.payload_json)), "stored-metadata"); return d.pages.map(p => `${d.canonicalUrl}${p.slug ? `/${p.slug}` : ""}`); });
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${url.replace(/&/g, "&amp;")}</loc></url>`).join("")}</urlset>`, { headers: { "Content-Type": "application/xml", "Cache-Control": "no-store" } });
  }
  const site = await publishedSite(store, parts[0]);
  if (!site || site === "withdrawn") return new Response(site === "withdrawn" ? "This marketing site has been withdrawn." : "Not found", { status: site === "withdrawn" ? 410 : 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  if (parts[1] === "assets" && parts.length === 4) {
    const a = site.document.assets.find(a => a.id === parts[2] && a.digest === parts[3]);
    if (!a) return new Response("Not found", { status: 404 });
    const record = (await store.read('SELECT base64 FROM marketing_site_assets WHERE project_id=? AND digest=?', [site.document.projectId, a.digest]))[0];
    const bytes = record ? Buffer.from(String(record.base64), "base64") : null;
    if (!bytes || sha256(bytes) !== a.digest) throw new MarketingError("Published image integrity verification failed", 503);
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": a.mime, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  }
  if (parts[1] === "manifest" && parts.length === 2) return Response.json({ siteId: site.document.siteId, revision: site.revision, generation: site.generation, pages: site.document.pages.map(p => p.slug), mainVideoId: site.document.mainVideoId, videos: site.document.videos.map(v => v.id) }, { headers: { "Cache-Control": "no-store" } });
  const html = parts.length <= 2 ? renderSiteHtml(site.document, site.revision, parts[1] || "", `/products/${site.document.slug}`) : null;
  return html ? new Response(html, { headers: SITE_HEADERS }) : new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}
