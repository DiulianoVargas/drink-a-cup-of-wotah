import type { MascotExpression } from './types';

/** FR-006: thirsty < 25% ≤ excited < 100% = radiant < celebrating. */
export function expressionFor(consumedMl: number, goalMl: number): MascotExpression {
  if (consumedMl > goalMl) return 'celebrating';
  if (consumedMl === goalMl) return 'radiant';
  return consumedMl * 4 >= goalMl ? 'excited' : 'thirsty';
}

/** FR-005: visual water level 0..1, capped at full. */
export function waterLevel(consumedMl: number, goalMl: number): number {
  if (goalMl <= 0) return 0;
  return Math.min(Math.max(consumedMl / goalMl, 0), 1);
}
