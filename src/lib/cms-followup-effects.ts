import {createHash,randomUUID} from "node:crypto";
import {makeCmsPostCommitEffects,type CmsPostCommitPayload} from "./cms-post-commit-effects";
import {verifiedPublicationEffectSource} from "./cms-effect-source";
import {fetchCmsPublication} from "./cms-publication-transport";
import type {CmsCacheEffectStore,CmsCacheEffectRow} from "./cms-cache-effects";
export interface CmsFollowupEffectStore extends CmsCacheEffectStore{
  bindDestination(id:string,baseUrl:string,credentialHash:string):Promise<boolean>;
}
function payloadOf(row:CmsCacheEffectRow,source:{requestHash:string;receiptJson:string|null}|null):CmsPostCommitPayload|null{
  try{
    if(!source?.receiptJson||!["teaser","astro"].includes(row.kind)||createHash("sha256").update(row.payloadJson).digest("hex")!==row.payloadHash)return null;
    const receipt=verifiedPublicationEffectSource(JSON.parse(source.receiptJson),source.requestHash);
    if(!receipt||receipt.requestId!==row.requestId)return null;
    const expected=makeCmsPostCommitEffects(receipt,receipt.site==="kecktech").find(value=>value.kind===row.kind);
    return expected&&expected.id===row.id&&expected.site===row.site&&expected.postId===row.postId&&expected.payloadHash===row.payloadHash&&expected.payloadJson===row.payloadJson?JSON.parse(row.payloadJson):null;
  }catch{return null;}
}
/** The callback is itself idempotent and commits its result with local teaser
 * records. Rebuild callbacks retain one original host request across retries. */
export async function runCmsFollowupEffects(store:CmsFollowupEffectStore,options:{requestId?:string;limit?:number;budgetMs?:number}={}){
  const count=options.limit??10,budget=options.budgetMs??20000;
  if(!Number.isInteger(count)||count<1||count>30||!Number.isFinite(budget)||budget<1||budget>60000)throw new Error("Invalid publication follow-up batch bounds");
  const result={completed:0,pending:0,failed:0,lostLease:0,budgetExceeded:false};
  const started=Date.now(),base=process.env.ME_MANAGER_URL?.trim(),key=process.env.ME_MANAGER_INGEST_KEY||process.env.ME_MANAGER_API_KEY;
  const rows=await store.candidates(new Date(),count,options.requestId);
  for(const row of rows){
    if(Date.now()-started>=budget){result.budgetExceeded=true;break;}
    const leaseId=randomUUID(),now=new Date();
    if(!await store.claim(row,leaseId,now,new Date(now.getTime()+90000)))continue;
    let completion:string|null=null,errorMessage:string|null=null;
    try{
      const payload=payloadOf(row,await store.source(row.requestId));
      if(!payload)throw new Error("Follow-up does not match its original committed receipt");
      if(!base||!key)throw new Error("The original callback destination and ingest credential must be configured");
      const address=new URL(base);
      if(!["http:","https:"].includes(address.protocol)||address.username||address.password||address.search||address.hash)throw new Error("Invalid callback destination");
      const normalized=base.replace(/\/$/,"");
      const credentialHash=createHash("sha256").update(key).digest("hex");
      if(!await store.bindDestination(row.id,normalized,credentialHash))throw new Error("The original callback destination or credential changed; restore it before recovery");
      const path="/api/sites/publication-effects";
      const lookup=await fetchCmsPublication(normalized,key,`${path}?${new URLSearchParams({effectId:row.id,payloadHash:row.payloadHash})}`,"GET",undefined,8000);
      let response=lookup;
      const status=lookup.body as {state?:unknown}|null;
      if(lookup.status===404||(lookup.status===200&&status?.state!=="completed"))response=await fetchCmsPublication(normalized,key,path,"POST",payload,45000);
      const receipt=response.body as {protocol?:unknown;effectId?:unknown;payloadHash?:unknown;state?:unknown;result?:{kind?:unknown;publicDeliveryConfirmed?:unknown}}|null;
      if(!receipt||receipt.protocol!=="cms-effect-callback-v1"||receipt.effectId!==row.id||receipt.payloadHash!==row.payloadHash)throw new Error("No exact follow-up receipt was returned; its original callback remains retained");
      if(response.status===200&&receipt.state==="completed"&&receipt.result?.kind===row.kind&&(row.kind!=="astro"||receipt.result.publicDeliveryConfirmed===true))completion=JSON.stringify(receipt);
      else errorMessage="The exact callback remains pending; no completed teaser/static delivery outcome is confirmed";
    }catch(error){errorMessage=error instanceof Error&&/^(Follow-up|The original|Invalid callback|No exact)/.test(error.message)?error.message:"The original callback outcome is unconfirmed; retry only its retained identity";}
    const at=new Date(),delay=Math.round(Math.min(300000,1000*2**Math.min(row.attemptCount,8))*(0.8+Math.random()*0.4));
    const saved=await store.settle(row.id,leaseId,{state:completion?"completed":"failed",resultJson:completion,errorMessage,nextAttemptAt:new Date(at.getTime()+delay),at});
    if(!saved)result.lostLease++;else if(completion)result.completed++;else if(errorMessage?.includes("pending"))result.pending++;else result.failed++;
  }
  return result;
}
