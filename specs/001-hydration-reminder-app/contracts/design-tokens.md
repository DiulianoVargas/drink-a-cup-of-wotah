# Contrato — Design tokens e componentes

**Fonte da verdade**: `design/Wotah Sistema.html` (tokens, tipografia, mascote, ícone mini).
**Referência visual** (layout e estados, não tokens): `design/Wotah Telas.html`, `design/Wotah Live Activity.html`, `design/Wotah Widgets.html`.

> Os HTMLs são bundles. Para inspecionar o código-fonte, extraia o `<script type="__bundler/template">` e o `__bundler/manifest` (base64 + gzip). O componente `Mascote` fica no recurso HTML de ~9,5 KB do manifest.

Implementação: `src/ui/theme/tokens.ts` (valores) + `src/ui/theme/useTheme.ts` (claro/escuro via `useColorScheme`).

## Cores

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `bg` | `#F3F9FB` | `#121D25` | fundo das telas |
| `surface` | `#FFFFFF` | `#1B2A34` | cards |
| `surface2` | `#E6F4F8` | `#223540` | cards secundários, trilhas |
| `line` | `#DCEBF0` | `#2A3F4A` | divisórias, bordas |
| `ink` | `#2B4656` | `#E5F0F4` | texto principal, contorno do mascote |
| `ink2` | `#567282` | `#9DB4BF` | texto secundário, legendas |
| `water` | `#9FD8EA` | `#7FBFD4` | água, progresso, número bebido |
| `waveBack` | `#C4EAF4` | `#A6D3E0` | onda de trás |
| `glass` | `#FFFFFF` | `#D3E6EC` | vidro da garrafa |
| `plusButton` | `#86CDE3` | `#8CCBDE` | botão "+" e pílula "Bebi 💧" |
| `waterLight` / `waterDeep` | `#CDEEF6` | `#2F5868` | água clara (claro) / água funda (escuro) |
| `mint` | `#BEEBD8` | `#8ECDB6` | sucesso, meta batida, card "nova meta" |
| `peach` | `#FFD0BE` | `#E9B3A0` | sequência, brilho de comemoração |
| `pink` | `#F7C6D6` | `#E3AFC0` | carinhos, confete, chapéu |

Cores fixas do mascote (iguais nos dois temas): tampa `#FFC9B6` (riscas `#E9A08A`), bochechas `#F6A9BF`, língua `#F4A0B4`, brilho radial `#FFE2CC`, olhos da gota em superfícies pretas `#12303D`.

Princípio (do design): "No escuro, os mesmos tons perdem brilho em vez de ganhar saturação." Nada de neon.

## Tipografia

| Papel | Fonte | Peso | Tamanho | Notas |
|---|---|---|---|---|
| `counter` | Fredoka | 600 | 50 pt (64 no hero) | `fontVariant: ['tabular-nums']`; unidade "/ 2 L" em 500, ~0,53× e cor `ink2` |
| `title` | Fredoka | 500 | 24–32 pt | "Bom trabalho! 🎉" |
| `body` | Nunito | 400 | 16–17 pt | |
| `button` | Nunito | 800 | 15 pt | "Desfazer", "Bebi 💧", "🔥 5 dias" |
| `caption` | Nunito | 700 | 12–14 pt | "Próximo lembrete às 14h30" |
| `island` | Nunito 800 / SF Rounded heavy | — | 13 pt | "1,25 / 2 L" na ilha compacta |

## Forma e espaçamento

- Raios: cards grandes 36; swatches/cards médios 24; pílulas 22 (altura/2); ícone do app 34/150.
- Contorno do mascote: 5 (na escala do viewBox 260 × 320).
- Sombra (ícone/cards elevados): `0 16 30 -14 rgba(43,70,86,.4)`.
- Superfícies iOS: widget com cantos de 23 pt e margem de 16 pt; Live Activity expandida com raio de 44 e margem de 22 pt.

## Componentes (`src/ui/components/`)

| Componente | Origem no design | Props principais |
|---|---|---|
| `Mascot` | `Mascote` (Sistema §03) | `progress: number`, `expression?: MascotExpression`, `size` |
| `DropIcon` | gota com carinha (Sistema §04) | `size: 22 \| 44 \| 120`, `withCheeks`, `color` |
| `ProgressRing` | gota com anel (forma mínima) | `progress`, `size = 37` |
| `ProgressCounter` | "1,25 / 2 L" | `consumedMl`, `goalMl` |
| `PlusButton` | botão "+" (Telas §02/§04) | `onPress`, `onLongPress` (0,45 s → "Desfazer último gole"), `disabledUndo` |
| `UndoToast` | toast "Desfazer" (4 s) | `visible`, `onUndo` (inverte as cores no escuro) |
| `WeekStrip` | faixa de 7 dias | `days: { key, status }[]` |
| `StreakBadge` | "🔥 5 dias" | `days` (oculto se 0) |
| `NextReminderHint` | "Próximo lembrete às 14h30" / "até amanhã" | `nextReminderAt`, `goalMet` |
| `RemindersOffBanner` | aviso de notificações desativadas | `onOpenSettings` |
| `Stepper` | meta − / + (250 ml) | `valueMl`, `onChange` |
| `WheelPicker` | peso (30–250) e horários (30 em 30 min) | `values`, `value`, `onChange` |
| `SuggestGoalCard` | cartão menta nos Ajustes | `suggestedMl`, `onAccept`, `onKeep` |
| `Pill` | "Bebi 💧"/botões primários | `label`, `tone` |

Regra: telas e componentes **só** usam tokens via `useTheme()`. Hex soltos só são permitidos em `Mascot`/`DropIcon` (cores fixas do personagem).
