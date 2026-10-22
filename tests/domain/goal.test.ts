import { clampWeight, stepGoalMl, suggestGoalMl } from '@/domain/goal';

describe('suggestGoalMl (FR-009, AS-2.1)', () => {
  it.each([
    [70, 2500], // 2,450 → nearest 250
    [30, 1000], // 1,050 → 1,000
    [60, 2000], // 2,100 → 2,000
    [64, 2250], // 2,240 → 2,250
    [100, 3500],
    [171, 6000], // 5,985 → 6,000
    [250, 6000], // 8,750 → clamped
  ])('%i kg → %i ml', (kg, expected) => {
    expect(suggestGoalMl(kg)).toBe(expected);
  });
});

describe('stepGoalMl (FR-010)', () => {
  it.each([
    [2000, 1, 2250],
    [2000, -1, 1750],
    [500, -1, 500],
    [6000, 1, 6000],
  ] as const)('%i ml step %i → %i ml', (current, dir, expected) => {
    expect(stepGoalMl(current, dir)).toBe(expected);
  });
});

describe('clampWeight (edge case "Weight out of range")', () => {
  it.each([
    [29, 30],
    [70, 70],
    [251, 250],
  ])('%i → %i', (kg, expected) => {
    expect(clampWeight(kg)).toBe(expected);
  });
});
