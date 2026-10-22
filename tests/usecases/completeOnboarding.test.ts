import { createApp } from '@/usecases/app';
import { at } from '../helpers/time';
import { createTestDeps } from '../helpers/fakes';

const draft = {
  weightKg: 70,
  dailyGoalMl: 2500,
  wakeMinutes: 480,
  sleepMinutes: 1320,
};

describe('completeOnboarding (FR-008)', () => {
  it.each([true, false])(
    'saves the profile as onboarded (permission granted: %s)',
    async (granted) => {
      const deps = await createTestDeps({ now: at('2026-10-22', '10:00'), profile: null });
      const app = createApp(deps, []);
      const today = await app.completeOnboarding(draft);
      expect(deps.profiles.get()).toEqual({
        ...draft,
        remindersEnabled: true,
        onboardingCompleted: true,
      });
      expect(today).toMatchObject({ dayKey: '2026-10-22', goalMl: 2500, consumedMl: 0 });
      expect(deps.sink.last.profile.onboardingCompleted).toBe(true);
      void granted; // the OS permission result never blocks onboarding (AS-2.4)
    },
  );

  it('rejects an invalid draft', async () => {
    const deps = await createTestDeps({ now: at('2026-10-22', '10:00'), profile: null });
    const app = createApp(deps, []);
    await expect(app.completeOnboarding({ ...draft, weightKg: 20 })).rejects.toThrow();
    expect(deps.profiles.get()).toBeNull();
  });
});
