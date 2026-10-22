Oi! Quero que você desenhe as telas do **Wotah**, um app de iPhone que lembra a pessoa de beber água. Antes de começar, leia este briefing inteiro: ele explica o produto, as regras e o visual que eu quero.

## O que é o app

O Wotah é um contador de água com uma **garrafa-mascote** no centro. A pessoa bebe um copo, toca em "+" e a garrafa enche. Ao longo do dia, o app manda lembretes no ritmo certo para ela bater a meta antes de dormir. Dá para registrar o gole direto pela notificação ou pela Dynamic Island, sem abrir o app.

O app deve ser simples, carinhoso e rápido: registrar um gole nunca deve levar mais de um toque.

## Público e tom

- Pessoas comuns que esquecem de beber água. Nada de estética "fitness" ou de cobrança.
- O tom é de um amigo fofo que torce por você, sem dar bronca.
- Todos os textos são em **português do Brasil**, curtos e simpáticos.

## Identidade visual

- Estilo **fofo e ilustrado**, em **tons pastel** (sugestão: azuis-água e menta, com um toque de rosa ou pêssego para os destaques). Pode propor outra paleta desde que continue pastel e delicada.
- Formas arredondadas e cantos generosos. Nada de visual técnico ou de dashboard.
- O app precisa ter **modo claro e modo escuro**. No escuro, os tons pastel continuam suaves, sem neon.
- Use uma tipografia amigável e arredondada, que fique legível em tamanhos pequenos (Dynamic Island).

## A garrafa-mascote (elemento principal)

A garrafa tem uma carinha. O nível da água dentro dela mostra o progresso do dia e sobe com uma animação a cada gole. A expressão muda conforme o progresso:

| Progresso | Expressão |
|---|---|
| menos de 25% | **sedenta** (cansadinha, língua de fora ou boca seca) |
| 25% a 99% | **animada** |
| 100% | **radiante** |
| acima de 100% | **comemorando** (garrafa cheia, com brilho e confete) |

Preciso das quatro expressões desenhadas, além de uma versão mini da garrafa ou de uma gota para usar como ícone na Dynamic Island.

## Regras que afetam o design

- Cada gole é sempre **um copo de 250 ml**. Não existe escolha de tamanho.
- O progresso aparece em litros com vírgula: **"1,25 / 2 L"**.
- Acima da meta, o app continua contando (ex.: "2,25 / 2 L"). A garrafa fica cheia e ganha brilho.
- **Desfazer:** depois de cada gole aparece um aviso temporário (toast) "Desfazer". Segurar o botão "+" abre a opção "Desfazer último gole".
- Ao bater a meta, aparece **"Bom trabalho! 🎉"** e os lembretes do dia param.

## Telas que preciso

**1. Onboarding (3 passos + permissão)**
1. "Quanto você pesa?" com um seletor de kg (de 30 a 250).
2. "Sua meta diária": meta sugerida (peso × 35 ml, arredondada para múltiplos de 250 ml), editável com botões − / + que mudam 250 ml por vez. Exemplo: 70 kg → 2,5 L.
3. "Que horas você acorda e dorme?" com dois seletores de horário.
4. Pedido de permissão de notificações, com uma explicação curta e fofa do motivo antes do pop-up do iOS.

Deve ser rápido: a pessoa termina em menos de 1 minuto.

**2. Home**
- A garrafa-mascote grande no centro, com o nível de água e a expressão atual.
- O progresso "X / Y L".
- Um botão **"+"** grande e fácil de tocar (com a opção de desfazer ao segurar).
- Uma faixa com os **últimos 7 dias**: cada dia aparece como cheio (bateu a meta), parcial ou vazio.
- O contador de sequência **"🔥 5 dias"**, exibido só quando a sequência for de 1 dia ou mais.
- Uma indicação discreta do próximo lembrete (ex.: "Próximo lembrete às 14h30").
- O toast "Desfazer".

