# Implementation Plan: Wotah — Lembrete de hidratação com garrafa-mascote

**Branch**: `001-hydration-reminder-app` | **Date**: 2026-10-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-hydration-reminder-app/spec.md`

## Summary

App iOS de lembrete de hidratação com uma garrafa-mascote animada, construído em **Expo SDK 57** (sem Mac, builds no EAS) com **`expo-widgets`** para a Live Activity/Dynamic Island, **`expo-notifications`** para lembretes locais com a ação "Bebi 💧" e **`expo-sqlite`** para o histórico local. As regras de negócio (meta, dia lógico, cadeia de lembretes, expressão, sequência, formatação PT-BR) ficam num núcleo **TypeScript puro e determinístico** (`src/domain/`), atrás de ports, para que uma futura migração a Swift/SwiftUI seja só tradução. A UI segue `design/Wotah Sistema.html` como fonte de tokens e componentes e usa os demais HTMLs de `design/` como referência visual.

O principal risco técnico, documentado em [research.md](./research.md) R4/R5, é registrar goles **sem o app rodando**: a ação da notificação e o botão da Live Activity. A mitigação tem três partes: agendar a **cadeia inteira** de lembretes, reconciliar na abertura com idempotência, e manter um **Plano B nativo** isolado (Expo Module em Swift) que só entra se os spikes S1/S2 falharem.

## Technical Context

**Language/Version**: TypeScript 5.x/6.x (`strict`) sobre React Native 0.86 / React 19.2 (Expo SDK 57, patch ≥ 57.0.17). Swift só no Plano B opcional (`modules/wotah-native`).

**Primary Dependencies**: `expo` 57, `expo-router`, `expo-dev-client`, `expo-widgets` + `@expo/ui` (SwiftUI), `expo-notifications`, `expo-sqlite`, `expo-file-system`, `expo-font` + `@expo-google-fonts/fredoka` e `@expo-google-fonts/nunito`, `expo-haptics`, `react-native-svg`, `react-native-reanimated` 4, `zustand`.

**Storage**: SQLite local (`expo-sqlite`) com o banco no App Group `group.<bundleId>` (pendente do spike S3). Schema em [data-model.md](./data-model.md#2-persistência-sqlite-srcservicesdb). Sem servidor (FR-031).

**Testing**: Jest + `jest-expo` (domínio e casos de uso com relógio injetado), `@testing-library/react-native` (componentes/telas), mocks de `expo-notifications`/`expo-widgets` para os planos de agendamento. Validação manual em aparelho conforme o [quickstart.md](./quickstart.md). Maestro via EAS Workflows é opcional.

**Target Platform**: iOS 16.4+ (mínimo do SDK). Live Activity com iOS 16.1+ na prática; botão interativo com iOS 17+. A Dynamic Island exige um modelo compatível. Android não é alvo da v1, mas o domínio e a UI são portáveis.

**Project Type**: mobile-app (um único app Expo com CNG; sem pasta `ios/` versionada).

**Performance Goals**: animação do gole a 60 fps na UI thread (SC-006), < 1,5 s no total; app, LA e próximo lembrete consistentes em ≤ 2 s após um gole com o app vivo (SC-005); cold start até a Home < 2 s.

**Constraints**: 100% offline (SC-008); sem conta; sem push; ≤ 48 notificações pendentes (limite do iOS: 64); Live Activity sujeita ao limite de 8 h e aos orçamentos de update do iOS; o runtime do widget é isolado (só `@expo/ui/swift-ui`, sem hooks, imports ou storage); somente PT-BR; claro e escuro; respeitar Reduzir movimento.

**Scale/Scope**: 1 usuário por aparelho; 5 telas (3 de onboarding + permissão, Home, Ajustes); 1 Live Activity; ~4 tabelas; histórico de 7 dias na UI.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

⚠️ `.specify/memory/constitution.md` ainda é o **template sem preenchimento**: não há princípios ratificados. Na falta deles, foram aplicados os gates abaixo, que derivam das restrições explícitas do usuário (`SPEC.md`) e de boas práticas. Recomendação: rodar `/speckit-constitution` para formalizá-los.

| Gate (provisório) | Origem | Pré-Phase 0 | Pós-Phase 1 |
|---|---|---|---|
| G1. Regras de negócio isoladas da UI e da plataforma (portáveis para Swift) | `SPEC.md` › Stack | ✅ planejado | ✅ `src/domain` puro + ports ([domain-api](./contracts/domain-api.md)) |
| G2. Sem servidor, sem conta, offline | FR-026, FR-031 | ✅ | ✅ SQLite local, notificações locais, LA sem push |
| G3. Construível e testável sem Mac | spec › Assumptions | ✅ EAS + dev client | ✅ Jest no Windows; aparelho via EAS ([quickstart](./quickstart.md)) |
| G4. Regras cobertas por testes antes da UI | boa prática | ✅ | ✅ casos de aceitação viram testes de tabela no domínio |
| G5. Simplicidade: um app, sem dependências sem justificativa | boa prática | ✅ | ✅ cada dependência justificada em research; Plano B nativo só se um spike falhar |
| G6. Visual fiel ao design system | pedido do usuário | ✅ | ✅ [design-tokens](./contracts/design-tokens.md) extraído de `Wotah Sistema.html` |

Resultado: **PASS** (sem violações). Nada a registrar em Complexity Tracking. O Plano B nativo é condicional e está registrado abaixo como complexidade potencial.

## Project Structure

### Documentation (this feature)

```text
specs/001-hydration-reminder-app/
├── plan.md              # Este arquivo
├── research.md          # Phase 0: decisões, riscos e spikes S1–S4
├── data-model.md        # Phase 1: entidades, SQLite, dia lógico, plano de lembretes
├── quickstart.md        # Phase 1: setup EAS + roteiro de validação
├── contracts/
│   ├── domain-api.md    # API pura do domínio + casos de uso/ports
│   ├── notifications.md # categoria, ação, textos, idempotência
│   ├── live-activity.md # regiões, props, botão, ciclo de vida
│   └── design-tokens.md # tokens e componentes de Wotah Sistema.html
├── checklists/
└── tasks.md             # Phase 2 (/speckit-tasks; não criado aqui)
```

### Source Code (repository root)

```text
app.config.ts             # bundleId, plugins: expo-widgets, expo-notifications, expo-font, expo-sqlite
eas.json                  # perfis development / preview / production
src/
├── app/                  # Expo Router
│   ├── _layout.tsx       # fontes, tema, boot (registerCategories, response listener, reconcile)
│   ├── (onboarding)/     # weight.tsx, goal.tsx, schedule.tsx, permission.tsx
│   └── (main)/           # index.tsx (Home), settings.tsx
├── domain/               # TS puro: constants, goal, day, progress, reminders, messages, format, types
├── usecases/             # registerSip, undoLastSip, updateProfile, completeOnboarding, reconcile, syncSideEffects
├── services/             # adapters dos ports
│   ├── db/               # client.ts (App Group path), migrations.ts, sipRepo.ts, profileRepo.ts
│   ├── notifications/    # scheduler.ts, responses.ts, categories.ts
│   ├── liveActivity.ts
│   └── haptics.ts
├── state/store.ts        # Zustand (somente leitura derivada + toast)
├── ui/
│   ├── theme/            # tokens.ts, useTheme.ts, typography.ts
│   └── components/       # Mascot, DropIcon, ProgressRing, PlusButton, UndoToast, WeekStrip, ...
└── widgets/
    └── WotahDay.tsx      # createLiveActivity (diretiva 'widget')
