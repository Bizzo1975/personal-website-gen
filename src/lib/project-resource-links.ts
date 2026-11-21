import { readProjectVideoResources, type ProjectVideoResource } from "./project-video-resources";
export function readProjectResourceLinks(content: string | null) {
  const manifest = readProjectVideoResources(content);
  content = content?.replace(/<!-- lunchpail-project-videos-v1 [\s\S]*? -->\s*$/, "").trimEnd() ?? null;
  const stages = { idea: "Planned", running_dev: "In development", beta: "Beta", live: "Live", archived: "Archived" };
  const metadata = manifest ? { videos: manifest.videos, mainVideoId: manifest.mainVideoId, ...(manifest.stage ? { stageLabel: stages[manifest.stage] } : {}) } : {};
  const heading = "## Project links\n\n";
  const index = content?.lastIndexOf(heading) ?? -1;
  const links: { marketingUrl?: string; videoUrls?: string[]; videos?: ProjectVideoResource[]; mainVideoId?: string | null } = {};
  if (index < 0 || !content) return { ...links, ...metadata };

  for (const line of content.slice(index + heading.length).trimEnd().split("\n")) {
    const match = /^- \[(Marketing site|Watch video \d+)\]\(<([^<>]+)>\)$/.exec(line);
    if (!match) return {};
    try {
      const url = new URL(match[2]);
      if (url.hostname.endsWith(".")) url.hostname = url.hostname.slice(0, -1);
      const lunchpailHost = /(?:^|\.)me\.(?:kecktech\.net|willworkforlunch\.com)$/.test(url.hostname);
      if (url.protocol !== "https:" || url.username || url.password ||
          !url.hostname.includes(".") || /^[\d.]+$/.test(url.hostname) || url.hostname.includes(":") ||
          url.hostname.endsWith(".local") || url.hostname.endsWith(".ts.net") ||
          /^\/api\/(?:video|packages)\//.test(url.pathname) ||
          (lunchpailHost && !/^\/api\/published-media\/[\w-]+\/[a-f0-9]{64}$/.test(url.pathname))) return {};
      if (match[1] === "Marketing site") links.marketingUrl = url.href;
      else (links.videoUrls ??= []).push(url.href);
    } catch {
      return {};
    }
  }
  return { ...links, ...metadata };
}
