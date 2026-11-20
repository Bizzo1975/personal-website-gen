import {randomUUID,createHash} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {getClient,query} from '@/lib/db';
import {executeProjectDelivery} from './project-delivery-receiver';
import {PROJECT_DELIVERY_PROTOCOL,type ProjectDeliveryRequest,type ManagedProjectPayload,type ManagedProjectSnapshot} from './project-delivery-protocol';
const projection=`id,title,slug,description,content,image,technologies,live_demo,source_code,featured,available,status,stage_label,updated_at::text AS revision`;
const headId=(site:string,identity:string)=>createHash('sha256').update(JSON.stringify([site,identity])).digest('hex');
function snapshot(row:Record<string,unknown>):ManagedProjectSnapshot{
  if(!Array.isArray(row.technologies)||row.technologies.some(tag=>typeof tag!=='string')||!['draft','published','archived'].includes(String(row.status)))throw new Error('Unsupported native project snapshot');
  return {id:String(row.id),revision:String(row.revision),payload:{title:String(row.title),slug:String(row.slug),description:row.description===null?'':String(row.description),content:row.content===null?null:String(row.content),image:row.image===null?null:String(row.image),technologies:row.technologies as string[],live_demo:row.live_demo===null?null:String(row.live_demo),source_code:row.source_code===null?null:String(row.source_code),featured:row.featured===true,available:row.available===true,status:String(row.status) as ManagedProjectPayload['status'],stage_label:row.stage_label===null?null:String(row.stage_label)}};
}
function values(payload:ManagedProjectPayload){return [payload.title,payload.slug,payload.description,payload.content,payload.image,payload.technologies,payload.live_demo,payload.source_code,payload.featured,payload.available,payload.status,payload.stage_label];}
export async function readManagedProjectReceipt(requestId:string){const row=(await query('SELECT receipt_json FROM me_manager_publication_receipts WHERE request_id=$1',[requestId])).rows[0];if(!row?.receipt_json)return null;const value=JSON.parse(row.receipt_json);return value?.protocol===PROJECT_DELIVERY_PROTOCOL?value:null;}
export async function readManagedProjectState(site:string,projectIdentity:string,externalId:string|null){
  const head=(await query('SELECT * FROM me_manager_project_heads WHERE site=$1 AND project_identity=$2',[site,projectIdentity])).rows[0];
  const id=head?head.external_id:externalId,project=id?(await query(`SELECT ${projection} FROM projects WHERE id=$1`,[id])).rows[0]:null;
  return {protocol:PROJECT_DELIVERY_PROTOCOL,site,projectIdentity,intentRevision:head?.intent_revision??0,headExternalId:head?.external_id??null,project:project?snapshot(project):null,exportPending:head?.export_pending??false};
}
export async function executeManagedProject(request:ProjectDeliveryRequest){
  const result=await executeProjectDelivery(request,{transaction:async run=>{
    const client=await getClient();
    async function write(run:()=>Promise<ManagedProjectSnapshot|null>){
      await client.query('SAVEPOINT managed_project_write');
      try{const result=await run();await client.query('RELEASE SAVEPOINT managed_project_write');return result;}
      catch(error){await client.query('ROLLBACK TO SAVEPOINT managed_project_write');await client.query('RELEASE SAVEPOINT managed_project_write');if(['23505','23503','23514'].includes((error as {code?:string}).code||''))return null;throw error;}
    }
    try{
      await client.query('BEGIN');await client.query("SET LOCAL TIME ZONE 'UTC'");await client.query("SET LOCAL statement_timeout='10000ms'");
      const value=await run({
        reserveReceipt:async(requestId,requestHash)=>{
          await client.query('INSERT INTO me_manager_publication_receipts(request_id,request_hash) VALUES($1,$2) ON CONFLICT(request_id) DO NOTHING',[requestId,requestHash]);
          const row=(await client.query('SELECT request_hash,receipt_json FROM me_manager_publication_receipts WHERE request_id=$1 FOR UPDATE',[requestId])).rows[0];return {requestHash:row.request_hash,receiptJson:row.receipt_json};
        },
        reserveHead:async(site,projectIdentity)=>{
          await client.query('INSERT INTO me_manager_project_heads(id,site,project_identity) VALUES($1,$2,$3) ON CONFLICT(site,project_identity) DO NOTHING',[headId(site,projectIdentity),site,projectIdentity]);
          const row=(await client.query('SELECT * FROM me_manager_project_heads WHERE site=$1 AND project_identity=$2 FOR UPDATE',[site,projectIdentity])).rows[0];return {site,projectIdentity,intentRevision:row.intent_revision,externalId:row.external_id,lastSlug:row.last_slug};
        },
        advanceHead:async(head,intentRevision,externalId,applied)=>{
          const result=await client.query(`UPDATE me_manager_project_heads SET intent_revision=$2,external_id=$3,
            last_slug=CASE WHEN $4 THEN $5 ELSE last_slug END,hidden=CASE WHEN $4 THEN $6 ELSE hidden END,
            export_pending=CASE WHEN $4 THEN true ELSE export_pending END,updated_at=clock_timestamp()
            WHERE id=$1 AND intent_revision=$7`,[headId(head.site,head.projectIdentity),intentRevision,externalId,Boolean(applied),applied?.slugHint??null,applied?.hidden??true,head.intentRevision]);
          if(result.rowCount!==1)throw new Error('Project intent changed during the transaction');
        },
        readProject:async id=>{const row=(await client.query(`SELECT ${projection} FROM projects WHERE id=$1 FOR UPDATE`,[id])).rows[0];return row?snapshot(row):null;},
        createProject:payload=>write(async()=>{
          const row=(await client.query(`INSERT INTO projects(id,title,slug,description,content,image,technologies,live_demo,source_code,featured,available,status,stage_label,published_at)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::text,$13,CASE WHEN $12::text='published' THEN timezone('UTC',clock_timestamp()) ELSE NULL END) RETURNING ${projection}`,[randomUUID(),...values(payload)])).rows[0];return snapshot(row);
        }),
        replaceProject:(id,revision,payload)=>write(async()=>{
          const row=(await client.query(`UPDATE projects SET title=$1,slug=$2,description=$3,content=$4,image=$5,technologies=$6,live_demo=$7,source_code=$8,featured=$9,available=$10,status=$11::text,stage_label=$12,
            published_at=CASE WHEN $11::text='published' THEN COALESCE(published_at,timezone('UTC',clock_timestamp())) ELSE NULL END,
            updated_at=GREATEST(timezone('UTC',clock_timestamp()),updated_at+interval '1 millisecond') WHERE id=$13 AND updated_at::text=$14 RETURNING ${projection}`,[...values(payload),id,revision])).rows[0];return row?snapshot(row):null;
        }),
        removeProject:async(id,revision)=>(await client.query('DELETE FROM projects WHERE id=$1 AND updated_at::text=$2',[id,revision])).rowCount===1,
        saveReceipt:async(requestId,receiptJson)=>{await client.query('UPDATE me_manager_publication_receipts SET receipt_json=$2 WHERE request_id=$1',[requestId,receiptJson]);},
      });
      await client.query('COMMIT');return value;
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }});
  return {...result,exportPending:await retryManagedProjectExport(result.receipt)};
}
export async function retryManagedProjectExport(request:{site:string;projectIdentity:string}){
  let exportPending=true;
  try{
    const head=(await query('SELECT intent_revision,last_slug FROM me_manager_project_heads WHERE site=$1 AND project_identity=$2',[request.site,request.projectIdentity])).rows[0];
    revalidatePath('/');revalidatePath('/projects');if(head?.last_slug)revalidatePath('/projects/'+encodeURIComponent(head.last_slug));
    const clear=await query('UPDATE me_manager_project_heads SET export_pending=false WHERE site=$1 AND project_identity=$2 AND intent_revision=$3',[request.site,request.projectIdentity,head?.intent_revision]);
    exportPending=clear.rowCount!==1;
  }catch{}
  return exportPending;
}
