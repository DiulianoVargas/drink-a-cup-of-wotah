import { createProfileRepo } from '@/services/db/profileRepo';
import type { Profile } from '@/domain/types';
import { createTestDb } from '../helpers/sqljsDb';

const profile: Profile = {
  weightKg: 70,
  dailyGoalMl: 2500,
  wakeMinutes: 480,
  sleepMinutes: 1320,
  remindersEnabled: true,
  onboardingCompleted: true,
};

describe('profileRepo', () => {
  it('returns null before onboarding', async () => {
    const repo = createProfileRepo(await createTestDb());
    expect(repo.get()).toBeNull();
  });

  it('saves and reads back a single profile row', async () => {
    const repo = createProfileRepo(await createTestDb());
    repo.save(profile);
    repo.save({ ...profile, dailyGoalMl: 2000, remindersEnabled: false });
    expect(repo.get()).toEqual({ ...profile, dailyGoalMl: 2000, remindersEnabled: false });
  });

  it.each([
    ['weight below 30 kg', { weightKg: 29 }],
    ['weight above 250 kg', { weightKg: 251 }],
    ['goal not a multiple of 250 ml', { dailyGoalMl: 2600 }],
    ['goal above 6000 ml', { dailyGoalMl: 6250 }],
    ['goal below 500 ml', { dailyGoalMl: 250 }],
    ['wake minutes out of range', { wakeMinutes: 1440 }],
  ])('rejects %s (CHECK constraint)', async (_label, patch) => {
    const repo = createProfileRepo(await createTestDb());
    expect(() => repo.save({ ...profile, ...patch })).toThrow();
  });
});
