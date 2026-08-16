/**
 * Asset Forge Inbox client (thin HTTP; SP17).
 * POST https://forge.kecktech.net/api/v1/requests with Bearer ASSET_FORGE_TOKEN
 */

export type ForgeRequestPayload = {
  title: string;
  packs?: string[];
  priority?: string;
  spec_md?: string;
  kits?: Record<string, unknown>[];
  callback_url?: string;
  project_id?: string;
  source_app?: string;
};

export type ForgeRequestResult = {
  id?: string;
  status?: string;
  detail?: string;
  [key: string]: unknown;
};

const DEFAULT_PROJECT_ID = "personal-website-gen";
const SOURCE_APP = "personal-website-gen";

function forgeConfig(): { url: string; token: string; projectId: string } {
  const url = (process.env.ASSET_FORGE_URL || "https://forge.kecktech.net")
    .trim()
    .replace(/\/$/, "");
  const token = (process.env.ASSET_FORGE_TOKEN || "").trim();
  const projectId = (
    process.env.ASSET_FORGE_PROJECT_ID || DEFAULT_PROJECT_ID
  ).trim();
  if (!token) {
    throw new Error(
      "ASSET_FORGE_TOKEN is required (see docs/FORGE.md / config/env.example)."
    );
  }
  return { url, token, projectId };
}

export async function submitRequest(
  opts: ForgeRequestPayload
): Promise<ForgeRequestResult> {
  const cfg = forgeConfig();
  const body = {
    project_id: opts.project_id || cfg.projectId,
    source_app: opts.source_app || SOURCE_APP,
    title: opts.title,
    priority: opts.priority || "normal",
    packs: opts.packs || ["web"],
    ...(opts.spec_md ? { spec_md: opts.spec_md } : {}),
    ...(opts.kits ? { kits: opts.kits } : {}),
    ...(opts.callback_url ? { callback_url: opts.callback_url } : {}),
  };
  const res = await fetch(`${cfg.url}/api/v1/requests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  const data = (await res.json().catch(() => ({}))) as ForgeRequestResult;
  if (!res.ok) {
    throw new Error(
      `Forge HTTP ${res.status}: ${data.detail || JSON.stringify(data)}`
    );
  }
  return data;
}

export async function getRequest(id: string): Promise<ForgeRequestResult> {
  const cfg = forgeConfig();
  const res = await fetch(`${cfg.url}/api/v1/requests/${encodeURIComponent(id)}`, {
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30000),
  });
  const data = (await res.json().catch(() => ({}))) as ForgeRequestResult;
  if (!res.ok) {
    throw new Error(
      `Forge HTTP ${res.status}: ${data.detail || JSON.stringify(data)}`
    );
  }
  return data;
}
