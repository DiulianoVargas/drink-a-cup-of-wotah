<!--
Sync Impact Report
- Version change: (unratified template) → 1.0.0
- Principles defined (all new):
  I. Portable Domain Core
  II. Local-First, Zero Data Collection
  III. Expo-First, Native by Exception
  IV. Domain Test-First (NON-NEGOTIABLE)
  V. Design System Fidelity
  VI. Kind, Accessible PT-BR Experience
  VII. Simplicity & Justified Dependencies
- Added sections: Technical Constraints; Development Workflow & Quality Gates; Governance
- Removed sections: none
- Templates: none modified (they read this file at runtime)
- Follow-up (resolved 2026-10-22):
  - specs/001-hydration-reminder-app/* translated to English (Principle VI).
  - plan.md Constitution Check now maps to Principles I–VII.
-->

# Wotah Constitution

## Core Principles

### I. Portable Domain Core

- All business rules (goal, logical day/awake window, reminder planning, mascot expression,
  streak, PT-BR formatting) MUST live in `src/domain/` as pure, deterministic TypeScript.
- `src/domain/` MUST NOT import `react`, `react-native`, `expo-*` or any platform module, and
  MUST NOT read the clock, storage or network directly: time is injected (`now: Date`).
- Platform effects (SQLite, notifications, Live Activity, widgets, haptics) MUST be reached only
  through ports defined by the domain/use-case layer and implemented in `src/services/`.
- Every write that changes sips or profile MUST go through a use case that ends in a single
  side-effect sync (reminders + Live Activity + UI state).

**Rationale**: a future Swift/SwiftUI rewrite must be a translation, not a redesign; the same
table-driven test cases port 1:1 to XCTest.

### II. Local-First, Zero Data Collection

- The app MUST work fully offline. No server, no account, no remote push in v1.
- No analytics, telemetry, crash-reporting or advertising SDKs. No user data leaves the device.
- All data (profile, sips, history) MUST be stored on-device only; the App Store privacy label
  MUST be "Data Not Collected".
- Any future feature that sends data off-device requires a constitution amendment first.

**Rationale**: hydration habits and body weight are personal; the product promise is a simple,
private companion.

### III. Expo-First, Native by Exception

- The app MUST be built with Expo (current stable SDK) using Continuous Native Generation:
  no hand-edited `ios/`/`android/` folders are committed; native config comes from
  `app.config.ts` and config plugins.
- iOS system surfaces (Live Activity, Dynamic Island, home-screen widgets) MUST use
  `expo-widgets` + `@expo/ui` first.
- Native code (Swift) is allowed ONLY as a local Expo Module under `modules/` and ONLY when a
  documented spike proves an Expo API cannot meet a functional requirement. The decision MUST
  be recorded in the feature's `research.md` and in the plan's Complexity Tracking.
- Native modules MUST reuse the domain rules (ported verbatim, same test cases) and the same
  shared storage; they MUST NOT introduce divergent business logic.

**Rationale**: the team has no Mac and wants speed now, while keeping a clean path to native
integration and performance later.

### IV. Domain Test-First (NON-NEGOTIABLE)

- Code in `src/domain/` and `src/usecases/` MUST be written test-first: a failing test exists
  before the implementation (Red → Green → Refactor).
- Every numeric acceptance scenario and edge case in a spec MUST map to at least one
  table-driven test (with a fixed injected clock).
- UI code MUST have component tests for critical interactions (register sip, undo toast,
  long-press undo, onboarding flow); test-first is not required for UI.
- Behaviour that cannot be automated (notifications, Live Activity, Dynamic Island) MUST have a
  manual device scenario in the feature's `quickstart.md` and be executed before release.

**Rationale**: reminder timing and day boundaries are easy to get subtly wrong and costly to
debug on a device built in the cloud.

### V. Design System Fidelity

- `design/Wotah Sistema.html` is the single source of truth for tokens (colors light/dark,
  typography, radii) and base components (mascot, mini drop icon, progress ring).
- The other `design/*.html` files are the visual reference for screens and states.
- Screens and components MUST consume tokens via the theme layer (`src/ui/theme/`); raw hex
  values are allowed only inside mascot/drop artwork with fixed character colors.
- Light and dark modes MUST both be supported; dark mode keeps pastel tones desaturated (no neon).
- A visual change that diverges from the design files MUST be noted in the feature's plan.

**Rationale**: the mascot and pastel identity must look like one family across app, Live
Activity, notification and widgets.

### VI. Kind, Accessible PT-BR Experience

- All user-facing text (UI, notifications, Live Activity, widgets) MUST be Brazilian Portuguese,
  short and friendly; guilt or blame language ("Você falhou", "Está desidratado!") is forbidden.
- Code identifiers, comments, commit messages, specs, plans and other project documentation
  MUST be written in English.
- Logging a sip MUST never take more than one tap from any entry point.
- Accessibility minimum: VoiceOver labels in PT-BR on every interactive control; touch targets
  ≥ 44 pt; text contrast WCAG AA; honor Reduce Motion (no bounce, flying drop or confetti);
  support Dynamic Type up to the large (non-accessibility) sizes without clipping.

**Rationale**: the product is a cute friend that cheers you on, usable by everyone.

### VII. Simplicity & Justified Dependencies

- One Expo app; no monorepo, backend or extra packages until a requirement demands it.
- Every new runtime dependency MUST be justified in `research.md` (decision, rationale,
  alternatives). Prefer Expo SDK packages, installed via `npx expo install`.
- No speculative features: only what the active spec requires (YAGNI). Designed-but-unspecified
  items (e.g. home-screen widget) MUST be added to a spec before being built.

**Rationale**: a small surface keeps cloud builds fast and a future native port cheap.

## Technical Constraints

- **Platform**: iOS first (minimum = Expo SDK minimum, currently iOS 16.4); interactive Live
  Activity/widget buttons require iOS 17+ and MUST degrade to "tap opens the app" below that.
  Android is not a v1 target but MUST NOT be blocked by domain or UI design choices.
- **Build**: all native builds via EAS Build in the cloud; development uses `expo-dev-client`
  (Expo Go is not supported). Native rebuilds only when native deps or config plugins change.
- **Stack baseline**: TypeScript `strict`; Expo Router; `expo-sqlite` for persistence (shared
  App Group container when available); `expo-notifications` for local reminders;
  `react-native-reanimated` + `react-native-svg` for the mascot. Changing any baseline item
  requires a `research.md` entry.
- **Notifications**: never scheduled outside the user's awake window; never more than the iOS
  pending limit (64); reminders stop for the day once the goal is met.
- **Performance**: sip animation runs on the UI thread at 60 fps; app, Live Activity and next
  reminder become consistent within 2 s of a sip while the app process is alive.
- **Dates**: device local time is the only clock; the logical day starts at the user's wake time.

## Development Workflow & Quality Gates

- Work follows Spec Kit: `/speckit-specify` → `/speckit-clarify` (as needed) → `/speckit-plan`
  → `/speckit-tasks` → `/speckit-implement`. Plans MUST include a Constitution Check against
  Principles I–VII, re-evaluated after design.
- Risky platform assumptions (background execution, widget runtime, shared storage) MUST be
  validated by an on-device spike before dependent work starts; outcomes are recorded in
  `research.md`.
- Before any build is shared (TestFlight/preview), all of these MUST pass:
  `typecheck`, `lint`, `test`, `npx expo-doctor`, and the feature's `quickstart.md` device
  scenarios.
- Each change set SHOULD be small and scoped to one task; commits in English, imperative mood.

## Governance

- This constitution supersedes conflicting practices, specs and plans. When a spec or plan
  conflicts with it, the constitution wins until amended.
- **Amendments**: proposed via `/speckit-constitution`, with the rationale and impact on existing
  specs/plans stated in the Sync Impact Report; the project owner approves.
- **Versioning** (semantic): MAJOR = removal or redefinition of a principle; MINOR = new
  principle/section or materially expanded guidance; PATCH = wording/clarification only.
- **Compliance**: every `/speckit-plan` Constitution Check and every `/speckit-analyze` run MUST
  verify these principles; any justified exception MUST appear in the plan's Complexity Tracking.

**Version**: 1.0.0 | **Ratified**: 2026-10-22 | **Last Amended**: 2026-10-22
