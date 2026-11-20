/**
 * Which campaign status changes an editor may make directly. 'sending', 'sent' and
 * 'failed' are set only by real delivery (lib/newsletter/delivery), so a campaign
 * can never be marked sent without having been sent.
 */
export const EDITABLE_TARGET_STATUSES = ['draft', 'scheduled', 'cancelled'] as const;

export function checkCampaignStatusChange(
  currentStatus: string,
  requestedStatus: unknown,
  scheduledSendAt: unknown
): { ok: true; status: string } | { ok: false; httpStatus: number; error: string } {
  if (currentStatus === 'sent' || currentStatus === 'sending') {
    return { ok: false, httpStatus: 409, error: `A ${currentStatus} campaign cannot be edited` };
  }
  const target = requestedStatus === undefined || requestedStatus === null || requestedStatus === ''
    ? currentStatus
    : String(requestedStatus);
  if (target !== currentStatus && !(EDITABLE_TARGET_STATUSES as readonly string[]).includes(target)) {
    return {
      ok: false,
      httpStatus: 400,
      error: `Status '${target}' cannot be set directly. Use "Send now" or schedule the campaign.`,
    };
  }
  if (target === 'scheduled') {
    const when = scheduledSendAt ? new Date(String(scheduledSendAt)) : null;
    if (!when || Number.isNaN(when.valueOf())) {
      return { ok: false, httpStatus: 400, error: 'A scheduled campaign needs a valid send date and time' };
    }
  }
  return { ok: true, status: target };
}
