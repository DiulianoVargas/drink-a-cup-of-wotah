import type { DayKey } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Minutes since local midnight for `date`. */
export function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function toDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDayKey(dayKey: DayKey): [number, number, number] {
  const [y, m, d] = dayKey.split('-').map(Number);
  return [y, m, d];
}

export function addDays(dayKey: DayKey, days: number): DayKey {
  const [y, m, d] = parseDayKey(dayKey);
  return toDayKey(new Date(y, m - 1, d + days));
}

/** Local wall-clock instant at `minutes` past midnight of `dayKey`. */
export function dateAt(dayKey: DayKey, minutes: number): Date {
  const [y, m, d] = parseDayKey(dayKey);
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, 0, 0);
}

/**
 * The logical day starts at the wake time (FR-030): before it, `now` still belongs to the
 * previous day, so sips between bedtime and wake time count toward the day before.
 */
export function dayKeyFor(now: Date, wakeMinutes: number): DayKey {
  const today = toDayKey(now);
  return minutesOf(now) >= wakeMinutes ? today : addDays(today, -1);
}

/**
 * Awake window of a logical day. The end uses the wall-clock bedtime (on the next calendar day
 * when the window crosses midnight), so DST shifts never push a reminder past bedtime.
 */
export function windowFor(
  dayKey: DayKey,
  wakeMinutes: number,
  sleepMinutes: number,
): { start: Date; end: Date } {
  const endDayKey = sleepMinutes > wakeMinutes ? dayKey : addDays(dayKey, 1);
  return { start: dateAt(dayKey, wakeMinutes), end: dateAt(endDayKey, sleepMinutes) };
}

export function nextWindow(
  dayKey: DayKey,
  wakeMinutes: number,
  sleepMinutes: number,
): { dayKey: DayKey; start: Date; end: Date } {
  const next = addDays(dayKey, 1);
  return { dayKey: next, ...windowFor(next, wakeMinutes, sleepMinutes) };
}

/** The last `n` day keys, oldest first, ending with `todayKey`. */
export function lastNDayKeys(todayKey: DayKey, n: number): DayKey[] {
  return Array.from({ length: n }, (_, i) => addDays(todayKey, i - (n - 1)));
}
