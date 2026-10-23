import { toSurfaceState } from '@/domain/surface';

const today = (consumedMl: number, goalMl = 2000) => ({
  dayKey: '2026-10-22',
  goalMl,
  consumedMl,
  lastSipAt: null,
});

describe('toSurfaceState (Live Activity props, data-model §6)', () => {
  it('mid-day', () => {
    expect(toSurfaceState(today(1250), 1_800_000_000_000)).toEqual({
      consumedMl: 1250,
      goalMl: 2000,
      progress: 0.625,
      expression: 'excited',
      nextReminderAt: 1_800_000_000_000,
      celebrating: false,
      consumedLabel: '1,25',
      goalLabel: '2',
    });
  });

  it('goal met → celebrating, no next reminder line', () => {
    expect(toSurfaceState(today(2000), null)).toMatchObject({
      expression: 'radiant',
      celebrating: true,
      nextReminderAt: null,
    });
  });

  it('above the goal keeps the real progress (> 1) and celebrates', () => {
    expect(toSurfaceState(today(2250), null)).toMatchObject({
      progress: 1.125,
      expression: 'celebrating',
      celebrating: true,
    });
  });

  it('reminders off or not allowed → nextReminderAt null hides the countdown (FR-022)', () => {
    expect(toSurfaceState(today(500), null).nextReminderAt).toBeNull();
  });

  it('is plain JSON (no Date, no functions)', () => {
    const s = toSurfaceState(today(500), 123);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});
