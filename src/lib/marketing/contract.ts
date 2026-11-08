/** marketing-sites-v1: deliberately dependency-free so all three applications use identical validation. */
export const SCHEMA = "marketing-sites-v1" as const;
export const RENDERER = "project-marketing-1" as const;
export const MAX_BODY_BYTES = 12 * 1024 * 1024;
export const TARGETS = { kecktech: "https://www.kecktech.net", wwfl: "https://willworkforlunch.com" } as const;
export type Target = keyof typeof TARGETS;
export type Stage = "idea" | "running_dev" | "beta" | "live";
export type Evidence = { id: string; text: string; source: string };
export type Section = { kind: "hero" | "text" | "features" | "steps" | "faq" | "image" | "videos" | "limitations"; title: string; body: string; evidenceIds: string[]; items: { title: string; body: string; evidenceIds: string[] }[]; imageId: string | null; cta: { label: string; url: string } | null };
export type SitePage = { slug: string; title: string; description: string; sections: Section[] };
export type SiteAsset = { id: string; digest: string; mime: "image/png" | "image/jpeg" | "image/webp"; base64: string; width: number; height: number; alt: string; source: string; license: string };
export type SiteVideo = { id: string; title: string; url: string; posterUrl?: string; captionsUrl?: string; musicCredit?: string | null };
export type SiteDocument = { schema: typeof SCHEMA; renderer: typeof RENDERER; siteId: string; projectId: string; owner: string; target: Target; slug: string; name: string; stage: Stage; canonicalUrl: string; appUrl: string | null; accent: string; template: "studio" | "editorial"; font: "system" | "serif"; logoId: string | null; evidenceFingerprint: string; evidence: Evidence[]; pages: SitePage[]; assets: SiteAsset[]; videos: SiteVideo[]; mainVideoId: string | null };
export class MarketingError extends Error { constructor(message: string, public status = 400) { super(message); } }
function fail(m: string): never { throw new MarketingError(m); }
export function object(v: unknown): Record<string, unknown> { if (!v || typeof v !== "object" || Array.isArray(v)) return fail("Expected an object"); return v as Record<string, unknown>; }
function fields(v: Record<string, unknown>, keys: string[]) { if (Object.keys(v).some(k => !keys.includes(k))) fail("Unsupported content field"); }
export function text(v: unknown, max: number, empty = false): string { if (typeof v !== "string" || v.length > max || (!empty && !v.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) return fail("Invalid text"); return v; }
export function identity(v: unknown): string { const s = text(v, 100); if (!/^[a-zA-Z0-9_-]+$/.test(s)) return fail("Invalid identity"); return s; }
export function slug(v: unknown, home = false): string { const s = text(v, 70, home); if (home && s === "") return s; if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) || ["api", "admin", "assets", "preview", "_next", "sitemap", "robots"].includes(s)) return fail("Invalid or reserved slug"); return s; }
export function https(v: unknown): string { const s = text(v, 2000); let u: URL; try { u = new URL(s); } catch { return fail("Expected an HTTPS URL"); } if (u.protocol !== "https:" || u.username || u.password || u.hash || !u.hostname.includes(".") || /^[\d.]+$/.test(u.hostname) || u.hostname.includes(":") || /\.(local|localhost|internal|ts\.net)$/.test(u.hostname)) return fail("Expected a public HTTPS URL without credentials or fragments"); return u.href; }
export function digest(v: unknown): string { const s = text(v, 64); if (!/^[a-f0-9]{64}$/.test(s)) return fail("Invalid SHA-256 digest"); return s; }
export function target(v: unknown): Target { if (v !== "kecktech" && v !== "wwfl") return fail("Unsupported marketing publisher"); return v; }
function array<T>(v: unknown, max: number, read: (v: unknown) => T): T[] { if (!Array.isArray(v) || v.length > max) return fail("Invalid list or limit exceeded"); return v.map(read); }
function unique(values: string[]) { if (new Set(values).size !== values.length) fail("Duplicate identities"); }
export function readPages(v: unknown, evidenceIds: string[], assetIds: string[]): SitePage[] {
  const refs = (v: unknown) => array(v, 50, x => { const id = identity(x); if (!evidenceIds.includes(id)) fail("Unknown evidence reference"); return id; });
  const pages = array(v, 12, v => { const p = object(v); fields(p, ["slug", "title", "description", "sections"]); return { slug: slug(p.slug, true), title: text(p.title, 160), description: text(p.description, 400), sections: array(p.sections, 24, v => {
    const s = object(v); fields(s, ["kind", "title", "body", "evidenceIds", "items", "imageId", "cta"]);
    const kind = text(s.kind, 20) as Section["kind"];
    if (!["hero", "text", "features", "steps", "faq", "image", "videos", "limitations"].includes(kind)) fail("Unsupported section");
    const imageId = s.imageId === null ? null : identity(s.imageId);
    if (imageId && !assetIds.includes(imageId)) fail("Unknown image");
    const c = s.cta === null ? null : object(s.cta); if (c) fields(c, ["label", "url"]);
    const section = { kind, title: text(s.title, 180), body: text(s.body, 6000, true), evidenceIds: refs(s.evidenceIds), imageId, cta: c ? { label: text(c.label, 80), url: https(c.url) } : null,
      items: array(s.items, 24, v => { const i = object(v); fields(i, ["title", "body", "evidenceIds"]); return { title: text(i.title, 160), body: text(i.body, 3000), evidenceIds: refs(i.evidenceIds) }; }) };
    if (section.body.trim() && !section.evidenceIds.length) fail("Section copy requires source evidence");
    if (section.items.some(i => !i.evidenceIds.length)) fail("Item copy requires source evidence");
    if (kind === "image" && !imageId) fail("Image section requires an image");
    return section;
  }) }; });
  unique(pages.map(p => p.slug));
  if (!pages.length || !pages.some(p => p.slug === "") || pages.some(p => !p.sections.length)) fail("A home page and nonempty pages are required");
  return pages;
}
export function readDocument(value: unknown, mode?: "stored-metadata"): SiteDocument {
  const d = object(value); fields(d, ["schema", "renderer", "siteId", "projectId", "owner", "target", "slug", "name", "stage", "canonicalUrl", "appUrl", "accent", "template", "font", "logoId", "evidenceFingerprint", "evidence", "pages", "assets", "videos", "mainVideoId"]);
  if (d.schema !== SCHEMA || d.renderer !== RENDERER) fail("Unsupported site or renderer version");
  const t = target(d.target), s = slug(d.slug), owner = identity(d.owner);
  if (owner === "jr" || owner === "jacob" || owner === "jacob-roman") fail("Anonymous persona cannot publish to these hosts");
  const stage = text(d.stage, 20) as Stage; if (!["idea", "running_dev", "beta", "live"].includes(stage)) fail("Archived or unknown project stage");
  const canonicalUrl = https(d.canonicalUrl);
  if (!Object.values(TARGETS).some(host => canonicalUrl === `${host}/products/${s}`)) fail("Canonical URL is not a supported reserved marketing path");
  const evidence = array(d.evidence, 150, v => { const e = object(v); fields(e, ["id", "text", "source"]); return { id: identity(e.id), text: text(e.text, 6000), source: text(e.source, 1000) }; }); unique(evidence.map(e => e.id));
  if (!evidence.length) fail("Project evidence is required");
  const assets = array(d.assets, 20, v => { const a = object(v); fields(a, ["id", "digest", "mime", "base64", "width", "height", "alt", "source", "license"]); const mime = text(a.mime, 20) as SiteAsset["mime"]; if (!["image/png", "image/jpeg", "image/webp"].includes(mime)) fail("Unsupported image type");
    if (!Number.isInteger(a.width) || !Number.isInteger(a.height) || Number(a.width) < 1 || Number(a.height) < 1 || Number(a.width) > 8192 || Number(a.height) > 8192) fail("Invalid image dimensions");
    const base64 = text(a.base64, 4 * 1024 * 1024, mode === "stored-metadata"); if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) fail("Invalid image encoding");
    return { id: identity(a.id), digest: digest(a.digest), mime, base64, width: Number(a.width), height: Number(a.height), alt: text(a.alt, 500), source: text(a.source, 1000), license: text(a.license, 500) }; }); unique(assets.map(a => a.id));
  const videos = array(d.videos, 100, v => { const a = object(v); fields(a, ["id", "title", "url", "posterUrl", "captionsUrl", "musicCredit"]); const url = https(a.url); const u = new URL(url); if (!["me.willworkforlunch.com", "me.kecktech.net"].includes(u.hostname) || !/^\/api\/published-media\/[a-f0-9-]{36}\/[a-f0-9]{64}$/.test(u.pathname) || u.search) fail("Video must be an owned immutable published asset");
    const posterUrl = a.posterUrl === undefined ? undefined : https(a.posterUrl), captionsUrl = a.captionsUrl === undefined ? undefined : https(a.captionsUrl);
    if ((posterUrl && posterUrl !== `${url}?kind=poster`) || (captionsUrl && captionsUrl !== `${url}?kind=captions`)) fail("Video dependencies must belong to the same asset");
    return { id: identity(a.id), title: text(a.title, 300), url, ...(posterUrl ? { posterUrl } : {}), ...(captionsUrl ? { captionsUrl } : {}), ...(a.musicCredit == null ? {} : { musicCredit: text(a.musicCredit, 4000) }) }; }); unique(videos.map(v => v.id));
  const mainVideoId = d.mainVideoId === null ? null : identity(d.mainVideoId); if ((videos.length > 0 && !videos.some(v => v.id === mainVideoId)) || (!videos.length && mainVideoId)) fail("Main video must belong to the saved selection");
  if (d.template !== "studio" && d.template !== "editorial") fail("Unsupported template");
  if (typeof d.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(d.accent)) fail("Invalid brand color");
  const pages = readPages(d.pages, evidence.map(e => e.id), assets.map(a => a.id));
  if (videos.length && !pages.find(p => p.slug === "")?.sections.some(s => s.kind === "videos")) fail("The home page must expose the selected project videos");
  const logoId = d.logoId === null ? null : identity(d.logoId); if (logoId && !assets.some(a => a.id === logoId)) fail("Unknown project logo");
  if (d.font !== "system" && d.font !== "serif") fail("Unsupported typeface");
  return { schema: SCHEMA, renderer: RENDERER, siteId: identity(d.siteId), projectId: identity(d.projectId), owner, target: t, slug: s, name: text(d.name, 160), stage, canonicalUrl, appUrl: d.appUrl === null ? null : https(d.appUrl), accent: d.accent, template: d.template, font: d.font, logoId, evidenceFingerprint: digest(d.evidenceFingerprint), evidence, assets, videos, mainVideoId, pages };
}
export function publicSiteUrl(d: Pick<SiteDocument, "target" | "slug">) { return `${TARGETS[d.target]}/products/${d.slug}`; }
