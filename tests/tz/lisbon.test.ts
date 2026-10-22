// Runs with TZ=Europe/Lisbon (jest.lisbon.config.js).
import { dayKeyFor, windowFor } from '@/domain/day';
import { hm } from '../helpers/time';

describe('DST transition day in Europe/Lisbon (2026-03-29, 01:00 → 02:00)', () => {
  it('runs in the expected time zone', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Europe/Lisbon');
  });

  it('keeps the wall-clock bedtime, so the window is 1.5 real hours', () => {
    const w = windowFor('2026-03-29', hm(0, 30), hm(3));
    expect(w.end.getHours()).toBe(3);
    expect(w.end.getMinutes()).toBe(0);
    expect((w.end.getTime() - w.start.getTime()) / 3_600_000).toBe(1.5);
  });

  it('a normal window on the DST day keeps its wall-clock start and end', () => {
    const w = windowFor('2026-03-29', hm(8), hm(22));
    expect([w.start.getHours(), w.end.getHours()]).toEqual([8, 22]);
    expect(dayKeyFor(new Date(2026, 2, 29, 9, 0), hm(8))).toBe('2026-03-29');
  });
});
