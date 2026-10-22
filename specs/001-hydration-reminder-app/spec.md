# Feature Specification: Wotah — Lembrete de hidratação com garrafa-mascote

**Feature Branch**: `001-hydration-reminder-app`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "App iOS (Expo, foco iOS) de lembrete de hidratação "Wotah" com garrafa-mascote animada. Usar todas as decisões já tomadas em SPEC.md na raiz do projeto: copo fixo de 250 ml + botão "+" e desfazer último gole; meta sugerida por peso (35 ml/kg, múltiplos de 250 ml, editável); lembretes calculados pela janela acordar/dormir ÷ copos restantes, reagendados a cada gole, nenhum fora da janela; notificação com ação "Bebi 💧" que registra sem abrir o app; ao bater a meta para de notificar no dia e mostra "Bom trabalho! 🎉", contando acima da meta; Live Activity/Dynamic Island local sem servidor (compacta com progresso, expandida/tela de bloqueio com barra, contagem até próximo lembrete e botão "Bebi 💧"), inicia ao abrir o app, limite de 8h aceito; histórico local de 7 dias + sequência; onboarding peso → meta → horários → permissão; visual fofo/ilustrado pastel com mascote cujas expressões mudam pelo nível; somente PT-BR."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar água e ver a garrafa encher (Priority: P1)

O usuário abre o app e vê uma garrafa-mascote que representa o progresso do dia em direção à meta. Cada vez que bebe um copo, toca no botão "+" e a garrafa sobe 250 ml com uma animação. A expressão do mascote muda conforme o nível. Se tocar sem querer, pode desfazer o último gole.

**Why this priority**: É o núcleo do app. Sem registrar água e visualizar o progresso não há produto. Sozinha, essa história já entrega um contador de água visual e útil.

**Independent Test**: Com uma meta já definida, tocar "+" várias vezes e verificar que o total, a garrafa e a expressão do mascote se atualizam, e que o "Desfazer" reverte o último registro.

**Acceptance Scenarios**:

1. **Given** meta de 2 L e 0 ml registrados, **When** o usuário toca "+", **Then** o total passa a 250 ml, a garrafa sobe proporcionalmente com animação e o progresso exibe "0,25 / 2 L".
2. **Given** um gole acabou de ser registrado, **When** o usuário toca "Desfazer" no aviso temporário, **Then** o total volta ao valor anterior e a garrafa desce.
3. **Given** o aviso "Desfazer" já sumiu, **When** o usuário segura o botão "+" e escolhe "Desfazer último gole", **Then** o gole mais recente do dia é removido.
4. **Given** 0 ml registrados no dia, **When** o usuário tenta desfazer, **Then** a opção fica indisponível e nada muda.
5. **Given** o progresso do dia, **When** ele cruza 0%, ~50%, 100% e acima de 100%, **Then** o mascote exibe, respectivamente, as expressões "sedento", "animado", "radiante" e "comemorando".

---

### User Story 2 - Configurar meta e rotina no primeiro uso (Priority: P1)

Na primeira abertura, o usuário passa por um onboarding curto: informa o peso, recebe uma meta sugerida que pode ajustar, informa o horário em que acorda e em que dorme e, por fim, é convidado a permitir notificações.

**Why this priority**: A meta e a janela acordado são pré-requisito do progresso (US1) e dos lembretes (US3).

**Independent Test**: Instalar o app do zero, completar o onboarding e verificar que a Home mostra a meta escolhida e que as configurações refletem os valores informados.

**Acceptance Scenarios**:

