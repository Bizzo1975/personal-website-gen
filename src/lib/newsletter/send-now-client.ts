/** Browser helper: ask the server to send a saved campaign now and describe the real result. */
export async function sendCampaignNow(campaignId: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`/api/admin/newsletter/campaigns/${campaignId}/send`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    const o = data?.outcome;
    if (res.ok && o) return { ok: true, message: `Sent to ${o.sent} of ${o.recipients} confirmed subscribers.` };
    if (o && o.status === 'failed') {
      return { ok: false, message: `Sent ${o.sent}, failed ${o.failed} of ${o.recipients}. Last error: ${o.error || 'unknown'}` };
    }
    return { ok: false, message: o?.error || data?.error || `Not sent (HTTP ${res.status})` };
  } catch (e) {
    return { ok: false, message: `Not sent: ${e instanceof Error ? e.message : String(e)}` };
  }
}
