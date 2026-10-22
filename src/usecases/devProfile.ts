// Temporary (T043): lets US1 run before onboarding exists. Removed in T058.
import type { Profile } from '@/domain/types';
import type { ProfileRepository } from './ports';

export const DEV_PROFILE: Profile = {
  weightKg: 70,
  dailyGoalMl: 2000,
  wakeMinutes: 8 * 60,
  sleepMinutes: 22 * 60,
  remindersEnabled: true,
  onboardingCompleted: true,
};

export function ensureDevProfile(profiles: ProfileRepository, isDev: boolean): void {
  if (isDev && !profiles.get()) profiles.save(DEV_PROFILE);
}