1. **Given** primeiro uso, **When** o usuário informa 70 kg, **Then** o app sugere 2,5 L (70 × 35 ml = 2.450 ml, arredondado ao múltiplo de 250 ml mais próximo).
2. **Given** a meta sugerida, **When** o usuário a ajusta, **Then** os valores mudam em passos de 250 ml.
3. **Given** os horários informados (ex.: acordar 8h, dormir 22h), **When** o onboarding termina, **Then** o app pede permissão de notificações com uma explicação e abre a Home.
4. **Given** o usuário recusa as notificações, **When** chega à Home, **Then** o app funciona normalmente para registro manual e exibe um aviso discreto explicando como ativar os lembretes.
5. **Given** o app já configurado, **When** o usuário altera meta, peso ou horários nos Ajustes, **Then** os novos valores passam a valer imediatamente, preservando o que já foi bebido no dia.

---

### User Story 3 - Receber lembretes e registrar direto pela notificação (Priority: P1)

Durante a janela acordado, o app lembra o usuário de beber água em intervalos calculados a partir do tempo restante e dos copos restantes. A notificação tem uma ação "Bebi 💧" que registra 250 ml sem abrir o app. Tocar na própria notificação também registra o gole e abre o app. Cada gole reagenda o próximo lembrete. Ao bater a meta, os lembretes param no dia.

**Why this priority**: É a proposta central do app ("o app me lembra de beber água") e o principal caminho de registro no dia a dia.

**Independent Test**: Configurar uma janela curta e uma meta pequena, aguardar os lembretes, usar a ação "Bebi 💧" e confirmar que o total sobe, o próximo lembrete é reagendado e que, ao bater a meta, nenhum outro lembrete chega no dia.

**Acceptance Scenarios**:

1. **Given** meta de 2 L, 0 ml bebidos e janela 8h–22h, **When** o dia começa às 8h, **Then** os lembretes são espaçados em ~1h45 (14 h ÷ 8 copos).
2. **Given** uma notificação de lembrete, **When** o usuário toca em "Bebi 💧", **Then** 250 ml são registrados sem abrir o app e o próximo lembrete é reagendado com base no novo restante.
3. **Given** uma notificação de lembrete, **When** o usuário toca no corpo da notificação, **Then** o app abre com 250 ml registrados e o aviso "Desfazer" visível.
4. **Given** o usuário registrou um gole pelo "+" às 10h, **When** o próximo lembrete estava previsto para 10h15, **Then** ele é reagendado para 10h + intervalo recalculado.
5. **Given** o total atinge ou passa a meta, **When** isso acontece por qualquer meio, **Then** todos os lembretes restantes do dia são cancelados e o app exibe "Bom trabalho! 🎉".
6. **Given** a hora atual está fora da janela acordado, **When** um lembrete seria calculado, **Then** nenhum lembrete é disparado até o início da próxima janela.
7. **Given** a meta foi batida e o usuário desfaz goles até ficar abaixo dela, **When** ainda há tempo na janela, **Then** os lembretes voltam a ser agendados.

---

### User Story 4 - Acompanhar pela Dynamic Island e tela de bloqueio (Priority: P2)

Com o app aberto no dia, uma atividade ao vivo aparece na Dynamic Island e na tela de bloqueio, mostrando o progresso. Na forma expandida e na tela de bloqueio aparecem uma barra de progresso, a contagem até o próximo lembrete e um botão "Bebi 💧" que registra o gole sem abrir o app.

**Why this priority**: É um diferencial importante, mas o app entrega valor completo sem ele (P1s). Também depende das capacidades do aparelho.

**Independent Test**: Em um iPhone com Dynamic Island, abrir o app, ir para a tela inicial do sistema e verificar a forma compacta. Expandir, tocar "Bebi 💧" e confirmar que o total no app e na atividade sobem 250 ml.

**Acceptance Scenarios**:

