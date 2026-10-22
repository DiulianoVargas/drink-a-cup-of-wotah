/** Local date of the start of a logical day, formatted `YYYY-MM-DD`. */
export type DayKey = string;

export type Profile = {
  weightKg: number;
  dailyGoalMl: number;
  /** Minutes since 00:00 (0..1439). */
  wakeMinutes: number;
  /** Minutes since 00:00 (0..1439). If `sleep < wake`, the window crosses midnight. */
  sleepMinutes: number;
  remindersEnabled: boolean;
  onboardingCompleted: boolean;
};

export type SipSource = 'button' | 'notification_action' | 'notification_tap' | 'live_activity';

export type Sip = {
  id: string;
  amountMl: number;
  /** Epoch ms. */
  occurredAt: number;
  dayKey: DayKey;
  source: SipSource;
  /** Epoch ms of the undo, or null. */
  undoneAt: number | null;
};

export type DaySummary = {
  dayKey: DayKey;
  goalMl: number;
  consumedMl: number;
};

export type DayStatus = 'empty' | 'partial' | 'full';

export type Reminder = {
  /** Epoch ms. */
  fireAt: number;
  dayKey: DayKey;
  /** Position in the planned list (stable notification id suffix). */
  index: number;
  remainingGlasses: number;
  title: string;
  body: string;
};

export type MascotExpression = 'thirsty' | 'excited' | 'radiant' | 'celebrating';

export type TodayState = {
  dayKey: DayKey;
  goalMl: number;
  consumedMl: number;
  /** Epoch ms of the most recent non-undone sip of the day, or null. */
  lastSipAt: number | null;
};

/** Props sent to the Live Activity. Plain JSON: no Date, no functions. */
export type SurfaceState = {
  consumedMl: number;
  goalMl: number;
  progress: number;
  expression: MascotExpression;
  /** Epoch ms, or null when reminders are off or not allowed. */
  nextReminderAt: number | null;
  celebrating: boolean;
  pendingSips: number;
  seq: number;
};
