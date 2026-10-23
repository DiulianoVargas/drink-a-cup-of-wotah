# Contract — Opening screen (splash)

**Requirement**: FR-035. **Decisions**: [research.md](../research.md) R15–R17.
**Visual reference**: `design/Wotah Splash.html` (screen "Pastel · garrafa animada", 393 × 852 pt).
**Tokens**: [design-tokens.md](./design-tokens.md) › Splash.

## 1. Native stage (`app.config.ts`, `expo-splash-screen` plugin)

Static, shown by the OS before JS runs. Requires a native rebuild when changed.

| Key | Value |
|---|---|
| `backgroundColor` | `#F3F9FB` (`bg` light) |
| `image` | `./assets/images/splash-mascot.png` |
| `imageWidth` | `180` |
| `dark.backgroundColor` | `#121D25` (`bg` dark) |
| `dark.image` | `./assets/images/splash-mascot-dark.png` |
| `android.imageWidth` | `120` (fits the Android 12+ circular mask, R16) |

The image is the mascot's first animation frame: level 0.6, expression `excited`, back wave at
x = 0, front wave at x = −100, transparent background, viewBox `-30 -30 260 320`, 3× (540 px wide).

## 2. In-app stage (`src/ui/components/AnimatedSplash.tsx`)

```ts
type AnimatedSplashProps = {
  /** True once boot finished (store `ready`); the overlay may start leaving. */
  ready: boolean;
  /** Called after the exit fade; the parent unmounts the overlay. */
  onDone: () => void;
};
```

- Rendered by `src/app/_layout.tsx` as an absolute overlay **above** the `Stack`, once fonts are
  loaded. The `Stack` mounts underneath as soon as `ready` is true, so the exit fade reveals the
  real first screen (onboarding or Home).
- Calls `SplashScreen.hide()` on its first `onLayout` (the native stage is never hidden earlier).
- Shown only on a cold start (it lives in the root layout's first mount); returning from the
  background never shows it.

### Layout (final, matching the design)

- Background: full-screen vertical gradient `splashTop` 0% → `bg` 55% → `splashBottom` 100%.
- Glow: circle 420 pt, centered horizontally, center 50 pt above the screen center, radial
  `water` at `splashGlowOpacity` → transparent at 65%.
- Content column, centered, `gap` 22, `paddingBottom` 60:
  - `Mascot` 180 × 222, `level` 0.6, `expression` `excited`.
  - Column, `gap` 6: "wotah" (Fredoka 600, 52, line height 52, letter spacing −0.5, `ink`) and
    "Um golinho de cada vez" (Nunito 700, 16, `ink2`). Both `maxFontSizeMultiplier = MAX_FONT_SCALE`.
- Dots: three 9 × 9 circles, radius 5, `gap` 8, color `plusButton`, centered, 64 pt above the
  bottom safe edge.

### Phases

```text
native ──(fonts loaded; overlay onLayout → SplashScreen.hide())──▶ entering
entering ──(450 ms)──▶ idle
idle ──(ready && ≥ 900 ms since mount)──▶ leaving
leaving ──(280 ms fade)──▶ done (onDone → unmount)
```

| Phase | Full motion | Reduce Motion |
|---|---|---|
| first frame | solid `bg`; mascot alone, at screen center, at the native width (iOS 180, Android 120) — identical to the native stage | same |
| entering | gradient + glow fade in (300 ms); mascot scales to 180 and translates to its layout position (450 ms, ease-out); wordmark/tagline/dots fade in and rise 8 pt (350 ms, 150 ms delay) | everything cross-fades into the final layout (250 ms); no scale or translation |
| idle | waves loop (Mascot); dots pulse in sequence (opacity .25 → 1, 900 ms cycle, 150 ms stagger) | waves paused (Mascot); dots static at 1 / .55 / .25 |
| leaving | overlay opacity 1 → 0, 280 ms | same |

If `ready` arrives during `entering`, `leaving` starts right after `entering` ends (the 900 ms
minimum still applies).

### Accessibility

- The overlay is one element: `accessible`, `accessibilityRole="image"`,
  `accessibilityLabel="Wotah, carregando"`; `accessibilityViewIsModal` while visible. Children are
  hidden from VoiceOver.
- No touch handling; the overlay sets `pointerEvents="none"` while `leaving`.

### Status bar

`dark` content in light mode, `light` in dark mode (same as the rest of the app).

## 3. Test hooks

- RNTL (`tests/ui/AnimatedSplash.test.tsx`), fake timers: `onDone` is not called before 900 ms even
  when `ready` is true at mount; it is called once after `ready` + the exit fade; with
  `useReducedMotion` mocked to `true`, the same contract holds.
- The native stage and the hand-off seam are checked manually (quickstart scenario 12).
