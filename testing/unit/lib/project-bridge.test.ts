/**
 * @jest-environment node
 */
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/cache', () => ({ __esModule: true, default: { getInstance: () => ({}) } }));
jest.mock('@/lib/project-video-resources', () => ({ readProjectVideoResources: () => [] }));
import { parseProjectFields, projectUpdateSet, serializeProject } from '@/lib/me-manager/project-bridge';

describe('Lunchpail project bridge (W7)', () => {
  it('keeps a sent null so a cleared field can be cleared', () => {
    const r = parseProjectFields({ source_code: null, image: null, live_demo: null, content: null, stage_label: null });
    expect(r).toEqual({ ok: true, fields: { source_code: null, image: null, live_demo: null, content: null, stage_label: null } });
  });

  it('leaves keys that were not sent out of the update', () => {
    const r = parseProjectFields({ status: 'draft', available: false });
    if (!r.ok) throw new Error(r.error);
    const { set, values } = projectUpdateSet(r.fields, 2);
    expect(values).toEqual([false, 'draft']);
    expect(set).toContain('available = $2');
    expect(set).toContain('status = $3::text');
    expect(set).not.toMatch(/title =|source_code =/);
    expect(set).toContain("WHEN $3::text = 'draft' THEN NULL");
  });

  it('accepts the older field names only when the canonical one is absent', () => {
    expect(parseProjectFields({ repoPath: 'https://x.test', liveUrl: 'https://y.test' })).toEqual({ ok: true, fields: { source_code: 'https://x.test', live_demo: 'https://y.test' } });
    expect(parseProjectFields({ image: 'a', featured_image: 'b' })).toEqual({ ok: true, fields: { image: 'a' } });
  });

  it.each([
    [{ status: 'archived' }, 'status'],
    [{ title: '' }, 'title'],
    [{ slug: 'a b' }, 'slug'],
    [{ featured: 1 }, 'featured'],
    [{ technologies: ['ok', 3] }, 'technologies'],
    [{ title: 'x'.repeat(501) }, 'title'],
  ])('rejects %j', (body, field) => {
    const r = parseProjectFields(body);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(field);
  });

  it('reports available and stage_label for the readback', () => {
    expect(serializeProject({ id: '1', available: false, stage_label: 'Beta' })).toMatchObject({ available: false, stage_label: 'Beta' });
    expect(serializeProject({ id: '1' })).toMatchObject({ available: true, stage_label: null });
  });
});
