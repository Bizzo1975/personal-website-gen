import {PROJECT_DELIVERY_PROTOCOL,projectRequestHash,projectPayloadHash,matchingProjectReceipt,type ManagedProjectPayload,type ManagedProjectSnapshot,type ProjectDeliveryRequest,type ProjectDeliveryReceipt} from "./project-delivery-protocol";

export class ProjectRequestIdentityConflict extends Error{}
export type ManagedProjectHead={site:string;projectIdentity:string;intentRevision:number;externalId:string|null;lastSlug:string|null};
export interface ProjectDeliveryTransaction{
  reserveReceipt(id:string,hash:string):Promise<{requestHash:string;receiptJson:string|null}>;
  reserveHead(site:string,identity:string):Promise<ManagedProjectHead>;
  advanceHead(head:ManagedProjectHead,nextRevision:number,externalId:string|null,applied?:{slugHint:string|null;hidden:boolean}):Promise<void>;
  readProject(id:string):Promise<ManagedProjectSnapshot|null>;
  createProject(payload:ManagedProjectPayload):Promise<ManagedProjectSnapshot|null>;
  replaceProject(id:string,revision:string,payload:ManagedProjectPayload):Promise<ManagedProjectSnapshot|null>;
  removeProject(id:string,revision:string):Promise<boolean>;
  saveReceipt(id:string,receiptJson:string):Promise<void>;
}
/** Per-source monotonic intent and native revision CAS share the visibility and
 * receipt transaction. A later removal leaves a tombstone; late creates cannot
 * resurrect it. Duplicate requests replay evidence without another write. */
export async function executeProjectDelivery(request:ProjectDeliveryRequest,store:{transaction<T>(run:(tx:ProjectDeliveryTransaction)=>Promise<T>):Promise<T>}){
  return store.transaction(async tx=>{
    const requestHash=projectRequestHash(request),stored=await tx.reserveReceipt(request.requestId,requestHash);
    if(stored.requestHash!==requestHash)throw new ProjectRequestIdentityConflict("Project request identity was reused with a different immutable payload");
    if(stored.receiptJson){const receipt=matchingProjectReceipt(JSON.parse(stored.receiptJson),request);if(!receipt)throw new Error("Stored project receipt failed identity verification");return {receipt,newlyApplied:false};}
    const head=await tx.reserveHead(request.site,request.projectIdentity);
    const finish=async(outcome:"confirmed"|"rejected",reason:string|null,project:ManagedProjectSnapshot|null)=>{
      const receipt:ProjectDeliveryReceipt={protocol:PROJECT_DELIVERY_PROTOCOL,requestId:request.requestId,requestHash,site:request.site,projectIdentity:request.projectIdentity,intentRevision:request.intentRevision,action:request.action,outcome,reason,project};
      await tx.saveReceipt(request.requestId,JSON.stringify(receipt));return {receipt,newlyApplied:outcome==="confirmed"};
    };
    if(request.intentRevision<=head.intentRevision)return finish("rejected","STALE_PROJECT_INTENT",null);
    // Even a refused newer intent fences off older in-flight writes.
    await tx.advanceHead(head,request.intentRevision,head.externalId);
    if(head.externalId&&request.externalId!==head.externalId)return finish("rejected","PROJECT_MAPPING_CHANGED",null);
    const id=head.externalId??request.externalId;
    const current=id?await tx.readProject(id):null;
    if(current&&current.revision!==request.expectedRemoteRevision)return finish("rejected","PROJECT_REVISION_CHANGED",current);
    if(!current&&request.expectedRemoteRevision!==null)return finish("rejected","PROJECT_DISAPPEARED",null);
    if(!current&&id&&request.action==="upsert")return finish("rejected","PROJECT_MAPPING_REQUIRES_RECONCILIATION",null);
    if(request.action==="delete"){
      if(current&&!await tx.removeProject(current.id,current.revision))return finish("rejected","PROJECT_REVISION_CHANGED",null);
      await tx.advanceHead({...head,intentRevision:request.intentRevision},request.intentRevision,null,{slugHint:current?.payload.slug??head.lastSlug??request.slugHint,hidden:true});
      return finish("confirmed",null,null);
    }
    if(request.action==="archive"&&!current){await tx.advanceHead({...head,intentRevision:request.intentRevision},request.intentRevision,null,{slugHint:head.lastSlug??request.slugHint,hidden:true});return finish("confirmed",null,null);}
    const payload=request.action==="archive"?{...current!.payload,status:"archived" as const,available:false}:request.payload!;
    const changed=current?await tx.replaceProject(current.id,current.revision,payload):await tx.createProject(payload);
    if(!changed)return finish("rejected","PROJECT_WRITE_CONFLICT",null);
    if(projectPayloadHash(changed.payload)!==projectPayloadHash(payload))throw new Error("Receiver did not store the exact requested public project snapshot");
    await tx.advanceHead({...head,intentRevision:request.intentRevision},request.intentRevision,changed.id,{slugHint:changed.payload.slug,hidden:changed.payload.status!=="published"||!changed.payload.available});
    return finish("confirmed",null,changed);
  });
}
