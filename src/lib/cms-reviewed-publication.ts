import {nativePublicationReceipt,nativePublicationSite} from './cms-effect-source';
import { makeCmsPostCommitEffects } from './cms-post-commit-effects';
import type { PoolClient } from 'pg';
import { makeNativeScheduleApproval, nativeScheduleMatches, readNativeScheduleApproval } from './cms-native-schedule';
import { getClient, query } from '@/lib/db';
import { executeReviewedCmsPublication, type CmsReceiverPost, type CmsPublicationCondition } from './cms-publication-receiver';
import type { CmsPublicationRequest, CmsPublicationReceipt } from './cms-publication-protocol';
import { confirmedCmsSchedule, dueCmsPublicationRequest } from './cms-scheduled-publication';

const projection = `id, title, slug, COALESCE(excerpt, '') AS excerpt, content, featured_image, tags, status, published, updated_at::text AS revision, to_char(published_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS published_at, to_char(scheduled_publish_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS scheduled_publish_at`;
function serialize(row: Record<string, unknown>): CmsReceiverPost {
  const at = (value: unknown) => value instanceof Date ? value.toISOString() : value === null ? null : new Date(String(value)).toISOString();
  if (!Array.isArray(row.tags) || row.tags.some(tag => typeof tag !== 'string')) throw new Error('Invalid stored article metadata');
  return { id: String(row.id), title: String(row.title), slug: String(row.slug), excerpt: String(row.excerpt), content: String(row.content), featured_image: row.featured_image === null ? null : String(row.featured_image), tags: row.tags, status: String(row.status), published: row.published === true, revision: String(row.revision), published_at: at(row.published_at), scheduled_publish_at: at(row.scheduled_publish_at) };
}

