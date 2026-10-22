# Research — Wotah (001-hydration-reminder-app)

**Data**: 2026-10-22 · **Entrada**: [spec.md](./spec.md), `SPEC.md`, `DESIGN-BRIEF.md`, `design/*.html`

Cada item segue o formato **Decisão / Justificativa / Alternativas**. Itens marcados com ⚠️ dependem de uma validação em aparelho (spike) antes de construir em cima.

---

## R1. Versão do Expo SDK

- **Decisão**: Expo **SDK 57** (patch ≥ 57.0.17, React Native 0.86, React 19.2). Avaliar o SDK 58 só quando ele sair do beta.
- **Justificativa**: o `expo-widgets` virou estável no SDK 56, mas o SDK 56 tem uma regressão de memória do Hermes V1 com `react-native-reanimated`/`react-native-worklets`. O app usa Reanimated na animação da garrafa. O SDK 57 corrige a regressão e é uma atualização sem breaking changes em relação ao 56. O `SPEC.md` pede "SDK 56+", então o 57 atende.
- **Alternativas**: SDK 56 (descartado pela regressão), SDK 58 beta (RN 0.88 RC, mira o iOS 27; instável demais para começar). O SDK 58 traz o pacote novo `expo-app-intents`, que pode resolver o R5 sem Swift. Acompanhar.
- **Requisitos herdados**: iOS mínimo 16.4 (SDK 56+). Xcode 26.4+ só nos builders do EAS.

## R2. Build e testes sem Mac

- **Decisão**: **EAS Build** (cloud, macOS runners) + **development build** (`expo-dev-client`) instalado no iPhone via TestFlight/ad-hoc. O dia a dia roda em Windows com Metro (`npx expo start --dev-client`) e o iPhone conectado na mesma rede (ou `--tunnel`).
- **Justificativa**: o `expo-widgets`, as categorias de notificação com ação e as Live Activities não funcionam no Expo Go. Só uma development build tem a Widget Extension gerada pelo prebuild. O EAS gera certificados e provisioning profiles sem Xcode local.
- **Boas práticas adotadas**:
  - **CNG (Continuous Native Generation)**: sem pasta `ios/` versionada. Toda configuração nativa vem de `app.config.ts` + config plugins. No SDK 57, o `prebuild` limpa os diretórios nativos, o que reforça essa regra.
  - Perfis em `eas.json`: `development` (dev client, distribuição interna), `preview` (release interno via TestFlight) e `production`.
  - Rebuild nativo só quando mudar dependência nativa ou config plugin. Mudanças de JS vão por Metro (dev) ou **EAS Update** (preview).
  - O iPhone precisa ser registrado com `eas device:create` para builds ad-hoc. Alternativa: usar o TestFlight em todos os builds.
  - `npx expo install` (nunca `npm i` direto) para pacotes Expo e `npx expo-doctor` no CI.
- **Alternativas**: Expo Go (inviável), Mac alugado na nuvem (desnecessário), builds locais (exigem Mac).

## R3. Estrutura do código e isolamento das regras de negócio

- **Decisão**: um único app Expo com três camadas:
  1. `src/domain/` — **TypeScript puro**, sem imports de React/React Native/Expo. Contém regras de meta, janela/dia lógico, cálculo de lembretes, expressão do mascote, sequência e formatação PT-BR. É **funcional e determinístico**: o relógio entra como parâmetro (`now: Date`).
  2. `src/services/` — adaptadores de plataforma (SQLite, notificações, Live Activity, háptico). Cada um implementa uma interface definida no domínio (ports & adapters).
  3. `src/app/` (Expo Router) + `src/ui/` — telas e componentes.
- **Justificativa**: o `SPEC.md` diz que uma possível migração para Swift deve ser "só tradução". Com o domínio puro e sem dependências, a reescrita vira portar ~10 funções puras com os mesmos testes de tabela (os mesmos casos viram `XCTest`). Também permite testar 100% das regras no Windows com Jest, sem aparelho.
- **Alternativas**: lógica dentro de hooks/stores (acopla ao React e dificulta o port), monorepo com pacote `@wotah/domain` (complexidade sem ganho agora; dá para extrair depois sem mudar código).

