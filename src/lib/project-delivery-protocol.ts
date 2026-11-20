import {createHash} from "node:crypto";

export const PROJECT_DELIVERY_PROTOCOL="managed-project-v1" as const;
export type ManagedProjectPayload={title:string;slug:string;description:string;content:string|null;image:string|null;technologies:string[];live_demo:string|null;source_code:string|null;featured:boolean;available:boolean;status:"draft"|"published"|"archived";stage_label:string|null};
export type ManagedProjectSnapshot={id:string;revision:string;payload:ManagedProjectPayload};
export type ProjectDeliveryRequest={protocol:typeof PROJECT_DELIVERY_PROTOCOL;requestId:string;site:string;projectIdentity:string;intentRevision:number;action:"upsert"|"archive"|"delete";externalId:string|null;expectedRemoteRevision:string|null;slugHint:string|null;payload:ManagedProjectPayload|null};
export type ProjectDeliveryReceipt={protocol:typeof PROJECT_DELIVERY_PROTOCOL;requestId:string;requestHash:string;site:string;projectIdentity:string;intentRevision:number;action:ProjectDeliveryRequest["action"];outcome:"confirmed"|"rejected";reason:string|null;project:ManagedProjectSnapshot|null};
const object=(value:unknown):value is Record<string,unknown>=>Boolean(value&&typeof value==="object"&&!Array.isArray(value));
const uuid=(value:unknown):value is string=>typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const text=(value:unknown,max:number):value is string=>typeof value==="string"&&value.length<=max;
function optionalUrl(value:unknown):value is string|null{if(value===null)return true;if(!text(value,4096))return false;if(value.startsWith("/")&&!value.startsWith("//")&&!/[\\\x00-\x1f]/.test(value))return true;try{const url=new URL(value);return ["http:","https:"].includes(url.protocol)&&!url.username&&!url.password;}catch{return false;}}
export function parseManagedProjectPayload(value:unknown):ManagedProjectPayload|null{
  if(!object(value)||Object.keys(value).some(key=>!["title","slug","description","content","image","technologies","live_demo","source_code","featured","available","status","stage_label"].includes(key)))return null;
  if(!text(value.title,1000)||!value.title.trim()||!text(value.slug,200)||!value.slug||/[\s/\\?#]/.test(value.slug)||!text(value.description,100000)||(value.content!==null&&!text(value.content,2000000))||!optionalUrl(value.image)||!optionalUrl(value.live_demo)||!optionalUrl(value.source_code)||!Array.isArray(value.technologies)||value.technologies.length>200||value.technologies.some(tag=>!text(tag,200))||typeof value.featured!=="boolean"||typeof value.available!=="boolean"||!["draft","published","archived"].includes(String(value.status))||(value.stage_label!==null&&!text(value.stage_label,100)))return null;
  return {title:value.title,slug:value.slug,description:value.description,content:value.content as string|null,image:value.image as string|null,technologies:value.technologies as string[],live_demo:value.live_demo as string|null,source_code:value.source_code as string|null,featured:value.featured,available:value.available,status:value.status as ManagedProjectPayload["status"],stage_label:value.stage_label as string|null};
}
export function projectPayloadHash(payload:ManagedProjectPayload){return createHash("sha256").update(JSON.stringify([payload.title,payload.slug,payload.description,payload.content,payload.image,[...new Set(payload.technologies)].sort(),payload.live_demo,payload.source_code,payload.featured,payload.available,payload.status,payload.stage_label])).digest("hex");}
export function projectRequestHash(request:ProjectDeliveryRequest){return createHash("sha256").update(JSON.stringify([request.protocol,request.requestId,request.site,request.projectIdentity,request.intentRevision,request.action,request.externalId,request.expectedRemoteRevision,request.slugHint,request.payload?projectPayloadHash(request.payload):null])).digest("hex");}
export function parseProjectDeliveryRequest(value:unknown):ProjectDeliveryRequest|null{
  if(!object(value)||Object.keys(value).some(key=>!["protocol","requestId","site","projectIdentity","intentRevision","action","externalId","expectedRemoteRevision","slugHint","payload"].includes(key)))return null;
  if(value.protocol!==PROJECT_DELIVERY_PROTOCOL||!uuid(value.requestId)||!text(value.site,100)||!/^[a-z0-9][a-z0-9-]*$/.test(value.site)||!text(value.projectIdentity,200)||!value.projectIdentity||!Number.isSafeInteger(value.intentRevision)||Number(value.intentRevision)<1||!["upsert","archive","delete"].includes(String(value.action))||(value.externalId!==null&&(!text(value.externalId,200)||!value.externalId))||(value.expectedRemoteRevision!==null&&(!text(value.expectedRemoteRevision,100)||!value.expectedRemoteRevision)))return null;
  const payload=value.action==="upsert"?parseManagedProjectPayload(value.payload):null;
  if(value.slugHint!==null&&(!text(value.slugHint,200)||!value.slugHint||/[\s/\\?#]/.test(value.slugHint)))return null;
  if(value.action==="upsert"?!payload:value.payload!==null)return null;
  return {protocol:PROJECT_DELIVERY_PROTOCOL,requestId:value.requestId,site:value.site,projectIdentity:value.projectIdentity,intentRevision:Number(value.intentRevision),action:value.action as ProjectDeliveryRequest["action"],externalId:value.externalId as string|null,expectedRemoteRevision:value.expectedRemoteRevision as string|null,slugHint:value.slugHint as string|null,payload};
}
export function matchingProjectReceipt(value:unknown,request:ProjectDeliveryRequest):ProjectDeliveryReceipt|null{
  if(!object(value)||value.protocol!==PROJECT_DELIVERY_PROTOCOL||value.requestId!==request.requestId||value.requestHash!==projectRequestHash(request)||value.site!==request.site||value.projectIdentity!==request.projectIdentity||value.intentRevision!==request.intentRevision||value.action!==request.action||!["confirmed","rejected"].includes(String(value.outcome))||(value.reason!==null&&!text(value.reason,200)))return null;
  const project=value.project;
  if(project!==null){if(!object(project)||!text(project.id,200)||!project.id||!text(project.revision,100)||!project.revision||!parseManagedProjectPayload(project.payload))return null;}
  if(value.outcome==="confirmed"){
    if(request.action==="upsert"&&(!object(project)||!request.payload||projectPayloadHash(project.payload as ManagedProjectPayload)!==projectPayloadHash(request.payload)))return null;
    if(request.action==="archive"&&project!==null&&(!object(project)||(project.payload as ManagedProjectPayload).status!=="archived"||(project.payload as ManagedProjectPayload).available!==false))return null;
    if(request.action==="delete"&&project!==null)return null;
    if(request.externalId!==null&&project!==null&&object(project)&&project.id!==request.externalId)return null;
  }
  return value as ProjectDeliveryReceipt;
}
