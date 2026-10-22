# Contrato — Live Activity / Dynamic Island (`expo-widgets`)

Implementação: `src/widgets/WotahDay.tsx` (componente com a diretiva `'widget'`) + `src/services/liveActivity.ts` (port `LiveActivityPort`). Referência visual: `design/Wotah Live Activity.html`.

## Config plugin (`app.config.ts`)

```ts
plugins: [
  ['expo-widgets', {
    groupIdentifier: 'group.<bundleId>',   // o mesmo App Group usado pelo SQLite (R6)
    enablePushNotifications: false,        // sem servidor (FR-026)
    widgets: [],                           // widget da tela de início: só após a spec (R11)
  }],
]
```

## Props (`SurfaceState`, ver [data-model §6](../data-model.md#6-snapshot-para-superfícies-do-sistema-surfacestate))

Objeto JSON plano, sem `Date`, sem funções e sem referência a escopo de módulo. A diretiva `'widget'` roda num runtime isolado e só pode usar `@expo/ui/swift-ui`.

## Regiões

| Região | Conteúdo | Medidas de referência (iPhone 15/16 Pro) |
|---|---|---|
| `compactLeading` | gota com carinha (22 pt) | ilha 126 × 37 pt; leading 22 pt |
| `compactTrailing` | "**1,25** / 2 L" (bebido em azul-água `#9FD8EA`, meta em branco), Nunito 800/13 pt ou SF Rounded heavy, `monospacedDigit` | trailing ~64 pt |
| `minimal` | gota + anel de progresso (37 pt, trilha `rgba(159,216,234,.25)`, traço `#9FD8EA`) | |
| `expandedLeading` / `expandedTrailing` / `expandedCenter` | "Wotah" + mini-garrafa / "1,25 / 2 L" | 371 × 172 pt, raio 44, margens 22 pt |
| `expandedBottom` | barra de progresso + "Próximo lembrete em 45 min" + pílula **"Bebi 💧"** | |
| `banner` (tela de bloqueio) | igual à expandida, num card de 361 × ~120 pt, fundo claro translúcido | altura < 160 pt |
| Estado `celebrating` | "Bom trabalho! 🎉" + "Meta de hoje batida. Lembretes só amanhã!"; sem botão; barra menta (`#BEEBD8`); compacta mostra "Meta! 🎉" com a gota menta | |

## Botão "Bebi 💧" (iOS 17+)

```ts
// dentro do componente 'widget'
<Button target="drink" onPress={() => ({
  ...props,
  consumedMl: props.consumedMl + 250,
  pendingSips: props.pendingSips + 1,
  progress: (props.consumedMl + 250) / props.goalMl,
  seq: props.seq + 1,
})}>Bebi 💧</Button>
```

- Atualiza a atividade no aparelho, mesmo com o app encerrado.
- Com o app vivo: `addUserInteractionListener` (comparar `event.source` com `instance.getId()`) → `reconcile()` importa `pendingSips`, grava os goles (`source: 'live_activity'`), zera `pendingSips` via `update()` e reagenda.
- Com o app encerrado: a importação acontece no próximo `reconcile()` (cold start/foreground), lendo os props atuais da instância. **⚠️ Spike S2**: se os props não forem legíveis ou o listener falhar (issue #49828), entra a Fase B (Expo Module Swift com `LiveActivityIntent`, ver research R5).
- iOS < 17: sem botão. O toque na atividade abre `wotah://home` (edge case da spec).

## Ciclo de vida

| Gatilho | Ação |
|---|---|
| `AppState → active` e meta não batida e `getInstances()` vazio | `start(state, 'wotah://home')` (FR-021) |
| Qualquer gole/undo/mudança de meta | `update(state)` (FR-024) |
| Meta batida | `update({ ...state, celebrating: true })` → `end('default', state, …)` com `after(now + 5 min)` (FR-025) |
| Undo deixa abaixo da meta com a atividade encerrada | nova atividade só na próxima abertura do app |
| Expirou (8 h) | nada; reinicia na próxima abertura (FR-026) |
| Lembretes desligados | a atividade continua (é independente das notificações); `nextReminderAt = null` → esconde a linha "Próximo lembrete" |
