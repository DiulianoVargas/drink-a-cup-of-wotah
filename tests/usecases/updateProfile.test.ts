import { createApp } from '@/usecases/app';
import { at } from '../helpers/time';
import { createTestDeps, PROFILE } from '../helpers/fakes';

describe('updateProfile (FR-011, AS-2.5)', () => {
  it('applies immediately and preserves the day total', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const app = createApp(deps, []);
    await app.registerSip('button');
    await app.registerSip('button');
    await app.updateProfile({ wakeMinutes: 7 * 60, weightKg: 72 });
    expect(deps.profiles.get()).toMatchObject({ wakeMinutes: 420, weightKg: 72 });
    expect(deps.sink.last.today.consumedMl).toBe(500);
  });

  it("changing the goal updates today's recorded goal (FR-028)", async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const app = createApp(deps, []);
    await app.registerSip('button');
    await app.updateProfile({ dailyGoalMl: 2500 });
    expect(deps.sips.goalFor('2026-10-22')).toBe(2500);
    expect(deps.sink.last.today.goalMl).toBe(2500);
  });

  it('turning reminders off cancels all reminders', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const app = createApp(deps, []);
    await app.updateProfile({ remindersEnabled: false });
    expect(deps.scheduler.cancelCalls).toBe(1);
    expect(deps.profiles.get()?.remindersEnabled).toBe(false);
  });

  it('lowering the goal to the amount already drunk celebrates (edge case "Goal changed mid-day")', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const app = createApp(deps, []);
    for (let i = 0; i < 6; i++) await app.registerSip('button'); // 1,5 L of 2 L
    expect(deps.sink.celebrations).toBe(0);
    await app.updateProfile({ dailyGoalMl: 1500 });
    expect(deps.sink.celebrations).toBe(1);
    expect(deps.sink.last.today).toMatchObject({ consumedMl: 1500, goalMl: 1500 });
  });

  it('rejects out-of-range values instead of saving them', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const app = createApp(deps, []);
    await expect(app.updateProfile({ dailyGoalMl: 2600 })).rejects.toThrow();
    expect(deps.profiles.get()).toEqual(PROFILE);
  });
});

describe('celebration (FR-018)', () => {
  it('is requested once when a sip crosses the goal', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const app = createApp(deps, []);
    for (let i = 0; i < 8; i++) await app.registerSip('button');
    expect(deps.sink.celebrations).toBe(1);
    await app.registerSip('button'); // above the goal: no new celebration
    expect(deps.sink.celebrations).toBe(1);
  });
});
