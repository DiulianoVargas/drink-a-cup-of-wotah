import { addDays, lastNDayKeys } from './day';
import type { DayKey, DayStatus, DaySummary } from './types';

/** FR-028: each day against the goal in force that day. */
export function classifyDay(consumedMl: number, goalMl: number): DayStatus {
  if (consumedMl <= 0) return 'empty';
  return consumedMl >= goalMl ? 'full' : 'partial';
}

const met = (d: DaySummary) => d.consumedMl >= d.goalMl;

/**
 * FR-029: consecutive days with the goal met, ending today (if already met) or yesterday.
 * A day without any record breaks the streak.
 */
export function computeStreak(days: DaySummary[], todayKey: DayKey): number {
  const byKey = new Map(days.map((d) => [d.dayKey, d]));
  const today = byKey.get(todayKey);
  let key = today && met(today) ? todayKey : addDays(todayKey, -1);
  let streak = 0;
  for (let d = byKey.get(key); d && met(d); d = byKey.get(key)) {
    streak++;
    key = addDays(key, -1);
  }
  return streak;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function weekdayLabel(dayKey: DayKey, todayKey: DayKey): string {
  if (dayKey === todayKey) return 'hoje';
  const [y, m, d] = dayKey.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

export type WeekDay = { dayKey: DayKey; status: DayStatus; label: string };

/** The Home strip: last 7 days, oldest first; days without records are empty. */
export function weekView(days: DaySummary[], todayKey: DayKey, fallbackGoalMl: number): WeekDay[] {
  const byKey = new Map(days.map((d) => [d.dayKey, d]));
  return lastNDayKeys(todayKey, 7).map((dayKey) => {
    const d = byKey.get(dayKey);
    return {
      dayKey,
      status: classifyDay(d?.consumedMl ?? 0, d?.goalMl ?? fallbackGoalMl),
      label: weekdayLabel(dayKey, todayKey),
    };
  });
}
