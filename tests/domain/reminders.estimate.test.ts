import { estimateIntervalMinutes } from '@/domain/reminders';
import { hm } from '../helpers/time';

describe('estimateIntervalMinutes (schedule hint, FR-014)', () => {
  it.each([
    [hm(8), hm(22), 2000, 105], // 14 h ÷ 8 glasses = 1h45
    [hm(7, 30), hm(22), 2500, 87], // 14.5 h ÷ 10 = 87 min
    [hm(10), hm(1), 2000, 112], // crosses midnight: 15 h ÷ 8
    [hm(8), hm(10), 2000, 30], // 2 h ÷ 8 = 15 min → 30-minute floor
  ])('wake %i, sleep %i, goal %i ml → %i min', (wake, sleep, goal, expected) => {
    expect(
      estimateIntervalMinutes({ wakeMinutes: wake, sleepMinutes: sleep, dailyGoalMl: goal }),
    ).toBe(expected);
  });
});
