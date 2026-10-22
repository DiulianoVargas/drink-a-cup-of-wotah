# Feature Specification: Wotah — Hydration reminder with a bottle mascot

**Feature Branch**: `001-hydration-reminder-app`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "iOS app (Expo, iOS focus) for hydration reminders, 'Wotah', with an animated bottle mascot. Use all decisions already made in SPEC.md at the project root: fixed 250 ml glass + '+' button and undo last sip; goal suggested by weight (35 ml/kg, multiples of 250 ml, editable); reminders computed from the wake/sleep window ÷ remaining glasses, rescheduled on every sip, none outside the window; notification with a 'Bebi 💧' action that logs without opening the app; once the goal is met, stop notifying for the day and show 'Bom trabalho! 🎉', keep counting above the goal; local Live Activity/Dynamic Island with no server (compact with progress, expanded/lock screen with bar, countdown to next reminder and a 'Bebi 💧' button), starts when the app opens, 8 h limit accepted; local 7-day history + streak; onboarding weight → goal → schedule → permission; cute pastel illustrated look with a mascot whose expressions change with the level; PT-BR only."

> **Language note**: this document is in English (Constitution, Principle VI). Every quoted
> user-facing string ("Bebi 💧", "Desfazer", "1,25 / 2 L", …) is the exact PT-BR text the app shows.

## Clarifications

### Session 2026-10-22

- Q: Is the home-screen widget (small/medium/large, designed in `design/Wotah Widgets.html`) part of v1? → A: No. It is deferred to v2 and listed as out of scope.
- Q: Does SC-003 (no reminders after the goal) hold when the goal is reached by sips logged while the app is not running? → A: Not until the app next runs. Already-scheduled reminders may still arrive in that window; this is accepted for v1 (no native code), consistent with the answer below.
- Q: On devices without the interactive live activity button (older OS), what does tapping the activity do? → A: It opens the app and logs a sip with the "Desfazer" toast, like tapping a reminder's body, so logging stays one tap from every entry point.
- Q: How is a sip logged from the Live Activity or a notification action handled while the app is not running? → A: The tap is captured natively and processed when iOS wakes the app in the background (usually within seconds), exactly once; the activity, history and reminders then update. If processing is delayed, it completes the next time the app runs. (Updated 2026-10-22: a small native module was adopted because the Live Activity button cannot run JavaScript.)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Log water and watch the bottle fill (Priority: P1)

The user opens the app and sees a bottle mascot that represents the day's progress toward the goal. Each time they drink a glass, they tap "+" and the bottle rises 250 ml with an animation. The mascot's expression changes with the level. If they tap by mistake, they can undo the last sip.

**Why this priority**: This is the core of the app. Without logging water and seeing progress there is no product. On its own, this story already delivers a useful visual water counter.

**Independent Test**: With a goal already set, tap "+" several times and check that the total, the bottle and the mascot expression update, and that "Desfazer" reverts the last entry.

**Acceptance Scenarios**:

1. **Given** a 2 L goal and 0 ml logged, **When** the user taps "+", **Then** the total becomes 250 ml, the bottle rises proportionally with an animation and the progress shows "0,25 / 2 L".
2. **Given** a sip was just logged, **When** the user taps "Desfazer" on the temporary toast, **Then** the total returns to its previous value and the bottle goes down.
3. **Given** the "Desfazer" toast has already disappeared, **When** the user long-presses "+" and chooses "Desfazer último gole", **Then** the most recent sip of the day is removed.
4. **Given** 0 ml logged today, **When** the user tries to undo, **Then** the option is unavailable and nothing changes.
5. **Given** the day's progress, **When** it crosses 0%, ~50%, 100% and above 100%, **Then** the mascot shows, respectively, the "thirsty", "excited", "radiant" and "celebrating" expressions.

---

### User Story 2 - Set the goal and routine on first use (Priority: P1)

On first launch, the user goes through a short onboarding: enters their weight, receives a suggested goal they can adjust, enters their wake-up and bedtime, and finally is invited to allow notifications.

**Why this priority**: The goal and the awake window are prerequisites for progress (US1) and reminders (US3).

**Independent Test**: Install the app from scratch, complete onboarding and check that Home shows the chosen goal and that settings reflect the entered values.

**Acceptance Scenarios**:

