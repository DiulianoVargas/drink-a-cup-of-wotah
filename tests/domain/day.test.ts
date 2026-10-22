import { dayKeyFor, lastNDayKeys, nextWindow, windowFor } from '@/domain/day';
import { at, hm } from '../helpers/time';

describe('dayKeyFor (FR-030, day rollover)', () => {
  it.each([
    ['2026-10-22', '07:59', hm(8), '2026-10-21'],
    ['2026-10-22', '08:00', hm(8), '2026-10-22'],
    ['2026-10-22', '23:59', hm(8), '2026-10-22'],
    ['2026-10-23', '00:30', hm(10), '2026-10-22'],
    ['2026-01-01', '03:00', hm(8), '2025-12-31'],
  ])('%s %s with wake %i → %s', (day, time, wake, expected) => {
    expect(dayKeyFor(at(day, time), wake)).toBe(expected);
  });
});

describe('windowFor', () => {
  it('8:00–22:00 lasts 14 h', () => {
    const w = windowFor('2026-10-22', hm(8), hm(22));
    expect(w.start).toEqual(at('2026-10-22', '08:00'));
    expect(w.end).toEqual(at('2026-10-22', '22:00'));
    expect((w.end.getTime() - w.start.getTime()) / 3_600_000).toBe(14);
  });

  it('crosses midnight (wake 10:00, sleep 1:00) and a 00:30 sip belongs to the previous day', () => {
    const w = windowFor('2026-10-22', hm(10), hm(1));
    expect(w.start).toEqual(at('2026-10-22', '10:00'));
    expect(w.end).toEqual(at('2026-10-23', '01:00'));
    expect(dayKeyFor(at('2026-10-23', '00:30'), hm(10))).toBe('2026-10-22');
  });
});

describe('nextWindow', () => {
  it('starts at the next wake time', () => {
    const n = nextWindow('2026-10-22', hm(8), hm(22));
    expect(n.dayKey).toBe('2026-10-23');
    expect(n.start).toEqual(at('2026-10-23', '08:00'));
    expect(n.end).toEqual(at('2026-10-23', '22:00'));
  });
});

describe('lastNDayKeys', () => {
  it('returns n keys, oldest first, ending with today (crossing a month)', () => {
    expect(lastNDayKeys('2026-11-02', 7)).toEqual([
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
  });
});

describe('time zones and clock changes (edge case "Time zone or clock change")', () => {
  // The suite runs with TZ=America/Sao_Paulo (jest.config.js); DST cases live in tests/tz/.
  it('uses the device local time (America/Sao_Paulo, UTC-3)', () => {
    expect(dayKeyFor(new Date('2026-10-22T10:30:00Z'), hm(8))).toBe('2026-10-21'); // 07:30 local
    expect(dayKeyFor(new Date('2026-10-22T10:30:00Z'), hm(7))).toBe('2026-10-22');
    expect(dayKeyFor(new Date('2026-10-22T11:00:00Z'), hm(8))).toBe('2026-10-22'); // 08:00 local
  });

  it('a clock change across wake time moves the logical day', () => {
    const before = at('2026-10-22', '07:50');
    const after = at('2026-10-22', '08:10');
    expect(dayKeyFor(before, hm(8))).toBe('2026-10-21');
    expect(dayKeyFor(after, hm(8))).toBe('2026-10-22');
  });
});
