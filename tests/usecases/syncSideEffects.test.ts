import { syncSideEffects, type Effect } from '@/usecases/syncSideEffects';
import { getTodayState } from '@/usecases/getTodayState';
import { at } from '../helpers/time';
import { createTestDeps } from '../helpers/fakes';

describe('syncSideEffects (single gateway, Constitution I)', () => {
  it('runs every registered effect with the current state, then publishes to the UI', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const order: string[] = [];
    const effects: Effect[] = [
      async (input, result) => {
        order.push(`a:${input.today.consumedMl}`);
        result.nextReminderAt = 123;
      },
      async () => {
        order.push('b');
      },
    ];
    const today = getTodayState(deps)!;
    await syncSideEffects(deps, { today, previous: null }, effects);
    expect(order).toEqual(['a:0', 'b']);
    expect(deps.sink.last).toMatchObject({ today, nextReminderAt: 123 });
  });

  it('tolerates no effects and still publishes', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    await syncSideEffects(deps, { today: getTodayState(deps)!, previous: null }, []);
    expect(deps.sink.published).toHaveLength(1);
    expect(deps.sink.last.nextReminderAt).toBeNull();
  });

  it('a failing effect does not block the others or the UI refresh', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    const ran: string[] = [];
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await syncSideEffects(deps, { today: getTodayState(deps)!, previous: null }, [
      async () => {
        throw new Error('boom');
      },
      async () => {
        ran.push('second');
      },
    ]);
    spy.mockRestore();
    expect(ran).toEqual(['second']);
    expect(deps.sink.published).toHaveLength(1);
  });
});
