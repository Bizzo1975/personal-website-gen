/**
 * @jest-environment node
 */
import { checkCampaignStatusChange } from '@/lib/newsletter/campaign-status';

describe('checkCampaignStatusChange (W18: no fake "sent")', () => {
  it('refuses to mark a draft as sent directly', () => {
    const r = checkCampaignStatusChange('draft', 'sent', null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.httpStatus).toBe(400);
  });

  it('refuses sending/failed as direct targets', () => {
    expect(checkCampaignStatusChange('draft', 'sending', null).ok).toBe(false);
    expect(checkCampaignStatusChange('draft', 'failed', null).ok).toBe(false);
  });

  it('refuses any edit of a sent or sending campaign', () => {
    const a = checkCampaignStatusChange('sent', 'draft', null);
    const b = checkCampaignStatusChange('sending', undefined, null);
    expect(a.ok).toBe(false);
    expect(b.ok).toBe(false);
    if (!a.ok) expect(a.httpStatus).toBe(409);
  });

  it('requires a valid date to schedule', () => {
    expect(checkCampaignStatusChange('draft', 'scheduled', null).ok).toBe(false);
    expect(checkCampaignStatusChange('draft', 'scheduled', 'not-a-date').ok).toBe(false);
    expect(checkCampaignStatusChange('draft', 'scheduled', '2026-12-01T15:00:00Z')).toEqual({ ok: true, status: 'scheduled' });
  });

  it('keeps the current status when none is requested', () => {
    expect(checkCampaignStatusChange('failed', undefined, null)).toEqual({ ok: true, status: 'failed' });
    expect(checkCampaignStatusChange('draft', '', null)).toEqual({ ok: true, status: 'draft' });
  });

  it('allows draft, scheduled and cancelled transitions', () => {
    expect(checkCampaignStatusChange('scheduled', 'draft', null)).toEqual({ ok: true, status: 'draft' });
    expect(checkCampaignStatusChange('draft', 'cancelled', null)).toEqual({ ok: true, status: 'cancelled' });
  });
});
