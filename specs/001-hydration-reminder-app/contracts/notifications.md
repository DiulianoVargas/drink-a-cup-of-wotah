# Contract — Local notifications

Implementation: `src/services/notifications/` on top of `expo-notifications` (R4).

## Category and action

| Item | Value |
|---|---|
| `categoryIdentifier` | `WOTAH_REMINDER` |
| Action | `identifier: "DRINK"`, `buttonTitle: "Bebi 💧"`, `options.opensAppToForeground: false` |
| Registration | `setNotificationCategoryAsync` at app boot, before any scheduling |

## Content of each reminder

```ts
{
  identifier: `rem:${dayKey}:${index}`,
  content: {
    title, body,                       // pickMessage(...)
    categoryIdentifier: 'WOTAH_REMINDER',
    sound: 'default',
    data: { kind: 'reminder', dayKey, index },
  },
  trigger: { type: 'date', date: fireAt },
}
```

## Texts (FR-020; source: `design/Wotah Live Activity.html`). User-facing, PT-BR verbatim

| # | Title | Body |
|---|---|---|
| 1 | Hora de um golinho! 💧 | Faltam {n} copos pra meta de hoje. |
| 2 | Psiu… tô com sedinha 🥺 | Um copo agora e eu fico felizona. |
| 3 | Bora de água? 💧 | 250 ml e você já tá mais pertinho. |
| 4 | Pausa pra hidratar ✨ | Pega um copo, respira, volta. Pronto! |
| 5 | Sua garrafinha lembrou de você | Bebe um copinho comigo? |
| 6 | Glub glub? 💦 | Só um copo e a gente segue o dia. |
| 7 | Um golinho pra dar energia ☀️ | Já são {x} L hoje. Bora pro próximo? |
| 8 | Falta pouquinho! 💧 | Mais 1 copo e a meta de hoje tá feita. *(only when `n = 1`)* |

Rules: `{n}` uses singular/plural ("1 copo" / "2 copos"). `{x}` uses `formatLiters`. Message 7 is
not used when consumption is 0. Never use guilt language (Constitution VI).

## Response handling

| Event | `actionIdentifier` | Effect |
|---|---|---|
| Tap on "Bebi 💧" | `DRINK` | `registerSip('notification_action')` without opening the app (FR-016) |
| Tap on the body | `expo.modules.notifications.actions.DEFAULT` | opens the app → `registerSip('notification_tap')` → Home with the "Desfazer" toast (FR-017) |

- The handler is registered at the entry module's scope (before render) and also checked via `getLastNotificationResponse()` on cold start and on every `AppState → active`.
- Idempotency: `event_key = notif:${request.identifier}:${actionIdentifier}` in `processed_event`. An already-processed response is ignored. Taps on different notifications always count (edge case "double tap": each tap logs a sip).
- In the foreground, `setNotificationHandler` shows the banner (`shouldShowBanner: true`, `shouldShowList: true`, `shouldPlaySound: false`).

## Scheduling

- `replaceAll(reminders)`: cancels all `rem:*` notifications (`cancelAllScheduledNotificationsAsync`, since the app has no other notifications) and schedules the new list. The list has ≤ 48 items, below the 64 pending notifications iOS allows.
- Notifications disabled (spec edge case): `permission() !== 'granted'` → nothing is scheduled and Home shows the discreet notice with a link to system Settings (`Linking.openSettings()`).
- Permission is requested **only** at onboarding step 4, after the "Posso te dar um toquinho?" explainer screen.
