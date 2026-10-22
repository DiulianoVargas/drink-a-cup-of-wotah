import { expressionFor, waterLevel } from '@/domain/progress';

describe('expressionFor (FR-006, AS-1.5)', () => {
  it.each([
    [0, 2000, 'thirsty'],
    [250, 2000, 'thirsty'],
    [499, 2000, 'thirsty'],
    [500, 2000, 'excited'],
    [1000, 2000, 'excited'],
    [1750, 2000, 'excited'],
    [2000, 2000, 'radiant'],
    [2250, 2000, 'celebrating'],
    [6000, 2000, 'celebrating'],
  ] as const)('%i / %i ml → %s', (consumed, goal, expected) => {
    expect(expressionFor(consumed, goal)).toBe(expected);
  });
});

describe('waterLevel (FR-005)', () => {
  it.each([
    [0, 2000, 0],
    [500, 2000, 0.25],
    [1250, 2000, 0.625],
    [2000, 2000, 1],
    [2500, 2000, 1],
  ])('%i / %i ml → %f (capped at full)', (consumed, goal, expected) => {
    expect(waterLevel(consumed, goal)).toBeCloseTo(expected);
  });
});
