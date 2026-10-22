import { DEV_PROFILE, ensureDevProfile } from '@/usecases/devProfile';
import { at } from '../helpers/time';
import { createTestDeps, PROFILE } from '../helpers/fakes';

describe('ensureDevProfile (T043, removed in T058)', () => {
  it('creates the default profile only in dev when none exists', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00'), profile: null });
    ensureDevProfile(deps.profiles, true);
    expect(deps.profiles.get()).toEqual({
      weightKg: 70,
      dailyGoalMl: 2000,
      wakeMinutes: 480,
      sleepMinutes: 1320,
      remindersEnabled: true,
      onboardingCompleted: true,
    });
    expect(DEV_PROFILE).toEqual(deps.profiles.get());
  });

  it('does nothing outside dev', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00'), profile: null });
    ensureDevProfile(deps.profiles, false);
    expect(deps.profiles.get()).toBeNull();
  });

  it('never overwrites an existing profile', async () => {
    const deps = await createTestDeps({
      now: at('2026-10-22', '10:00'),
      profile: { ...PROFILE, dailyGoalMl: 3000 },
    });
    ensureDevProfile(deps.profiles, true);
    expect(deps.profiles.get()?.dailyGoalMl).toBe(3000);
  });
});
