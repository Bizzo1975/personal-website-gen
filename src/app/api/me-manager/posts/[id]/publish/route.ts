import { NextResponse } from 'next/server';
import { readCmsPublicationRequest } from '@/lib/cms-publication-protocol';
import { POST as reviewedPublication } from '../reviewed-publication/route';
export const dynamic = 'force-dynamic';
/** Compatibility URL; the versioned reviewed request is mandatory. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const key=process.env.ME_MANAGER_API_KEY;
  const reply=(body:unknown,status:number)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
  if(!key || request.headers.get('authorization')!==`Bearer ${key}`) return reply({error:'Unauthorized'},401);
  const body=await readCmsPublicationRequest(request);
  if(!body || body.action!=='publish') return reply({error:'Use the exact versioned reviewed-publication request',code:'REVIEWED_PUBLICATION_REQUIRED'},428);
  return reviewedPublication(new Request(request.url,{method:'POST',headers:request.headers,body:JSON.stringify(body)}),context);
}
