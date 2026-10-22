import { requireOptionalNativeModule } from 'expo-modules-core';

export type PendingInteraction = {
  source: string;
  target: string;
  timestamp: number;
  type?: string;
};

type WotahNativeModule = { drainPendingInteractions(): PendingInteraction[] };

// Optional: absent in Jest and on platforms without the native module.
const native = requireOptionalNativeModule<WotahNativeModule>('WotahNative');

/** Live Activity taps recorded natively while JS was not listening (oldest first). */
export function drainPendingInteractions(): PendingInteraction[] {
  return native?.drainPendingInteractions() ?? [];
}
