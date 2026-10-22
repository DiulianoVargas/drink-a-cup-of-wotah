# Wotah — Especificação v1

App de lembrete de hidratação com uma garrafa animada. Foco em iOS, construído em Expo (Android de graça depois).

## Stack
- Expo SDK 56+ (Windows, sem Mac), builds via EAS Build na nuvem.
- `expo-widgets` (estável no SDK 56, conferir changelog) para Live Activity / Dynamic Island.
- `expo-notifications` para lembretes locais com ação.
- Armazenamento local (AsyncStorage ou SQLite). Sem servidor.
- Exige development build + conta Apple Developer paga para testar no iPhone (não roda no Expo Go).
- Possível migração futura para Swift: manter as regras de negócio isoladas da UI para que a reescrita seja só tradução.

## Regras de negócio
- **Gole** = copo fixo de 250 ml.
- Botão **"+"** no app para registrar goles.
- **Desfazer último gole:** toast "Desfazer" logo após o gole + opção ao segurar o "+".
- **Meta:** sugerida como 35 ml × peso (kg), arredondada para múltiplos de 250 ml, editável.
- **Janela acordado:** horário de acordar e de dormir definidos pelo usuário.
- **Lembretes:** intervalo = tempo restante na janela ÷ copos restantes.
  - Cada gole (notificação, Dynamic Island ou "+") reagenda o próximo lembrete.
  - Nenhuma notificação fora da janela.
- **Meta batida:** cancela os lembretes do dia e mostra "Bom trabalho! 🎉". O app continua contando acima da meta (ex.: 2,25 / 2 L).
- **Novo dia:** o progresso zera no horário de acordar.
- Mudar a meta no meio do dia mantém o progresso e recalcula os lembretes.

## Notificação
- Ação única **"Bebi 💧"**, que registra 250 ml sem abrir o app.

## Live Activity / Dynamic Island
- **Compacta:** gota/mini-garrafa + "1,25 / 2 L".
- **Expandida + tela de bloqueio:** barra de progresso, contagem até o próximo lembrete, botão interativo "Bebi 💧" (iOS 17+).
- **Ciclo de vida:** inicia quando o app é aberto no dia e é atualizada a cada gole. Limite de 8 h do iOS: se expirar, as notificações seguem normalmente. Ao bater a meta, mostra "Bom trabalho! 🎉" brevemente e encerra.
- Sem push-to-start (exigiria servidor). Fica como possível v2.

## Histórico
- Total diário salvo localmente.
- Faixa com os últimos 7 dias (cheio/vazio) + contador de sequência ("🔥 5 dias").

## Onboarding
1. Peso → 2. Meta sugerida (editável) → 3. Horário de acordar/dormir → permissão de notificação.

## Visual
- Estilo fofo/ilustrado, tons pastel, garrafa-mascote com carinha que muda conforme enche.
- Idioma: somente PT-BR.

## Fora da v1
- Servidor / push-to-start, gráficos mensais, vários tamanhos de copo, Android polido, EN.
