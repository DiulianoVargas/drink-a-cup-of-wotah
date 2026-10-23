# Data Model — Wotah (001-hydration-reminder-app)

**Date**: 2026-10-22 · Based on: [spec.md › Key Entities](./spec.md#key-entities), [research.md](./research.md) (R3, R6, R13)

Units: volume in **integer ml**; times of day in **minutes since 00:00** (`0..1439`); instants in
**epoch ms**. Formatting ("1,25 / 2 L", "14h30") happens only at the edge (`src/domain/format.ts`).

---

## 1. Domain entities (pure TypeScript, `src/domain/types.ts`)

### Profile

| Field | Type | Rules |
|---|---|---|
| `weightKg` | `number` (integer) | 30 ≤ x ≤ 250 |
| `dailyGoalMl` | `number` | multiple of 250; 500 ≤ x ≤ 6000 |
| `wakeMinutes` | `number` | 0..1439; multiple of 30 in the UI (pickers in 30-minute steps) |
| `sleepMinutes` | `number` | 0..1439; ≠ `wakeMinutes`. If `sleep < wake`, the window crosses midnight |
| `remindersEnabled` | `boolean` | default `true`; turning it off cancels all reminders |
| `onboardingCompleted` | `boolean` | `false` until the permission step ends (granted or declined) |

Derived:
- `suggestedGoalMl(weightKg) = clamp(round(weightKg × 35 / 250) × 250, 500, 6000)` (FR-009). Example: 70 kg → 2,450 → **2,500**.
- `awakeDurationMinutes = (sleep − wake + 1440) % 1440`.

### Sip

| Field | Type | Rules |
|---|---|---|
| `id` | `string` (UUID) | generated when logged |
| `amountMl` | `250` | constant `GLASS_ML` (FR-001) |
| `occurredAt` | `number` (epoch ms) | instant of logging |
| `dayKey` | `string` `YYYY-MM-DD` | local date of the start of the logical day (see §3) |
| `source` | `'button' \| 'notification_action' \| 'notification_tap' \| 'live_activity'` | origin (spec › Sip) |
| `undoneAt` | `number \| null` | soft delete for "Desfazer" (FR-003) |

### Day

Derived from the sip log plus a goal snapshot. The day's goal is fixed at the first event of the
day and updated if the user changes the goal that day (FR-028 compares with "the goal in force
that day").

| Field | Type | Rules |
|---|---|---|
| `dayKey` | `string` | PK |
| `goalMl` | `number` | goal in force that day (the last change wins) |
| `consumedMl` | `number` | Σ `amountMl` of the day's sips with `undoneAt = null` (derived; may be cached) |
| `goalMet` | `boolean` | `consumedMl ≥ goalMl` (derived) |

History classification (FR-028): `empty` if `consumedMl = 0`; `full` if `consumedMl ≥ goalMl`;
otherwise `partial`.

### Reminder

Not persisted as a business entity. It is **computed** by the domain (`planReminders`) and
materialized as scheduled notifications. Scheduled notification IDs are kept in
`scheduled_reminder` only for inspection and cancellation.

| Field | Type |
|---|---|
| `fireAt` | `number` (epoch ms) |
| `dayKey` | `string` |
| `remainingGlasses` | `number` (for the "Faltam {n} copos" text) |
| `messageIndex` | `number` (text variant, FR-020) |

### MascotExpression

`'thirsty' | 'excited' | 'radiant' | 'celebrating'` (FR-006; PT-BR design names: sedenta, animada,
radiante, comemorando):

| Progress `p = consumed / goal` | Expression |
|---|---|
| `p < 0.25` | `thirsty` |
| `0.25 ≤ p < 1` | `excited` |
| `p = 1` (consumption exactly equals the goal) | `radiant` |
| `p > 1` | `celebrating` |

Visual water level: `min(p, 1)`.

---

## 2. Persistence (SQLite, `src/services/db/`)

Database `wotah.db` in the App Group container (R6). Migrations via `PRAGMA user_version`.

```sql
-- v1
CREATE TABLE profile (
  id                    INTEGER PRIMARY KEY CHECK (id = 1),
  weight_kg             INTEGER NOT NULL CHECK (weight_kg BETWEEN 30 AND 250),
  daily_goal_ml         INTEGER NOT NULL CHECK (daily_goal_ml BETWEEN 500 AND 6000 AND daily_goal_ml % 250 = 0),
  wake_minutes          INTEGER NOT NULL CHECK (wake_minutes BETWEEN 0 AND 1439),
  sleep_minutes         INTEGER NOT NULL CHECK (sleep_minutes BETWEEN 0 AND 1439),
  reminders_enabled     INTEGER NOT NULL DEFAULT 1,
  onboarding_completed  INTEGER NOT NULL DEFAULT 0,
  updated_at            INTEGER NOT NULL
);

CREATE TABLE day (
  day_key     TEXT PRIMARY KEY,            -- 'YYYY-MM-DD'
  goal_ml     INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE sip (
  id           TEXT PRIMARY KEY,
  day_key      TEXT NOT NULL REFERENCES day(day_key),
  amount_ml    INTEGER NOT NULL DEFAULT 250,
  occurred_at  INTEGER NOT NULL,
  source       TEXT NOT NULL,
  undone_at    INTEGER
);
CREATE INDEX sip_day ON sip(day_key, occurred_at);

-- idempotency for notification responses / Live Activity props (R4, R5)
CREATE TABLE processed_event (
  event_key     TEXT PRIMARY KEY,          -- e.g. 'notif:<requestId>:<actionId>' | 'la:<activityId>:<seq>'
  processed_at  INTEGER NOT NULL
);

CREATE TABLE scheduled_reminder (
  notification_id  TEXT PRIMARY KEY,
  day_key          TEXT NOT NULL,
  fire_at          INTEGER NOT NULL
);
```

Key queries:
- **Day total**: `SELECT COALESCE(SUM(amount_ml),0) FROM sip WHERE day_key=? AND undone_at IS NULL`.
- **Undo last sip** (FR-003): `UPDATE sip SET undone_at=? WHERE id = (SELECT id FROM sip WHERE day_key=? AND undone_at IS NULL ORDER BY occurred_at DESC LIMIT 1)`. No effect if there is none.
- **Last 7 days**: `day LEFT JOIN` aggregates from `sip`, for the 7 `dayKey`s generated by the domain. Days without a row count as `empty`.
- **Streak** (FR-029): computed in the domain over the ordered day list (`computeStreak(days, todayKey)`).

Retention: keep everything (the volume is tiny). The UI only reads 7 days.

---

## 3. Logical day and window (rules in `src/domain/day.ts`)

- `dayKeyFor(now, wake)`: if `minutesOf(now) ≥ wake`, the day is the local date of `now`; otherwise it is the local date of `now − 1 day` (FR-030 and the "day rollover" edge case: sips between bedtime and wake time count toward the previous day).
- `windowFor(dayKey, wake, sleep)`: `start = dayKey@wake`; `end = start + awakeDuration`. This covers windows that cross midnight (e.g., 10:00 → 1:00).
- `isInsideWindow(now)`: `start ≤ now < end`.

---

## 4. Reminder planning (`src/domain/reminders.ts`)

Input: `profile`, today's `consumedMl`, `now`, `lastSipAt?`. Output: `Reminder[]` (today + next window).

```
remainingGlasses = ceil(max(goal − consumed, 0) / 250)
if !remindersEnabled or remainingGlasses = 0  → today: []          (FR-018, SC-003)
anchor   = max(now, window.start)                                   (late start / outside window)
interval = clamp( (window.end − anchor) / remainingGlasses , 30 min, 60 min )  (FR-014)
first    = anchor + interval   (anchor = max(now, window.start); every sip triggers a replan at the sip time, FR-015)
chain: first, first+interval, …  while t ≤ window.end   (FR-013, SC-004, FR-019; ≤ 24 per window)
next window: same formula with consumed = 0, anchor = nextWindow.start
```

A reminder exactly at bedtime is allowed (the spec forbids only reminders *after* bedtime); otherwise
the last glass would never be reminded (with 1 glass left the single reminder always lands at bedtime),
breaking FR-019/AS-3.7.

Spec cases that become table tests: AS-3.1 (2 L, 8:00–22:00 → ~1h45), AS-3.4 (a sip at 10:00
reschedules), AS-3.5/3.7 (goal met/undo), plus the edge cases for a short window (30-minute floor),
late start, last reminder before bedtime and a window crossing midnight.

Text (FR-020): `pickMessage(remainingGlasses, consumedMl, seed)` picks among the design's 8
variants (`contracts/notifications.md`). "Falta pouquinho!" only appears when `remainingGlasses = 1`.

---

## 5. State transitions

```
Onboarding:  weight → goal → schedule → permission → (onboardingCompleted = true) → Home

Day (per dayKey):
  empty (0 ml) ──registerSip──▶ partial ──registerSip (≥ goal)──▶ goal met ──registerSip──▶ above goal
       ▲              │  ▲                     │                                    │
       └──undo────────┘  └────undo (< goal)────┘◀────────────undo (= goal)─────────┘

Effects per transition (syncSideEffects):
  any sip/undo/profile change → replan reminders; update the Live Activity
  crossed into goal met → cancel today's reminders; celebrate; LA: "Bom trabalho! 🎉" → end after ~5 min
  left goal met (undo) → reschedule if window time remains (FR-019)

Live Activity:  none ──app opens and goal not met──▶ active ──update──▶ active
                active ──goal met──▶ celebrating ──~5 min──▶ ended
                active ──8 h (iOS)──▶ ended ──app opens and goal not met──▶ active
```

---

## 6. Snapshot for system surfaces (`SurfaceState`)

Props sent to the Live Activity (and, in v2, to the home-screen widget). Plain JSON, no `Date`:

| Field | Type | Use |
|---|---|---|
| `consumedMl` | `number` | "1,25" |
| `goalMl` | `number` | "/ 2 L" |
| `progress` | `number` 0..∞ | bar/ring |
| `expression` | `MascotExpression` | drop/bottle |
| `nextReminderAt` | `number \| null` | "Próximo lembrete em 45 min" |
| `celebrating` | `boolean` | "Bom trabalho! 🎉" |
| `pendingSips` | `number` | sips made on the activity itself, not yet imported by the app (R5) |
| `seq` | `number` | monotonic counter used for idempotency (`processed_event`) |

Details and per-region mapping in [contracts/live-activity.md](./contracts/live-activity.md).
