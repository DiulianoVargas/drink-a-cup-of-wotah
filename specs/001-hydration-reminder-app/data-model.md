# Data Model — Wotah (001-hydration-reminder-app)

**Data**: 2026-10-22 · Base: [spec.md › Key Entities](./spec.md#key-entities), [research.md](./research.md) (R3, R6, R13)

Unidades: volume em **ml inteiros**; horários do dia em **minutos desde 00:00** (`0..1439`); instantes em **epoch ms**. A formatação ("1,25 / 2 L", "14h30") acontece só na borda (`src/domain/format.ts`).

---

## 1. Entidades de domínio (TypeScript puro, `src/domain/types.ts`)

### Profile (Perfil do usuário)

| Campo | Tipo | Regras |
|---|---|---|
| `weightKg` | `number` (inteiro) | 30 ≤ x ≤ 250 |
| `dailyGoalMl` | `number` | múltiplo de 250; 500 ≤ x ≤ 6000 |
| `wakeMinutes` | `number` | 0..1439; múltiplo de 30 na UI (seletores de 30 em 30 min) |
| `sleepMinutes` | `number` | 0..1439; ≠ `wakeMinutes`. Se `sleep < wake`, a janela cruza a meia-noite |
| `remindersEnabled` | `boolean` | padrão `true`; desligar cancela todos os lembretes |
| `onboardingCompleted` | `boolean` | `false` até o fim do passo de permissão (aceita ou recusada) |

Derivados:
- `suggestedGoalMl(weightKg) = clamp(round(weightKg × 35 / 250) × 250, 500, 6000)` (FR-009). Ex.: 70 kg → 2.450 → **2.500**.
- `awakeDurationMinutes = (sleep − wake + 1440) % 1440`.

### Sip (Gole)

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `string` (UUID) | gerado no registro |
| `amountMl` | `250` | constante `GLASS_ML` (FR-001) |
| `occurredAt` | `number` (epoch ms) | instante do registro |
| `dayKey` | `string` `YYYY-MM-DD` | data local do início do dia lógico (ver §3) |
| `source` | `'button' \| 'notification_action' \| 'notification_tap' \| 'live_activity' \| 'widget'` | origem (spec › Gole) |
| `undoneAt` | `number \| null` | soft-delete do "Desfazer" (FR-003) |

### Day (Dia)

Derivado do log de goles + snapshot de meta. A meta do dia é fixada no primeiro evento do dia e atualizada se o usuário mudar a meta naquele dia (FR-028 compara com "a meta vigente naquele dia").

| Campo | Tipo | Regras |
|---|---|---|
| `dayKey` | `string` | PK |
| `goalMl` | `number` | meta vigente no dia (última alteração vale) |
| `consumedMl` | `number` | Σ `amountMl` dos goles do dia com `undoneAt = null` (derivado; pode ser cacheado) |
| `goalMet` | `boolean` | `consumedMl ≥ goalMl` (derivado) |

Classificação de histórico (FR-028): `empty` se `consumedMl = 0`; `full` se `consumedMl ≥ goalMl`; senão `partial`.

### Reminder (Lembrete)

Não é persistido como entidade de negócio. É **calculado** pelo domínio (`planReminders`) e materializado como notificações agendadas. Os IDs das notificações agendadas ficam em `scheduled_reminders` só para conferência e cancelamento.

| Campo | Tipo |
|---|---|
| `fireAt` | `number` (epoch ms) |
| `dayKey` | `string` |
| `remainingGlasses` | `number` (para o texto "Faltam {n} copos") |
| `messageIndex` | `number` (variação de texto, FR-020) |

### MascotExpression

`'sedenta' | 'animada' | 'radiante' | 'comemorando'` (FR-006):

| Progresso `p = consumed / goal` | Expressão |
|---|---|
| `p < 0.25` | `sedenta` |
| `0.25 ≤ p < 1` | `animada` |
| `p = 1` (consumo exatamente igual à meta) | `radiante` |
| `p > 1` | `comemorando` |

Nível visual da água: `min(p, 1)`.

---

## 2. Persistência (SQLite, `src/services/db/`)

Banco `wotah.db` no container do App Group (R6). Migrations com `PRAGMA user_version`.

```sql
-- v1
CREATE TABLE profile (
  id                    INTEGER PRIMARY KEY CHECK (id = 1),
  weight_kg             INTEGER NOT NULL CHECK (weight_kg BETWEEN 30 AND 250),
  daily_goal_ml         INTEGER NOT NULL CHECK (daily_goal_ml BETWEEN 500 AND 6000 AND daily_goal_ml % 250 = 0),
  wake_minutes          INTEGER NOT NULL CHECK (wake_minutes BETWEEN 0 AND 1439),
  sleep_minutes         INTEGER NOT NULL CHECK (sleep_minutes BETWEEN 0 AND 1439),
  reminders_enabled     INTEGER NOT NULL DEFAULT 1,
  onboarding_completed  INTEGER NOT NULL DEFAULT 0,
  updated_at            INTEGER NOT NULL
);

CREATE TABLE day (
  day_key     TEXT PRIMARY KEY,            -- 'YYYY-MM-DD'
  goal_ml     INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE sip (
  id           TEXT PRIMARY KEY,
  day_key      TEXT NOT NULL REFERENCES day(day_key),
  amount_ml    INTEGER NOT NULL DEFAULT 250,
  occurred_at  INTEGER NOT NULL,
  source       TEXT NOT NULL,
  undone_at    INTEGER
);
CREATE INDEX sip_day ON sip(day_key, occurred_at);

-- idempotência de respostas de notificação / props da Live Activity (R4, R5)
CREATE TABLE processed_event (
  event_key     TEXT PRIMARY KEY,          -- ex.: 'notif:<requestId>:<actionId>' | 'la:<activityId>:<seq>'
  processed_at  INTEGER NOT NULL
);

CREATE TABLE scheduled_reminder (
  notification_id  TEXT PRIMARY KEY,
  day_key          TEXT NOT NULL,
  fire_at          INTEGER NOT NULL
);
```

Consultas-chave:
- **Total do dia**: `SELECT COALESCE(SUM(amount_ml),0) FROM sip WHERE day_key=? AND undone_at IS NULL`.
- **Desfazer último gole** (FR-003): `UPDATE sip SET undone_at=? WHERE id = (SELECT id FROM sip WHERE day_key=? AND undone_at IS NULL ORDER BY occurred_at DESC LIMIT 1)`. Sem efeito se não houver.
- **Últimos 7 dias**: `day LEFT JOIN` agregados de `sip`, para os 7 `dayKey`s gerados pelo domínio. Dias sem linha contam como `empty`.
- **Sequência** (FR-029): calculada no domínio sobre a lista de dias ordenada (`computeStreak(days, todayKey)`).

Retenção: manter tudo (o volume é minúsculo). A UI só lê 7 dias.

---

## 3. Dia lógico e janela (regras de `src/domain/day.ts`)

- `dayKeyFor(now, wake)`: se `minutesOf(now) ≥ wake`, o dia é a data local de `now`; senão, a data local de `now − 1 dia` (FR-030 e o edge case "virada do dia": goles entre dormir e acordar contam para o dia anterior).
- `windowFor(dayKey, wake, sleep)`: `start = dayKey@wake`; `end = start + awakeDuration`. Isso cobre o caso em que a janela cruza a meia-noite (ex.: 10h → 1h).
- `isInsideWindow(now)`: `start ≤ now < end`.

---

## 4. Planejamento de lembretes (`src/domain/reminders.ts`)

Entrada: `profile`, `consumedMl` de hoje, `now`, `lastSipAt?`. Saída: `Reminder[]` (hoje + próxima janela).

```
remainingGlasses = ceil(max(goal − consumed, 0) / 250)
se !remindersEnabled ou remainingGlasses = 0  → hoje: []           (FR-018, SC-003)
anchor  = max(now, window.start)                                     (início tardio / fora da janela)
interval = max( (window.end − anchor) / remainingGlasses , 30 min )  (FR-014)
first   = (lastSipAt ≥ window.start ? lastSipAt : anchor) + interval (FR-015)
chain: first, first+interval, …  enquanto t < window.end e k ≤ remainingGlasses   (FR-013, SC-004)
próxima janela: mesma fórmula com consumed = 0, anchor = nextWindow.start
```

Casos da spec que viram testes de tabela: AS-3.1 (2 L, 8h–22h → ~1h45), AS-3.4 (gole às 10h reagenda), AS-3.5/3.7 (meta batida/desfazer), edge cases de janela curta (piso de 30 min), início tardio, último lembrete antes de dormir e janela que cruza a meia-noite.

Texto (FR-020): `pickMessage(remainingGlasses, consumedMl, seed)` sorteia entre as 8 variações do design (`contracts/notifications.md`). "Falta pouquinho!" só aparece quando `remainingGlasses = 1`.

---

## 5. Transições de estado

```
Onboarding:  peso → meta → horários → permissão → (onboardingCompleted = true) → Home

Dia (por dayKey):
  vazio (0 ml) ──registerSip──▶ parcial ──registerSip (≥ meta)──▶ meta batida ──registerSip──▶ acima da meta
       ▲               │  ▲                     │                                     │
       └──undo─────────┘  └────undo (< meta)────┘◀────────────undo (= meta)──────────┘

Efeitos por transição (syncSideEffects):
  qualquer gole/undo/mudança de perfil → replanejar lembretes; atualizar a Live Activity
  cruzou para meta batida → cancelar os lembretes de hoje; celebrar; LA: "Bom trabalho! 🎉" → end após ~5 min
  saiu de meta batida (undo) → reagendar se ainda houver janela (FR-019)

Live Activity:  inexistente ──app abre e meta não batida──▶ ativa ──update──▶ ativa
                 ativa ──meta batida──▶ celebrando ──~5 min──▶ encerrada
                 ativa ──8 h (iOS)──▶ encerrada ──app abre e meta não batida──▶ ativa
```

---

## 6. Snapshot para superfícies do sistema (`SurfaceState`)

Props enviados à Live Activity (e ao widget, se entrar no escopo). JSON simples, sem `Date`:

| Campo | Tipo | Uso |
|---|---|---|
| `consumedMl` | `number` | "1,25" |
| `goalMl` | `number` | "/ 2 L" |
| `progress` | `number` 0..∞ | barra/anel |
| `expression` | `MascotExpression` | gota/garrafa |
| `nextReminderAt` | `number \| null` | "Próximo lembrete em 45 min" |
| `celebrating` | `boolean` | "Bom trabalho! 🎉" |
| `pendingSips` | `number` | goles feitos na própria atividade, ainda não importados pelo app (R5 Fase A) |
| `seq` | `number` | contador monotônico usado na idempotência (`processed_event`) |

Detalhes e mapeamento por região em [contracts/live-activity.md](./contracts/live-activity.md).
