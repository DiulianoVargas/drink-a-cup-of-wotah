import { classifyDay, computeStreak, weekdayLabel, weekView } from '@/domain/history';
import type { DaySummary } from '@/domain/types';

const d = (dayKey: string, consumedMl: number, goalMl = 2000): DaySummary => ({
  dayKey,
  consumedMl,
  goalMl,
});

describe('classifyDay (FR-028, AS-5.1)', () => {
  it.each([
    [0, 2000, 'empty'],
    [250, 2000, 'partial'],
    [1999, 2000, 'partial'],
    [2000, 2000, 'full'],
    [2500, 2000, 'full'],
  ] as const)('%i / %i → %s', (consumed, goal, expected) => {
    expect(classifyDay(consumed, goal)).toBe(expected);
  });
});

describe('computeStreak (FR-029)', () => {
  it('AS-5.2: met yesterday and the day before, not today yet → 2', () => {
    const days = [
      d('2026-10-19', 500),
      d('2026-10-20', 2000),
      d('2026-10-21', 2250),
      d('2026-10-22', 750),
    ];
    expect(computeStreak(days, '2026-10-22')).toBe(2);
  });

  it('AS-5.3: meeting today extends it → 3', () => {
    const days = [d('2026-10-20', 2000), d('2026-10-21', 2000), d('2026-10-22', 2000)];
    expect(computeStreak(days, '2026-10-22')).toBe(3);
  });

  it('AS-5.4: a missed day resets to 0', () => {
    const days = [d('2026-10-20', 2000), d('2026-10-21', 1000)];
    expect(computeStreak(days, '2026-10-22')).toBe(0);
  });

  it('a day without any record breaks the streak', () => {
    const days = [d('2026-10-18', 2000), d('2026-10-19', 2000), d('2026-10-21', 2000)];
    expect(computeStreak(days, '2026-10-22')).toBe(1);
  });

  it("compares each day with that day's own goal", () => {
    const days = [d('2026-10-20', 1500, 1500), d('2026-10-21', 2000, 2500)];
    expect(computeStreak(days, '2026-10-22')).toBe(0);
    expect(
      computeStreak([d('2026-10-20', 1500, 1500), d('2026-10-21', 2500, 2500)], '2026-10-22'),
    ).toBe(2);
  });

  it('counts long streaks beyond the visible week', () => {
    const days = Array.from({ length: 12 }, (_, i) =>
      d(`2026-10-${String(10 + i).padStart(2, '0')}`, 2000),
    );
    expect(computeStreak(days, '2026-10-22')).toBe(12);
  });
});

describe('weekView (Home strip)', () => {
  it('returns the last 7 days, oldest first, filling gaps as empty with the fallback goal', () => {
    const view = weekView([d('2026-10-20', 2000), d('2026-10-22', 500)], '2026-10-22', 2000);
    expect(view.map((v) => [v.dayKey, v.status, v.label])).toEqual([
      ['2026-10-16', 'empty', 'sex'],
      ['2026-10-17', 'empty', 'sáb'],
      ['2026-10-18', 'empty', 'dom'],
      ['2026-10-19', 'empty', 'seg'],
      ['2026-10-20', 'full', 'ter'],
      ['2026-10-21', 'empty', 'qua'],
      ['2026-10-22', 'partial', 'hoje'],
    ]);
  });
});

describe('weekdayLabel', () => {
  it.each([
    ['2026-10-22', '2026-10-22', 'hoje'],
    ['2026-10-18', '2026-10-22', 'dom'],
    ['2026-10-17', '2026-10-22', 'sáb'],
  ])('%s (today %s) → %s', (key, today, expected) => {
    expect(weekdayLabel(key, today)).toBe(expected);
  });
});
