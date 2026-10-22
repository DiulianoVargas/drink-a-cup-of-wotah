// Ports between the use cases and platform adapters (contracts/domain-api.md).
import type {
  DayKey,
  DaySummary,
  Profile,
  Reminder,
  Sip,
  SurfaceState,
  TodayState,
} from '@/domain/types';

export interface SipRepository {
  /** Inserts a sip; records `dayGoalMl` as the day's goal if this is the day's first event. */
  add(sip: Sip, dayGoalMl: number): void;
  undoLast(dayKey: DayKey, at: number): Sip | null;
  totalFor(dayKey: DayKey): number;
  lastSipAt(dayKey: DayKey): number | null;
  goalFor(dayKey: DayKey): number | null;
  setDayGoal(dayKey: DayKey, goalMl: number): void;
  summaries?(keys: DayKey[], fallbackGoalMl: number): DaySummary[];
}

export interface ProfileRepository {
  get(): Profile | null;
  save(profile: Profile): void;
}

export interface EventLog {
  seen(key: string): boolean;
  mark(key: string, at: number): void;
}

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface ReminderScheduler {
  replaceAll(reminders: Reminder[]): Promise<void>;
  cancelAll(): Promise<void>;
  permission(): Promise<PermissionStatus>;
}

export interface LiveActivityPort {
  ensureStarted(state: SurfaceState): Promise<void>;
  update(state: SurfaceState): Promise<void>;
  celebrateAndEnd(state: SurfaceState): Promise<void>;
  readPending(): Promise<{ activityId: string; seq: number; pendingSips: number } | null>;
}

export interface Clock {
  now(): Date;
}

export type { TodayState };
