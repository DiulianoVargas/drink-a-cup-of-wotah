import { createApp } from '@/usecases/app';
import { at } from '../helpers/time';
import { createTestDeps } from '../helpers/fakes';

describe('registerSip (FR-001, FR-007, FR-015)', () => {
  it('adds a 250 ml sip for the logical day with its source and syncs', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const app = createApp(deps, []);
    const today = await app.registerSip('button');
    expect(today).toEqual({
      dayKey: '2026-10-22',
      goalMl: 2000,
      consumedMl: 250,
      lastSipAt: at('2026-10-22', '10:00').getTime(),
    });
    expect(deps.sink.last.today.consumedMl).toBe(250);
  });

  it('logs sips after midnight to the previous logical day', async () => {
    const deps = await createTestDeps({ now: at('2026-10-23', '06:00') });
    const app = createApp(deps, []);
    expect((await app.registerSip('notification_action'))?.dayKey).toBe('2026-10-22');
  });

  it('keeps counting above the goal', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const app = createApp(deps, []);
    for (let i = 0; i < 9; i++) await app.registerSip('button');
    expect(deps.sink.last.today.consumedMl).toBe(2250);
  });

  it('is idempotent for the same event key', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const app = createApp(deps, []);
    await app.registerSip('notification_action', { eventKey: 'notif:rem:1:DRINK' });
    await app.registerSip('notification_action', { eventKey: 'notif:rem:1:DRINK' });
    await app.registerSip('notification_action', { eventKey: 'notif:rem:2:DRINK' });
    expect(deps.sink.last.today.consumedMl).toBe(500);
  });

  it('asks for the "Desfazer" toast for in-app and body-tap sips only', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const app = createApp(deps, []);
    await app.registerSip('button');
    await app.registerSip('notification_tap');
    await app.registerSip('notification_action');
    expect(deps.sink.toasts).toBe(2);
  });

  it('does nothing without a profile', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00'), profile: null });
    const app = createApp(deps, []);
    expect(await app.registerSip('button')).toBeNull();
  });
});
