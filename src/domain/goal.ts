import {
  GLASS_ML,
  MAX_GOAL_ML,
  MAX_WEIGHT_KG,
  MIN_GOAL_ML,
  MIN_WEIGHT_KG,
  ML_PER_KG,
} from './constants';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** FR-009: weight × 35 ml, rounded to the nearest 250 ml, limited to 0.5–6 L. */
export function suggestGoalMl(weightKg: number): number {
  const rounded = Math.round((weightKg * ML_PER_KG) / GLASS_ML) * GLASS_ML;
  return clamp(rounded, MIN_GOAL_ML, MAX_GOAL_ML);
}

/** FR-010: one glass up or down, within 0.5–6 L. */
export function stepGoalMl(currentMl: number, dir: 1 | -1): number {
  return clamp(currentMl + dir * GLASS_ML, MIN_GOAL_ML, MAX_GOAL_ML);
}

export function clampWeight(weightKg: number): number {
  return clamp(Math.round(weightKg), MIN_WEIGHT_KG, MAX_WEIGHT_KG);
}
