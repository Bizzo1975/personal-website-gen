const BODY_MAX = 12 * 1024 * 1024;
/** Bound headers and the complete response body; redirects never forward CMS credentials. */
export async function fetchCmsPublication(
  base: string, key: string, path: string, method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE", request?: unknown,
  timeoutMs = method === "GET" ? 12_000 : 45_000,
): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error("CMS publication request timed out; its outcome may be unknown")); }, timeoutMs); });
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const address = new URL(base);
    if (!key || !["http:", "https:"].includes(address.protocol) || address.username || address.password || address.search || address.hash || !path.startsWith("/")) throw new Error("CMS publication connection is invalid");
    const payload = request ? JSON.stringify(request) : undefined;
    if (payload && Buffer.byteLength(payload) > BODY_MAX) throw new Error("Reviewed CMS request exceeds the supported body limit");
    const response = await Promise.race([fetch(base + path, { method, body: payload, headers: { Authorization: `Bearer ${key}`, Accept: "application/json", ...(payload ? { "Content-Type": "application/json" } : {}) }, signal: controller.signal, redirect: "error", cache: "no-store" }), deadline]);
    reader = response.body?.getReader();
    if (!reader) return { status: response.status, body: null };
    const parts: Uint8Array[] = []; let size = 0;
    while (true) { const part = await Promise.race([reader.read(), deadline]); if (part.done) break; size += part.value.byteLength; if (size > BODY_MAX) throw new Error("CMS publication response exceeds its size limit"); parts.push(part.value); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    return { status: response.status, body: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } finally { if (timer) clearTimeout(timer); if (reader) void reader.cancel().catch(() => undefined); }
}