Estados da Home que quero ver:
- dia começando (0 ml, mascote sedenta);
- meio do dia;
- meta batida, com "Bom trabalho! 🎉";
- acima da meta;
- notificações desativadas, com um aviso discreto explicando como ativar os lembretes.

**3. Ajustes**
Peso, meta (passos de 250 ml), horário de acordar e de dormir, e liga/desliga dos lembretes. Ao mudar o peso, o app *oferece* atualizar a meta, mas não muda sozinho.

**4. Notificação**
Uma notificação do iOS com um texto curto e simpático e um único botão de ação: **"Bebi 💧"**. Proponha de 5 a 8 variações de texto (ex.: "Hora de um golinho! 💧").

**5. Live Activity / Dynamic Island**
- **Compacta:** gota ou mini-garrafa à esquerda e "1,25 / 2 L" à direita.
- **Mínima** (quando outra atividade divide a ilha): a gota com um anel de progresso.
- **Expandida:** barra de progresso, "próximo lembrete em 45 min" e o botão **"Bebi 💧"**.
- **Tela de bloqueio:** o mesmo conteúdo da expandida, num card mais largo.
- **Meta batida:** "Bom trabalho! 🎉" (aparece por alguns minutos antes de a atividade sumir).

Respeite as dimensões e as áreas seguras reais da Dynamic Island e da tela de bloqueio do iPhone. O espaço é pequeno, então o texto tem que caber.

**6. Widget da tela de início (área de trabalho)**
Quero um widget para a pessoa deixar na tela de início do iPhone e acompanhar a água sem abrir o app. Desenhe nos tamanhos padrão do iOS:
- **Pequeno (2×2):** a mini-garrafa com o nível de água e a expressão atual, mais "1,25 / 2 L".
- **Médio (4×2):** a garrafa à esquerda. À direita, o progresso "X / Y L", "Próximo lembrete às 14h30" e um botão **"Bebi 💧"** que registra 250 ml sem abrir o app.
- **Grande (4×4), opcional:** o mesmo conteúdo do médio, mais a faixa dos últimos 7 dias e a sequência "🔥 5 dias".

Para cada tamanho, mostre os estados:
- dia começando (mascote sedenta);
- meio do dia;
- meta batida, com "Bom trabalho! 🎉";
- acima da meta.

Mostre também cada widget em **modo claro, modo escuro e no modo "tingido"** (ícones e widgets monocromáticos do iOS). Respeite as margens e os cantos arredondados padrão dos widgets do iOS.

**7. Visão de conjunto: widget + Dynamic Island + notificação**
Monte uma imagem com um iPhone mostrando as três peças juntas, para eu ver se elas parecem da mesma família:
- a tela de início com o widget;
- a Dynamic Island compacta no topo;
- uma notificação de lembrete chegando, com o botão "Bebi 💧".

Faça também uma versão na **tela de bloqueio**, com a Live Activity e uma notificação empilhadas. As três peças devem usar a mesma garrafa, as mesmas cores e o mesmo botão "Bebi 💧", para a pessoa reconhecer o Wotah em qualquer lugar.

## O que NÃO fazer

- Não inventar recursos fora desta lista: login, gráficos mensais, vários tamanhos de copo, integração com o app Saúde, inglês.
- Não usar linguagem de culpa ("Você falhou", "Está desidratado!").
- Não usar cores saturadas ou fortes demais.

## O que espero receber

1. A paleta de cores (claro e escuro) e a tipografia.
2. A garrafa-mascote nas 4 expressões, mais o ícone mini.
3. Todas as telas e estados listados acima, em tamanho de iPhone.
4. As variações da Dynamic Island e da tela de bloqueio.
5. Os widgets da tela de início (pequeno, médio e, se der, grande), com os estados e os modos claro, escuro e tingido.
6. A notificação com as variações de texto.
7. A visão de conjunto: widget, Dynamic Island e notificação juntos no iPhone.
8. Uma sugestão de como animar a água subindo quando a pessoa toca no "+".

O nome "Wotah" é provisório. Se tiver ideias de nome ou de logo, pode sugerir.