## R4. Notificações locais com ação "Bebi 💧" ⚠️

- **Decisão**: `expo-notifications` com uma categoria `WOTAH_REMINDER` e uma ação `DRINK` (`buttonTitle: "Bebi 💧"`, `opensAppToForeground: false`). Gatilho `DATE` para cada lembrete. A cada mudança de estado, **cancelar todos os lembretes e reagendar a cadeia inteira** que falta: os lembretes restantes de hoje mais a cadeia completa da próxima janela (assumindo 0 ml).
- **Justificativa**:
  - Agendar a **cadeia inteira** (e não só "o próximo") garante que os lembretes continuem chegando dentro da janela mesmo se o JS não rodar depois de uma ação em segundo plano ou de um gole pela Live Activity. O pior caso fica "um lembrete adiantado", e não "nenhum lembrete".
  - Incluir a próxima janela cobre o dia seguinte se o usuário não abrir o app (o dia zera no horário de acordar).
  - Volume: com meta máxima de 6 L, são no máximo 24 por dia; hoje + amanhã ≤ 48. Isso fica abaixo do limite de 64 notificações pendentes do iOS.
  - O texto ("Faltam {n} copos") é calculado no agendamento para cada item da cadeia, assumindo que nenhum gole acontece entre eles. Ele é recalculado a cada gole.
- **Risco ⚠️**: a documentação do Expo não garante que o JS rode no iOS quando o usuário toca uma ação com `opensAppToForeground: false` e o app está **encerrado**. O `registerTaskAsync` só cobre esse caso no Android. Há relatos antigos de listener que não dispara em segundo plano.
- **Mitigação (camadas)**:
  1. Handler único `handleNotificationResponse()` registrado no topo do módulo (antes do primeiro render) via `addNotificationResponseReceivedListener`. Quando o iOS acorda o app em segundo plano, o JS roda o handler.
  2. No cold start e em todo retorno ao primeiro plano: `getLastNotificationResponse()` + dedupe por `request.identifier` (idempotência; ver tabela `processed_responses` no data model).
  3. Como a cadeia já está agendada, um gole perdido não gera excesso de notificações. No máximo chega um lembrete "a mais".
  4. **Plano B nativo**: um Expo Module local em Swift (`modules/wotah-native`) que implementa o `UNUserNotificationCenterDelegate` para a ação `DRINK` e grava o gole direto no SQLite do App Group (ver R6). Só entra se o spike S1 falhar.
- **Tocar no corpo** da notificação (FR-017): o mesmo handler, com `actionIdentifier === DEFAULT_ACTION_IDENTIFIER`. Registra o gole, abre a Home e mostra o toast "Desfazer".
- **Alternativas**: agendar só o próximo lembrete (frágil sem JS em segundo plano), gatilho `TIME_INTERVAL` repetitivo (não respeita a janela nem a meta), push remoto (exige servidor; fora do escopo).

## R5. Live Activity / Dynamic Island com `expo-widgets` ⚠️ (risco principal)

- **Decisão**: `expo-widgets` com `createLiveActivity('WotahDay', …)`, nas regiões `compactLeading`, `compactTrailing`, `minimal`, `expandedLeading`/`expandedTrailing`/`expandedCenter`/`expandedBottom` e `banner` (tela de bloqueio). Componentes de `@expo/ui/swift-ui`. Ciclo de vida:
  - **Início**: ao abrir o app, se a meta do dia não foi batida e `Factory.getInstances()` estiver vazio, chamar `start(props, 'wotah://home')`.
  - **Atualização**: `instance.update(props)` a cada gole registrado no app.
  - **Meta batida**: `update({ celebrating: true })` e depois `end('default', props)` com `after(now + 5 min)`.
  - **Expiração de 8 h**: aceita. A atividade é reiniciada no próximo `AppState → active`.
  - `NSSupportsLiveActivitiesFrequentUpdates` não é necessário (no máximo algumas dezenas de updates por dia).