1. **Given** o app é aberto em um dia com meta não batida, **When** não há atividade ao vivo em andamento, **Then** uma é iniciada mostrando o progresso atual.
2. **Given** a atividade em andamento, **When** vista na forma compacta, **Then** mostra um ícone de gota/mini-garrafa e o progresso no formato "1,25 / 2 L".
3. **Given** a forma mínima (outra atividade disputa a ilha), **When** exibida, **Then** mostra a gota com um anel de progresso.
4. **Given** a forma expandida ou a tela de bloqueio, **When** o usuário toca "Bebi 💧", **Then** 250 ml são registrados e a atividade, o app e os lembretes se atualizam.
5. **Given** um gole registrado por qualquer meio, **When** a atividade está ativa, **Then** ela reflete o novo total e a nova contagem até o próximo lembrete.
6. **Given** a meta é batida, **When** a atividade está ativa, **Then** ela mostra "Bom trabalho! 🎉" por alguns minutos e é encerrada.
7. **Given** a atividade expirou pelo limite de tempo do sistema, **When** o usuário reabre o app e a meta ainda não foi batida, **Then** uma nova atividade é iniciada; enquanto isso, os lembretes por notificação continuam normalmente.

---

### User Story 5 - Ver histórico da semana e sequência (Priority: P3)

Na Home, o usuário vê os últimos 7 dias (cheio = meta batida, parcial, vazio) e um contador de sequência de dias consecutivos batendo a meta.

**Why this priority**: Dá motivação e contexto, mas não é necessário para o uso diário básico.

**Independent Test**: Com dados de vários dias, verificar que a faixa de 7 dias e a sequência refletem corretamente quais dias bateram a meta.

**Acceptance Scenarios**:

1. **Given** dados dos últimos 7 dias, **When** a Home é aberta, **Then** cada dia aparece como cheio (≥ meta do dia), parcial (> 0 e < meta) ou vazio (0).
2. **Given** a meta foi batida ontem e anteontem, mas não antes disso, **When** hoje ainda não foi batida, **Then** a sequência mostra "🔥 2 dias".
3. **Given** a sequência de 2 dias, **When** o usuário bate a meta hoje, **Then** a sequência passa a "🔥 3 dias".
4. **Given** um dia sem bater a meta, **When** o dia seguinte começa, **Then** a sequência volta a zero e não é exibida até a meta ser batida novamente.

---

### Edge Cases

- **Início tardio do dia**: se o usuário abre o app pela primeira vez no dia às 15h, o intervalo é calculado sobre o tempo restante da janela, não sobre a janela inteira.
- **Janela curta demais**: se o intervalo calculado ficar abaixo de 30 minutos, os lembretes passam a ser a cada 30 minutos. O app não tenta "compensar" com notificações seguidas.
- **Último lembrete do dia**: nenhum lembrete é agendado depois do horário de dormir, mesmo que a meta não tenha sido batida.
- **Janela que cruza a meia-noite** (ex.: acordar 10h, dormir 1h): é suportada. Os goles após a meia-noite e antes do horário de dormir contam para o dia que começou no último horário de acordar.
- **Virada do dia**: o progresso zera no horário de acordar. Goles registrados entre o horário de dormir e o de acordar contam para o dia anterior.
- **Meta alterada no meio do dia**: o total já bebido é mantido. Se a nova meta já foi alcançada, os lembretes param e o app comemora. Caso contrário, os lembretes são recalculados.
- **Acima da meta**: o app continua contando (ex.: "2,25 / 2 L"), a garrafa permanece cheia com brilho e nenhum lembrete volta a ser agendado.
- **Notificações negadas ou desativadas depois**: o registro manual, a garrafa e o histórico funcionam. O app indica que os lembretes estão desativados e como reativá-los.
- **Toque duplo na ação "Bebi 💧"**: cada toque registra um gole, e o usuário pode corrigir com "Desfazer".
- **Aparelho sem Dynamic Island ou versão de sistema sem suporte a botões interativos**: a atividade aparece só onde for suportada (ex.: tela de bloqueio). Sem o botão interativo, tocar na atividade abre o app.
- **Mudança de fuso horário ou de relógio**: o app usa sempre a hora local atual do aparelho para calcular o dia e a janela.
- **Peso fora da faixa**: o app aceita pesos entre 30 kg e 250 kg. A meta fica limitada entre 0,5 L e 6 L.

## Requirements *(mandatory)*

### Functional Requirements

