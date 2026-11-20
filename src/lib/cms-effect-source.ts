import {createHash} from "node:crypto";
import {cmsContentDigest,parseCmsPublicContent,parseCmsPublicationRequest,matchingCmsPublicationReceipt,type CmsPublicationReceipt} from "./cms-publication-protocol";
import type {CmsReceiverPost} from "./cms-publication-receiver";
type NativeReceipt={protocol:"native-publication-v1";requestId:string;requestHash:string;site:string;postId:string;source:"native-admin"|"native-scheduler";outcome:"confirmed";post:CmsReceiverPost};
const digest=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function nativePublicationSite(env:Record<string,string|undefined>=process.env):string{
  const explicit=env.ME_MANAGER_SITE_KEY?.trim();
  if(explicit){if(!/^[a-z0-9][a-z0-9-]{0,99}$/.test(explicit))throw new Error("Invalid native publication site identity");return explicit;}
  const host=new URL(env.NEXTAUTH_URL||env.NEXT_PUBLIC_SITE_URL||"").hostname.toLowerCase();
  const sites:Record<string,string>={"kecktech.net":"kecktech","www.kecktech.net":"kecktech","willworkforlunch.com":"wwfl","www.willworkforlunch.com":"wwfl","jacob-roman.com":"jacob-roman","www.jacob-roman.com":"jacob-roman","unclejonsitgarage.com":"unclejon","www.unclejonsitgarage.com":"unclejon","homestead.kecktech.net":"homestead"};
  if(!sites[host])throw new Error("Configure the exact native publication site identity before publishing");return sites[host];
}
function nativeHash(row:Omit<NativeReceipt,"requestHash">){return digest([row.protocol,row.requestId,row.site,row.postId,row.source,row.outcome,row.post.revision,cmsContentDigest(row.post),row.post.published_at,row.post.scheduled_publish_at]);}
export function nativePublicationReceipt(site:string,post:CmsReceiverPost,source:NativeReceipt["source"]):NativeReceipt{
  const bytes=Buffer.from(digest(["native-publication-v1",site,post.id,post.revision,cmsContentDigest(post),source]).slice(0,32),"hex");bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=bytes.toString("hex"),requestId=`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  const receipt:NativeReceipt={protocol:"native-publication-v1",requestId,requestHash:"",site,postId:post.id,source,outcome:"confirmed",post};receipt.requestHash=nativeHash(receipt);
  if(!verifiedPublicationEffectSource(receipt,receipt.requestHash))throw new Error("Native publication did not produce a complete committed public snapshot");
  return receipt;
}
/** Native CMS authorization is explicitly distinct from Lunchpail review. Both
 * proofs bind the real committed content/revision; neither is a status-only ACK. */
export function verifiedPublicationEffectSource(value:unknown,expectedHash?:string):{requestId:string;requestHash:string;site:string;post:CmsReceiverPost}|null{
  try{
    if(!value||typeof value!=="object")return null;
    const row=value as CmsPublicationReceipt|NativeReceipt,post=row.post;
    if(!post||typeof row.site!=="string"||!/^[a-z0-9][a-z0-9-]{0,99}$/.test(row.site)||typeof row.requestId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.requestId)||row.postId!==post.id||typeof post.id!=="string"||!post.id||typeof post.revision!=="string"||!post.revision||row.outcome!=="confirmed"||post.status!=="published"||post.published!==true||typeof post.published_at!=="string"||!Number.isFinite(Date.parse(post.published_at))||post.scheduled_publish_at!==null||!parseCmsPublicContent({title:post.title,slug:post.slug,excerpt:post.excerpt,content:post.content,featured_image:post.featured_image,tags:post.tags}))return null;
    if(expectedHash&&row.requestHash!==expectedHash)return null;
    if(row.protocol==="native-publication-v1"){
      if(!["native-admin","native-scheduler"].includes(row.source)||row.requestHash!==nativeHash(row))return null;
    }else{
      const request=parseCmsPublicationRequest({protocol:row.protocol,requestId:row.requestId,site:row.site,postId:row.postId,action:row.action,expectedRevision:row.expectedRevision,scheduledFor:row.scheduledFor,content:{title:post.title,slug:post.slug,excerpt:post.excerpt,content:post.content,featured_image:post.featured_image,tags:post.tags},contentDigest:row.contentDigest});
      if(!request||request.action!=="publish"||!matchingCmsPublicationReceipt(row,request))return null;
    }
    return {requestId:row.requestId,requestHash:row.requestHash,site:row.site,post};
  }catch{return null;}
}