1. **Given** first use, **When** the user enters 70 kg, **Then** the app suggests 2.5 L (70 × 35 ml = 2,450 ml, rounded to the nearest multiple of 250 ml).
2. **Given** the suggested goal, **When** the user adjusts it, **Then** the value changes in 250 ml steps.
3. **Given** the entered times (e.g., wake 8:00, sleep 22:00), **When** onboarding ends, **Then** the app asks for notification permission with an explanation and opens Home.
4. **Given** the user declines notifications, **When** they reach Home, **Then** the app works normally for manual logging and shows a discreet notice explaining how to enable reminders.
5. **Given** the app is already set up, **When** the user changes goal, weight or times in Settings, **Then** the new values apply immediately, preserving what was already drunk today.

---

### User Story 3 - Receive reminders and log straight from the notification (Priority: P1)

During the awake window, the app reminds the user to drink water at intervals computed from the remaining time and remaining glasses. The notification has a "Bebi 💧" action that logs 250 ml without opening the app. Tapping the notification itself also logs the sip and opens the app. Each sip reschedules the next reminder. Once the goal is met, reminders stop for the day.

**Why this priority**: It is the app's central promise ("the app reminds me to drink water") and the main logging path in daily use.

**Independent Test**: Configure a short window and a small goal, wait for reminders, use the "Bebi 💧" action and confirm that the total rises, the next reminder is rescheduled and, once the goal is met, no other reminder arrives that day.

**Acceptance Scenarios**:

1. **Given** a 2 L goal, 0 ml drunk and an 8:00–22:00 window, **When** the day starts at 8:00, **Then** reminders are spaced ~1h45 apart (14 h ÷ 8 glasses).
2. **Given** a reminder notification, **When** the user taps "Bebi 💧", **Then** 250 ml is logged without opening the app and the next reminder is rescheduled based on the new remainder.
3. **Given** a reminder notification, **When** the user taps the notification body, **Then** the app opens with 250 ml logged and the "Desfazer" toast visible.
4. **Given** the user logged a sip with "+" at 10:00, **When** the next reminder was due at 10:15, **Then** it is rescheduled to 10:00 + the recomputed interval.
5. **Given** the total reaches or exceeds the goal, **When** this happens by any means, **Then** all remaining reminders for the day are cancelled and the app shows "Bom trabalho! 🎉".
6. **Given** the current time is outside the awake window, **When** a reminder would be computed, **Then** no reminder fires until the start of the next window.
7. **Given** the goal was met and the user undoes sips until falling below it, **When** there is still time left in the window, **Then** reminders are scheduled again.

---

### User Story 4 - Follow along on the Dynamic Island and lock screen (Priority: P2)

With the app opened that day, a live activity appears on the Dynamic Island and the lock screen, showing progress. The expanded form and the lock screen show a progress bar, the countdown to the next reminder and a "Bebi 💧" button that logs the sip without opening the app.

**Why this priority**: It is an important differentiator, but the app delivers full value without it (P1s). It also depends on device capabilities.

**Independent Test**: On an iPhone with a Dynamic Island, open the app, go to the system home screen and check the compact form. Expand, tap "Bebi 💧" and confirm that the total in the app and in the activity rises by 250 ml.

**Acceptance Scenarios**:

1. **Given** the app is opened on a day whose goal is not met, **When** there is no live activity running, **Then** one is started showing current progress.
2. **Given** the activity is running, **When** seen in compact form, **Then** it shows a drop/mini-bottle icon and progress in the "1,25 / 2 L" format.
3. **Given** the minimal form (another activity shares the island), **When** displayed, **Then** it shows the drop with a progress ring.
4. **Given** the expanded form or the lock screen, **When** the user taps "Bebi 💧", **Then** 250 ml is logged and the activity updates immediately; the app and reminders reflect it within 2 s while the app is running, or the next time the app runs otherwise.
5. **Given** a sip logged by any means, **When** the activity is running, **Then** it reflects the new total and the new countdown to the next reminder.
6. **Given** the goal is met, **When** the activity is running, **Then** it shows "Bom trabalho! 🎉" for a few minutes and then ends.
7. **Given** the activity expired due to the system time limit, **When** the user reopens the app and the goal is still not met, **Then** a new activity is started; meanwhile, notification reminders continue normally.

---

### User Story 5 - See the week's history and streak (Priority: P3)

On Home, the user sees the last 7 days (full = goal met, partial, empty) and a counter of consecutive days meeting the goal.

**Why this priority**: It adds motivation and context, but is not needed for basic daily use.

**Independent Test**: With data from several days, check that the 7-day strip and the streak correctly reflect which days met the goal.

**Acceptance Scenarios**:

