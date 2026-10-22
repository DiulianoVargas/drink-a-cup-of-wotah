# Implementation Plan: Wotah — Hydration reminder with a bottle mascot

**Branch**: `001-hydration-reminder-app` | **Date**: 2026-10-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-hydration-reminder-app/spec.md`

## Summary

An iOS hydration-reminder app with an animated bottle mascot. It is built with **Expo SDK 57** (no
Mac, EAS cloud builds), **`expo-widgets`** for the Live Activity/Dynamic Island,
**`expo-notifications`** for local reminders with the "Bebi 💧" action and **`expo-sqlite`** for
local history. The business rules (goal, logical day, reminder chain, expression, streak, PT-BR
formatting) live in a **pure, deterministic TypeScript core** (`src/domain/`) behind ports, so a
future Swift/SwiftUI migration is translation only. The UI uses `design/Wotah Sistema.html` as the
source of tokens and components, and the other `design/` HTMLs as visual reference.

The main technical risk ([research.md](./research.md) R4/R5) is logging sips **while the app is
not running** (the notification action and the Live Activity button). Following the user's
decision, v1 stays Expo-only, with the caveat accepted in the spec. Three things keep sips from
being lost: the **whole reminder chain** is scheduled ahead of time, the app **reconciles
idempotently** on its next run, and an isolated **native fallback** (Swift Expo Module) is adopted
only if spikes S1/S2 show sips would be lost.

## Technical Context

**Language/Version**: TypeScript (`strict`) on React Native 0.86 / React 19.2 (Expo SDK 57, patch ≥ 57.0.17). Swift only in the conditional fallback (`modules/wotah-native`).

**Primary Dependencies**: `expo` 57, `expo-router`, `expo-dev-client`, `expo-widgets` + `@expo/ui` (SwiftUI), `expo-notifications`, `expo-sqlite`, `expo-file-system`, `expo-font` + `@expo-google-fonts/fredoka` and `@expo-google-fonts/nunito`, `expo-haptics`, `react-native-svg`, `react-native-reanimated` 4, `zustand`.

**Storage**: local SQLite (`expo-sqlite`) with the database in the App Group `group.<bundleId>` (pending spike S3). Schema in [data-model.md](./data-model.md#2-persistence-sqlite-srcservicesdb). No server (FR-031).

**Testing**: Jest + `jest-expo` (domain and use cases, test-first, with an injected clock), `@testing-library/react-native` (critical UI interactions), `expo-notifications`/`expo-widgets` mocks for scheduling plans. Manual on-device validation per [quickstart.md](./quickstart.md). Maestro via EAS Workflows is optional.

**Target Platform**: iOS 16.4+ (SDK minimum). The interactive Live Activity button requires iOS 17+, and the Dynamic Island requires a compatible model. Android is not a v1 target, but the domain and UI stay portable.

**Project Type**: mobile app (a single Expo app with CNG; no committed `ios/` folder).

**Performance Goals**: sip animation at 60 fps on the UI thread (SC-006) and < 1.5 s in total. App, LA and next reminder consistent within 2 s of a sip while the app is running, or within 2 s of the next run otherwise (SC-005). Cold start to Home < 2 s.

**Constraints**: 100% offline (SC-008); no account; no push; ≤ 48 pending notifications (iOS limit: 64). The Live Activity is subject to the 8-hour limit and iOS update budgets. The widget runtime is isolated (`@expo/ui/swift-ui` only; no hooks, imports or storage). All UI text is PT-BR and all code and docs are English. Light and dark modes, Reduce Motion and Dynamic Type are supported. No analytics or telemetry.

**Scale/Scope**: 1 user per device; 6 screens (onboarding: weight, goal, schedule, permission; Home; Settings); 1 Live Activity; 5 tables; 7-day history in the UI. The home-screen widget is deferred to v2.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against `.specify/memory/constitution.md` v1.0.0.

| Principle | Pre-Phase 0 | Post-Phase 1 | Evidence |
|---|---|---|---|
| I. Portable Domain Core | ✅ | ✅ | `src/domain` is pure with an injected clock; ports in [domain-api](./contracts/domain-api.md); single `syncSideEffects` gateway; one justified exception (inline thresholds in the widget runtime), see Complexity Tracking |
| II. Local-First, Zero Data Collection | ✅ | ✅ | SQLite on device, local notifications, LA without push; no analytics/crash SDK in the dependency list |
| III. Expo-First, Native by Exception | ✅ | ✅ | `expo-widgets` + CNG. The Swift module is conditional on spikes S1/S2 and listed in Complexity Tracking |
| IV. Domain Test-First | ✅ | ✅ | Spec acceptance scenarios map to table tests (R12, data-model §4); manual device scenarios in quickstart |
| V. Design System Fidelity | ✅ | ✅ | [design-tokens](./contracts/design-tokens.md) extracted from `Wotah Sistema.html`; tokens only via `useTheme()` |
| VI. Kind, Accessible PT-BR Experience | ✅ | ✅ | PT-BR strings verbatim from the design; no guilt copy; R14 accessibility; docs in English |
| VII. Simplicity & Justified Dependencies | ✅ | ✅ | Every dependency justified in research; one app; widget deferred to v2 |

Technical Constraints: iOS minimum, EAS-only builds, stack baseline, the notification window and
64-pending rules, and the performance targets are all reflected in Technical Context.

Result: **PASS**. No unjustified violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-hydration-reminder-app/
├── plan.md              # This file
├── research.md          # Phase 0: decisions, risks, spikes S1–S4
├── data-model.md        # Phase 1: entities, SQLite, logical day, reminder planning
├── quickstart.md        # Phase 1: EAS setup + validation script
├── contracts/
│   ├── domain-api.md    # pure domain API + use cases/ports
│   ├── notifications.md # category, action, texts, idempotency
│   ├── live-activity.md # regions, props, button, lifecycle
│   └── design-tokens.md # tokens and components from Wotah Sistema.html
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
app.config.ts             # bundleId, plugins: expo-widgets, expo-notifications, expo-font, expo-sqlite
eas.json                  # development / preview / production profiles
src/
├── app/                  # Expo Router
│   ├── _layout.tsx       # fonts, theme, boot (register categories, response listener, reconcile)
│   ├── (onboarding)/     # weight.tsx, goal.tsx, schedule.tsx, permission.tsx
│   └── (main)/           # index.tsx (Home), settings.tsx
├── domain/               # pure TS: constants, goal, day, progress, reminders, messages, format, types
├── usecases/             # registerSip, undoLastSip, updateProfile, completeOnboarding, reconcile, syncSideEffects
├── services/             # port adapters
│   ├── db/               # client.ts (App Group path), migrations.ts, sipRepo.ts, profileRepo.ts, eventLog.ts
│   ├── notifications/    # scheduler.ts, responses.ts, categories.ts
│   ├── liveActivity.ts
│   └── haptics.ts
├── state/store.ts        # Zustand (derived read state + toast)
├── ui/
│   ├── theme/            # tokens.ts, useTheme.ts, typography.ts
│   └── components/       # Mascot, DropIcon, ProgressRing, PlusButton, UndoToast, WeekStrip, ...
└── widgets/
    └── WotahDay.tsx      # createLiveActivity ('widget' directive)
modules/
└── wotah-native/         # (CONDITIONAL fallback) Swift Expo Module: LiveActivityIntent + notification delegate
tests/
├── domain/               # table tests per FR/AS
├── usecases/             # with port fakes and a fixed clock
└── ui/                   # RNTL
assets/                   # icon (drop), splash, mascot PNGs for the LA (if S4 requires them)
```

