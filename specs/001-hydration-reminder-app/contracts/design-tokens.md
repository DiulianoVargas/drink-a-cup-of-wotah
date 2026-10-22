# Contract — Design tokens and components

**Source of truth** (Constitution V): `design/Wotah Sistema.html` (tokens, typography, mascot, mini icon).
**Visual reference** (layout and states, not tokens): `design/Wotah Telas.html`,
`design/Wotah Live Activity.html`, `design/Wotah Widgets.html` (widgets are v2).

> The HTML files are bundles. To inspect the source, extract `<script type="__bundler/template">`
> and the `__bundler/manifest` entries (base64 + gzip). The `Mascote` component is the ~9.5 KB
> HTML resource in the manifest.

Implementation: `src/ui/theme/tokens.ts` (values) + `src/ui/theme/useTheme.ts` (light/dark via
`useColorScheme`).

## Colors

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F3F9FB` | `#121D25` | screen background |
| `surface` | `#FFFFFF` | `#1B2A34` | cards |
| `surface2` | `#E6F4F8` | `#223540` | secondary cards, tracks |
| `line` | `#DCEBF0` | `#2A3F4A` | dividers, borders |
| `ink` | `#2B4656` | `#E5F0F4` | primary text, mascot outline |
| `ink2` | `#567282` | `#9DB4BF` | secondary text, captions |
| `water` | `#9FD8EA` | `#7FBFD4` | water, progress, drunk number |
| `waveBack` | `#C4EAF4` | `#A6D3E0` | back wave |
| `glass` | `#FFFFFF` | `#D3E6EC` | bottle glass |
| `plusButton` | `#86CDE3` | `#8CCBDE` | "+" button and "Bebi 💧" pill |
| `waterLight` / `waterDeep` | `#CDEEF6` | `#2F5868` | light water (light mode) / deep water (dark mode) |
| `mint` | `#BEEBD8` | `#8ECDB6` | success, goal met, "new goal" card |
| `peach` | `#FFD0BE` | `#E9B3A0` | streak, celebration glow |
| `pink` | `#F7C6D6` | `#E3AFC0` | small delights, confetti, party hat |

Fixed mascot colors (same in both themes): cap `#FFC9B6` (stripes `#E9A08A`), cheeks `#F6A9BF`,
tongue `#F4A0B4`, radial glow `#FFE2CC`, drop eyes on black surfaces `#12303D`.

Design principle: "In dark mode, the same tones lose brightness instead of gaining saturation."
No neon.

## Typography

| Role | Font | Weight | Size | Notes |
|---|---|---|---|---|
| `counter` | Fredoka | 600 | 50 pt (64 in the hero) | `fontVariant: ['tabular-nums']`; unit "/ 2 L" at 500, ~0.53× and `ink2` color |
| `title` | Fredoka | 500 | 24–32 pt | "Bom trabalho! 🎉" |
| `body` | Nunito | 400 | 16–17 pt | |
| `button` | Nunito | 800 | 15 pt | "Desfazer", "Bebi 💧", "🔥 5 dias" |
| `caption` | Nunito | 700 | 12–14 pt | "Próximo lembrete às 14h30" |
| `island` | Nunito 800 / SF Rounded heavy | — | 13 pt | "1,25 / 2 L" on the compact island |

All text roles scale with Dynamic Type up to the large (non-accessibility) sizes (Constitution VI).

## Shape and spacing

- Radii: large cards 36; swatches/medium cards 24; pills 22 (height/2); app icon 34/150.
- Mascot outline: 5 (at the 260 × 320 viewBox scale).
- Shadow (icon/elevated cards): `0 16 30 -14 rgba(43,70,86,.4)`.
- iOS surfaces: Live Activity expanded with radius 44 and 22 pt margins.
- Minimum touch target: 44 × 44 pt.

## Components (`src/ui/components/`)

| Component | Design source | Main props |
|---|---|---|
| `Mascot` | `Mascote` (Sistema §03) | `progress: number`, `expression?: MascotExpression`, `size` |
| `DropIcon` | drop with a face (Sistema §04) | `size: 22 \| 44 \| 120`, `withCheeks`, `color` |
| `ProgressRing` | drop with a ring (minimal form) | `progress`, `size = 37` |
| `ProgressCounter` | "1,25 / 2 L" | `consumedMl`, `goalMl` |
| `PlusButton` | "+" button (Telas §02/§04) | `onPress`, `onLongPress` (0.45 s → "Desfazer último gole"), `disabledUndo` |
| `UndoToast` | "Desfazer" toast (4 s) | `visible`, `onUndo` (inverted colors in dark mode) |
| `WeekStrip` | 7-day strip | `days: { key, status }[]` |
| `StreakBadge` | "🔥 5 dias" | `days` (hidden when 0) |
| `NextReminderHint` | "Próximo lembrete às 14h30" / "até amanhã" | `nextReminderAt`, `goalMet` |
| `RemindersOffBanner` | notifications-off notice | `onOpenSettings` |
| `Stepper` | goal − / + (250 ml) | `valueMl`, `onChange` |
| `WheelPicker` | weight (30–250) and times (30-minute steps) | `values`, `value`, `onChange` |
| `SuggestGoalCard` | mint card in Settings | `suggestedMl`, `onAccept`, `onKeep` |
| `Pill` | "Bebi 💧"/primary buttons | `label`, `tone` |

Rule: screens and components use tokens **only** via `useTheme()`. Raw hex values are allowed only
inside `Mascot`/`DropIcon` (fixed character colors).
