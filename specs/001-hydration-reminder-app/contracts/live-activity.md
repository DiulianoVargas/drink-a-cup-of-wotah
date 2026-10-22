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

```ts
// inside the 'widget' component
<Button target="drink" onPress={() => ({
  ...props,
  consumedMl: props.consumedMl + 250,
  pendingSips: props.pendingSips + 1,
  progress: (props.consumedMl + 250) / props.goalMl,
  seq: props.seq + 1,
})}>Bebi 💧</Button>
```

- Updates the activity on the device, even with the app terminated.
- With the app alive: `addUserInteractionListener` (compare `event.source` with `instance.getId()`) → `reconcile()` imports `pendingSips`, logs the sips (`source: 'live_activity'`), resets `pendingSips` via `update()` and reschedules.
- With the app terminated: the import happens on the next `reconcile()` (cold start/foreground) by reading the instance's current props. This caveat is accepted in the spec (Clarifications, FR-023, SC-005). **⚠️ Spike S2**: if the props cannot be read back, sips would be lost, and the native fallback (research R5) is adopted.
- iOS < 17: no button. Tapping the activity opens `wotah://home` (spec edge case).

## Lifecycle

| Trigger | Action |
|---|---|
| `AppState → active`, goal not met and `getInstances()` empty | `start(state, 'wotah://home')` (FR-021) |
| Any sip/undo/goal change | `update(state)` (FR-024) |
| Goal met | `update({ ...state, celebrating: true })` → `end('default', state, …)` with `after(now + 5 min)` (FR-025) |
| Undo drops below the goal after the activity ended | new activity only on the next app open |
| Expired (8 h) | nothing; restarts on the next app open (FR-026) |
| Reminders turned off | the activity continues (it is independent of notifications); `nextReminderAt = null` hides the "Próximo lembrete" line |
