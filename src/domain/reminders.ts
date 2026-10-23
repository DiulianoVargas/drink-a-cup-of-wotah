import {
  GLASS_ML,
  MAX_REMINDER_INTERVAL_MIN,
  MIN_REMINDER_INTERVAL_MIN,
  MINUTES_PER_DAY,
  MS_PER_MINUTE,
} from './constants';
import { dayKeyFor, nextWindow, windowFor } from './day';
import { pickMessage } from './messages';
import type { DayKey, Profile, Reminder } from './types';

type Routine = Pick<Profile, 'wakeMinutes' | 'sleepMinutes' | 'dailyGoalMl'>;

export const awakeMinutes = ({
  wakeMinutes,
  sleepMinutes,
}: Pick<Profile, 'wakeMinutes' | 'sleepMinutes'>) =>
  (sleepMinutes - wakeMinutes + MINUTES_PER_DAY) % MINUTES_PER_DAY;

const clampInterval = (minutes: number) =>
  Math.min(Math.max(minutes, MIN_REMINDER_INTERVAL_MIN), MAX_REMINDER_INTERVAL_MIN);

/** Whole-day estimate for the schedule hint: awake time ÷ glasses, between 30 min and 1 h (FR-014). */
export function estimateIntervalMinutes(routine: Routine): number {
  const glasses = Math.max(1, routine.dailyGoalMl / GLASS_ML);
  return Math.floor(clampInterval(awakeMinutes(routine) / glasses));
}

const remainingGlasses = (goalMl: number, consumedMl: number) =>
  Math.ceil(Math.max(goalMl - consumedMl, 0) / GLASS_ML);

const daySeed = (dayKey: DayKey) => Number(dayKey.replace(/-/g, ''));

/**
 * One window's chain (data-model §4): interval = time left ÷ glasses left (30 min–1 h), first one
 * an interval after `now` (or after the wake time), none after bedtime (FR-013–FR-015).
 * A reminder exactly at bedtime is allowed, so the last glass is always reminded (FR-019).
 */
function chain(
  dayKey: DayKey,
  window: { start: Date; end: Date },
  goalMl: number,
  consumedMl: number,
  now: Date,
): Omit<Reminder, 'index'>[] {
  const remaining = remainingGlasses(goalMl, consumedMl);
  const anchor = Math.max(now.getTime(), window.start.getTime());
  const end = window.end.getTime();
  if (remaining === 0 || anchor >= end) return [];

  // At most 24 per window: the 1 h cap only applies when a window has more hours than glasses left.
  const interval = clampInterval((end - anchor) / remaining / MS_PER_MINUTE) * MS_PER_MINUTE;
  const out: Omit<Reminder, 'index'>[] = [];
  for (let k = 1; ; k++) {
    const fireAt = Math.round(anchor + k * interval);
    if (fireAt > end) break;
    out.push({
      fireAt,
      dayKey,
      remainingGlasses: remaining,
      ...pickMessage(remaining, consumedMl, daySeed(dayKey) + k),
    });
  }
  return out;
}

/**
 * Every reminder to schedule now: the rest of today plus the whole next window (so the next day
 * is covered even if the app is not opened). Empty when reminders are off.
 */
export function planReminders(input: {
  profile: Profile;
  consumedMl: number;
  /** Today's goal in force (defaults to the profile goal). */
  goalMl?: number;
  now: Date;
}): Reminder[] {
  const { profile, consumedMl, now } = input;
  if (!profile.remindersEnabled) return [];
  const { wakeMinutes, sleepMinutes, dailyGoalMl } = profile;

  const todayKey = dayKeyFor(now, wakeMinutes);
  const next = nextWindow(todayKey, wakeMinutes, sleepMinutes);
  return [
    ...chain(
      todayKey,
      windowFor(todayKey, wakeMinutes, sleepMinutes),
      input.goalMl ?? dailyGoalMl,
      consumedMl,
      now,
    ),
    ...chain(next.dayKey, next, dailyGoalMl, 0, now),
  ].map((r, index) => ({ ...r, index }));
}
