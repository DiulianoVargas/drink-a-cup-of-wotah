import { create } from 'zustand';
import { suggestGoalMl } from '@/domain/goal';
import type { OnboardingDraft } from '@/usecases/app';

const DEFAULT_WEIGHT = 70;

type DraftStore = OnboardingDraft & {
  /** True once the user changed the goal by hand; a later weight change then keeps it. */
  goalEdited: boolean;
  setWeight: (kg: number) => void;
  setGoal: (ml: number) => void;
  setWake: (minutes: number) => void;
  setSleep: (minutes: number) => void;
  reset: () => void;
};

const initial = {
  weightKg: DEFAULT_WEIGHT,
  dailyGoalMl: suggestGoalMl(DEFAULT_WEIGHT),
  wakeMinutes: 8 * 60,
  sleepMinutes: 22 * 60,
  goalEdited: false,
};

/** Onboarding answers, prefilled with sensible defaults (SC-001: "Continuar" ×4 works). */
export const useOnboardingDraft = create<DraftStore>((set) => ({
  ...initial,
  setWeight: (kg) =>
    set((s) => ({ weightKg: kg, dailyGoalMl: s.goalEdited ? s.dailyGoalMl : suggestGoalMl(kg) })),
  setGoal: (ml) => set({ dailyGoalMl: ml, goalEdited: true }),
  setWake: (minutes) => set({ wakeMinutes: minutes }),
  setSleep: (minutes) => set({ sleepMinutes: minutes }),
  reset: () => set(initial),
}));
