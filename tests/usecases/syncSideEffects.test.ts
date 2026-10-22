import { createApp } from '@/usecases/app';
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

describe('history in every sync (US5)', () => {
  it('publishes the 7-day strip and the streak', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00') });
    for (const [dayKey, n] of [
      ['2026-10-20', 8],
      ['2026-10-21', 8],
    ] as const) {
      for (let i = 0; i < n; i++) {
        deps.sips.add(
          {
            id: `${dayKey}-${i}`,
            amountMl: 250,
            occurredAt: i,
            dayKey,
            source: 'button',
            undoneAt: null,
          },
          2000,
        );
      }
    }
    const app = createApp(deps, []);
    await app.registerSip('button');
    expect(deps.sink.last.streak).toBe(2);
    expect(deps.sink.last.week.map((d) => d.status)).toEqual([
      'empty',
      'empty',
      'empty',
      'empty',
      'full',
      'full',
      'partial',
    ]);
    for (let i = 0; i < 7; i++) await app.registerSip('button');
    expect(deps.sink.last.streak).toBe(3);
  });
});