export async function executeWebsitePublication(request: CmsPublicationRequest, condition?: CmsPublicationCondition) {
  return executeReviewedCmsPublication(request, {
    transaction: async run => {
      const client = await getClient();
      try {
        await client.query('BEGIN');
        await client.query("SET LOCAL TIME ZONE 'UTC'");
        await client.query("SET LOCAL statement_timeout = '10000ms'");
        const result = await run({
          reserve: async (requestId, requestHash) => {
            await client.query('INSERT INTO me_manager_publication_receipts (request_id, request_hash) VALUES ($1, $2) ON CONFLICT (request_id) DO NOTHING', [requestId, requestHash]);
            const result = await client.query('SELECT request_hash, receipt_json FROM me_manager_publication_receipts WHERE request_id = $1 FOR UPDATE', [requestId]);
            return { requestHash: result.rows[0].request_hash, receiptJson: result.rows[0].receipt_json };
          },
          readPost: async postId => { const result = await client.query(`SELECT ${projection} FROM posts WHERE id = $1 FOR UPDATE`, [postId]); return result.rows[0] ? serialize(result.rows[0]) : null; },
          changeVisibility: async (intent, guard) => {
            const result = await client.query(`UPDATE posts SET status = $1, published = $2, published_at = CASE WHEN $2 THEN timezone('UTC', clock_timestamp()) ELSE NULL END, scheduled_publish_at = ($3::timestamptz AT TIME ZONE 'UTC'), updated_at = GREATEST(timezone('UTC', clock_timestamp()), updated_at + interval '1 millisecond') WHERE id = $4 AND updated_at::text = $5 AND permission_level = 'all' AND published = false AND status IN ('draft', 'scheduled') AND ($6::timestamptz IS NULL OR (status = 'scheduled' AND scheduled_publish_at = ($6::timestamptz AT TIME ZONE 'UTC'))) RETURNING ${projection}`, [intent.action === 'publish' ? 'published' : 'scheduled', intent.action === 'publish', intent.scheduledFor, intent.postId, intent.expectedRevision, guard?.scheduledFor ?? null]);
            return result.rows[0] ? serialize(result.rows[0]) : null;
          },
          saveReceipt: async (requestId, receiptJson) => { await client.query('UPDATE me_manager_publication_receipts SET receipt_json = $2 WHERE request_id = $1', [requestId, receiptJson]); },
          enqueuePostCommit: async receipt => {
            if (!receipt.post) throw new Error('Publication outbox requires its committed post');
            for (const effect of makeCmsPostCommitEffects({ requestId: receipt.requestId, requestHash: receipt.requestHash, site: receipt.site, post: receipt.post }, false)) {
              await client.query(`INSERT INTO me_manager_publication_effects(id,request_id,site,post_id,kind,payload_hash,payload_json)
                VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING`, [effect.id,effect.requestId,effect.site,effect.postId,effect.kind,effect.payloadHash,effect.payloadJson]);
              const stored = await client.query('SELECT payload_hash FROM me_manager_publication_effects WHERE id=$1',[effect.id]);
              if (stored.rows[0]?.payload_hash !== effect.payloadHash) throw new Error('Publication effect identity conflict');
            }
          },
        });
        await client.query('COMMIT'); return result;
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    },
  }, condition);
}

export async function readWebsitePublicationReceipt(requestId: string) {
  const result = await query('SELECT receipt_json FROM me_manager_publication_receipts WHERE request_id = $1', [requestId]);
  return result.rows[0]?.receipt_json ? JSON.parse(result.rows[0].receipt_json) : null;
}

export async function executeDueWebsitePublication(postId: string, now: Date): Promise<{ managed: boolean; newlyApplied: boolean; receipt?: CmsPublicationReceipt; reason?: string }> {
  const rows = await query(`SELECT request_hash, receipt_json FROM me_manager_publication_receipts
    WHERE receipt_json IS NOT NULL AND receipt_json::jsonb->>'postId' = $1
      AND receipt_json::jsonb->>'action' = 'schedule' AND receipt_json::jsonb->>'outcome' = 'confirmed'
    ORDER BY created_at DESC, request_id DESC LIMIT 1`, [postId]);
  const row = rows.rows[0];
  if (!row) return { managed: false, newlyApplied: false };
  const stored = JSON.parse(row.receipt_json);
  if (stored?.protocol === 'website-native-schedule-v1') {
    const approval = readNativeScheduleApproval(stored, row.request_hash);
    const current = await query(`SELECT ${projection} FROM posts WHERE id = $1`, [postId]);
    return nativeScheduleMatches(approval, current.rows[0] ? serialize(current.rows[0]) : null) && Date.parse(approval.scheduledFor) <= now.getTime()
      ? { managed: false, newlyApplied: false }
      : { managed: true, newlyApplied: false, reason: 'NATIVE_APPROVED_SCHEDULE_CHANGED_OR_NOT_DUE' };
  }
  const approval = confirmedCmsSchedule(stored, row.request_hash);
  const request = dueCmsPublicationRequest(approval, now);
  if (!request) return { managed: true, newlyApplied: false, reason: 'APPROVED_SCHEDULE_NOT_DUE' };
  return { managed: true, ...await executeWebsitePublication(request, { scheduledFor: approval.scheduledFor! }) };
}
/** Called only inside the authenticated native editor's write transaction. */
export async function recordNativeWebsiteSchedule(client: PoolClient, postId: string) {
  const result = await client.query(`SELECT ${projection} FROM posts WHERE id = $1 FOR UPDATE`, [postId]);
  if (!result.rows[0]) throw new Error('Native scheduled post not found');
  const approval = makeNativeScheduleApproval(serialize(result.rows[0]));
  await client.query(`INSERT INTO me_manager_publication_receipts(request_id,request_hash,receipt_json,created_at)
    VALUES ($1,$2,$3,GREATEST(clock_timestamp(),COALESCE((SELECT max(created_at)+interval '1 millisecond'
      FROM me_manager_publication_receipts WHERE receipt_json IS NOT NULL
        AND receipt_json::jsonb->>'postId'=$4 AND receipt_json::jsonb->>'action'='schedule'
        AND receipt_json::jsonb->>'outcome'='confirmed'),clock_timestamp())))`, [approval.requestId, approval.requestHash, JSON.stringify(approval), postId]);
  return approval;
}

export async function scheduleNativeWebsitePost(postId: string, scheduledFor: string) {
  const at = new Date(scheduledFor);
  if (!Number.isFinite(at.getTime()) || at.toISOString() !== scheduledFor || at.getTime() <= Date.now()) throw new Error('Provide a valid future native scheduling time');
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL TIME ZONE 'UTC'");
    await client.query("SET LOCAL statement_timeout='10000ms'");
    const changed = await client.query(`UPDATE posts SET status='scheduled',published=false,published_at=NULL,
      scheduled_publish_at=($2::timestamptz AT TIME ZONE 'UTC'),
      updated_at=GREATEST(timezone('UTC',clock_timestamp()),updated_at+interval '1 millisecond')
      WHERE id=$1 AND status='draft' AND published=false RETURNING id`, [postId, scheduledFor]);
    if (changed.rowCount !== 1) throw new Error('Native scheduling requires a current unpublished draft');
    const approval = await recordNativeWebsiteSchedule(client, postId);
    await client.query('COMMIT');
    return approval;
  } catch(error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export async function recordNativeWebsitePublication(client:Awaited<ReturnType<typeof getClient>>,postId:string,source:'native-admin'|'native-scheduler'='native-admin'){
  const current=await client.query(`SELECT ${projection},permission_level FROM posts WHERE id=$1 FOR UPDATE`,[postId]);
  if(!current.rows[0])throw new Error('Native publication disappeared before its receipt');
  if(current.rows[0].permission_level!=='all')return null;
  const post=serialize(current.rows[0]);if(!post.published||post.status!=='published')return null;
  const receipt=nativePublicationReceipt(nativePublicationSite(),post,source);
  await client.query('INSERT INTO me_manager_publication_receipts(request_id,request_hash,receipt_json) VALUES($1,$2,$3) ON CONFLICT(request_id) DO NOTHING',[receipt.requestId,receipt.requestHash,JSON.stringify(receipt)]);
  const prior=await client.query('SELECT request_hash FROM me_manager_publication_receipts WHERE request_id=$1',[receipt.requestId]);
  if(prior.rows[0]?.request_hash!==receipt.requestHash)throw new Error('Native publication receipt identity conflict');
  for(const effect of makeCmsPostCommitEffects(receipt,false))await client.query('INSERT INTO me_manager_publication_effects(id,request_id,site,post_id,kind,payload_hash,payload_json) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING',[effect.id,effect.requestId,effect.site,effect.postId,effect.kind,effect.payloadHash,effect.payloadJson]);
  return receipt;
}
