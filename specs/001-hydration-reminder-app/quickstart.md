# Quickstart — validating Wotah

How to set up the environment and prove, end to end, that the feature works. Rules:
[data-model.md](./data-model.md); interfaces: [contracts/](./contracts/).

## Prerequisites

- Windows with Node.js LTS (≥ 20), Git and `npm`.
- Expo account (`npx eas-cli login`) and a **paid Apple Developer** account linked to EAS.
- iPhone with iOS 17+ (Dynamic Island for US4; iOS 16.4–16.x validates only US1–3 and US5) on the same Wi-Fi as the PC (or use `--tunnel`).

## Setup

```bash
npm install
npx expo-doctor                     # must pass with no errors
npx eas-cli device:create           # register the iPhone (once)
npx eas-cli build -p ios --profile development   # cloud dev client (~15–25 min)
# install the build from the EAS link/QR (or TestFlight)
npx expo start --dev-client         # Metro on Windows; open the app on the iPhone
```

Native rebuild (`eas build`) **only** when a native dependency, `app.config.ts` or a config plugin
changes. JS changes reload through Metro.

## Automated validation (Windows)

```bash
npm run typecheck     # tsc --noEmit
npm run lint
npm test              # Jest: domain (spec tables) + use cases + components + scheduling plan
```

Expected: every numeric acceptance scenario in the spec passes in the domain (AS-2.1, AS-3.1,
AS-3.4–3.7, AS-5.1–5.4, plus the window, day rollover, 30-minute floor and weight/goal range
edge cases).

## Spikes (run before building US3/US4; see research › Required spikes)

| ID | Steps | Expected result |
|---|---|---|
| S1 | Schedule a test notification 1 min out → terminate the app (swipe up) → tap "Bebi 💧" → open the app | total +250 ml, no duplicate |
| S2 | Open the app (LA starts) → terminate the app → expand the island → "Bebi 💧" ×2 → open the app | the LA showed +500 immediately; the app imports exactly 2 sips on open |
| S3 | Log the `wotah.db` path | inside `.../Shared/AppGroup/<id>/` |
| S4 | LA with Fredoka and a drop PNG | renders, or falls back to SF Rounded |

Record each spike's outcome in `research.md` (final decision).

## Manual scenarios on the iPhone

1. **Onboarding (US2, SC-001)**: clean install → 70 kg → suggests **2,5 L** → "−" gives 2,25 → 8:00 / 22:00 → "Permitir lembretes" → Home in < 1 min.
2. **Logging and undo (US1)**: "+" ×2 → "0,5 / 2 L"; the bottle rises with a spring and the mascot turns "excited" when crossing 25% → "Desfazer" on the toast → back to 0,25 → long-press "+" 0.45 s → "Desfazer último gole" → 0 → undo unavailable.
3. **Reminders (US3)**: in Settings, window = now → now + 2 h, goal 1 L. Expect reminders every ~30 min (2 h ÷ 4 glasses). Tap "Bebi 💧" on the notification without opening the app → open the app: total +250 and "Próximo lembrete" recomputed. Meet the goal → "Bom trabalho! 🎉" and **no** notification until the next wake time (SC-003). Undo a sip → reminders return.
4. **Body tap (FR-017)**: the app opens with +250 ml and the "Desfazer" toast.
5. **Outside the window (SC-004)**: window already over for today → no reminder until tomorrow at wake time.
6. **Live Activity (US4)** (on an iOS 16.4–16.x device, tapping the activity must open the app with +250 ml and the "Desfazer" toast): open the app → compact island "drop + 0,25 / 2 L" → long-press to expand → "Bebi 💧" → island, app and "next reminder" consistent in ≤ 2 s with the app alive (SC-005) → meet the goal → "Bom trabalho! 🎉" and the activity disappears in ~5 min.
7. **Live Activity with the app suspended vs. terminated (SC-005, spike S2)**: (a) leave the app in the background → "Bebi 💧" on the lock screen → the activity and app update within 2 s, exactly once; (b) terminate the app (swipe up) → "Bebi 💧" → record whether the sip is logged when the app next opens. Expected with Expo only: (a) works, (b) may be lost without a wrong value being shown — record the result in research.md; if (b) loses sips, decide on Phase 9.
8. **History (US5)**: with the dev seed (Home › dev › "Seed week", dev builds only), the strip shows full/partial/empty and "🔥 2 dias"; meeting today's goal → "🔥 3 dias".
9. **Notifications denied**: decline during onboarding → Home shows the discreet notice; "+" works normally.
10. **Dark mode, Reduce Motion and accessibility**: toggle in iOS Settings → dark theme colors from `design-tokens.md`; with Reduce Motion there is no jump or confetti; VoiceOver reads PT-BR labels on every control; layouts hold at the largest non-accessibility Dynamic Type size.
11. **Offline (SC-008)**: airplane mode → scenarios 2, 3 and 8 all work.
