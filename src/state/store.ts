import { create } from 'zustand';
import type { Profile, TodayState } from '@/domain/types';
import type { Published, StateSink } from '@/usecases/app';

type WotahState = {
  ready: boolean;
  profile: Profile | null;
  today: TodayState | null;
  nextReminderAt: number | null;
  /** Increments every time the "Desfazer" toast should (re)appear. */
  undoToastKey: number;
};

/** Read-only view of the database for the UI; rebuilt by every sync (research R7). */
export const useWotahStore = create<WotahState>(() => ({
  ready: false,
  profile: null,
  today: null,
  nextReminderAt: null,
  undoToastKey: 0,
}));

export const storeSink: StateSink = {
  publish(p: Published) {
    useWotahStore.setState({
      ready: true,
      profile: p.profile,
      today: p.today,
      nextReminderAt: p.nextReminderAt,
    });
  },
  requestUndoToast() {
    useWotahStore.setState((s) => ({ undoToastKey: s.undoToastKey + 1 }));
  },
};
