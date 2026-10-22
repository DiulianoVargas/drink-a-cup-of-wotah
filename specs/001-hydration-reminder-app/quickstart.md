# Quickstart — validação do Wotah

Guia para subir o ambiente e provar, de ponta a ponta, que a feature funciona. Detalhes de regras: [data-model.md](./data-model.md); interfaces: [contracts/](./contracts/).

## Pré-requisitos

- Windows com Node.js LTS (≥ 20), Git e `npm`.
- Conta Expo (`npx eas-cli login`) e **Apple Developer paga** vinculada ao EAS.
- iPhone com iOS 17+ (Dynamic Island para a US4; iOS 16.4–16.x valida só US1–3 e US5) na mesma rede Wi-Fi do PC (ou use `--tunnel`).

## Setup

```bash
npm install
npx expo-doctor                     # deve passar sem erros
npx eas-cli device:create           # registra o iPhone (uma vez)
npx eas-cli build -p ios --profile development   # dev client na nuvem (~15–25 min)
# instale o build pelo link/QR do EAS (ou TestFlight)
npx expo start --dev-client         # Metro no Windows; abra o app no iPhone
```

Rebuild nativo (`eas build`) **só** quando mudar dependência nativa, `app.config.ts` ou config plugin. Mudanças de JS recarregam pelo Metro.

## Validação automatizada (Windows)

```bash
npm run typecheck     # tsc --noEmit
npm run lint
npm test              # Jest: domínio (tabelas da spec) + componentes + plano de agendamento
```

Esperado: todos os casos de aceitação numéricos da spec passam no domínio (AS-2.1, AS-3.1, AS-3.4–3.7, AS-5.1–5.4 e os edge cases de janela, virada de dia, piso de 30 min e faixas de peso/meta).

## Spikes (rodar antes de construir US3/US4; ver research › Spikes)

| ID | Passos | Resultado esperado |
|---|---|---|
| S1 | Agendar uma notificação de teste para daqui a 1 min → encerrar o app (swipe up) → tocar "Bebi 💧" → abrir o app | total +250 ml, sem duplicar |
| S2 | Abrir o app (LA inicia) → encerrar o app → expandir a ilha → "Bebi 💧" ×2 → abrir o app | LA mostrou +500 na hora; o app importa 2 goles na abertura |
| S3 | Log do caminho do `wotah.db` | dentro de `.../Shared/AppGroup/<id>/` |
| S4 | LA com Fredoka e PNG da gota | renderiza ou cai no fallback SF Rounded |

Registre o resultado de cada spike em `research.md` (Decisão final).

## Cenários manuais no iPhone

1. **Onboarding (US2, SC-001)**: instalação limpa → 70 kg → sugere **2,5 L** → − deixa 2,25 → 8h / 22h → "Permitir lembretes" → Home em < 1 min.
2. **Registro e desfazer (US1)**: "+" ×2 → "0,5 / 2 L", garrafa sobe com mola e o mascote fica "animada" ao cruzar 25% → "Desfazer" no toast → volta a 0,25 → segurar "+" 0,45 s → "Desfazer último gole" → 0 → desfazer indisponível.
3. **Lembretes (US3)**: nos Ajustes, janela = agora → agora+2h, meta 1 L. Espere: lembretes a cada ~30 min (2 h ÷ 4 copos). Toque "Bebi 💧" na notificação sem abrir o app → abra o app: total +250 e "Próximo lembrete" recalculado. Bata a meta → "Bom trabalho! 🎉" e **nenhuma** notificação até o próximo horário de acordar (SC-003). Desfaça um gole → lembretes voltam.
4. **Toque no corpo (FR-017)**: o app abre com +250 ml e o toast "Desfazer".
5. **Fora da janela (SC-004)**: janela já encerrada hoje → nenhum lembrete até amanhã no horário de acordar.
6. **Live Activity (US4)**: abrir o app → ilha compacta "gota + 0,25 / 2 L" → long-press expande → "Bebi 💧" → ilha, app e "próximo lembrete" consistentes em ≤ 2 s com o app vivo (SC-005) → bater a meta → "Bom trabalho! 🎉" e a atividade some em ~5 min.
7. **Histórico (US5)**: com seed de dev (`npm run seed:week`, só em dev), a faixa mostra cheio/parcial/vazio e "🔥 2 dias"; bater a meta hoje → "🔥 3 dias".
8. **Notificações negadas**: recusar no onboarding → a Home mostra o aviso discreto; o "+" funciona normalmente.
9. **Modo escuro e Reduzir movimento**: alternar nos Ajustes do iOS → cores do tema escuro do `design-tokens.md`; com Reduzir movimento, sem pulo e sem confete.
10. **Offline (SC-008)**: modo avião → todos os cenários 2, 3 e 7 funcionam.
