# Wotah 💧

An iOS hydration reminder with an animated bottle mascot. Tap **+** and the bottle fills; reminders
arrive at the right pace to reach your goal before bed; log a glass straight from the notification
or the Dynamic Island with **"Bebi 💧"**. Everything stays on the device: no account, no server, no
analytics.

The app UI is in Brazilian Portuguese. Code and docs are in English.

## Stack

- **Expo SDK 58** (React Native 0.88, React 19.3) with Continuous Native Generation (no `ios/` folder
  is committed)
- `expo-widgets` + `@expo/ui` for the Live Activity / Dynamic Island
- `expo-notifications` for local reminders with the "Bebi 💧" action
- `expo-sqlite` for local history (database in the App Group)
- `react-native-svg` + `react-native-reanimated` for the mascot
- Jest (`jest-expo`) + Testing Library; SQLite repositories are tested on `sql.js` (WASM)

## Getting started (no Mac needed)

```bash
npm install
npx expo-doctor
npx eas-cli login
npx eas-cli device:create                         # register your iPhone once
npx eas-cli build -p ios --profile development    # cloud dev client
npx expo start --dev-client                       # Metro on Windows/Linux/macOS
```

Expo Go runs everything except the Live Activity and the Swift module (`npm run go`), but the App
Store Expo Go only supports the newest SDK: SDK 58 support is due a few weeks after 2026-10-16.
The full app (Live Activity, Swift module) needs a development build. Rebuild natively only when a native dependency or `app.config.ts` changes.

## Scripts

| Script | What it does |
|---|---|
| `npm test` | Unit, use-case and component tests (plus DST tests under `TZ=Europe/Lisbon`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`eslint-config-expo`), including the "pure domain" import rule |
| `npm run check:privacy` | Fails if an analytics/telemetry SDK is added |

## Project structure

```text
src/
├── domain/       pure TypeScript business rules (no React/Expo; clock injected) — portable to Swift
├── usecases/     registerSip, undoLastSip, updateProfile, reconcile… + side-effect gateway
├── services/     SQLite, notifications, Live Activity, haptics (adapters for the ports)
├── state/        Zustand read store + onboarding draft
├── ui/           theme tokens (from design/Wotah Sistema.html) and components (Mascot, PlusButton…)
├── widgets/      WotahDay Live Activity ('widget' directive, isolated runtime)
└── app/          Expo Router screens: (onboarding), (main), dev/tools
tests/            mirrors src/ (domain tables per spec scenario, use cases, UI)
design/           visual references (HTML bundles); Wotah Sistema.html is the token source
specs/            Spec Kit: spec, plan, research, data model, contracts, quickstart, tasks
```

## Documentation

- [Constitution](.specify/memory/constitution.md): the project's non-negotiable principles
- [Spec](specs/001-hydration-reminder-app/spec.md) · [Plan](specs/001-hydration-reminder-app/plan.md) ·
  [Research](specs/001-hydration-reminder-app/research.md) ·
  [Tasks](specs/001-hydration-reminder-app/tasks.md)
- [Quickstart / device validation](specs/001-hydration-reminder-app/quickstart.md)

## Status

All five user stories are implemented and covered by automated tests. On-device validation (spikes
S1–S4 and the manual scenarios in the quickstart) is still pending; see `tasks.md` for the open tasks.
