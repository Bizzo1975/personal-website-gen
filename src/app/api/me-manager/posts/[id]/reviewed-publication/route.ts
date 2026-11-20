import { runWebsiteCacheEffects, readWebsitePublicationEffects } from '@/lib/cms-publication-effects';
import { NextResponse } from 'next/server';
import { readCmsPublicationRequest } from '@/lib/cms-publication-protocol';
import { CmsRequestIdentityConflict } from '@/lib/cms-publication-receiver';
import { executeWebsitePublication, readWebsitePublicationReceipt } from '@/lib/cms-reviewed-publication';

export const dynamic = 'force-dynamic';
async function effectStatus(requestId: string) {
  try { return { available:true,items:await readWebsitePublicationEffects(requestId) }; }
  catch { return { available:false }; }
}
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
function authorized(request: Request) { const key = process.env.ME_MANAGER_API_KEY; return Boolean(key && request.headers.get('authorization') === `Bearer ${key}`); }
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(request)) return reply({ error: 'Unauthorized' }, 401);
  const postId = (await params).id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) return reply({ error: 'Invalid article identity' }, 400);
  const requestId = new URL(request.url).searchParams.get('requestId');
  if (!requestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) return reply({ error: 'A publication request identity is required' }, 400);
  try {
    const receipt = await readWebsitePublicationReceipt(requestId);
    if (!receipt) return reply({ error: 'No committed receipt for this request', code: 'RECEIPT_NOT_FOUND' }, 404);
    if (receipt.postId !== (await params).id) return reply({ error: 'Request belongs to another post' }, 409);
    return reply({ ok: receipt.outcome === 'confirmed', receipt, effects:await effectStatus(receipt.requestId) });
  } catch { return reply({ error: 'Publication receipt storage unavailable', code: 'RECEIPT_UNAVAILABLE' }, 503); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(request)) return reply({ error: 'Unauthorized' }, 401);
  const postId = (await params).id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) return reply({ error: 'Invalid article identity', code: 'INVALID_PUBLICATION_REQUEST' }, 400);
  const body = await readCmsPublicationRequest(request);
  if (!body || body.postId !== (await params).id) return reply({ error: 'Provide the exact versioned reviewed publication request', code: 'INVALID_PUBLICATION_REQUEST' }, 400);
  try {
    const result = await executeWebsitePublication(body);
    let cacheAttempt: Awaited<ReturnType<typeof runWebsiteCacheEffects>> | {available:false} | null = null;
    if(result.receipt.outcome === 'confirmed' && result.receipt.action === 'publish') {
      try { cacheAttempt=await runWebsiteCacheEffects(result.receipt.requestId); }
      catch { cacheAttempt={available:false}; }
    }
    return reply({ ok: result.receipt.outcome === 'confirmed', receipt: result.receipt, replay: !result.newlyApplied, cacheAttempt, effects:await effectStatus(result.receipt.requestId) }, result.receipt.outcome === 'confirmed' ? 200 : 409);
  } catch (error) {
    if (error instanceof CmsRequestIdentityConflict) return reply({ error: error.message, code: 'REQUEST_IDENTITY_CONFLICT' }, 409);
    return reply({ error: 'Publication outcome unconfirmed; reconcile the original request identity', code: 'PUBLICATION_UNCONFIRMED' }, 503);
  }
}
