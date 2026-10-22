import { getTodayState } from '@/usecases/getTodayState';
import { at } from '../helpers/time';
import { createTestDeps, PROFILE } from '../helpers/fakes';

describe('getTodayState', () => {
  it('returns null without a profile', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00'), profile: null });
    expect(getTodayState(deps)).toBeNull();
  });

  it('computes dayKey, total (excluding undone sips) and lastSipAt', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const t1 = at('2026-10-22', '09:00').getTime();
    const t2 = at('2026-10-22', '09:30').getTime();
    deps.sips.add({ id: 'a', amountMl: 250, occurredAt: t1, dayKey: '2026-10-22', source: 'button', undoneAt: null }, 2000);
    deps.sips.add({ id: 'b', amountMl: 250, occurredAt: t2, dayKey: '2026-10-22', source: 'button', undoneAt: null }, 2000);
    deps.sips.undoLast('2026-10-22', t2 + 1);
    expect(getTodayState(deps)).toEqual({ dayKey: '2026-10-22', goalMl: 2000, consumedMl: 250, lastSipAt: t1 });
  });

  it('before the wake time it still reports the previous logical day', async () => {
    const deps = await createTestDeps({ now: at('2026-10-23', '07:00') });
    expect(getTodayState(deps)?.dayKey).toBe('2026-10-22');
  });

  it("uses the day's recorded goal, falling back to the profile goal", async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    expect(getTodayState(deps)?.goalMl).toBe(PROFILE.dailyGoalMl);
    deps.sips.setDayGoal('2026-10-22', 2500);
    expect(getTodayState(deps)?.goalMl).toBe(2500);
  });
});