- **Contagem até o próximo lembrete**: enviar `nextReminderAt` (epoch ms) nos props e renderizar com texto relativo/timer do SwiftUI, para o iOS contar sozinho sem updates por minuto.
- **Botão "Bebi 💧" (FR-023) — limitação confirmada**:
  - O `onPress` de um botão `expo-widgets` roda no **runtime isolado do widget**. O valor que ele retorna vira os novos props da atividade, então **a própria atividade sobe 250 ml na hora, mesmo com o app encerrado**.
  - Porém, o runtime isolado **não acessa o SQLite do app nem o `expo-notifications`**. O app só fica sabendo via `addUserInteractionListener`, que **só dispara com o processo do app vivo**. Além disso, a issue [expo/expo#49828](https://github.com/expo/expo/issues/49828) (listener não recebe interações no SDK 57) segue aberta.
- **Estratégia em duas fases**:
  - **Fase A (Expo puro, v1)**: o `onPress` retorna `{ ...props, consumedMl: props.consumedMl + 250, pendingSips: props.pendingSips + 1 }`. Com o app vivo, o listener grava o gole (origem `live_activity`) e reagenda. Com o app encerrado, a atividade mostra o valor certo, e na próxima abertura o app reconcilia: lê os props atuais via `getInstances()` e importa os `pendingSips`. A cadeia de lembretes já agendada (R4) continua valendo até a reconciliação. **SC-005 (consistência em 2 s) só é garantido com o app vivo.** Essa ressalva vai ser registrada na spec.
  - **Fase B (se o spike S2 mostrar que os props não são legíveis ou que o listener não funciona)**: um Expo Module local em Swift com um `LiveActivityIntent` (iOS 17) que grava o gole no SQLite do App Group e reagenda os `UNNotificationRequest`s com as mesmas regras do domínio (portadas). É a primeira peça "nativa" que o usuário já previa, e fica isolada em `modules/wotah-native/`. Alternativa sem Swift a acompanhar: `expo-app-intents` (SDK 58).
- **Alternativas**: `expo-apple-targets` + SwiftUI escrito à mão (mais controle, mas sai do "Expo widgets primeiro" pedido pelo usuário), push-to-start/push update (exige servidor; fora da v1).

## R6. Armazenamento local

- **Decisão**: **`expo-sqlite`** (API síncrona/assíncrona moderna) com o arquivo do banco **dentro do App Group** (`group.<bundleId>`, o mesmo do `expo-widgets`), resolvido via `Paths.appleSharedContainers` do `expo-file-system`. O modelo é um log de eventos `sip` (append + soft-delete para desfazer). Os totais diários são derivados.
- **Justificativa**:
  - O histórico, a sequência e o desfazer são consultas naturais em SQL. O log de goles com `source` atende à entidade Gole da spec.
  - O banco no App Group permite que o Plano B nativo (R4/R5) grave no **mesmo** banco sem migrar dados.
  - `PRAGMA user_version` + migrations versionadas em código.
  - ⚠️ Confirmar no spike S3 que `openDatabaseSync(name, options, directory)` aceita o diretório do App Group. Se não aceitar, usar o diretório padrão na v1 e migrar o arquivo quando o Plano B entrar.
- **Preferências** (perfil): numa tabela `profile` de linha única no mesmo banco. Isso evita um segundo mecanismo como AsyncStorage/MMKV.
- **Alternativas**: AsyncStorage (sem consultas, e o JSON cresce sem controle), MMKV (rápido, mas é outro storage nativo e não ajuda no histórico), Drizzle ORM (dá para adicionar depois; para 4 tabelas o SQL direto é mais simples).

## R7. Estado da UI

- **Decisão**: **Zustand** como store fina de leitura (`profile`, `today`, `week`, `nextReminderAt`, `toast`). Toda escrita passa por **casos de uso** (`registerSip`, `undoLastSip`, `updateProfile`), que gravam no SQLite e depois ressincronizam os efeitos (notificações, Live Activity, widget) num único `syncSideEffects()`.
- **Justificativa**: um ponto único de escrita garante a regra "todo gole, por qualquer meio, reagenda". A store é descartável: dá para reconstruí-la do banco a qualquer momento (cold start ou volta ao primeiro plano).
- **Alternativas**: Context + useReducer (re-render amplo), Redux Toolkit (cerimônia demais para 3 telas), TanStack Query (pensado para dados remotos).

## R8. Navegação

- **Decisão**: **Expo Router** (file-based). Grupos `(onboarding)` e `(main)`, com redirecionamento por `profile.onboardingCompleted`. Deep link `wotah://home?sip=1` reservado para o toque na Live Activity sem botão interativo.
- **Justificativa**: é o padrão do template Expo. No SDK 56+ ele não depende mais de React Navigation, e o deep linking vem pronto.
- **Alternativas**: React Navigation direto (mais configuração e sem ganho).

## R9. Animação da garrafa-mascote

- **Decisão**: portar o componente `Mascote` de `design/Wotah Sistema.html` (SVG de viewBox `-30 -30 260 320`) para **`react-native-svg`**, animado com **`react-native-reanimated` 4**:
  - Nível da água: `waterY = 278 − min(p,1) × 214`, animado com `withSpring` com overshoot (equivalente ao `cubic-bezier(.34,1.45,.55,1)` de 1,1 s com 280 ms de atraso).
  - Duas ondas (`translateX`) em loop infinito, em sentidos opostos (2,6 s e 3,4 s, lineares).
  - Squash & stretch do corpo a partir dos pés (`scale 1.06/.93 → .97/1.05 → 1`, 650 ms, atraso de 300 ms), só quando o nível sobe.
  - Gota voando do "+" ao gargalo (0–520 ms). Botão afunda para 92% (0–150 ms) com `expo-haptics` leve. Confete (~1 s) + háptico de sucesso ao bater a meta.
  - A expressão troca no meio do pulo quando o progresso cruza 25% ou 100%.
  - **Reduzir movimento** (`useReducedMotion`): sem pulo, sem gota e sem confete; só a troca de nível, de expressão e do número.
  - Toques repetidos no meio da animação somam goles. O alvo da mola é atualizado sem reiniciar a animação.
- **Justificativa**: o SVG do design já é a fonte da verdade (paths, cores, expressões) e o `react-native-svg` renderiza os mesmos paths. A animação roda na UI thread com Reanimated, o que atende ao SC-006.
- **Alternativas**: Lottie/Rive (exigiria refazer a arte noutra ferramenta), Skia (mais poder, mas é dependência a mais para uma cena simples).

## R10. Design system a partir de `Wotah Sistema.html`

- **Decisão**: os tokens extraídos de `design/Wotah Sistema.html` viram `src/ui/theme/tokens.ts` (contrato em [contracts/design-tokens.md](./contracts/design-tokens.md)). Os demais HTMLs (`Telas`, `Live Activity`, `Widgets`) são **referência visual** das telas e estados. O tema claro/escuro segue `useColorScheme()` (FR-033).
- **Fontes**: **Fredoka** (500/600; títulos e números com `tabular-nums`) e **Nunito** (400/700/800; texto, botões e legendas) via `expo-font` + `@expo-google-fonts/*`, embutidas pelo config plugin do `expo-font` (sem flash no carregamento).
- **Nas superfícies do sistema** (Live Activity/widget): o runtime do widget não carrega as fontes do app automaticamente. Usar a fonte do sistema com `design: rounded` (SF Rounded), que tem o mesmo espírito, e só tentar a Fredoka se o `expo-widgets` permitir incluir fontes na extensão.
- **Mascote nas superfícies do sistema**: a gota com carinha vira SwiftUI shapes/SF Symbol, ou PNGs pré-renderizados (4 expressões, poucos níveis) gravados em `widgetsDirectory` e referenciados pelos props.
- **Alternativas**: NativeWind/Tailwind (bom, mas os tokens são poucos e o design usa estilos inline; um `StyleSheet` com tokens tipados basta), Tamagui (pesado demais para o escopo).

## R11. Widget da tela de início (gap entre design e spec)

- **Constatação**: o `DESIGN-BRIEF.md` e o `Wotah Widgets.html` desenham widgets pequeno, médio e grande (claro/escuro/tingido) com botão "Bebi 💧". A `spec.md` **não tem nenhum FR para o widget da tela de início**.
- **Decisão**: o plano deixa a arquitetura pronta (o mesmo snapshot `SurfaceState` alimenta a Live Activity e o widget via `updateSnapshot`), mas **as tarefas do widget só entram depois que a spec ganhar uma User Story e FRs** (rodar `/speckit-specify` ou editar a spec). O botão do widget tem a mesma limitação do R5.
- **Alternativas**: implementar sem spec (fere o fluxo SDD), descartar o widget (o design já existe e o custo marginal é baixo).

## R12. Testes e qualidade

- **Decisão**:
  - **Jest + `jest-expo`** para o domínio (testes de tabela cobrindo todos os cenários de aceitação e edge cases numéricos da spec), com relógio injetado.
  - **`@testing-library/react-native`** para componentes e telas (toast Desfazer, segurar o "+", onboarding).
  - **Testes de serviço** com mocks de `expo-notifications`/`expo-widgets` verificando o *plano* de agendamento (o que é cancelado e agendado).
  - **Validação manual em aparelho** (roteiro no [quickstart.md](./quickstart.md)) para notificações, Live Activity e Dynamic Island. Opcional: Maestro via EAS Workflows num simulador iOS para os fluxos de UI.
  - TypeScript `strict`, ESLint (`eslint-config-expo`) e Prettier. `expo-doctor` no CI.
- **Alternativas**: Detox (exige Mac localmente).

## R13. Fuso horário, relógio e virada do dia

- **Decisão**: todo cálculo usa a hora local do aparelho no momento (`now`). O "dia lógico" é identificado pela data local do **último horário de acordar ≤ now** (`dayKey = 'YYYY-MM-DD'`). Os goles guardam `occurredAt` (epoch ms, UTC) + `dayKey` calculado no registro. Ao voltar ao primeiro plano e em mudanças de fuso/relógio (`AppState` + checagem de `dayKey`), tudo é recalculado e reagendado.
- **Justificativa**: atende aos edge cases "janela que cruza a meia-noite", "virada do dia" e "mudança de fuso" sem biblioteca de datas pesada. O `date-fns` pode ajudar na formatação, mas o domínio usa aritmética de minutos do dia.

## Spikes obrigatórios (primeiras tarefas da implementação)

| ID | Pergunta | Como validar | Se falhar |
|---|---|---|---|
| S1 | Tocar "Bebi 💧" (`opensAppToForeground: false`) com o app **encerrado** roda o JS e grava o gole? | Dev build no iPhone, encerrar o app, disparar a notificação de teste, tocar na ação e abrir o app para ver o total | Plano B nativo (R4), com o `getLastNotificationResponse` cobrindo o caso parcial |
| S2 | `onPress` da Live Activity com app encerrado: (a) a atividade atualiza? (b) o app consegue ler os props atuais via `getInstances()`? (c) o `addUserInteractionListener` funciona com o app vivo (issue #49828)? | Dev build no iPhone com Dynamic Island | Fase B do R5 (`LiveActivityIntent` em Swift) |
| S3 | `expo-sqlite` abre o banco no diretório do App Group? | Log do caminho + leitura no Plano B | Diretório padrão na v1 |
| S4 | Fontes customizadas e imagens dentro da Live Activity/widget | Protótipo com Fredoka e PNG em `widgetsDirectory` | SF Rounded + SwiftUI shapes |

## Fontes consultadas

- [Expo SDK 56 changelog](https://expo.dev/changelog/sdk-56) · [Expo SDK 57 changelog](https://expo.dev/changelog/sdk-57) · [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta)
- [expo-widgets (SDK 57)](https://docs.expo.dev/versions/v57.0.0/sdk/widgets/) · [expo-widgets (SDK 56)](https://docs.expo.dev/versions/v56.0.0/sdk/widgets/) · [Blog: widgets estáveis no SDK 56](https://expo.dev/blog/ios-widgets-and-live-activities-in-expo) · [Blog: widgets e Live Activities](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo)
- [expo/expo#49828](https://github.com/expo/expo/issues/49828) · [expo-live-activity-recorder (exemplo da comunidade)](https://github.com/seniormobiledev/expo-live-activity-recorder)
- [expo-notifications (SDK 57)](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/) · [Fórum: respostas em segundo plano](https://forums.expo.dev/t/background-and-killed-push-notification-response-handling/55368)
- [Apple: Configuring app groups](https://developer.apple.com/documentation/xcode/configuring-app-groups)
