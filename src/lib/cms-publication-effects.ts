import {runCmsFollowupEffects,type CmsFollowupEffectStore} from './cms-followup-effects';
import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { runCmsCacheEffectBatch, type CmsCacheEffectStore } from './cms-cache-effects';

export const websiteCacheEffectStore: CmsCacheEffectStore = {
  candidates: async (now, limit, requestId) => (await query(`SELECT id,request_id AS "requestId",site,post_id AS "postId",kind,
    payload_hash AS "payloadHash",payload_json AS "payloadJson",attempt_count AS "attemptCount"
    FROM me_manager_publication_effects WHERE kind='cache' AND ($2::text IS NULL OR request_id=$2)
      AND ((state IN ('pending','failed','unknown') AND next_attempt_at <= $1)
        OR (state='running' AND (lease_until IS NULL OR lease_until <= $1)))
    ORDER BY created_at,id LIMIT $3`,[now,requestId ?? null,limit])).rows,
  claim: async (row,leaseId,now,until) => (await query(`UPDATE me_manager_publication_effects
    SET state='running',attempt_count=attempt_count+1,lease_id=$3,lease_until=$5,result_json=NULL,error_message=NULL,updated_at=$4
    WHERE id=$1 AND attempt_count=$2 AND kind='cache' AND
      ((state IN ('pending','failed','unknown') AND next_attempt_at <= $4)
        OR (state='running' AND (lease_until IS NULL OR lease_until <= $4)))`,[row.id,row.attemptCount,leaseId,now,until])).rowCount === 1,
  source: async requestId => {
    const result=await query('SELECT request_hash AS "requestHash",receipt_json AS "receiptJson" FROM me_manager_publication_receipts WHERE request_id=$1',[requestId]);
    return result.rows[0] ?? null;
  },
  settle: async (id,leaseId,input) => (await query(`UPDATE me_manager_publication_effects
    SET state=$3,result_json=$4,error_message=$5,next_attempt_at=$6,updated_at=$7,lease_id=NULL,lease_until=NULL
    WHERE id=$1 AND state='running' AND lease_id=$2`,[id,leaseId,input.state,input.resultJson,input.errorMessage,input.nextAttemptAt,input.at])).rowCount === 1,
};
export async function runWebsiteCacheEffects(requestId?: string) {
  const cache=await runCmsCacheEffectBatch(websiteCacheEffectStore,paths=>{for(const path of paths)revalidatePath(path);},{requestId});
  let followups:Awaited<ReturnType<typeof runCmsFollowupEffects>>|{available:false};
  try{followups=await runCmsFollowupEffects(websiteFollowupEffectStore,{requestId});}catch{followups={available:false};}
  return {...cache,followups};
}
export async function readWebsitePublicationEffects(requestId: string) {
  return (await query(`SELECT id,kind,state,attempt_count AS "attemptCount",lease_until AS "leaseUntil",
    next_attempt_at AS "nextAttemptAt",result_json AS "resultJson",error_message AS "errorMessage",updated_at AS "updatedAt"
    FROM me_manager_publication_effects WHERE request_id=$1 ORDER BY kind,id`,[requestId])).rows;
}
export const websiteFollowupEffectStore: CmsFollowupEffectStore={
  ...websiteCacheEffectStore,
  candidates:async(now,limit,requestId)=>(await query(`SELECT id,request_id AS "requestId",site,post_id AS "postId",kind,payload_hash AS "payloadHash",payload_json AS "payloadJson",attempt_count AS "attemptCount" FROM me_manager_publication_effects WHERE kind IN ('teaser','astro') AND ($2::text IS NULL OR request_id=$2) AND ((state IN ('pending','failed','unknown') AND next_attempt_at<=$1) OR (state='running' AND (lease_until IS NULL OR lease_until<=$1))) ORDER BY created_at,id LIMIT $3`,[now,requestId??null,limit])).rows,
  claim:async(row,leaseId,now,until)=>(await query(`UPDATE me_manager_publication_effects SET state='running',attempt_count=attempt_count+1,lease_id=$3,lease_until=$5,result_json=NULL,error_message=NULL,updated_at=$4 WHERE id=$1 AND attempt_count=$2 AND kind IN ('teaser','astro') AND ((state IN ('pending','failed','unknown') AND next_attempt_at<=$4) OR (state='running' AND (lease_until IS NULL OR lease_until<=$4)))`,[row.id,row.attemptCount,leaseId,now,until])).rowCount===1,
  bindDestination:async(id,baseUrl,credentialHash)=>{
    await query('UPDATE me_manager_publication_effects SET destination_url=$2,credential_hash=$3 WHERE id=$1 AND destination_url IS NULL AND credential_hash IS NULL',[id,baseUrl,credentialHash]);
    const result=await query('SELECT destination_url,credential_hash FROM me_manager_publication_effects WHERE id=$1',[id]);
    return result.rows[0]?.destination_url===baseUrl&&result.rows[0]?.credential_hash===credentialHash;
  },
};

export async function listWebsitePublicationEffects(){
  const result=await query(`WITH recent AS (SELECT id FROM me_manager_publication_effects WHERE state='completed' ORDER BY updated_at DESC,id LIMIT 20) SELECT id,request_id AS "requestId",site,kind,state,attempt_count AS "attemptCount",error_message AS "errorMessage",result_json AS "resultJson",updated_at AS "updatedAt" FROM me_manager_publication_effects WHERE state<>'completed' OR id IN (SELECT id FROM recent) ORDER BY updated_at,id`);
  return {unresolved:result.rows.filter(row=>row.state!=='completed'),recent:result.rows.filter(row=>row.state==='completed')};
}
