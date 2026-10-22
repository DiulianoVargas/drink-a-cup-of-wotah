import { planReminders } from '@/domain/reminders';
import type { Profile } from '@/domain/types';
import { at, hm } from '../helpers/time';

const profile: Profile = {
  weightKg: 60,
  dailyGoalMl: 2000,
  wakeMinutes: hm(8),
  sleepMinutes: hm(22),
  remindersEnabled: true,
  onboardingCompleted: true,
};

const times = (rs: { fireAt: number }[]) =>
  rs.map((r) => {
    const d = new Date(r.fireAt);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
const forDay = <T extends { dayKey: string }>(rs: T[], dayKey: string) =>
  rs.filter((r) => r.dayKey === dayKey);

describe('planReminders (FR-013–FR-019, data-model §4)', () => {
  it('AS-3.1: 2 L, 8h–22h, 0 ml at 08:00 → 8 reminders every 1h45, the last at bedtime (not after it)', () => {
    const plan = planReminders({ profile, consumedMl: 0, now: at('2026-10-22', '08:00') });
    expect(times(forDay(plan, '2026-10-22'))).toEqual([
      '09:45',
      '11:30',
      '13:15',
      '15:00',
      '16:45',
      '18:30',
      '20:15',
      '22:00',
    ]);
  });

  it('AS-3.4: a sip at 10:00 reschedules from the sip with the recomputed interval', () => {
    // 1 glass drunk → 7 left; (22:00 − 10:00) ÷ 7 = 102.86 min → first at ~11:42
    const plan = forDay(
      planReminders({ profile, consumedMl: 250, now: at('2026-10-22', '10:00') }),
      '2026-10-22',
    );
    expect(times(plan)[0]).toBe('11:42');
    expect(plan).toHaveLength(7);
    expect(times(plan)[6]).toBe('22:00');
  });

  it('AS-3.5 / SC-003: goal met → no reminders today, only the next day', () => {
    const plan = planReminders({ profile, consumedMl: 2000, now: at('2026-10-22', '15:00') });
    expect(forDay(plan, '2026-10-22')).toEqual([]);
    expect(forDay(plan, '2026-10-23').length).toBeGreaterThan(0);
  });

  it('above the goal → still none today (edge case "Above the goal")', () => {
    const plan = planReminders({ profile, consumedMl: 2500, now: at('2026-10-22', '15:00') });
    expect(forDay(plan, '2026-10-22')).toEqual([]);
  });

  it('AS-3.6 / SC-004: after bedtime nothing until the next wake time', () => {
    const plan = planReminders({ profile, consumedMl: 500, now: at('2026-10-22', '23:00') });
    expect(forDay(plan, '2026-10-22')).toEqual([]);
    const tomorrow = forDay(plan, '2026-10-23');
    expect(times(tomorrow)[0]).toBe('09:45');
    expect(tomorrow.every((r) => r.fireAt > at('2026-10-23', '08:00').getTime())).toBe(true);
  });

  it('before the wake time, the coming morning is the next window (sleep → wake gap)', () => {
    const plan = planReminders({ profile, consumedMl: 0, now: at('2026-10-23', '06:00') });
    expect(forDay(plan, '2026-10-22')).toEqual([]);
    expect(times(forDay(plan, '2026-10-23'))[0]).toBe('09:45');
  });

  it('AS-3.7 / FR-019: after undoing one sip below the goal, a reminder returns', () => {
    // 1 glass left over 4 h → the single reminder lands at bedtime (allowed: not *after* it).
    const plan = planReminders({ profile, consumedMl: 1750, now: at('2026-10-22', '18:00') });
    const plan2 = planReminders({ profile, consumedMl: 1500, now: at('2026-10-22', '18:00') });
    expect(times(forDay(plan, '2026-10-22'))).toEqual(['22:00']);
    expect(times(forDay(plan2, '2026-10-22'))).toEqual(['20:00', '22:00']);
  });

  it('late start at 15:00 uses the remaining window, not the whole day', () => {
    const plan = forDay(
      planReminders({ profile, consumedMl: 0, now: at('2026-10-22', '15:00') }),
      '2026-10-22',
    );
    // 7 h ÷ 8 glasses = 52.5 min
    expect(times(plan).slice(0, 2)).toEqual(['15:52', '16:45']);
    expect(plan.every((r) => r.fireAt <= at('2026-10-22', '22:00').getTime())).toBe(true);
  });

  it('short window: never closer than 30 minutes, never after bedtime', () => {
    const plan = forDay(
      planReminders({ profile, consumedMl: 0, now: at('2026-10-22', '20:00') }),
      '2026-10-22',
    );
    expect(times(plan)).toEqual(['20:30', '21:00', '21:30', '22:00']);
  });

  it('window crossing midnight (wake 10:00, sleep 01:00) keeps reminders after midnight', () => {
    const night = { ...profile, wakeMinutes: hm(10), sleepMinutes: hm(1) };
    const plan = forDay(
      planReminders({ profile: night, consumedMl: 1500, now: at('2026-10-22', '22:00') }),
      '2026-10-22',
    );
    // 3 h ÷ 2 glasses = 90 min → 23:30 and 01:00 (bedtime, next calendar day)
    expect(times(plan)).toEqual(['23:30', '01:00']);
  });

  it('reminders off → nothing at all', () => {
    const plan = planReminders({
      profile: { ...profile, remindersEnabled: false },
      consumedMl: 0,
      now: at('2026-10-22', '08:00'),
    });
    expect(plan).toEqual([]);
  });

  it('the next window is planned from 0 ml with the profile goal', () => {
    const plan = planReminders({ profile, consumedMl: 1000, now: at('2026-10-22', '12:00') });
    expect(times(forDay(plan, '2026-10-23'))).toEqual([
      '09:45',
      '11:30',
      '13:15',
      '15:00',
      '16:45',
      '18:30',
      '20:15',
      '22:00',
    ]);
  });

  it('nothing is ever scheduled after bedtime (SC-004)', () => {
    for (const time of ['08:00', '12:37', '19:59', '21:59']) {
      const plan = planReminders({ profile, consumedMl: 250, now: at('2026-10-22', time) });
      for (const r of plan) {
        const end = at(r.dayKey, '22:00').getTime();
        expect(r.fireAt).toBeLessThanOrEqual(end);
      }
    }
  });

  it('stays under the iOS pending limit at the 6 L goal (≤ 48)', () => {
    const plan = planReminders({
      profile: { ...profile, dailyGoalMl: 6000, wakeMinutes: hm(6), sleepMinutes: hm(23, 30) },
      consumedMl: 0,
      now: at('2026-10-22', '06:00'),
    });
    expect(plan.length).toBeLessThanOrEqual(48);
  });

  it('every reminder carries a friendly PT-BR text and a stable index', () => {
    const plan = planReminders({ profile, consumedMl: 500, now: at('2026-10-22', '09:00') });
    plan.forEach((r, i) => {
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.body.length).toBeGreaterThan(0);
      expect(r.index).toBe(i);
    });
    expect(plan.map((r) => r.title)).toEqual(
      planReminders({ profile, consumedMl: 500, now: at('2026-10-22', '09:00') }).map(
        (r) => r.title,
      ),
    );
  });
});
