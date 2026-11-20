import {NextResponse} from 'next/server';
import {listWebsitePublicationEffects,runWebsiteCacheEffects} from '@/lib/cms-publication-effects';
import {readCmsBridgeJson} from '@/lib/cms-legacy-bridge';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
function authorized(request:Request){const key=process.env.ME_MANAGER_API_KEY;return Boolean(key&&request.headers.get('authorization')==='Bearer '+key);}
export async function GET(request:Request){if(!authorized(request))return reply({error:'Unauthorized'},401);try{return reply(await listWebsitePublicationEffects());}catch{return reply({error:'Publication effect history is unavailable; its unresolved count is unknown'},503);}}
export async function POST(request:Request){
  if(!authorized(request))return reply({error:'Unauthorized'},401);
  const body=await readCmsBridgeJson(request);
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(key=>key!=='requestId')||('requestId' in body&&(typeof body.requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId))))return reply({error:'Provide an optional exact publication request ID'},400);
  try{return reply({batch:await runWebsiteCacheEffects('requestId' in body?body.requestId as string:undefined),history:await listWebsitePublicationEffects()});}catch{return reply({error:'The retained effect batch remains unconfirmed; no replacement publication was sent'},503);}
}
