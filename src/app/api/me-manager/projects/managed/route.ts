import {NextResponse} from 'next/server';
import {readCmsBridgeJson} from '@/lib/cms-legacy-bridge';
import {parseProjectDeliveryRequest} from '@/lib/project-delivery-protocol';
import {ProjectRequestIdentityConflict} from '@/lib/project-delivery-receiver';
import {executeManagedProject,readManagedProjectReceipt,readManagedProjectState,retryManagedProjectExport} from '@/lib/cms-managed-project';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
function authorized(request:Request){const key=process.env.ME_MANAGER_API_KEY;return Boolean(key&&request.headers.get('authorization')===`Bearer ${key}`);}
export async function GET(request:Request){
  if(!authorized(request))return reply({error:'Unauthorized'},401);
  const query=new URL(request.url).searchParams,requestId=query.get('requestId');
  try{
    if(requestId){if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId))return reply({error:'Invalid request identity'},400);const receipt=await readManagedProjectReceipt(requestId);if(!receipt)return reply({code:'RECEIPT_NOT_FOUND'},404);const state=await readManagedProjectState(receipt.site,receipt.projectIdentity,null);return reply({receipt,exportPending:state.exportPending});}
    const site=query.get('site'),identity=query.get('projectIdentity'),externalId=query.get('externalId');
    if(!site||!/^[a-z0-9][a-z0-9-]{0,99}$/.test(site)||!identity||identity.length>200||(externalId!==null&&(!externalId||externalId.length>200)))return reply({error:'Provide the exact project/source identity'},400);
    return reply(await readManagedProjectState(site,identity,externalId));
  }catch{return reply({code:'PROJECT_STATE_UNAVAILABLE',error:'Project outcome storage is unavailable'},503);}
}
export async function POST(request:Request){
  if(!authorized(request))return reply({error:'Unauthorized'},401);
  const raw=await readCmsBridgeJson(request);
  if(raw&&typeof raw==='object'&&!Array.isArray(raw)&&(raw as {protocol?:unknown}).protocol==='managed-project-export-v1'){
    const body=raw as Record<string,unknown>;
    if(Object.keys(body).some(key=>!['protocol','requestId','requestHash'].includes(key))||typeof body.requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId)||typeof body.requestHash!=='string'||!/^[0-9a-f]{64}$/.test(body.requestHash))return reply({error:'Invalid export recovery identity'},400);
    try{const receipt=await readManagedProjectReceipt(body.requestId);if(!receipt)return reply({code:'RECEIPT_NOT_FOUND'},404);if(receipt.requestHash!==body.requestHash||receipt.outcome!=='confirmed')return reply({error:'The export recovery request does not match a committed receipt'},409);return reply({receipt,exportPending:await retryManagedProjectExport(receipt)});}catch{return reply({error:'Export recovery could not be confirmed; no visibility write was attempted'},503);}
  }
  const body=parseProjectDeliveryRequest(raw);
  if(!body)return reply({error:'Provide the exact versioned project intent',code:'INVALID_PROJECT_REQUEST'},400);
  try{const result=await executeManagedProject(body);return reply({ok:result.receipt.outcome==='confirmed',receipt:result.receipt,replay:!result.newlyApplied,exportPending:result.exportPending},result.receipt.outcome==='confirmed'?200:409);}
  catch(error){if(error instanceof ProjectRequestIdentityConflict)return reply({error:'Project request identity conflict',code:'REQUEST_IDENTITY_CONFLICT'},409);return reply({error:'Project outcome is unconfirmed; read the original request receipt',code:'PROJECT_OUTCOME_UNCONFIRMED'},503);}
}
