/**
 * @jest-environment node
 */
import { toDateTimeLocalValue, fromDateTimeLocalValue } from '@/lib/datetime-local';

describe('datetime-local conversion (W31)', () => {
  it('treats the form value as local time and returns UTC', () => {
    const local = '2026-12-01T09:00';
    const iso = fromDateTimeLocalValue(local)!;
    expect(new Date(iso).getTime()).toBe(new Date(2026, 11, 1, 9, 0).getTime());
    expect(iso.endsWith('Z')).toBe(true);
  });

  it('round-trips form -> stored -> form without shifting', () => {
    for (const v of ['2026-12-01T09:00', '2026-07-04T23:30', '2027-03-14T02:30']) {
      const back = toDateTimeLocalValue(fromDateTimeLocalValue(v));
      // 2027-03-14T02:30 does not exist in zones that spring forward that night; skip it there
      if (new Date(v).getHours() !== Number(v.slice(11, 13))) continue;
      expect(back).toBe(v);
    }
  });

  it('handles empty and invalid input', () => {
    expect(fromDateTimeLocalValue('')).toBeNull();
    expect(fromDateTimeLocalValue('nope')).toBeNull();
    expect(toDateTimeLocalValue(null)).toBe('');
    expect(toDateTimeLocalValue('nope')).toBe('');
  });
});
