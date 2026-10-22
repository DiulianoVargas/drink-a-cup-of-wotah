import { createApp } from '@/usecases/app';
import { at } from '../helpers/time';
import { createTestDeps } from '../helpers/fakes';

type Deps = Awaited<ReturnType<typeof createTestDeps>>;
const seedSip = (deps: Deps, when: Date) =>
  deps.sips.add(
    {
      id: `s${when.getTime()}`,
      amountMl: 250,
      occurredAt: when.getTime(),
      dayKey: '2026-10-22',
      source: 'button',
      undoneAt: null,
    },
    2000,
  );

describe('reconcile: day rollover (FR-030)', () => {
  it('crossing the wake time yields the new day with 0 ml and syncs once', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '21:00') });
    const app = createApp(deps, []);
    seedSip(deps, at('2026-10-22', '20:00'));
    await app.reconcile();
    expect(deps.sink.last.today.consumedMl).toBe(250);

    deps.clock.set(at('2026-10-23', '08:01'));
    const before = deps.sink.published.length;
    const today = await app.reconcile();
    expect(today).toMatchObject({ dayKey: '2026-10-23', consumedMl: 0 });
    expect(deps.sink.published.length - before).toBe(1);
  });

  it('same logical day → refresh only, totals unchanged', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const app = createApp(deps, []);
    seedSip(deps, at('2026-10-22', '09:00'));
    deps.clock.advanceMinutes(30);
    const today = await app.reconcile();
    expect(today).toMatchObject({ dayKey: '2026-10-22', consumedMl: 250 });
  });

  it('without a profile there is nothing to reconcile', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00'), profile: null });
    const app = createApp(deps, []);
    expect(await app.reconcile()).toBeNull();
    expect(deps.sink.published).toHaveLength(0);
  });
});