**Registro e progresso**

- **FR-001**: O app MUST registrar goles em unidades fixas de 250 ml.
- **FR-002**: O app MUST oferecer na Home um botão "+" que registra um gole.
- **FR-003**: O app MUST permitir desfazer o gole mais recente do dia, por um aviso temporário exibido após cada gole e por uma opção ao segurar o botão "+". O desfazer pode ser repetido até o total do dia chegar a zero.
- **FR-004**: O app MUST exibir o progresso do dia em litros, com vírgula decimal (ex.: "1,25 / 2 L").
- **FR-005**: O app MUST representar o progresso com uma garrafa-mascote cujo nível de água é proporcional ao progresso (limitado a cheio) e anima a cada gole.
- **FR-006**: O mascote MUST ter quatro expressões ligadas ao progresso: sedento (< 25%), animado (25%–99%), radiante (100%) e comemorando (> 100%).
- **FR-007**: O app MUST continuar contando acima da meta.

**Meta e configuração**

- **FR-008**: Na primeira abertura, o app MUST conduzir o onboarding na ordem: peso → meta sugerida editável → horários de acordar e dormir → pedido de permissão de notificações.
- **FR-009**: O app MUST sugerir a meta como peso (kg) × 35 ml, arredondada ao múltiplo de 250 ml mais próximo e limitada entre 0,5 L e 6 L.
- **FR-010**: O usuário MUST poder editar a meta em passos de 250 ml, no onboarding e nos Ajustes.
- **FR-011**: O usuário MUST poder alterar peso, meta, horários e ligar/desligar lembretes nos Ajustes. Alterações valem imediatamente e preservam o total do dia.
- **FR-012**: Alterar o peso nos Ajustes MUST oferecer (sem impor) atualizar a meta para o novo valor sugerido.

**Lembretes**

- **FR-013**: O app MUST agendar lembretes apenas dentro da janela acordado do usuário.
- **FR-014**: O intervalo entre lembretes MUST ser o tempo restante na janela dividido pelo número de copos restantes para a meta, com mínimo de 30 minutos.
- **FR-015**: Todo gole registrado, por qualquer meio, MUST reagendar o próximo lembrete para o momento do gole somado ao intervalo recalculado.
- **FR-016**: Os lembretes MUST ter a ação "Bebi 💧", que registra um gole sem abrir o app.
- **FR-017**: Tocar no corpo de um lembrete MUST abrir o app, registrar um gole e exibir o aviso "Desfazer".
- **FR-018**: Ao atingir a meta, o app MUST cancelar todos os lembretes restantes do dia e exibir a comemoração "Bom trabalho! 🎉".
- **FR-019**: Se um desfazer levar o total abaixo da meta, o app MUST voltar a agendar lembretes, se ainda houver tempo na janela.
- **FR-020**: Os textos dos lembretes MUST ser curtos e simpáticos, em PT-BR, e podem variar entre algumas opções.

**Dynamic Island / atividade ao vivo**

- **FR-021**: Em aparelhos com suporte, ao abrir o app em um dia com meta não batida, o app MUST iniciar uma atividade ao vivo, caso não haja uma em andamento.
- **FR-022**: A atividade MUST mostrar: na forma compacta, gota/mini-garrafa e progresso "X / Y L"; na forma mínima, gota com anel de progresso; na forma expandida e na tela de bloqueio, barra de progresso, contagem até o próximo lembrete e botão "Bebi 💧".
- **FR-023**: O botão "Bebi 💧" da atividade MUST registrar um gole sem abrir o app e atualizar app, atividade e lembretes.
- **FR-024**: A atividade MUST refletir todo gole registrado por qualquer meio.
- **FR-025**: Ao bater a meta, a atividade MUST mostrar "Bom trabalho! 🎉" brevemente e então ser encerrada.
- **FR-026**: A atividade MUST funcionar sem nenhum servidor. É aceito que ela expire pelo limite de tempo do sistema e só seja reiniciada quando o usuário abrir o app.

