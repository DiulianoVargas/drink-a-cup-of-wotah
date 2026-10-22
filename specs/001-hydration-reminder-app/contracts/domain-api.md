# Contract — Domain API (`src/domain/`)

Pure TypeScript. **No imports** from `react`, `react-native` or `expo-*` (Constitution I). All
functions are pure: the clock comes in as `now`. This is the contract a future Swift version will
port 1:1 (same names, same test cases).

```ts
// constants.ts
export const GLASS_ML = 250;
export const MIN_GOAL_ML = 500;
export const MAX_GOAL_ML = 6000;
export const MIN_WEIGHT_KG = 30;
export const MAX_WEIGHT_KG = 250;
export const ML_PER_KG = 35;
export const MIN_REMINDER_INTERVAL_MIN = 30;

// goal.ts
suggestGoalMl(weightKg: number): number                  // FR-009
stepGoalMl(currentMl: number, dir: 1 | -1): number       // FR-010, clamped to [500, 6000]

// day.ts
dayKeyFor(now: Date, wakeMinutes: number): DayKey        // FR-030, R13
windowFor(dayKey: DayKey, wake: number, sleep: number): { start: Date; end: Date }
nextWindow(dayKey: DayKey, wake: number, sleep: number): { dayKey: DayKey; start: Date; end: Date }
lastNDayKeys(todayKey: DayKey, n: number): DayKey[]

// progress.ts
expressionFor(consumedMl: number, goalMl: number): MascotExpression   // FR-006
waterLevel(consumedMl: number, goalMl: number): number                // 0..1 (FR-005)
classifyDay(consumedMl: number, goalMl: number): 'empty' | 'partial' | 'full'  // FR-028
computeStreak(days: DaySummary[], todayKey: DayKey): number           // FR-029

// reminders.ts
planReminders(input: {
  profile: Profile; consumedMl: number; now: Date; lastSipAt?: Date;
}): Reminder[]                                            // FR-013..015, FR-018/019, R4
pickMessage(remainingGlasses: number, consumedMl: number, seed: number): { title: string; body: string } // FR-020

// format.ts  (PT-BR output, FR-004/032)
formatLiters(ml: number): string          // 1250 → "1,25"; 2000 → "2"; 2500 → "2,5"
formatProgress(consumed: number, goal: number): string   // "1,25 / 2 L"
formatClock(d: Date): string              // "14h30" (zero minutes → "14h")
formatCountdown(ms: number): string       // "em 45 min" | "em 1h45"
formatStreak(n: number): string | null    // n ≥ 1 → "🔥 n dia(s)"; 0 → null
```

## Use cases (`src/usecases/`, depend on ports)

```ts
interface SipRepository { add(sip): void; undoLast(dayKey, at): Sip | null; totalFor(dayKey): number; lastSipAt(dayKey): Date | null; summaries(keys: DayKey[]): DaySummary[] }
interface ProfileRepository { get(): Profile | null; save(p: Profile): void }
interface EventLog { seen(key: string): boolean; mark(key: string, at: Date): void }
interface ReminderScheduler { replaceAll(reminders: Reminder[]): Promise<void>; cancelAll(): Promise<void>; permission(): Promise<'granted'|'denied'|'undetermined'> }
interface LiveActivityPort { ensureStarted(s: SurfaceState): Promise<void>; update(s: SurfaceState): Promise<void>; celebrateAndEnd(s: SurfaceState): Promise<void>; readPending(): Promise<{ activityId: string; seq: number; pendingSips: number } | null> }
interface Clock { now(): Date }

registerSip(source: SipSource, eventKey?: string): Promise<TodayState>   // idempotent when eventKey is given
undoLastSip(): Promise<TodayState | null>                  // FR-003, FR-019
updateProfile(patch: Partial<Profile>): Promise<void>      // FR-011, preserves the day's total
completeOnboarding(p: Profile, permission: boolean): Promise<void>  // FR-008
reconcile(): Promise<void>   // cold start / foreground: day rollover, import LA pendingSips, pending notification responses, reschedule
syncSideEffects(today: TodayState): Promise<void>          // single gateway to notifications + LA
```

**Invariant**: every change to sips or profile ends in `syncSideEffects`, which (1) replans the
reminders, (2) updates or ends the Live Activity and (3) refreshes the UI store. This guarantees
FR-015, FR-024 and SC-005.
