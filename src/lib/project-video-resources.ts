export type ProjectVideoResource = { id: string; title: string; url: string; posterUrl?: string; captionsUrl?: string; musicCredit?: string | null };
export type ProjectVideoResources = { version: 1; stage?: "idea" | "running_dev" | "beta" | "live" | "archived"; mainVideoId: string | null; videos: ProjectVideoResource[] };

function publicUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2000) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password && u.hostname.includes(".") && !/^[\d.]+$/.test(u.hostname) && !u.hostname.endsWith(".local") && !u.hostname.endsWith(".ts.net") && !/^\/api\/(video|packages)\//.test(u.pathname);
  } catch { return false; }
}
export function readProjectVideoResources(content: string | null | undefined): ProjectVideoResources | null {
  if (!content?.includes("<!-- lunchpail-project-videos-v1 ")) return null;
  const match = content.match(/<!-- lunchpail-project-videos-v1 ([\s\S]*?) -->\s*$/);
  if (!match || match[1].length > 500000) throw new Error("Project video information is invalid");
  const value = JSON.parse(match[1]);
  if (!value || value.version !== 1 || !Array.isArray(value.videos) || value.videos.length > 100 || (value.mainVideoId !== null && typeof value.mainVideoId !== "string")) throw new Error("Project video information is invalid");
  if (value.stage !== undefined && !["idea", "running_dev", "beta", "live", "archived"].includes(value.stage)) throw new Error("Project lifecycle stage is invalid");
  const ids = new Set<string>();
  for (const video of value.videos) {
    if (!video || typeof video.id !== "string" || !video.id || video.id.length > 100 || ids.has(video.id) || typeof video.title !== "string" || !video.title.trim() || video.title.length > 300 || !publicUrl(video.url) || (video.posterUrl !== undefined && !publicUrl(video.posterUrl)) || (video.captionsUrl !== undefined && !publicUrl(video.captionsUrl)) || (video.musicCredit != null && (typeof video.musicCredit !== "string" || video.musicCredit.length > 4000))) throw new Error("Project video information is invalid");
    ids.add(video.id);
  }
  if (value.videos.length && !ids.has(value.mainVideoId)) throw new Error("The main marketing video is missing");
  return value as ProjectVideoResources;
}
export function projectMarketingUrl(content: string | null | undefined): string | null {
  const match = content?.match(/^- \[Marketing site\]\(<([^<>]+)>\)$/m);
  return match && publicUrl(match[1]) ? match[1] : null;
}
