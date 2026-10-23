import { Platform } from 'react-native';
import { createLiveActivityAdapter, DRINK_TARGET } from '@/services/liveActivity';
import type { SurfaceState } from '@/domain/types';

const state: SurfaceState = {
  consumedMl: 500,
  goalMl: 2000,
  progress: 0.25,
  expression: 'excited',
  nextReminderAt: null,
  celebrating: false,
  consumedLabel: '0,5',
  goalLabel: '2',
};

const makeFactory = () => {
  const instance = {
    getId: jest.fn(() => 'act-1'),
    update: jest.fn(async () => {}),
    end: jest.fn(async () => {}),
  };
  const factory = {
    start: jest.fn(() => instance),
    getInstances: jest.fn((): (typeof instance)[] => []),
  };
  return { factory, instance };
};

describe('Live Activity adapter (contracts/live-activity.md)', () => {
  it('starts with the plain tap URL on iOS 17+', () => {
    const { factory } = makeFactory();
    Object.defineProperty(Platform, 'Version', { value: '17.4', configurable: true });
    createLiveActivityAdapter(factory as never, (q) => `wotah:///${q ? '?sip=1' : ''}`).start(
      state,
    );
    expect(factory.start).toHaveBeenCalledWith(state, 'wotah:///');
  });

  it('on iOS < 17 (no interactive button) tapping the activity logs a sip', () => {
    const { factory } = makeFactory();
    Object.defineProperty(Platform, 'Version', { value: '16.6', configurable: true });
    createLiveActivityAdapter(factory as never, (q) => `wotah:///${q ? '?sip=1' : ''}`).start(
      state,
    );
    expect(factory.start).toHaveBeenCalledWith(state, 'wotah:///?sip=1');
  });

  it('reports whether an activity is running and updates every instance', async () => {
    const { factory, instance } = makeFactory();
    const la = createLiveActivityAdapter(factory as never, () => 'x');
    expect(la.isRunning()).toBe(false);
    factory.getInstances.mockReturnValue([instance]);
    expect(la.isRunning()).toBe(true);
    await la.update(state);
    expect(instance.update).toHaveBeenCalledWith(state);
  });

  it('end() shows the final state and dismisses after the given delay', async () => {
    const { factory, instance } = makeFactory();
    factory.getInstances.mockReturnValue([instance]);
    const la = createLiveActivityAdapter(factory as never, () => 'x');
    const before = Date.now();
    await la.end({ ...state, celebrating: true }, 5 * 60_000);
    const [policy, props] = instance.end.mock.calls[0] as unknown[] as [
      { after: Date },
      SurfaceState,
    ];
    expect(props.celebrating).toBe(true);
    expect(policy.after.getTime()).toBeGreaterThanOrEqual(before + 5 * 60_000);
  });

  it('the button target is namespaced so the dev spike never logs real sips', () => {
    expect(DRINK_TARGET).toBe('wotah-drink');
  });
});
