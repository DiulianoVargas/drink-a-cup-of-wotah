# Contract — Live Activity / Dynamic Island (`expo-widgets`)

Implementation: `src/widgets/WotahDay.tsx` (component with the `'widget'` directive) +
`src/services/liveActivity.ts` (`LiveActivityPort`). Visual reference:
`design/Wotah Live Activity.html`.

## Config plugin (`app.config.ts`)

```ts
plugins: [
  ['expo-widgets', {
    groupIdentifier: 'group.<bundleId>',   // the same App Group used by SQLite (R6)
    enablePushNotifications: false,        // no server (FR-026)
    widgets: [],                           // home-screen widget deferred to v2 (R11)
  }],
]
```

## Props (`SurfaceState`, see [data-model §6](../data-model.md#6-snapshot-for-system-surfaces-surfacestate))

A flat JSON object: no `Date`, no functions and no references to module scope. The `'widget'`
directive runs in an isolated runtime and can only use `@expo/ui/swift-ui`.

## Regions

| Region | Content | Reference sizes (iPhone 15/16 Pro) |
|---|---|---|
| `compactLeading` | drop with a face (22 pt) | island 126 × 37 pt; leading 22 pt |
| `compactTrailing` | "**1,25** / 2 L" (drunk amount in water blue `#9FD8EA`, goal in white), Nunito 800/13 pt or SF Rounded heavy, `monospacedDigit` | trailing ~64 pt |
| `minimal` | drop + progress ring (37 pt, track `rgba(159,216,234,.25)`, stroke `#9FD8EA`) | |
| `expandedLeading` / `expandedTrailing` / `expandedCenter` | "Wotah" + mini bottle / "1,25 / 2 L" | 371 × 172 pt, radius 44, 22 pt margins |
| `expandedBottom` | progress bar + "Próximo lembrete em 45 min" + **"Bebi 💧"** pill | |
| `banner` (lock screen) | same as expanded, in a 361 × ~120 pt card on a light translucent background | height < 160 pt |
| `celebrating` state | "Bom trabalho! 🎉" + "Meta de hoje batida. Lembretes só amanhã!"; no button; mint bar (`#BEEBD8`); compact shows "Meta! 🎉" with the mint drop | |

## "Bebi 💧" button (iOS 17+)

```tsx
// inside the 'widget' component: no onPress — Live Activity buttons cannot run JS
<Button label="Bebi 💧" target="wotah-drink" />
```

- **How it works (verified in `expo-widgets` 57 source, research › Implementation findings)**: the
  button runs `LiveActivityUserInteraction`, a `LiveActivityIntent` that only posts an in-process
  event; `onPress` is never evaluated for Live Activities. `addUserInteractionListener`
  (registered at module scope) → `handleLiveActivityInteraction` → `registerSip('live_activity',
  { eventKey: 'la:<source>:<timestamp>' })` → the normal sync updates the activity, the app and the
  reminders.
- **App suspended** (common case): iOS resumes the process, the event reaches JS, everything updates
  within 2 s. **App terminated**: the event is probably delivered before JS starts and is lost; the
  activity does not change, so nothing wrong is shown (spike S2 measures this; reliable delivery needs
  the Phase 9 native fallback).
- Props are fully computed by `toSurfaceState` (domain), including `consumedLabel`/`goalLabel`; the
  widget only renders, so no business rule is duplicated (Constitution I).
- iOS < 17: no button. The activity is started with `Linking.createURL('/', { queryParams: { sip: '1' } })`
  (`wotah:///?sip=1`); tapping it opens Home, which logs one sip (`live_activity`, with the
  "Desfazer" toast) and clears the param (T082).

## Lifecycle

| Trigger | Action |
|---|---|
| Any sync (boot, foreground, sip, settings) with the goal not met and no running activity | `start(state, url)` with `wotah:///?sip=1` on iOS < 17, `wotah:///` on iOS 17+ (FR-021, AS-4.7) |
| Any sip/undo/goal change | `update(state)` (FR-024) |
| Goal met | `end(after(now + 5 min), { ...state, celebrating: true })` — shows "Bom trabalho! 🎉" then goes away (FR-025) |
| Undo drops below the goal after the activity ended | new activity only on the next app open |
| Expired (8 h) | nothing; restarts on the next app open (FR-026) |
| Goal reached via the button while the app was terminated | activity shows the celebrating state; `reconcile()` ends it on the next app run (FR-025) |
| Reminders turned off | the activity continues (it is independent of notifications); `nextReminderAt = null` hides the "Próximo lembrete" line |
