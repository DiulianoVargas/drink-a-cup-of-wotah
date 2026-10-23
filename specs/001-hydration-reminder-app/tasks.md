---

description: "Task list for Wotah — Hydration reminder with a bottle mascot"
---

# Tasks: Wotah — Hydration reminder with a bottle mascot

**Input**: Design documents from `/specs/001-hydration-reminder-app/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: REQUIRED. Constitution Principle IV (NON-NEGOTIABLE) mandates test-first for
`src/domain/` and `src/usecases/`, plus component tests for critical UI interactions. Test tasks
come before their implementation tasks and MUST fail before the implementation is written.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested
independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US5)
- Paths are relative to the repository root (single Expo app, see plan.md › Project Structure)

## Conventions for every task

- Code identifiers, comments and commits in English. User-facing strings in PT-BR, copied
  verbatim from spec.md/contracts (Constitution VI).
- `src/domain/**` MUST NOT import `react`, `react-native` or `expo-*`; the clock is always an
  injected `now: Date` (Constitution I).
- UI reads colors/typography only through `useTheme()` (Constitution V).
- Add Expo packages with `npx expo install <pkg>`, never plain `npm i` (research R2).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Expo project initialization, tooling and the first cloud dev build

- [X] T001 Scaffold an Expo SDK 57 TypeScript app (Expo Router template) into the existing repo root without overwriting `SPEC.md`, `DESIGN-BRIEF.md`, `design/`, `specs/`, `.specify/`, `.claude/`, `.gitignore`, `.gitattributes`: generate it with `npx create-expo-app@latest` in a temp folder, copy `package.json`, `tsconfig.json`, `app.json`→(replaced in T003), `assets/` and move the router root to `src/app/`; delete template demo screens/components; set `"strict": true` and path alias `@/*` → `src/*` in `tsconfig.json`
- [X] T002 Install runtime dependencies with `npx expo install expo-dev-client expo-router expo-widgets @expo/ui expo-notifications expo-sqlite expo-file-system expo-font @expo-google-fonts/fredoka @expo-google-fonts/nunito expo-haptics expo-linking expo-splash-screen react-native-svg react-native-reanimated react-native-worklets` and `npm i zustand`; verify `expo` resolves to ≥ 57.0.17 in `package.json` (research R1)
- [X] T003 Create `app.config.ts` (delete `app.json`): `name: "Wotah"`, `slug: "wotah"`, `scheme: "wotah"`, `userInterfaceStyle: "automatic"`, `ios.bundleIdentifier: "com.diulianovargas.wotah"` (confirmed by owner), `ios.deploymentTarget: "16.4"`, `ios.infoPlist.NSSupportsLiveActivities: true`, plugins: `expo-router`, `expo-sqlite`, `expo-notifications`, `["expo-font", { fonts: [Fredoka 500/600, Nunito 400/700/800 from @expo-google-fonts] }]`, `["expo-widgets", { groupIdentifier: "group.com.diulianovargas.wotah", enablePushNotifications: false, widgets: [] }]` per contracts/live-activity.md
- [X] T004 [P] Create `eas.json` with profiles `development` (`developmentClient: true`, `distribution: "internal"`), `preview` (`distribution: "internal"`, channel `preview`) and `production` (channel `production`) per research R2
- [X] T005 [P] Configure ESLint (`eslint-config-expo`) + Prettier in `eslint.config.js` and `.prettierrc`; add a `no-restricted-imports` rule scoped to `src/domain/**` that forbids `react`, `react-native`, `expo*`, `@expo/*` (Constitution I); add scripts `typecheck` (`tsc --noEmit`), `lint`, `test`, `format` to `package.json`
- [X] T006 [P] Configure Jest with the `jest-expo` preset in `jest.config.js` and `tests/setup.ts` (fake timers helper, mocks for `expo-notifications`, `expo-widgets`, `expo-haptics`, `expo-sqlite`); add devDependencies `@testing-library/react-native` and `sql.js` (WASM SQLite for repository tests, no native build on Windows)
- [X] T007 [P] Add CI in `.github/workflows/ci.yml`: on push/PR run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npx expo-doctor`
- [ ] T008 Run `npx eas-cli login`, `npx eas-cli init`, `npx eas-cli device:create`, then `npx eas-cli build -p ios --profile development`; install the dev client on the iPhone and confirm `npx expo start --dev-client` loads the app (quickstart › Setup)

**Checkpoint**: The empty app runs on the iPhone from a cloud dev build; CI is green.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Spikes, pure domain base, persistence, use-case plumbing, theme and app shell

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Spikes (research › Required spikes; record outcomes before US3/US4)

- [X] T009 Create a dev-only tools screen `src/app/dev/tools.tsx` (route reachable only when `__DEV__`) with buttons for: S1 "schedule test notification in 60 s with `DRINK` action and log responses to a list"; S2 "start test Live Activity with a `Bebi 💧` button that increments `pendingSips`, then show `getInstances()` props"; S3 "open `wotah-spike.db` in `Paths.appleSharedContainers['group.com.diulianovargas.wotah']` and print its path"; S4 "start a Live Activity rendering Fredoka text and a PNG from `widgetsDirectory`"
- [ ] T010 Rebuild the dev client (`eas build -p ios --profile development`), run spikes S1–S4 on the iPhone exactly as described in quickstart.md › Spikes, and append a `## Spike results` section to `specs/001-hydration-reminder-app/research.md` with pass/fail and the final decision for R4, R5, R6 and R10 (if S1 or S2 shows sips are lost → schedule Phase 9)

### Domain base (test-first)

- [X] T011 [P] Create `src/domain/types.ts` (`DayKey`, `Profile`, `Sip`, `SipSource = 'button' | 'notification_action' | 'notification_tap' | 'live_activity'`, `DaySummary`, `Reminder`, `MascotExpression = 'thirsty' | 'excited' | 'radiant' | 'celebrating'`, `TodayState`, `SurfaceState`) and `src/domain/constants.ts` (`GLASS_ML = 250`, `MIN_GOAL_ML = 500`, `MAX_GOAL_ML = 6000`, `MIN_WEIGHT_KG = 30`, `MAX_WEIGHT_KG = 250`, `ML_PER_KG = 35`, `MIN_REMINDER_INTERVAL_MIN = 30`) exactly as in data-model.md §1 and contracts/domain-api.md
- [X] T012 [P] Write failing table tests in `tests/domain/day.test.ts` for `dayKeyFor`, `windowFor`, `nextWindow`, `lastNDayKeys`: wake 8:00 at 07:59 → previous day; at 08:00 → same day; window 8:00–22:00 = 14 h; window crossing midnight (wake 10:00, sleep 1:00) → end next day 01:00 and a sip at 00:30 belongs to the previous dayKey; `lastNDayKeys('2026-10-22', 7)` ends with today; time zone cases run under `TZ=America/Sao_Paulo` and `TZ=Europe/Lisbon` (DST transition day), and a clock change across wake time moves `dayKeyFor` accordingly (edge case "Time zone or clock change")
- [X] T013 [P] Write failing table tests in `tests/domain/format.test.ts`: `formatLiters` 250→"0,25", 1250→"1,25", 2000→"2", 2500→"2,5", 2250→"2,25"; `formatProgress(1250, 2000)`→"1,25 / 2 L"; `formatClock` 14:30→"14h30", 14:00→"14h"; `formatCountdown` 45 min→"em 45 min", 105 min→"em 1h45"; `formatStreak` 0→null, 1→"🔥 1 dia", 5→"🔥 5 dias"
- [X] T014 Implement `src/domain/day.ts` (minutes-of-day arithmetic, `awakeDurationMinutes = (sleep − wake + 1440) % 1440`) to pass T012
- [X] T015 [P] Implement `src/domain/format.ts` to pass T013
- [X] T016 Create `src/domain/index.ts` re-exporting the public domain API

### Persistence

- [X] T017 Create `src/services/db/sqlDb.ts`: a minimal `SqlDb` interface (`exec`, `run`, `getFirst`, `getAll`, `transaction`) with an `expo-sqlite` implementation and a `sql.js` implementation in `tests/helpers/sqljsDb.ts` for tests
- [X] T018 Create `src/services/db/migrations.ts` applying schema v1 via `PRAGMA user_version` with the exact DDL from data-model.md §2, including the constraints verbatim: `weight_kg ... CHECK (weight_kg BETWEEN 30 AND 250)`, `daily_goal_ml ... CHECK (daily_goal_ml BETWEEN 500 AND 6000 AND daily_goal_ml % 250 = 0)`, `wake_minutes`/`sleep_minutes ... CHECK (... BETWEEN 0 AND 1439)`, `profile.id CHECK (id = 1)`, `sip.amount_ml INTEGER NOT NULL DEFAULT 250`, `sip.undone_at` nullable, tables `day`, `processed_event`, `scheduled_reminder`, index `sip_day ON sip(day_key, occurred_at)`
- [X] T019 Create `src/services/db/client.ts`: open `wotah.db` in the App Group directory from `Paths.appleSharedContainers` (or the default directory if spike S3 failed, per T010 result), run migrations once, export a singleton `SqlDb`
- [X] T020 [P] Write failing tests `tests/services/profileRepo.test.ts` (save/get single row; rejects weight 29 and goal 2600 via CHECK) then implement `src/services/db/profileRepo.ts` (`ProfileRepository`)
- [X] T021 [P] Write failing tests `tests/services/sipRepo.test.ts` (`add`; `totalFor` ignores `undone_at IS NOT NULL`; `undoLast` marks only the most recent non-undone sip of the dayKey and returns null when none; `lastSipAt`; upserting `day.goal_ml` on first sip of a day) then implement `src/services/db/sipRepo.ts` (`SipRepository` without `summaries`, added in US5)
- [X] T022 [P] Write failing tests `tests/services/eventLog.test.ts` (`seen`/`mark` on `processed_event`) then implement `src/services/db/eventLog.ts`

### Use-case plumbing

- [X] T023 Create `src/usecases/ports.ts` with the interfaces from contracts/domain-api.md (`SipRepository`, `ProfileRepository`, `EventLog`, `ReminderScheduler`, `LiveActivityPort`, `Clock`) and `tests/helpers/fakes.ts` with in-memory fakes and a `FixedClock`
- [X] T024 Write failing tests `tests/usecases/syncSideEffects.test.ts` asserting the gateway calls each registered effect (scheduler, live activity) with the current `TodayState` and then refreshes the store, and tolerates absent adapters; implement `src/usecases/syncSideEffects.ts` with pluggable effects (null adapters until US3/US4)
- [X] T025 Write failing tests `tests/usecases/getTodayState.test.ts` (profile + `FixedClock` → correct dayKey, total excluding undone sips, `lastSipAt`, goal from `day.goal_ml` falling back to the profile; no profile → null), then implement `src/usecases/getTodayState.ts`; create `src/usecases/container.ts` wiring real adapters (db repos, `SystemClock`, null scheduler/live activity for now) and exporting the use-case functions
- [X] T026 Create `src/state/store.ts` (Zustand) holding `profile`, `today`, `week`, `nextReminderAt`, `toast`; expose `refreshFromDb()` that rebuilds state from `getTodayState`

### Theme and app shell

- [X] T027 [P] Create `src/ui/theme/tokens.ts` with every color (light/dark), fixed mascot color, radius and shadow value from contracts/design-tokens.md, and `src/ui/theme/typography.ts` with roles `counter`, `title`, `body`, `button`, `caption` (Fredoka/Nunito weights and sizes, `tabular-nums` for counter, `allowFontScaling` with `maxFontSizeMultiplier` for the large non-accessibility sizes)
- [X] T028 [P] Create `src/ui/theme/useTheme.ts` returning tokens for `useColorScheme()` (FR-033)
- [X] T029 Create `src/app/_layout.tsx`: keep the splash until fonts load and DB migrations finish, hydrate the store, set the background from `bg`, and subscribe to `AppState` changes to call `reconcile()`. First write failing tests `tests/usecases/reconcile.rollover.test.ts` (when `FixedClock` crosses wake time, `reconcile` yields the new dayKey's `TodayState` with 0 ml and calls `syncSideEffects` once; same dayKey → only a refresh), then implement `src/usecases/reconcile.ts` to pass them
- [X] T030 Create route groups `src/app/(main)/_layout.tsx` and a placeholder `src/app/(main)/index.tsx` (Home) that renders `formatProgress` from the store

**Checkpoint**: Spikes recorded; domain base, DB, plumbing and theme ready; `npm test` green.

---

## Phase 3: User Story 1 - Log water and watch the bottle fill (Priority: P1) 🎯 MVP

**Goal**: Home with the animated bottle mascot, the "+" button, the progress counter, undo via
toast and long-press, and the four expressions.

**Independent Test**: With a goal set (dev default profile), tap "+" several times and check that
total, bottle and expression update, and that "Desfazer" reverts the last sip (quickstart scenario 2).

### Tests for User Story 1 (write first, must fail) ⚠️

- [X] T031 [P] [US1] Table tests in `tests/domain/progress.test.ts` for `expressionFor` (0 → thirsty, 499/2000 → thirsty, 500/2000 → excited, 1750/2000 → excited, 2000/2000 → radiant, 2250/2000 → celebrating; AS-1.5, FR-006) and `waterLevel` (capped at 1; FR-005)
- [X] T032 [P] [US1] Tests in `tests/usecases/registerSip.test.ts`: adds a 250 ml sip with source and dayKey from `FixedClock` (FR-001), returns updated `TodayState`, calls `syncSideEffects`, is idempotent when the same `eventKey` is passed twice, keeps counting above the goal (FR-007)
- [X] T033 [P] [US1] Tests in `tests/usecases/undoLastSip.test.ts`: reverts the most recent sip (AS-1.2/1.3), repeatable until 0, returns null and changes nothing at 0 ml (AS-1.4), calls `syncSideEffects`
- [X] T034 [P] [US1] Component tests in `tests/ui/PlusButton.test.tsx` (tap calls `onPress`; long-press ≥ 0.45 s opens "Desfazer último gole"; option disabled when `disabledUndo`) and `tests/ui/UndoToast.test.tsx` (visible after a sip, auto-hides after 4 s, "Desfazer" calls `onUndo`)

### Implementation for User Story 1

- [X] T035 [P] [US1] Implement `expressionFor` and `waterLevel` in `src/domain/progress.ts` to pass T031
- [X] T036 [US1] Implement `src/usecases/registerSip.ts` and `src/usecases/undoLastSip.ts` to pass T032/T033; expose both in `src/usecases/container.ts`
- [X] T037 [P] [US1] Port the `Mascote` SVG from `design/Wotah Sistema.html` (viewBox `-30 -30 260 320`, bottle path, clip path, two wave paths, cap, cheeks with opacity 0.35 for thirsty / 0.85 otherwise, the four expression groups, celebrating confetti + glow, shine stars for radiant/celebrating) into `src/ui/components/Mascot.tsx` using `react-native-svg`, props `progress`, `expression?`, `size`; colors via tokens `glass`, `water`, `waveBack`, `ink` plus fixed mascot colors
- [X] T038 [US1] Create `src/ui/animation/useSipAnimation.ts` (Reanimated 4): water `waterY = 278 − min(p,1) × 214` with an overshooting `withSpring` and a 280 ms delay; infinite opposite waves (2.6 s / 3.4 s linear); squash & stretch `1.06/.93 → .97/1.05 → 1` over 650 ms with a 300 ms delay only when the level rises; expression switch mid-jump; repeated taps retarget the spring without restarting; `useReducedMotion()` disables jump, drop and confetti (research R9); wire into `Mascot.tsx`
- [X] T039 [P] [US1] Create `src/ui/components/DropIcon.tsx` (drop-with-face SVG from Sistema §04; sizes 22/44/120; `withCheeks`) and `src/ui/components/ProgressCounter.tsx` ("1,25 / 2 L" with `counter` role; unit in `ink2` at ~0.53×)
- [X] T040 [P] [US1] Implement `src/ui/components/PlusButton.tsx` (≥ 44 pt target, `plusButton` token, press-in scale to 92% within 150 ms, long-press 0.45 s menu "Desfazer último gole") and `src/ui/components/UndoToast.tsx` (4 s, inverted colors in dark mode) to pass T034
- [X] T041 [P] [US1] Create `src/services/haptics.ts` (light impact on sip, success notification on goal met) and `src/ui/components/FlyingDrop.tsx` (drop from "+" to the bottle neck, 0–520 ms, accelerating; skipped with Reduce Motion)
- [X] T042 [US1] Compose Home in `src/app/(main)/index.tsx` per `design/Wotah Telas.html` › Home: mascot centered, counter below, "+" in the thumb zone, undo toast, "Bom trabalho! 🎉" title when goal met (FR-018 visual) with ~1 s confetti burst + success haptic, glow/shine above goal (FR-007)
- [X] T043 [US1] Write a failing test `tests/usecases/devProfile.test.ts` (`ensureDevProfile` creates `{ weightKg: 70, dailyGoalMl: 2000, wakeMinutes: 480, sleepMinutes: 1320, remindersEnabled: true, onboardingCompleted: true }` only when no profile exists and `isDev` is true; never overwrites), then implement it in `src/usecases/devProfile.ts` and call it from `src/usecases/container.ts` when `__DEV__` (removed in T058), so US1 is testable before onboarding exists

**Checkpoint**: US1 works on the device as the MVP counter (quickstart scenario 2).

---

## Phase 4: User Story 2 - Set the goal and routine on first use (Priority: P1)

**Goal**: Onboarding weight → goal → schedule → permission, Settings, and the notifications-off notice.

**Independent Test**: Clean install, finish onboarding (70 kg → 2,5 L), Home shows the goal and
Settings reflect the values (quickstart scenario 1 and 9).

### Tests for User Story 2 (write first, must fail) ⚠️

- [X] T044 [P] [US2] Table tests in `tests/domain/goal.test.ts`: `suggestGoalMl` 70 → 2500 (AS-2.1), 30 → 1000, 60 → 2000, 250 → 6000 (clamped), and clamped to [500, 6000]; `stepGoalMl` ±250 with clamps at 500 and 6000 (FR-010)
- [X] T045 [P] [US2] Table tests in `tests/domain/reminders.estimate.test.ts` for `estimateIntervalMinutes(profile)` used by the schedule screen hint: 8:00–22:00 with 2000 ml → 105 min ("~1h45"); 30-minute floor
- [X] T046 [P] [US2] Tests in `tests/usecases/updateProfile.test.ts`: changes apply immediately and preserve today's total (AS-2.5, FR-011); changing the goal updates today's `day.goal_ml` (FR-028); turning reminders off calls the scheduler `cancelAll`; lowering the goal to ≤ today's total marks the day as met, schedules only the next-window chain and requests the celebration (edge case "Goal changed mid-day"); calls `syncSideEffects`
- [X] T047 [P] [US2] Tests in `tests/usecases/completeOnboarding.test.ts`: saves the profile with `onboardingCompleted = true` whether permission is granted or declined (FR-008)
- [X] T048 [P] [US2] Component test `tests/ui/onboarding.test.tsx`: steps appear in order weight → goal → schedule → permission; pressing "Continuar" on each step with defaults (70 kg, 2,5 L, 08:00/22:00) reaches Home (SC-001)

### Implementation for User Story 2

- [X] T049 [P] [US2] Implement `src/domain/goal.ts` to pass T044 and `estimateIntervalMinutes` in `src/domain/reminders.ts` to pass T045
- [X] T050 [US2] Implement `src/usecases/updateProfile.ts` and `src/usecases/completeOnboarding.ts` to pass T046/T047
- [X] T051 [P] [US2] Create `src/ui/components/WheelPicker.tsx` (weight 30–250, default 70; times in 30-minute steps; VoiceOver adjustable) and `src/ui/components/Stepper.tsx` (− / + by 250 ml, shows "10 copos de 250 ml")
- [X] T052 [P] [US2] Create `src/ui/components/Pill.tsx` (primary/secondary tones) and `src/ui/components/SuggestGoalCard.tsx` (mint card "Com 72 kg, a sugestão é 2,5 L por dia. Quer atualizar sua meta?" with "Atualizar pra …" / "Manter …"; FR-012)
- [X] T053 [US2] Create onboarding screens in `src/app/(onboarding)/weight.tsx` ("Quanto você pesa?"), `goal.tsx` ("Sua meta diária", suggestion text "Pra 70 kg, a gente sugere 2,5 L por dia. Pode ajustar do seu jeito."), `schedule.tsx` ("Que horas você acorda e dorme?" + hint "14 horas acordado · um lembrete a cada ~1h45"), with a draft profile held in `src/app/(onboarding)/_layout.tsx`; copy texts verbatim from `design/Wotah Telas.html`
- [X] T054 [US2] Create `src/services/notifications/permissions.ts` (`getPermission`, `requestPermission` via `expo-notifications`) and `src/app/(onboarding)/permission.tsx` ("Posso te dar um toquinho?", sample notification preview, "Permitir lembretes" / "Agora não"); both choices call `completeOnboarding` and replace to Home (AS-2.3)
- [X] T055 [US2] Add the onboarding gate in `src/app/_layout.tsx`: redirect to `(onboarding)/weight` when no profile or `onboardingCompleted = false`, otherwise to `(main)`
- [X] T056 [US2] Create `src/app/(main)/settings.tsx` per `design/Wotah Telas.html` › Ajustes: weight (shows `SuggestGoalCard` when the suggestion differs; never changes the goal by itself), goal stepper, wake/sleep pickers, reminders toggle with the explanatory text; all via `updateProfile`; add a settings entry point on Home
- [X] T057 [US2] Create `src/ui/components/RemindersOffBanner.tsx` and show it on Home when permission ≠ granted or reminders are off, with a button calling `Linking.openSettings()` (AS-2.4)
- [X] T058 [US2] Remove the dev default profile call from `src/usecases/container.ts` and delete `src/usecases/devProfile.ts` and `tests/usecases/devProfile.test.ts` (added in T043)

**Checkpoint**: A fresh install goes through onboarding and lands on a working Home (US1 + US2).

---

## Phase 5: User Story 3 - Receive reminders and log straight from the notification (Priority: P1)

**Goal**: Reminder chain inside the awake window, the "Bebi 💧" action, body tap logging,
rescheduling on every sip and stopping at the goal.

**Independent Test**: Short window + small goal; reminders arrive; "Bebi 💧" logs without opening
the app; no reminders after the goal (quickstart scenarios 3–5).

### Tests for User Story 3 (write first, must fail) ⚠️

- [X] T059 [P] [US3] Table tests in `tests/domain/reminders.test.ts` for `planReminders`: AS-3.1 (2000 ml, 8:00–22:00, 0 ml at 08:00 → interval 105 min → 8 reminders at 09:45 … 20:15, 22:00; bedtime itself is allowed, only *after* it is forbidden — needed so AS-3.7/FR-019 work with 1 glass left); AS-3.4 (sip at 10:00 → first = 10:00 + recomputed interval); AS-3.5 (consumed ≥ goal → no reminders today); AS-3.6 (now after sleep → none until next window start); AS-3.7 (after undo below goal → chain returns); late start at 15:00; 30-minute floor for short windows; nothing at or after window end; window crossing midnight; `remindersEnabled = false` → []; next-window chain included; total ≤ 48 at the 6000 ml goal
- [X] T060 [P] [US3] Table tests in `tests/domain/messages.test.ts` for `pickMessage`: message 8 only when `remainingGlasses = 1`; message 7 never when `consumedMl = 0`; "{n}" singular/plural ("1 copo"/"2 copos"); "{x}" uses `formatLiters`; deterministic for a given seed; all 8 texts verbatim from contracts/notifications.md
- [X] T061 [P] [US3] Tests in `tests/services/scheduler.test.ts` (mocked `expo-notifications`): `replaceAll` cancels all scheduled notifications then schedules each with `identifier: rem:${dayKey}:${index}`, `categoryIdentifier: 'WOTAH_REMINDER'`, `trigger: { type: 'date' }`, and records rows in `scheduled_reminder`; nothing is scheduled when permission ≠ granted
- [X] T062 [P] [US3] Tests in `tests/services/responses.test.ts`: `DRINK` → `registerSip('notification_action', 'notif:<id>:DRINK')`; default action → `registerSip('notification_tap', …)` and a toast request; the same response twice logs once; two different notifications log twice (double-tap edge case)
- [X] T063 [P] [US3] Tests in `tests/usecases/syncSideEffects.reminders.test.ts`: crossing into goal met replaces the schedule with only the next-window chain (FR-018, SC-003); undo below the goal reschedules today (FR-019); a sip reschedules from the sip time (FR-015)

### Implementation for User Story 3

- [X] T064 [US3] Implement `planReminders` in `src/domain/reminders.ts` (algorithm in data-model.md §4) to pass T059
- [X] T065 [P] [US3] Implement `src/domain/messages.ts` (`pickMessage`) to pass T060
- [X] T066 [P] [US3] Create `src/services/notifications/categories.ts` registering category `WOTAH_REMINDER` with action `{ identifier: 'DRINK', buttonTitle: 'Bebi 💧', options: { opensAppToForeground: false } }`, and `setNotificationHandler` (`shouldShowBanner: true`, `shouldShowList: true`, `shouldPlaySound: false`)
- [X] T067 [US3] Implement `src/services/notifications/scheduler.ts` (`ReminderScheduler`: `replaceAll`, `cancelAll`, and `permission` delegating to `getPermission` from `src/services/notifications/permissions.ts` (T054), with no second permission implementation) to pass T061
- [X] T068 [US3] Implement `src/services/notifications/responses.ts` (`handleNotificationResponse`) to pass T062; register `addNotificationResponseReceivedListener` at module scope in `src/app/_layout.tsx` before the component, and call `getLastNotificationResponse()` inside `reconcile()` (cold start + every `AppState → active`)
- [X] T069 [US3] Plug the scheduler into `src/usecases/syncSideEffects.ts` (plan with `planReminders`, then `replaceAll`) to pass T063; call `registerCategories()` at boot in `src/app/_layout.tsx`
- [X] T070 [P] [US3] Create `src/ui/components/NextReminderHint.tsx` ("Próximo lembrete às 14h30" / "Lembretes só amanhã" when the goal is met / hidden when reminders are off) and add it to Home; store `nextReminderAt` in `src/state/store.ts`
- [X] T071 [US3] Show the "Desfazer" toast on Home when the app opens from a body tap (FR-017), driven by the toast request from T068
- [ ] T072 [US3] Rebuild the dev client and validate quickstart scenarios 3, 4 and 5 on the iPhone; note results in `specs/001-hydration-reminder-app/research.md` › Spike results

**Checkpoint**: US1–US3 (all P1) work end to end. This is a shippable v1 without the Live Activity.

---

## Phase 6: User Story 4 - Follow along on the Dynamic Island and lock screen (Priority: P2)

**Goal**: Live Activity started on app open, updated on every sip, with the "Bebi 💧" button,
celebration and end, plus reconciliation of sips made while the app was not running.

**Independent Test**: On an iPhone with Dynamic Island, the compact form shows progress; the
expanded "Bebi 💧" logs a sip and everything agrees (quickstart scenarios 6–7).

### Tests for User Story 4 (write first, must fail) ⚠️

- [X] T073 [P] [US4] Table tests in `tests/domain/surface.test.ts` for `toSurfaceState(today, nextReminderAt)`: fields `consumedMl`, `goalMl`, `progress`, `expression`, `nextReminderAt` (null when reminders are off, notification permission is not granted, or the goal is met), `celebrating`, `consumedLabel`, `goalLabel` per data-model.md §6; plus `tests/widgets/WotahDay.test.ts` asserting the compiled widget defines every region, uses target `wotah-drink` and contains no business rule (the former parity test is moot: Live Activity buttons never run `onPress`, research › Implementation findings)
- [X] T074 [P] [US4] Tests in `tests/services/liveActivity.test.ts` (mocked `expo-widgets`): `ensureStarted` starts only if the goal is not met and `getInstances()` is empty (FR-021) with URL `wotah://home?sip=1` when the iOS major version is < 17 and `wotah://home` otherwise; `update` forwards the state (FR-024); `celebrateAndEnd` updates with `celebrating: true` then ends with `after(now + 5 min)` (FR-025); `readPending` returns `{ activityId, seq, pendingSips }`
- [X] T075 [P] [US4] Tests in `tests/usecases/liveActivityEffect.test.ts`: starts once when the goal is not met (FR-021); every sip updates it with the next reminder (FR-024); crossing the goal ends it with the celebration after 5 min (FR-025); a met day never starts one; an activity left running on a met day is ended on the next run; restarted after the 8-hour expiry (AS-4.7); `handleLiveActivityInteraction` logs one sip per tap event (`la:<source>:<timestamp>`) and ignores other targets

### Implementation for User Story 4

- [X] T076 [P] [US4] Implement `src/domain/surface.ts` (`toSurfaceState`) to pass T073
- [X] T077 [US4] Build `src/widgets/WotahDay.tsx` with `createLiveActivity('WotahDay', …)` and the `'widget'` directive, using only `@expo/ui/swift-ui` and constants declared inside the function: regions `compactLeading` (drop 22 pt), `compactTrailing` ("1,25" in `#9FD8EA` + "/ 2 L" in white, monospaced digits), `minimal` (drop + 37 pt ring), `expandedLeading/Trailing/Center/Bottom` (bar, "Próximo lembrete em …" relative to `nextReminderAt` and hidden when it is `null` (FR-022), "Bebi 💧" pill), `banner` (lock screen card), celebrating state ("Bom trabalho! 🎉", "Meta de hoje batida. Lembretes só amanhã!", mint bar, no button); fonts/images per spike S4 result (contracts/live-activity.md)
- [X] T078 [US4] Add the "Bebi 💧" `Button` with `target="wotah-drink"` (no `onPress`: the tap is an in-process event handled by the app) in `src/widgets/WotahDay.tsx`, and register `addUserInteractionListener` → `handleLiveActivityInteraction` at module scope
- [X] T079 [US4] Implement `src/services/liveActivity.ts` (`LiveActivityPort`) to pass T074
- [X] T080 [US4] Extend `src/usecases/reconcile.ts` to pass T075 and plug the live activity port into `src/usecases/syncSideEffects.ts` (ensureStarted on `AppState → active`, update on every change, celebrateAndEnd on goal met)
- [X] T081 [US4] Register `addUserInteractionListener` in `src/app/_layout.tsx`, matching `event.source` against `instance.getId()`, and call `reconcile()` (works around issue #49828 by also reconciling on `AppState` changes)
- [X] T082 [US4] Handle the `wotah://home?sip=1` deep link (activity tap on iOS < 17) in `src/app/(main)/index.tsx`: call `registerSip('live_activity')`, show the "Desfazer" toast, then `router.replace('/')` to drop the param so a reload does not log twice; first add a failing component test in `tests/ui/homeDeepLink.test.tsx` (param present → one sip + toast; param absent → no sip)
- [ ] T083 [US4] Rebuild the dev client and validate quickstart scenarios 6 and 7 on an iPhone with Dynamic Island (consistency ≤ 2 s with the app alive; exactly-once import after the app was terminated)

**Checkpoint**: US1–US4 work; the Live Activity mirrors the app.

---

## Phase 7: User Story 5 - See the week's history and streak (Priority: P3)

**Goal**: 7-day strip (full/partial/empty) and the "🔥 n dias" streak on Home.

**Independent Test**: With a seeded week, the strip and streak match which days met the goal
(quickstart scenario 8).

### Tests for User Story 5 (write first, must fail) ⚠️

- [X] T084 [P] [US5] Table tests in `tests/domain/history.test.ts` for `classifyDay` (0 → empty; 0 < x < goal → partial; ≥ goal → full; AS-5.1) and `computeStreak` (met yesterday and the day before, today not yet → 2 (AS-5.2); meeting today → 3 (AS-5.3); a missed day resets to 0 (AS-5.4); each day compared with its own goal)
- [X] T085 [P] [US5] Extend `tests/services/sipRepo.test.ts` with `summaries(keys)`: days without rows return `{ consumedMl: 0, goalMl: profile goal }`; undone sips excluded
- [X] T086 [P] [US5] Component tests `tests/ui/WeekStrip.test.tsx` (7 items with statuses and PT-BR accessibility labels) and `tests/ui/StreakBadge.test.tsx` (hidden at 0; "🔥 1 dia"; "🔥 5 dias")

### Implementation for User Story 5

- [X] T087 [P] [US5] Implement `classifyDay` and `computeStreak` in `src/domain/progress.ts` to pass T084
- [X] T088 [US5] Implement `summaries` in `src/services/db/sipRepo.ts` to pass T085; add `week` and `streak` to `getTodayState`/`src/state/store.ts`
- [X] T089 [P] [US5] Create `src/ui/components/WeekStrip.tsx` and `src/ui/components/StreakBadge.tsx` to pass T086; add both to Home
- [X] T090 [US5] Add a "Seed week" button to `src/app/dev/tools.tsx` that inserts 6 past days (met, met, partial, empty, met, partial) for validation, and change quickstart scenario 8 in `specs/001-hydration-reminder-app/quickstart.md` from `npm run seed:week` to "Dev tools › Seed week"

**Checkpoint**: All five user stories work independently.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, visuals, privacy and release readiness

- [X] T091 [P] Add `tests/ui/contrast.test.ts` computing WCAG contrast for `ink`/`ink2` on `bg`/`surface` and the button text on `plusButton`, in both themes, asserting ≥ 4.5:1 (or ≥ 3:1 for large text); adjust tokens only if a pair fails and note it in plan.md (Constitution V/VI)
- [ ] T092 Accessibility pass on every screen and component: PT-BR `accessibilityLabel`/`accessibilityHint` (e.g. "+" → "Registrar um copo de 250 ml"; mascot → "Garrafa com 1,25 de 2 litros, animada"), touch targets ≥ 44 pt, and layouts verified at the largest non-accessibility Dynamic Type size (research R14)
- [X] T093 [P] Create the app icon (`assets/icon.png`, 1024 × 1024, drop with face on the `#D8F2F9 → #9FD8EA` gradient from Sistema §04) and the splash config in `app.config.ts`
- [ ] T094 [P] Verify dark mode on every screen against contracts/design-tokens.md, including the inverted toast and the slightly grey glass
- [X] T095 [P] Add `scripts/check-no-telemetry.mjs` (fails if `package.json` contains analytics/crash SDKs such as `sentry`, `firebase`, `amplitude`, `segment`, `mixpanel`) and run it in `.github/workflows/ci.yml` (Constitution II)
- [ ] T096 Measure the sip animation with the RN Performance Monitor on the device (60 fps target, SC-006) and cold start to Home (< 2 s); fix regressions
- [X] T097 [P] Write `README.md` (English): what Wotah is, Mac-free setup, scripts, project structure, links to spec/plan/constitution
- [ ] T098 Run the full quickstart.md (automated checks + manual scenarios 1–11 + offline) and then `eas build -p ios --profile preview` to TestFlight; fill the App Store privacy label as "Data Not Collected"

---

## Phase 9: Native fallback (Swift) — adopted by the owner on 2026-10-22

**Purpose**: Constitution III escape hatch, recorded in plan.md › Complexity Tracking. The owner chose
Swift for the "Bebi 💧" Live Activity tap with the app terminated (code reading showed the tap is an
in-process event that JS misses when the app was killed). Business rules stay in TypeScript.

- [X] T099 [US4] Create the local Expo Module `modules/wotah-native` (iOS only; `expo-module.config.json`, `WotahNative.podspec`), autolinked from `modules/`
- [X] T100 [US4] `WotahAppDelegateSubscriber.swift`: in `subscriberDidRegister` (before the intent runs and before JS loads) observe expo-widgets' `onExpoWidgetsUserInteraction` notification and persist each tap via `PendingInteractions.swift` in the App Group `UserDefaults` (`ExpoWidgetsAppGroupIdentifier`, max 200 entries)
- [X] T101 [US4] `WotahNativeModule.swift` exposes `drainPendingInteractions()`; `modules/wotah-native/index.ts` wraps it with `requireOptionalNativeModule` (no-op in Jest)
- [X] T102 [US4] `importPendingInteractions` (tests in `tests/usecases/liveActivityEffect.test.ts`) imports queued taps with the same `la:<source>:<timestamp>` keys as the live listener, so a tap delivered both ways counts once; `bootApp`/`onForeground` drain the queue
- [ ] T103 [US3] Only if spike S1 shows notification-action sips are lost with the app terminated: add the equivalent native capture for the `DRINK` action (without replacing expo-notifications' delegate) and drain it the same way

---

## Phase 10: Opening screen (FR-035) — added 2026-10-22

**Purpose**: the animated opening screen from `design/Wotah Splash.html`, using the two-stage
approach in plan.md › Increment — Opening screen. Contract: [contracts/splash.md](./contracts/splash.md).
Decisions: research R15 (two stages, timing, Reduce Motion, dark), R16 (image size per
platform), R17 (PNG rendering). It applies to every cold start, so it has no user-story label.

**Independent test**: kill the app and open it on a preview build. The static bottle hands over
to the animated screen with no jump or blank frame, then fades into onboarding or Home in < 2 s
(quickstart scenario 12).

### Native stage (static OS splash)

- [X] T104 Add the dev-only renderer with `npx expo install @resvg/resvg-js -- --save-dev` (it must land in `devDependencies` of `package.json` and never be imported from `src/`; research R17); confirm `node scripts/check-no-telemetry.mjs` still passes
- [X] T105 Create `scripts/render-splash-image.mjs` and the npm script `"render:splash": "node scripts/render-splash-image.mjs"` in `package.json`. It builds an SVG string (viewBox `-30 -30 260 320`, transparent background) with the mascot's **first animation frame**, copying the path data verbatim from `src/ui/components/Mascot.tsx` (header comment: "keep in sync with Mascot.tsx"): `excited` arms (`M33 182 q-22 -2 -32 -20`, `M167 182 q22 -2 32 -20`), feet, `BOTTLE` filled with the glass color, the water group clipped to `BOTTLE` and translated by `waterY(0.6) = 278 − 0.6 × 214 = 149.6` with `WAVE_BACK` at translateX 0 and `WAVE_FRONT` at translateX −100, the outline, highlight, cap and stripes, cheeks at opacity 0.85 and the `excited` face. No glow, confetti or sparkles. It renders twice at 540 px wide with `@resvg/resvg-js`: `assets/images/splash-mascot.png` (glass `#FFFFFF`, water `#9FD8EA`, waveBack `#C4EAF4`) and `assets/images/splash-mascot-dark.png` (glass `#D3E6EC`, water `#7FBFD4`, waveBack `#A6D3E0`); fixed character colors come from `mascotColors` in `src/ui/theme/tokens.ts`
- [X] T106 Run `npm run render:splash`, open both PNGs and compare them with the mascot on Home at 60% (same art, same wave phase); commit the PNGs
- [X] T107 Update the `expo-splash-screen` plugin entry in `app.config.ts` exactly as in contracts/splash.md §1: `backgroundColor: '#F3F9FB'`, `image: './assets/images/splash-mascot.png'`, `imageWidth: 180`, `dark: { backgroundColor: '#121D25', image: './assets/images/splash-mascot-dark.png' }`, `android: { imageWidth: 120 }` (R16). Delete `assets/images/splash-icon.png`, which this makes unused (only `app.config.ts` referenced it)

### In-app stage (AnimatedSplash)

- [X] T108 [P] Add the splash tokens from contracts/design-tokens.md › Splash to both `lightColors` and `darkColors` in `src/ui/theme/tokens.ts`: `splashTop` (`#E3F4F9` / `#172631`), `splashBottom` (`#FDEDE6` / `#241F23`) and `splashGlowOpacity` (`0.45` / `0.25`, a number; the glow color is the `water` token). Check that `tests/ui/contrast.test.ts` still type-checks, since `ColorTokens` is `typeof lightColors`
- [X] T109 [P] Write `tests/ui/AnimatedSplash.test.tsx` first (it must fail), following the patterns in `tests/ui/UndoToast.test.tsx` (fake timers) and `tests/ui/Mascot.test.tsx`. Mock `expo-splash-screen` (`hide: jest.fn()`). Assert that: (1) the root has `accessibilityLabel` "Wotah, carregando"; (2) `SplashScreen.hide` is called once after the first layout; (3) with `ready` true at mount, `onDone` is NOT called before 900 ms and is called exactly once after 900 + 280 ms; (4) with `ready` false, `onDone` is never called, and flipping `ready` to true later calls it once after the 280 ms fade; (5) cases 3–4 hold with `useReducedMotion` mocked to `true`
- [X] T110 Implement `src/ui/components/AnimatedSplash.tsx` (`{ ready: boolean; onDone: () => void }`) per contracts/splash.md §2 so T109 passes:
  - **Layout**: absolute full-screen overlay. A solid `colors.bg` base, then an `Svg` layer with a vertical `LinearGradient` (`splashTop` 0 → `bg` 0.55 → `splashBottom` 1) and a 420 pt `RadialGradient` glow (`water` at `splashGlowOpacity` → 0 at 65%) whose center is 50 pt above the screen center. A centered content column (`gap` 22, `paddingBottom` 60) holds `<Mascot level={0.6} expression="excited" width={180} />`, "wotah" (`fonts.fredokaSemiBold`, 52, `lineHeight` 52, `letterSpacing` −0.5, `ink`) and "Um golinho de cada vez" (`fonts.nunitoBold`, 16, `ink2`) with `gap` 6, both with `maxFontSizeMultiplier={MAX_FONT_SCALE}`. Three 9 × 9 dots (radius 5, `gap` 8, `plusButton`) sit 64 pt above the bottom safe-area inset. Tokens come only from `useTheme()`.
  - **First frame and hand-off**: measure the mascot wrapper with `onLayout`, then set its initial transform so it matches the native image: `translateY = windowHeight / 2 − mascotCenterY`, `scale = (Platform.OS === 'android' ? 120 : 180) / 180`. Keep the gradient, glow, texts and dots at opacity 0. Call `SplashScreen.hide()` once, in a `requestAnimationFrame` after that transform is applied.
  - **Enter, full motion**: gradient and glow opacity 0 → 1 over 300 ms; mascot transform → identity over 450 ms (`Easing.out(Easing.cubic)`); texts and dots opacity 0 → 1 with translateY 8 → 0 over 350 ms after a 150 ms delay. Then the dots pulse forever in sequence (opacity .25 → 1, 900 ms cycle, 150 ms stagger).
  - **Enter, Reduce Motion** (`useReducedMotion`): no transform. All layers cross-fade to the final layout in 250 ms, and the dots stay static at 1 / .55 / .25.
  - **Exit**: once `ready` is true, entering has ended and ≥ 900 ms have passed since mount, fade the overlay opacity 1 → 0 over 280 ms, then call `onDone` exactly once (via `scheduleOnRN`/`runOnJS`, matching the project's Reanimated 4 usage). Set `pointerEvents="none"` while leaving.
  - **Accessibility**: the root is `accessible` with `accessibilityRole="image"`, `accessibilityLabel="Wotah, carregando"` and `accessibilityViewIsModal`; children use `importantForAccessibility="no-hide-descendants"`.
- [X] T111 Wire the overlay into `src/app/_layout.tsx`: keep the module-scope `SplashScreen.preventAutoHideAsync()`; remove the effect that calls `SplashScreen.hideAsync()` (AnimatedSplash hides the native stage now); render nothing until `fontsLoaded`. After that, render the `Stack` (with its current `Stack.Protected` guards) once `ready` is true, and render `<AnimatedSplash ready={ready} onDone={() => setSplashDone(true)} />` absolutely on top until `splashDone`. The overlay must sit above the navigator so the exit fade reveals onboarding or Home. Keep `StatusBar` as is
- [X] T112 Run `npm test` and fix any existing UI test that renders the root layout or relied on `hideAsync` (e.g. `tests/ui/homeDeepLink.test.tsx`, `tests/ui/onboarding.test.tsx`), then `npm run typecheck`, `npm run lint` and `npx expo-doctor`; all must pass

### Device validation

- [X] T113 Rebuild, since the splash plugin config changed: `npx eas-cli build -p android --profile preview` (the native stage is only reliable on preview/release builds, quickstart scenario 12) and, for day-to-day work, `npx eas-cli build -p android --profile development`. iOS waits for the paid Apple account (same constraint as T008)
- [ ] T114 Run quickstart scenario 12 on Android in light, dark and Reduce Motion modes, and when returning from the background. Confirm the bottle is not cropped by the circular mask, the hand-off has no jump, and cold start to Home is < 2 s. Record the result and the owner's confirmation of the dark gradient under research.md › R15 (adjust `splashTop`/`splashBottom` dark values in `src/ui/theme/tokens.ts` and contracts/design-tokens.md if the owner asks)
- [ ] T115 Once an iOS build is possible, repeat scenario 12 on the iPhone (folded into T098's full quickstart run)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies. T008 needs T001–T003.
- **Foundational (Phase 2)**: depends on Setup. T010 (spikes) depends on T009 and blocks T019 (DB location) and Phases 5–6 decisions. Blocks all user stories.
- **US1 (Phase 3)**: after Foundational.
- **US2 (Phase 4)**: after Foundational; T058 removes US1's dev profile, so it runs after T043.
- **US3 (Phase 5)**: after Foundational; uses `estimateIntervalMinutes` from T049 (same file `src/domain/reminders.ts`, so T064 follows T049) and the permission service from T054.
- **US4 (Phase 6)**: after Foundational; integrates `nextReminderAt` from US3 (works with `null` if US3 is absent).
- **US5 (Phase 7)**: after Foundational; independent of US2–US4.
- **Polish (Phase 8)**: after the desired stories.
- **Phase 9**: only if spikes fail; after US3 (T099–T101) and US4 (T102–T103).
- **Phase 10 (opening screen)**: independent of the user stories (the app shell from T029 already exists). Order: T104 → T105 → T106 → T107; T108 and T109 can run in parallel with T104–T107; T110 needs T108 and T109; T111 needs T110; T112 needs T107 and T111; T113 needs T112; T114 needs T113; T115 needs an iOS build (T008).

### User Story Dependencies

- **US1 (P1)**: none (uses the dev default profile).
- **US2 (P1)**: none functionally; replaces the dev profile.
- **US3 (P1)**: needs a profile (US2 or dev profile) and the permission service (T054).
- **US4 (P2)**: independent; richer with US3's `nextReminderAt`.
- **US5 (P3)**: independent.

### Within Each User Story

- Tests first (must fail) → domain → use cases → services → UI → device validation.
- Files shared across stories (`src/domain/reminders.ts`, `src/domain/progress.ts`, `src/usecases/syncSideEffects.ts`, `src/app/_layout.tsx`, `src/app/(main)/index.tsx`) are edited sequentially, never in parallel.

### Parallel Opportunities

- Setup: T004, T005, T006, T007 in parallel after T001–T003.
- Foundational: T011–T013 together; T015 with T014; T020–T022 together; T027–T028 together.
- Each story's test tasks marked [P] run together, followed by [P] implementation tasks on distinct files.
- After Foundational, US1, US4 and US5 can be developed in parallel; US2 and US3 follow US1 in practice because of shared screens.
- Phase 10: T108 (tokens) and T109 (failing test) in parallel with the native-stage chain T104 → T107.

---

## Parallel Example: User Story 1

```bash
# Tests first (all fail):
Task: "T031 Table tests for expressionFor/waterLevel in tests/domain/progress.test.ts"
Task: "T032 Tests for registerSip in tests/usecases/registerSip.test.ts"
Task: "T033 Tests for undoLastSip in tests/usecases/undoLastSip.test.ts"
Task: "T034 Component tests in tests/ui/PlusButton.test.tsx and tests/ui/UndoToast.test.tsx"

# Then independent implementation files:
Task: "T035 progress.ts"   Task: "T037 Mascot.tsx"   Task: "T039 DropIcon + ProgressCounter"
Task: "T040 PlusButton + UndoToast"   Task: "T041 haptics + FlyingDrop"
```

## Parallel Example: User Story 3

```bash
Task: "T059 tests/domain/reminders.test.ts"
Task: "T060 tests/domain/messages.test.ts"
Task: "T061 tests/services/scheduler.test.ts"
Task: "T062 tests/services/responses.test.ts"
Task: "T063 tests/usecases/syncSideEffects.reminders.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → Phase 2 Foundational (including spikes).
2. Phase 3 US1 → **stop and validate** on the iPhone (quickstart scenario 2).

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → animated counter (MVP demo).
3. US2 → real onboarding/settings.
4. US3 → reminders: **shippable v1** (all P1 stories) via TestFlight.
5. US4 → Live Activity / Dynamic Island.
6. US5 → history and streak.
7. Polish → release build. Phase 9 only if the spikes demand it.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- Commit after each task or logical group, in English and the imperative mood (Constitution workflow).
- Native rebuilds (`eas build`) only at T008, T010, T072, T083, T098 or when a native dependency changes.
- Never edit a generated `ios/` folder; all native configuration goes through `app.config.ts`.
