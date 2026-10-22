import {
  formatClock,
  formatCountdown,
  formatLiters,
  formatProgress,
  formatStreak,
} from '@/domain/format';
import { at } from '../helpers/time';

describe('formatLiters (FR-004)', () => {
  it.each([
    [0, '0'],
    [250, '0,25'],
    [500, '0,5'],
    [1250, '1,25'],
    [2000, '2'],
    [2250, '2,25'],
    [2500, '2,5'],
  ])('%i ml → %s', (ml, expected) => {
    expect(formatLiters(ml)).toBe(expected);
  });
});

describe('formatProgress', () => {
  it('formats "X / Y L"', () => {
    expect(formatProgress(1250, 2000)).toBe('1,25 / 2 L');
    expect(formatProgress(2250, 2000)).toBe('2,25 / 2 L');
  });
});

describe('formatClock', () => {
  it.each([
    ['14:30', '14h30'],
    ['14:00', '14h'],
    ['08:05', '8h05'],
  ])('%s → %s', (time, expected) => {
    expect(formatClock(at('2026-10-22', time))).toBe(expected);
  });
});

describe('formatCountdown', () => {
  it.each([
    [45 * 60_000, 'em 45 min'],
    [105 * 60_000, 'em 1h45'],
    [60 * 60_000, 'em 1h'],
    [30_000, 'em 1 min'],
    [44 * 60_000 + 1, 'em 45 min'],
  ])('%i ms → %s', (ms, expected) => {
    expect(formatCountdown(ms)).toBe(expected);
  });
});

describe('formatStreak (FR-029)', () => {
  it.each([
    [0, null],
    [1, '🔥 1 dia'],
    [5, '🔥 5 dias'],
  ])('%i → %s', (n, expected) => {
    expect(formatStreak(n)).toBe(expected);
  });
});
