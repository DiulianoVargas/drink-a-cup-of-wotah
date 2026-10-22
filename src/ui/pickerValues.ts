import { MAX_WEIGHT_KG, MIN_WEIGHT_KG } from '@/domain/constants';

/** 30–250 kg (FR edge case "Weight out of range"). */
export const WEIGHTS = Array.from(
  { length: MAX_WEIGHT_KG - MIN_WEIGHT_KG + 1 },
  (_, i) => MIN_WEIGHT_KG + i,
);

/** Every 30 minutes of the day (design: "Rodinhas de 30 em 30 min"). */
export const HALF_HOURS = Array.from({ length: 48 }, (_, i) => i * 30);
