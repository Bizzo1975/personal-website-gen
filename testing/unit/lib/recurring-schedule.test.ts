/**
 * @jest-environment node
 */
import { nextRun, zonedToUtc, isValidTimeZone, validDay } from '@/lib/recurring/schedule';

const CHI = 'America/Chicago';
const iso = (d: Date) => d.toISOString();

describe('recurring schedule (W26)', () => {
  it('weekly 09:00 Chicago is 15:00 UTC in winter (CST), not 09:00 UTC', () => {
    // Friday 2026-11-20 10:00 Chicago -> next Monday
    expect(iso(nextRun('weekly', 1, '09:00', CHI, new Date('2026-11-20T16:00:00Z')))).toBe('2026-11-23T15:00:00.000Z');
  });

  it('runs later the same day when the time has not passed yet', () => {
    expect(iso(nextRun('weekly', 1, '09:00', CHI, new Date('2026-11-23T14:00:00Z')))).toBe('2026-11-23T15:00:00.000Z');
  });

  it('moves a week on once the time has passed', () => {
    expect(iso(nextRun('weekly', 1, '09:00', CHI, new Date('2026-11-23T15:00:00Z')))).toBe('2026-11-30T15:00:00.000Z');
  });

  it('Sunday (0) is a valid day', () => {
    expect(validDay('weekly', 0)).toBe(true);
    expect(iso(nextRun('weekly', 0, '09:00', CHI, new Date('2026-11-20T16:00:00Z')))).toBe('2026-11-22T15:00:00.000Z');
  });

  it('day 31 in February runs on the last day, not in March', () => {
    expect(iso(nextRun('monthly', 31, '09:00', CHI, new Date('2027-02-01T12:00:00Z')))).toBe('2027-02-28T15:00:00.000Z');
  });

  it('follows daylight saving: 09:00 Chicago is 14:00 UTC after the spring change', () => {
    expect(iso(nextRun('weekly', 0, '09:00', CHI, new Date('2027-03-13T12:00:00Z')))).toBe('2027-03-14T14:00:00.000Z');
  });

  it('converts a wall time in a zone to UTC', () => {
    expect(iso(zonedToUtc(2026, 7, 4, 9, 30, CHI))).toBe('2026-07-04T14:30:00.000Z');
    expect(iso(zonedToUtc(2026, 7, 4, 9, 30, 'UTC'))).toBe('2026-07-04T09:30:00.000Z');
  });

  it('rejects invalid settings', () => {
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
    expect(validDay('monthly', 0)).toBe(false);
    expect(() => nextRun('weekly', 1, '25:00', CHI, new Date())).toThrow();
    expect(() => nextRun('weekly', 1, '09:00', 'Nowhere/Zone', new Date())).toThrow();
  });
});
