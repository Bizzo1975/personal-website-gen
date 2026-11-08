import assert from 'node:assert/strict';

const base = process.env.ACCEPTANCE_BASE_URL || 'http://127.0.0.1:55445';
assert.equal(new URL(base).hostname, '127.0.0.1', 'This writes only isolated loopback acceptance data');
const headers = { Authorization: 'Bearer isolated-wwfl-acceptance-only', 'Content-Type': 'application/json' };
const slug = 'isolated-video-acceptance';
const manifest = { version: 1, stage: 'beta', mainVideoId: 'second', videos: [
  { id: 'first', title: 'Feature walkthrough', url: 'https://assets.example.com/first.mp4' },
  { id: 'second', title: 'Main marketing video', url: 'https://assets.example.com/second.mp4' },
] };
const content = 'Isolated actual gallery acceptance\n\n## Project links\n\n- [Marketing site](<https://product.example.com/>)\n\n<!-- lunchpail-project-videos-v1 ' + JSON.stringify(manifest) + ' -->';
async function request(path, method = 'GET', body) {
  return fetch(base + path, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}

assert.equal((await fetch(base + '/api/me-manager/projects')).status, 401);
await fetch(base + '/api/projects'); // Populate the real list cache before creating a project.
let response = await request('/api/me-manager/projects', 'POST', {
  slug, title: 'Isolated actual gallery', description: 'Disposable schema-compatible fixture', content,
  live_demo: 'https://product.example.com/login', technologies: [], status: 'published',
});
assert.equal(response.status, 200, await response.clone().text());
const { project } = await response.json();
assert(project.id);
let list = await (await fetch(base + '/api/projects')).json();
assert(list.projects.some(item => item.id === project.id), 'A newly published project must immediately appear in the public cached list');
let detail = await (await fetch(base + '/api/projects/by-slug/' + slug)).json();
assert.equal((detail.data || detail).content, content);

response = await request('/api/me-manager/projects/' + project.id, 'PATCH', { content: '<!-- lunchpail-project-videos-v1 invalid -->' });
assert.equal(response.status, 400);
assert.equal((await (await request('/api/me-manager/projects/' + project.id)).json()).project.content, content);
response = await request('/api/me-manager/projects/' + project.id, 'PATCH', { status: 'draft' });
assert.equal(response.status, 200);
assert.equal((await fetch(base + '/api/projects/by-slug/' + slug)).status, 404);
list = await (await fetch(base + '/api/projects')).json();
assert(!list.projects.some(item => item.id === project.id));
response = await request('/api/me-manager/projects', 'POST', {
  slug, title: 'Isolated actual gallery', description: 'Disposable schema-compatible fixture', content,
  live_demo: 'https://product.example.com/login', technologies: [], status: 'published',
});
assert.equal(response.status, 200);
assert.equal((await response.json()).project.id, project.id, 'Retry must reuse the existing remote identity');
console.log(JSON.stringify({ realPostgresCreate: 'passed', immediateCachedList: 'passed', fullManifestReadback: 'passed', unauthorized: 401, invalidManifest: 400, invalidWritePreservedExisting: 'passed', withdrawal: 'passed', republishIdentityPreserved: 'passed' }));