**Histórico**

- **FR-027**: O app MUST salvar no aparelho o total e a meta de cada dia.
- **FR-028**: A Home MUST mostrar os últimos 7 dias como cheio, parcial ou vazio, comparando cada dia com a meta vigente naquele dia.
- **FR-029**: O app MUST exibir a sequência de dias consecutivos com a meta batida, terminando hoje (se já batida) ou ontem. A sequência só aparece quando for ≥ 1.

**Geral**

- **FR-030**: O dia do app MUST começar no horário de acordar do usuário. O progresso zera nesse momento.
- **FR-031**: Todos os dados MUST ficar apenas no aparelho. O app não exige conta nem conexão com a internet.
- **FR-032**: Toda a interface e as notificações MUST estar em português do Brasil.
- **FR-033**: O app MUST suportar modo claro e modo escuro do sistema.
- **FR-034**: O visual MUST seguir o estilo fofo/ilustrado em tons pastel, com a garrafa-mascote como elemento central.

### Key Entities

- **Perfil do usuário**: peso (kg), meta diária (ml), horário de acordar, horário de dormir, lembretes ligados/desligados, onboarding concluído.
- **Gole**: quantidade (sempre 250 ml), momento do registro, origem (botão "+", notificação, atividade ao vivo). Pertence a um Dia.
- **Dia**: data de referência (iniciada no horário de acordar), meta vigente no dia, total bebido, meta batida (sim/não). Agrupa os Goles.
- **Lembrete**: horário agendado, pertence ao Dia atual. É recalculado a cada gole e cancelado quando a meta é batida.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um novo usuário conclui o onboarding em menos de 1 minuto.
- **SC-002**: Registrar um gole a partir de uma notificação ou da Dynamic Island leva no máximo 1 toque e não exige abrir o app.
- **SC-003**: Após bater a meta, 0 lembretes são entregues até o início do dia seguinte, em 100% dos dias testados.
- **SC-004**: Nenhum lembrete é entregue fora da janela acordado, em 100% dos dias testados.
- **SC-005**: Após qualquer gole, o total exibido no app, na atividade ao vivo e o próximo lembrete ficam consistentes entre si em até 2 segundos.
- **SC-006**: A animação da garrafa ao registrar um gole roda de forma fluida, sem travamentos perceptíveis, em aparelhos compatíveis.
- **SC-007**: Em testes com usuários, ao menos 9 de 10 pessoas conseguem registrar e desfazer um gole sem instruções.
- **SC-008**: O app funciona por completo (registro, lembretes, histórico) sem conexão com a internet.

## Assumptions

- **Plataforma**: o foco é iPhone. A Dynamic Island exige um modelo compatível, e o botão interativo da atividade exige uma versão do sistema que o suporte. Outras plataformas ficam para depois, mas a solução deve permitir levá-las sem reescrever as regras de negócio.
- **Ambiente de desenvolvimento**: o time não tem Mac. A solução deve ser construível e testável sem Mac, com builds em nuvem e uma conta de desenvolvedor da Apple paga (já aceito pelo usuário).
- **Toque no corpo da notificação registra um gole**: segue o pedido original do usuário ("ao clicar na notificação ele marca que eu bebi"). O "Desfazer" cobre toques acidentais.
- **Expressões do mascote**: os limiares (25% / 100%) são um padrão razoável, que pode ser ajustado no design.
- **Intervalo mínimo de 30 min e faixas de peso/meta**: são padrões razoáveis, escolhidos para evitar excesso de notificações e valores absurdos.
- **Sem servidor e sem conta**: não há sincronização entre aparelhos nem backup na nuvem na v1.
- **Fora do escopo da v1**: reinício automático da atividade ao vivo sem abrir o app, gráficos de longo prazo, vários tamanhos de copo, inglês ou outros idiomas, versão Android polida, integração com apps de saúde.
- **Nome "Wotah"**: é provisório.
