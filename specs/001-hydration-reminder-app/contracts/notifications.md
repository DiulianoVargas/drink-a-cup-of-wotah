# Contrato — Notificações locais

Implementação: `src/services/notifications/` sobre `expo-notifications` (R4).

## Categoria e ação

| Item | Valor |
|---|---|
| `categoryIdentifier` | `WOTAH_REMINDER` |
| Ação | `identifier: "DRINK"`, `buttonTitle: "Bebi 💧"`, `options.opensAppToForeground: false` |
| Registro | `setNotificationCategoryAsync` no boot do app, antes de qualquer agendamento |

## Conteúdo de cada lembrete

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

## Textos (FR-020; origem: `design/Wotah Live Activity.html`)

| # | Título | Corpo |
|---|---|---|
| 1 | Hora de um golinho! 💧 | Faltam {n} copos pra meta de hoje. |
| 2 | Psiu… tô com sedinha 🥺 | Um copo agora e eu fico felizona. |
| 3 | Bora de água? 💧 | 250 ml e você já tá mais pertinho. |
| 4 | Pausa pra hidratar ✨ | Pega um copo, respira, volta. Pronto! |
| 5 | Sua garrafinha lembrou de você | Bebe um copinho comigo? |
| 6 | Glub glub? 💦 | Só um copo e a gente segue o dia. |
| 7 | Um golinho pra dar energia ☀️ | Já são {x} L hoje. Bora pro próximo? |
| 8 | Falta pouquinho! 💧 | Mais 1 copo e a meta de hoje tá feita. *(só quando `n = 1`)* |

Regras: `{n}` usa singular/plural ("1 copo" / "2 copos"). `{x}` usa `formatLiters`. A mensagem 7 não aparece quando o consumo é 0. Nunca usar tom de culpa (DESIGN-BRIEF).

## Tratamento de respostas

| Evento | `actionIdentifier` | Efeito |
|---|---|---|
| Toque em "Bebi 💧" | `DRINK` | `registerSip('notification_action')` sem abrir o app (FR-016) |
| Toque no corpo | `expo.modules.notifications.actions.DEFAULT` | abre o app → `registerSip('notification_tap')` → Home com toast "Desfazer" (FR-017) |

- O handler é registrado no escopo do módulo de entrada (antes do render) e também consultado via `getLastNotificationResponse()` no cold start e a cada `AppState → active`.
- Idempotência: `event_key = notif:${request.identifier}:${actionIdentifier}` em `processed_event`. Uma resposta já processada é ignorada. Toques em notificações diferentes sempre contam (edge case "toque duplo": cada toque registra um gole).
- Em primeiro plano, `setNotificationHandler` mostra o banner (`shouldShowBanner: true`, `shouldShowList: true`, `shouldPlaySound: false`).

## Agendamento

- `replaceAll(reminders)`: cancela todos os `rem:*` (`cancelAllScheduledNotificationsAsync`, porque o app não tem outras notificações) e agenda a lista nova. O limite é ≤ 48 itens, abaixo dos 64 pendentes permitidos pelo iOS.
- Notificações desativadas (FR edge case): `permission() !== 'granted'` → nada é agendado e a Home mostra o aviso discreto com um link para os Ajustes do sistema (`Linking.openSettings()`).
- Permissão pedida **só** no passo 4 do onboarding, depois da tela explicativa "Posso te dar um toquinho?".
