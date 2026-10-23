import { formatLiters } from './format';
import { expressionFor } from './progress';
import type { SurfaceState, TodayState } from './types';

/**
 * Props for the Live Activity (data-model §6). Everything is computed here, in the domain, so the
 * isolated widget runtime only renders — no business rule is duplicated there (Constitution I).
 */
export function toSurfaceState(today: TodayState, nextReminderAt: number | null): SurfaceState {
  const { consumedMl, goalMl } = today;
  const celebrating = consumedMl >= goalMl;
  return {
    consumedMl,
    goalMl,
    progress: goalMl > 0 ? consumedMl / goalMl : 0,
    expression: expressionFor(consumedMl, goalMl),
    nextReminderAt: celebrating ? null : nextReminderAt,
    celebrating,
    consumedLabel: formatLiters(consumedMl),
    goalLabel: formatLiters(goalMl),
  };
}
