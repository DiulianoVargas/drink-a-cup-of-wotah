import { dayKeyFor } from '@/domain/day';
import type { TodayState } from '@/domain/types';
import type { Clock, ProfileRepository, SipRepository } from './ports';

type Deps = { sips: SipRepository; profiles: ProfileRepository; clock: Clock };

/** Current logical day snapshot, or null before a profile exists. */
export function getTodayState({ sips, profiles, clock }: Deps): TodayState | null {
  const profile = profiles.get();
  if (!profile) return null;
  const dayKey = dayKeyFor(clock.now(), profile.wakeMinutes);
  return {
    dayKey,
    goalMl: sips.goalFor(dayKey) ?? profile.dailyGoalMl,
    consumedMl: sips.totalFor(dayKey),
    lastSipAt: sips.lastSipAt(dayKey),
  };
}
