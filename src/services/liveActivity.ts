import { after, type LiveActivityFactory } from 'expo-widgets';
import { Platform } from 'react-native';
import type { SurfaceState } from '@/domain/types';
import type { LiveActivityPort } from '@/usecases/ports';
import { LIVE_ACTIVITY_DRINK_TARGET } from '@/usecases/liveActivityInteraction';

export const DRINK_TARGET = LIVE_ACTIVITY_DRINK_TARGET;

/** iOS 17 added interactive Live Activity buttons. */
const hasInteractiveButtons = () => parseInt(String(Platform.Version), 10) >= 17;

/**
 * ActivityKit adapter. Without the interactive button (iOS < 17), tapping the activity opens a
 * URL that logs a sip, keeping logging at one tap (Constitution VI, spec edge case).
 */
export function createLiveActivityAdapter(
  factory: LiveActivityFactory<SurfaceState>,
  makeUrl: (sipOnTap: boolean) => string,
): LiveActivityPort {
  const instances = () => factory.getInstances();
  return {
    isRunning: () => instances().length > 0,
    start(state) {
      factory.start(state, makeUrl(!hasInteractiveButtons()));
    },
    async update(state) {
      await Promise.all(instances().map((i) => i.update(state)));
    },
    async end(state, dismissAfterMs) {
      const policy = after(new Date(Date.now() + dismissAfterMs));
      await Promise.all(instances().map((i) => i.end(policy, state)));
    },
  };
}