1. **Given** data for the last 7 days, **When** Home opens, **Then** each day appears as full (≥ that day's goal), partial (> 0 and < goal) or empty (0).
2. **Given** the goal was met yesterday and the day before, but not earlier, **When** today's goal is not yet met, **Then** the streak shows "🔥 2 dias".
3. **Given** a 2-day streak, **When** the user meets today's goal, **Then** the streak becomes "🔥 3 dias".
4. **Given** a day without meeting the goal, **When** the next day starts, **Then** the streak resets to zero and is not shown until the goal is met again.

---

### Edge Cases

- **Late start of the day**: if the user opens the app for the first time that day at 15:00, the interval is computed over the remaining window time, not the whole window.
- **Window too short**: if the computed interval falls below 30 minutes, reminders are sent every 30 minutes. The app does not try to "catch up" with back-to-back notifications.
- **Last reminder of the day**: no reminder is scheduled after bedtime, even if the goal was not met.
- **Window crossing midnight** (e.g., wake 10:00, sleep 1:00): supported. Sips after midnight and before bedtime count toward the day that started at the last wake time.
- **Day rollover**: progress resets at wake time. Sips logged between bedtime and wake time count toward the previous day.
- **Goal changed mid-day**: the amount already drunk is kept. If the new goal is already reached, reminders stop and the app celebrates. Otherwise, reminders are recomputed.
- **Above the goal**: the app keeps counting (e.g., "2,25 / 2 L"), the bottle stays full with a shine and no reminder is scheduled again.
- **Notifications denied or later disabled**: manual logging, the bottle and history work. The app indicates reminders are off and how to turn them back on.
- **Double tap on the "Bebi 💧" action**: each tap logs a sip, and the user can correct it with "Desfazer".
- **Sip logged outside the app while the app is not running** (notification action or live activity button): the sip MUST NOT be lost or counted twice. Until the app runs again, already-scheduled reminders keep their original times (so they may arrive earlier than the recomputed schedule would place them, or after the goal was reached that way); the schedule is corrected as soon as the app runs.
- **Device without Dynamic Island or OS version without interactive buttons**: the activity appears only where supported (e.g., lock screen). Without the interactive button, tapping the activity opens the app and logs a sip, showing the "Desfazer" toast (same behavior as tapping a reminder's body).
- **Time zone or clock change**: the app always uses the device's current local time to compute the day and the window.
- **Weight out of range**: the app accepts weights between 30 kg and 250 kg. The goal is limited to 0.5 L–6 L.

## Requirements *(mandatory)*

### Functional Requirements

**Logging and progress**

- **FR-001**: The app MUST log sips in fixed 250 ml units.
- **FR-002**: The app MUST offer a "+" button on Home that logs a sip.
- **FR-003**: The app MUST allow undoing the day's most recent sip, via a temporary toast shown after each sip and via an option when long-pressing "+". Undo may be repeated until the day's total reaches zero.
- **FR-004**: The app MUST show the day's progress in liters with a decimal comma (e.g., "1,25 / 2 L").
- **FR-005**: The app MUST represent progress with a bottle mascot whose water level is proportional to progress (capped at full) and animates on every sip.
- **FR-006**: The mascot MUST have four expressions tied to progress: thirsty (< 25%), excited (25%–99%), radiant (100%) and celebrating (> 100%).
- **FR-007**: The app MUST keep counting above the goal.

**Goal and setup**

- **FR-008**: On first launch, the app MUST run onboarding in this order: weight → editable suggested goal → wake and sleep times → notification permission request.
- **FR-009**: The app MUST suggest the goal as weight (kg) × 35 ml, rounded to the nearest multiple of 250 ml and limited to 0.5 L–6 L.
- **FR-010**: The user MUST be able to edit the goal in 250 ml steps, in onboarding and in Settings.
- **FR-011**: The user MUST be able to change weight, goal, times and turn reminders on/off in Settings. Changes apply immediately and preserve the day's total.
- **FR-012**: Changing the weight in Settings MUST offer (not impose) updating the goal to the new suggested value.

**Reminders**

- **FR-013**: The app MUST schedule reminders only within the user's awake window.
- **FR-014**: The interval between reminders MUST be the remaining window time divided by the number of glasses remaining to the goal, with a 30-minute minimum.
- **FR-015**: Every sip logged, by any means, MUST reschedule the next reminder to the time of the sip plus the recomputed interval. For sips logged outside the app while it is not running, rescheduling happens the next time the app runs (see Clarifications).
- **FR-016**: Reminders MUST have a "Bebi 💧" action that logs a sip without opening the app.
- **FR-017**: Tapping the body of a reminder MUST open the app, log a sip and show the "Desfazer" toast.
- **FR-018**: When the goal is met, the app MUST cancel all remaining reminders for the day and show the "Bom trabalho! 🎉" celebration.
- **FR-019**: If an undo takes the total below the goal, the app MUST schedule reminders again, if there is still time in the window.
- **FR-020**: Reminder texts MUST be short and friendly, in PT-BR, and may vary among a few options.

**Dynamic Island / live activity**

- **FR-021**: On supported devices, when the app opens on a day whose goal is not met, the app MUST start a live activity if none is running.
- **FR-022**: The activity MUST show: in compact form, a drop/mini-bottle and "X / Y L" progress; in minimal form, a drop with a progress ring; in expanded form and on the lock screen, a progress bar, the countdown to the next reminder and a "Bebi 💧" button. When reminders are off or notifications are not allowed, the countdown line is hidden.
- **FR-023**: The activity's "Bebi 💧" button MUST log a sip without opening the app and update the activity immediately. The app's stored total and reminders MUST reflect it within 2 s while the app is running, or the next time the app runs otherwise, exactly once.
- **FR-024**: The activity MUST reflect every sip logged by any means.
- **FR-025**: When the goal is met, the activity MUST briefly show "Bom trabalho! 🎉" and then end. If the goal was reached by sips logged while the app was not running, the activity shows the celebration and ends the next time the app runs (or when the system time limit expires).
- **FR-026**: The activity MUST work without any server. It is accepted that it expires due to the system time limit and only restarts when the user opens the app.

**History**

- **FR-027**: The app MUST store each day's total and goal on the device.
- **FR-028**: Home MUST show the last 7 days as full, partial or empty, comparing each day with the goal in force that day.
- **FR-029**: The app MUST show the streak of consecutive days with the goal met, ending today (if already met) or yesterday. The streak only appears when it is ≥ 1.

**General**

- **FR-030**: The app's day MUST start at the user's wake time. Progress resets at that moment.
- **FR-031**: All data MUST stay on the device only. The app requires no account and no internet connection.
- **FR-032**: The entire interface and notifications MUST be in Brazilian Portuguese.
- **FR-033**: The app MUST support the system's light and dark modes.
- **FR-034**: The visual style MUST follow the cute/illustrated pastel style, with the bottle mascot as the central element.

### Key Entities

- **User profile**: weight (kg), daily goal (ml), wake time, sleep time, reminders on/off, onboarding completed.
- **Sip**: amount (always 250 ml), time logged, source ("+" button, notification action, notification tap, live activity). Belongs to a Day.
- **Day**: reference date (starting at wake time), goal in force that day, total drunk, goal met (yes/no). Groups Sips.
- **Reminder**: scheduled time, belongs to the current Day. Recomputed on every sip and cancelled when the goal is met.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user completes onboarding in under 1 minute.
- **SC-002**: Logging a sip from a notification or the Dynamic Island takes at most 1 tap and does not require opening the app.
- **SC-003**: After the goal is met, 0 reminders are delivered until the start of the next day, in 100% of tested days. Exception: when the goal is reached by sips logged outside the app while it is not running, already-scheduled reminders may still arrive until the app next runs; from then on, 0 reminders are delivered that day.
- **SC-004**: No reminder is delivered outside the awake window, in 100% of tested days.
- **SC-005**: While the app is running, after any sip the total shown in the app, in the live activity and the next reminder are consistent with each other within 2 seconds. When the sip happens while the app is not running, they become consistent within 2 seconds of the app next running, with no sip lost or duplicated.
- **SC-006**: The bottle animation when logging a sip runs smoothly, with no perceptible stutter, on compatible devices.
- **SC-007**: In user tests, at least 9 out of 10 people can log and undo a sip without instructions.
- **SC-008**: The app works fully (logging, reminders, history) with no internet connection.

## Assumptions

- **Platform**: the focus is iPhone. The Dynamic Island requires a compatible model, and the activity's interactive button requires an OS version that supports it. Other platforms come later, but the solution must allow bringing them over without rewriting the business rules.
- **Development environment**: the team has no Mac. The solution must be buildable and testable without a Mac, with cloud builds and a paid Apple developer account (already accepted by the user).
- **Tapping the notification body logs a sip**: follows the user's original request ("when I tap the notification it marks that I drank"). "Desfazer" covers accidental taps.
- **Mascot expressions**: the thresholds (25% / 100%) are a reasonable default that can be adjusted in design.
- **30-minute minimum interval and weight/goal ranges**: reasonable defaults chosen to avoid excessive notifications and absurd values.
- **No server and no account**: no cross-device sync or cloud backup in v1.
- **Out of scope for v1**: home-screen widget (designed in `design/Wotah Widgets.html`; planned for v2), automatic restart of the live activity without opening the app, long-term charts, multiple glass sizes, English or other languages, a polished Android version, health-app integration.
- **Name "Wotah"**: provisional.
