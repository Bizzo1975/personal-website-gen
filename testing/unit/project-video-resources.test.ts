import { readProjectVideoResources, projectMarketingUrl } from "../../src/lib/project-video-resources";

const manifest = { version: 1, mainVideoId: "second", videos: [
  { id: "first", title: "Feature walkthrough", url: "https://assets.example.com/first.mp4" },
  { id: "second", title: "Main marketing video", url: "https://assets.example.com/second.mp4", captionsUrl: "https://assets.example.com/second.vtt" },
] };
const content = "Description\n\n## Project links\n\n- [Marketing site](<https://product.example.com/>)\n\n<!-- lunchpail-project-videos-v1 " + JSON.stringify(manifest) + " -->";

test("preserves every video and its explicit main identity", () => {
  expect(readProjectVideoResources(content)).toEqual(manifest);
  expect(projectMarketingUrl(content)).toBe("https://product.example.com/");
});
test("preserves project content without a video manifest", () => {
  expect(readProjectVideoResources("Existing project")).toBeNull();
});
test("refuses malformed metadata, private render paths and missing main videos", () => {
  for (const value of ["not-json", JSON.stringify({ ...manifest, mainVideoId: "missing" }), JSON.stringify({ ...manifest, videos: [{ ...manifest.videos[0], url: "https://me.example.com/api/video/private/file" }] })]) {
    expect(() => readProjectVideoResources("<!-- lunchpail-project-videos-v1 " + value + " -->")).toThrow();
  }
});
