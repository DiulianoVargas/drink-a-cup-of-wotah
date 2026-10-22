import { GLASS_ML, MAX_GOAL_ML, MAX_WEIGHT_KG, MIN_GOAL_ML, MIN_WEIGHT_KG } from './constants';
import type { Profile } from './types';

/** Rules from data-model.md §1; returns the violated rules (empty when valid). */
export function profileErrors(p: Profile): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(p.weightKg) || p.weightKg < MIN_WEIGHT_KG || p.weightKg > MAX_WEIGHT_KG) {
    errors.push('weightKg');
  }
  if (
    p.dailyGoalMl < MIN_GOAL_ML ||
    p.dailyGoalMl > MAX_GOAL_ML ||
    p.dailyGoalMl % GLASS_ML !== 0
  ) {
    errors.push('dailyGoalMl');
  }
  for (const key of ['wakeMinutes', 'sleepMinutes'] as const) {
    if (!Number.isInteger(p[key]) || p[key] < 0 || p[key] > 1439) errors.push(key);
  }
  if (p.wakeMinutes === p.sleepMinutes) errors.push('sleepMinutes');
  return errors;
}

export function assertValidProfile(p: Profile): void {
  const errors = profileErrors(p);
  if (errors.length) throw new RangeError(`Invalid profile: ${errors.join(', ')}`);
}
