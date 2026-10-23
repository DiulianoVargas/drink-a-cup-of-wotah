import { createApp } from '@/usecases/app';
import { createReminderEffect } from '@/usecases/effects/reminders';
import { at } from '../helpers/time';
import { createTestDeps } from '../helpers/fakes';

const setup = async (now: Date) => {
  const deps = await createTestDeps({ now });
  const app = createApp(deps, [createReminderEffect(deps.scheduler)]);
  return { deps, app };
};
const today = (deps: Awaited<ReturnType<typeof setup>>['deps'], dayKey = '2026-10-22') =>
  deps.scheduler.scheduled.filter((r) => r.dayKey === dayKey);

describe('reminder effect (FR-015, FR-018, FR-019)', () => {
  it('every sip replaces the chain, rescheduling from the sip time (FR-015)', async () => {
    const { deps, app } = await setup(at('2026-10-22', '10:00'));
    await app.reconcile();
    const before = today(deps)[0].fireAt;
    deps.clock.advanceMinutes(20);
    await app.registerSip('button'); // 10:20 → next at 11:20 (1 h cap)
    const after = today(deps)[0].fireAt;
    expect(after).not.toBe(before);
    expect(new Date(after).getHours()).toBe(11);
    expect(new Date(after).getMinutes()).toBe(20);
    expect(deps.sink.last.nextReminderAt).toBe(after);
  });

  it('crossing the goal leaves only the next-day chain (FR-018, SC-003)', async () => {
    const { deps, app } = await setup(at('2026-10-22', '10:00'));
    for (let i = 0; i < 8; i++) await app.registerSip('notification_action');
    expect(today(deps)).toEqual([]);
    expect(today(deps, '2026-10-23').length).toBeGreaterThan(0);
  });

  it('an undo back below the goal reschedules today (FR-019)', async () => {
    const { deps, app } = await setup(at('2026-10-22', '10:00'));
    for (let i = 0; i < 8; i++) await app.registerSip('button');
    await app.undoLastSip();
    await app.undoLastSip();
    expect(today(deps).length).toBeGreaterThan(0);
  });

  it('lowering the goal to the amount drunk stops today (edge case "Goal changed mid-day")', async () => {
    const { deps, app } = await setup(at('2026-10-22', '10:00'));
    for (let i = 0; i < 6; i++) await app.registerSip('button');
    await app.updateProfile({ dailyGoalMl: 1500 });
    expect(today(deps)).toEqual([]);
  });

  it('without permission nothing is scheduled and there is no next reminder', async () => {
    const { deps, app } = await setup(at('2026-10-22', '10:00'));
    deps.scheduler.status = 'denied';
    await app.reconcile();
    expect(deps.scheduler.scheduled).toEqual([]);
    expect(deps.sink.last.nextReminderAt).toBeNull();
  });

  it('reminders turned off → cancelled, no next reminder', async () => {
    const { deps, app } = await setup(at('2026-10-22', '10:00'));
    await app.reconcile();
    await app.updateProfile({ remindersEnabled: false });
    expect(deps.scheduler.scheduled).toEqual([]);
    expect(deps.sink.last.nextReminderAt).toBeNull();
  });
});
