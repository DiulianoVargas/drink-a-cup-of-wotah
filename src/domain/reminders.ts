import { GLASS_ML, MIN_REMINDER_INTERVAL_MIN, MINUTES_PER_DAY } from './constants';
import type { Profile } from './types';

type Routine = Pick<Profile, 'wakeMinutes' | 'sleepMinutes' | 'dailyGoalMl'>;

export const awakeMinutes = ({
  wakeMinutes,
  sleepMinutes,
}: Pick<Profile, 'wakeMinutes' | 'sleepMinutes'>) =>
  (sleepMinutes - wakeMinutes + MINUTES_PER_DAY) % MINUTES_PER_DAY;

/** Whole-day estimate for the schedule hint: awake time ÷ glasses, at least 30 min (FR-014). */
export function estimateIntervalMinutes(routine: Routine): number {
  const glasses = Math.max(1, routine.dailyGoalMl / GLASS_ML);
  return Math.max(MIN_REMINDER_INTERVAL_MIN, Math.floor(awakeMinutes(routine) / glasses));
}
