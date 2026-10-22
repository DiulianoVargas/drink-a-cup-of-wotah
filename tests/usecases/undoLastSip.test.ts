import { createApp } from '@/usecases/app';
import { at } from '../helpers/time';
import { createTestDeps } from '../helpers/fakes';

describe('undoLastSip (FR-003, AS-1.2–1.4)', () => {
  it('reverts the most recent sip and can repeat until zero', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const app = createApp(deps, []);
    await app.registerSip('button');
    deps.clock.advanceMinutes(1);
    await app.registerSip('button');

    expect((await app.undoLastSip())?.consumedMl).toBe(250);
    expect((await app.undoLastSip())?.consumedMl).toBe(0);
    expect(deps.sink.last.today.consumedMl).toBe(0);
  });

  it('at 0 ml returns null and changes nothing (AS-1.4)', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const app = createApp(deps, []);
    const published = deps.sink.published.length;
    expect(await app.undoLastSip()).toBeNull();
    expect(deps.sink.published.length).toBe(published);
  });

  it("does not touch the previous day's sips", async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '21:00') });
    const app = createApp(deps, []);
    await app.registerSip('button');
    deps.clock.set(at('2026-10-23', '09:00'));
    expect(await app.undoLastSip()).toBeNull();
  });
});