**Structure Decision**: a single Expo app (mobile app) with CNG. The boundaries are `domain` (pure)
→ `usecases` (orchestration via ports) → `services` (Expo/native) → `app`/`ui` (React).
`modules/wotah-native` is created only if spike S1 or S2 shows sips would be lost.

## Phase 0 — Research (complete)

See [research.md](./research.md). No `NEEDS CLARIFICATION` remains. Decisions:
- SDK 57 (R1)
- EAS + dev client + CNG (R2)
- pure domain with ports (R3)
- reminder chain + idempotent reconciliation (R4)
- Expo-only Live Activity with an accepted caveat and a conditional native fallback (R5)
- SQLite in the App Group (R6)
- Zustand (R7)
- Expo Router (R8)
- SVG + Reanimated mascot (R9)
- tokens from Sistema (R10)
- widget deferred to v2 (R11)
- Jest/RNTL (R12)
- logical day (R13)
- accessibility (R14)

## Phase 1 — Design (complete)

- [data-model.md](./data-model.md): Profile, Sip, Day, Reminder (computed), MascotExpression, SurfaceState; SQLite schema; day/window rules; reminder chain algorithm; state transitions.
- [contracts/](./contracts/): domain-api, notifications, live-activity, design-tokens.
- [quickstart.md](./quickstart.md): Mac-free setup, spikes and a manual script per user story.

**Suggested order for `/speckit-tasks`**:
0. scaffolding + EAS dev build + spikes S1–S4
1. domain, test-first
2. DB + use cases
3. tokens + Mascot + Home/US1
4. onboarding/US2 + Settings
5. notifications/US3
6. Live Activity/US4
7. history/US5
8. polish: dark mode, Reduce Motion, accessibility, icon/splash

## Complexity Tracking

| Potential violation | Why it may be needed | Simpler alternative rejected because |
|---|---|---|
| Expression/celebration thresholds repeated inline in `src/widgets/WotahDay.tsx` (Constitution I) | The `'widget'` runtime cannot import `src/domain`, but the button must update the face and celebration immediately with the app closed (FR-024/FR-025) | Leaving the props stale shows a wrong expression and no celebration; drift is prevented by a parity test against `toSurfaceState` (T073) |
| Swift Expo Module `modules/wotah-native` (conditional, Constitution III) | FR-016/FR-023 require logging a sip without opening the app, exactly once. The `expo-widgets` runtime cannot reach storage or notifications, and iOS background actions may not run JS | "Reconcile on next run" is the accepted default. It is only insufficient if spikes S1/S2 show the pending sips cannot be recovered at all (i.e. they would be lost) |
