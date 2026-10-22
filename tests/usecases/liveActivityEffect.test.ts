import { createApp } from '@/usecases/app';
import { createLiveActivityEffect, LA_DISMISS_AFTER_MS } from '@/usecases/effects/liveActivity';
import { createReminderEffect } from '@/usecases/effects/reminders';
import {
  handleLiveActivityInteraction,
  importPendingInteractions,
} from '@/usecases/liveActivityInteraction';
import { at } from '../helpers/time';
import { createTestDeps } from '../helpers/fakes';

const setup = async (now = at('2026-10-22', '10:00')) => {
  const deps = await createTestDeps({ now });
  const app = createApp(deps, [
    createReminderEffect(deps.scheduler),
    createLiveActivityEffect(deps.liveActivity),
  ]);
  return { deps, app, la: deps.liveActivity };
};

describe('Live Activity effect (US4)', () => {
  it('opening the app with the goal not met starts one activity (FR-021, AS-4.1)', async () => {
    const { app, la } = await setup();
    await app.reconcile();
    await app.reconcile();
    expect(la.started).toBe(1);
    expect(la.running?.state).toMatchObject({ consumedMl: 0, goalMl: 2000, celebrating: false });
  });

  it('every sip updates it, with the next reminder for the countdown (FR-024, AS-4.5)', async () => {
    const { app, la, deps } = await setup();
    await app.reconcile();
    await app.registerSip('button');
    expect(la.running?.state.consumedMl).toBe(250);
    expect(la.running?.state.nextReminderAt).toBe(deps.sink.last.nextReminderAt);
    expect(la.running?.state.nextReminderAt).not.toBeNull();
  });

  it('reaching the goal shows "Bom trabalho! 🎉" and ends after a few minutes (FR-025, AS-4.6)', async () => {
    const { app, la } = await setup();
    await app.reconcile();
    for (let i = 0; i < 8; i++) await app.registerSip('button');
    expect(la.ended).toHaveLength(1);
    expect(la.ended[0]).toMatchObject({ state: { celebrating: true, consumedMl: 2000 } });
    expect(la.ended[0].afterMs).toBe(LA_DISMISS_AFTER_MS);
    expect(la.running).toBeNull();
  });

  it('a day that is already met does not start a new activity', async () => {
    const { app, la } = await setup();
    for (let i = 0; i < 8; i++) await app.registerSip('notification_action');
    la.started = 0;
    await app.reconcile();
    expect(la.started).toBe(0);
  });

  it('an activity left running on a met day (goal reached while closed) is ended on the next run', async () => {
    const { app, la, deps } = await setup();
    await app.reconcile(); // running
    // sips logged while the app was not running (e.g. notification action processed at cold start)
    for (let i = 0; i < 8; i++) {
      deps.sips.add(
        {
          id: `x${i}`,
          amountMl: 250,
          occurredAt: at('2026-10-22', '11:00').getTime() + i,
          dayKey: '2026-10-22',
          source: 'notification_action',
          undoneAt: null,
        },
        2000,
      );
    }
    const fresh = createApp(deps, [createLiveActivityEffect(la)]); // new process: no previous state
    await fresh.reconcile();
    expect(la.ended).toHaveLength(1);
  });

  it('expired by the system → restarted on the next app open (AS-4.7)', async () => {
    const { app, la } = await setup();
    await app.reconcile();
    la.running = null; // iOS 8-hour limit
    await app.reconcile();
    expect(la.started).toBe(2);
  });
});

describe('Live Activity "Bebi 💧" (FR-023)', () => {
  it('logs one sip per tap from the live activity and updates it', async () => {
    const { app, la, deps } = await setup();
    await app.reconcile();
    const event = {
      source: 'act-1',
      target: 'wotah-drink',
      timestamp: 1,
      type: 'ExpoWidgetsUserInteraction' as const,
    };
    await handleLiveActivityInteraction(app, event);
    await handleLiveActivityInteraction(app, event); // same delivery twice → counted once
    await handleLiveActivityInteraction(app, { ...event, timestamp: 2 });
    expect(deps.sink.last.today.consumedMl).toBe(500);
    expect(la.running?.state.consumedMl).toBe(500);
  });

  it('ignores other targets (e.g. the dev spike button)', async () => {
    const { app, deps } = await setup();
    await app.reconcile();
    await handleLiveActivityInteraction(app, {
      source: 'spike',
      target: 'drink',
      timestamp: 1,
      type: 'ExpoWidgetsUserInteraction',
    });
    expect(deps.sink.last.today.consumedMl).toBe(0);
  });
});

describe('taps recorded natively while JS was not running (Swift queue, Phase 9)', () => {
  it('imports queued taps once, even if the same tap was also delivered live', async () => {
    const { app, deps } = await setup();
    await app.reconcile();
    const tap = (timestamp: number) => ({ source: 'act-1', target: 'wotah-drink', timestamp });
    await handleLiveActivityInteraction(app, tap(1)); // delivered live
    await importPendingInteractions(app, [tap(1), tap(2), tap(3), { ...tap(4), target: 'drink' }]);
    expect(deps.sink.last.today.consumedMl).toBe(750);
  });

  it('an empty queue changes nothing', async () => {
    const { app, deps } = await setup();
    await app.reconcile();
    const before = deps.sink.published.length;
    await importPendingInteractions(app, []);
    expect(deps.sink.published.length).toBe(before);
  });
});