modules/
└── wotah-native/         # (CONDICIONAL: Plano B) Expo Module Swift: LiveActivityIntent + delegate de notificação
tests/
├── domain/               # testes de tabela por FR/AS
├── usecases/             # com fakes dos ports e relógio fixo
└── ui/                   # RNTL
assets/                   # ícone (gota), splash, PNGs do mascote para a LA (se S4 exigir)
```

**Structure Decision**: um único app Expo (mobile-app) com CNG. As fronteiras são `domain` (puro) → `usecases` (orquestração via ports) → `services` (Expo/nativo) → `app`/`ui` (React). `modules/wotah-native` só é criado se os spikes S1/S2 falharem.

## Phase 0 — Research (concluída)

Ver [research.md](./research.md). Nenhum `NEEDS CLARIFICATION` ficou aberto. Decisões: SDK 57 (R1), EAS + dev client + CNG (R2), domínio puro com ports (R3), cadeia de lembretes + reconciliação idempotente (R4), Live Activity Fase A/B (R5), SQLite no App Group (R6), Zustand (R7), Expo Router (R8), SVG + Reanimated para o mascote (R9), tokens do Sistema (R10), widget de tela de início fora da spec (R11), Jest/RNTL (R12), dia lógico (R13).

## Phase 1 — Design (concluída)

- [data-model.md](./data-model.md): entidades Profile, Sip, Day, Reminder (calculado), MascotExpression, SurfaceState; schema SQLite; regras de dia/janela; algoritmo da cadeia de lembretes; transições.
- [contracts/](./contracts/): domain-api, notifications, live-activity, design-tokens.
- [quickstart.md](./quickstart.md): setup sem Mac, spikes e roteiro manual por User Story.

**Ordem sugerida para o `/speckit-tasks`**: (0) scaffolding + EAS dev build + spikes S1–S4 → (1) domínio + testes → (2) DB + casos de uso → (3) tokens + Mascot + Home/US1 → (4) onboarding/US2 + Ajustes → (5) notificações/US3 → (6) Live Activity/US4 → (7) histórico/US5 → (8) polimento (escuro, Reduzir movimento, acessibilidade, ícone/splash).

## Pontos para o usuário decidir

1. **Widget da tela de início** (desenhado em `Wotah Widgets.html`) **não está na spec**. Para incluí-lo na v1, atualize a spec (nova User Story + FRs) antes do `/speckit-tasks`. A arquitetura (`SurfaceState`) já o comporta.
2. **SC-005 com o app encerrado**: no modo Expo puro, um gole feito pela Live Activity com o app fechado só é refletido no banco e nos lembretes quando o app abrir. Vale aceitar essa ressalva na spec ou exigir o Plano B nativo desde já.
3. **Constituição**: formalizar os gates G1–G6 com `/speckit-constitution`.

## Complexity Tracking

| Possível violação | Por que pode ser necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| Expo Module Swift `modules/wotah-native` (condicional) | FR-016/FR-023 exigem registrar o gole sem abrir o app; o runtime do `expo-widgets` não acessa storage nem notificações, e a ação em segundo plano no iOS pode não rodar JS | "Só reconciliar na abertura" deixa o histórico e os lembretes defasados até o usuário abrir o app; só é aceitável se o usuário aceitar a ressalva do ponto 2 |
