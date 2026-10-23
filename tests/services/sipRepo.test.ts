import { createSipRepo } from '@/services/db/sipRepo';
import type { Sip } from '@/domain/types';
import { createTestDb } from '../helpers/sqljsDb';

const sip = (id: string, occurredAt: number, dayKey = '2026-10-22'): Sip => ({
  id,
  amountMl: 250,
  occurredAt,
  dayKey,
  source: 'button',
  undoneAt: null,
});

describe('sipRepo', () => {
  it('adds sips and totals the day', async () => {
    const repo = createSipRepo(await createTestDb());
    repo.add(sip('a', 1000), 2000);
    repo.add(sip('b', 2000), 2000);
    repo.add(sip('c', 3000, '2026-10-21'), 2000);
    expect(repo.totalFor('2026-10-22')).toBe(500);
    expect(repo.totalFor('2026-10-21')).toBe(250);
    expect(repo.totalFor('2026-10-20')).toBe(0);
  });

  it('records the goal in force on the first sip of a day and keeps it', async () => {
    const repo = createSipRepo(await createTestDb());
    repo.add(sip('a', 1000), 2000);
    repo.add(sip('b', 2000), 2500);
    expect(repo.goalFor('2026-10-22')).toBe(2000);
    repo.setDayGoal('2026-10-22', 2500);
    expect(repo.goalFor('2026-10-22')).toBe(2500);
    expect(repo.goalFor('2026-10-23')).toBeNull();
  });

  it('undoLast marks only the most recent non-undone sip and the total ignores it', async () => {
    const repo = createSipRepo(await createTestDb());
    repo.add(sip('a', 1000), 2000);
    repo.add(sip('b', 2000), 2000);
    expect(repo.undoLast('2026-10-22', 5000)?.id).toBe('b');
    expect(repo.totalFor('2026-10-22')).toBe(250);
    expect(repo.undoLast('2026-10-22', 6000)?.id).toBe('a');
    expect(repo.totalFor('2026-10-22')).toBe(0);
  });

  it('undoLast returns null when there is nothing to undo', async () => {
    const repo = createSipRepo(await createTestDb());
    expect(repo.undoLast('2026-10-22', 1000)).toBeNull();
  });

  it('lastSipAt ignores undone sips', async () => {
    const repo = createSipRepo(await createTestDb());
    expect(repo.lastSipAt('2026-10-22')).toBeNull();
    repo.add(sip('a', 1000), 2000);
    repo.add(sip('b', 2000), 2000);
    repo.undoLast('2026-10-22', 3000);
    expect(repo.lastSipAt('2026-10-22')).toBe(1000);
  });
});

describe('sipRepo.allSummaries (US5)', () => {
  it('returns every recorded day with its own goal and total (undone sips excluded)', async () => {
    const repo = createSipRepo(await createTestDb());
    repo.add(sip('a', 1000, '2026-10-20'), 1500);
    repo.add(sip('b', 2000, '2026-10-22'), 2000);
    repo.add(sip('c', 3000, '2026-10-22'), 2000);
    repo.undoLast('2026-10-22', 4000);
    repo.setDayGoal('2026-10-21', 2500); // goal changed on a day with no sips
    expect(repo.allSummaries()).toEqual([
      { dayKey: '2026-10-20', goalMl: 1500, consumedMl: 250 },
      { dayKey: '2026-10-21', goalMl: 2500, consumedMl: 0 },
      { dayKey: '2026-10-22', goalMl: 2000, consumedMl: 250 },
    ]);
  });
});
