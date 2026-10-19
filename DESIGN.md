---
name: SportsBet Manager
description: Controle pessoal de apostas esportivas, noturno, com um azul só.
colors:
  azul-conferido: "#2563eb"
  azul-conferido-texto: "#3b82f6"
  fundo-noturno: "#09090b"
  superficie: "#131316"
  superficie-2: "#1c1c20"
  texto: "#f2f2f4"
  texto-secundario: "#a1a1aa"
  texto-apagado: "#85858d"
  divisoria: "rgba(255, 255, 255, 0.1)"
  ganho: "#4ade9e"
  perda: "#f0797e"
  ganho-solido: "#12a05c"
  perda-solida: "#c0272e"
  atencao: "#fbbf24"
  cashout: "#8b5cf6"
typography:
  display:
    fontFamily: "Archivo, Inter, system-ui, sans-serif"
    fontSize: "76px"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 115"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  numeric:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.25
    fontFeature: "'tnum' 1"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  badge: "6px"
  md: "8px"
  xl: "12px"
  lg: "14px"
  2xl: "16px"
  full: "9999px"
spacing:
  stack: "8px"
  card-y: "12px"
  card-x: "14px"
  gutter: "16px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.azul-conferido}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "rgba(37, 99, 235, 0.9)"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.texto}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "rgba(242, 242, 244, 0.07)"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.azul-conferido-texto}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "rgba(37, 99, 235, 0.1)"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
    height: "44px"
  chip-filter:
    backgroundColor: "rgba(242, 242, 244, 0.04)"
    textColor: "#d4d4d8"
    rounded: "{rounded.full}"
    padding: "0 12px"
    height: "36px"
  chip-filter-active:
    backgroundColor: "{colors.azul-conferido}"
    textColor: "#ffffff"
  badge-ganha:
    backgroundColor: "rgba(74, 222, 158, 0.16)"
    textColor: "{colors.ganho}"
    rounded: "{rounded.badge}"
    padding: "3px 10px"
  badge-perdida:
    backgroundColor: "rgba(240, 121, 126, 0.16)"
    textColor: "{colors.perda}"
    rounded: "{rounded.badge}"
    padding: "3px 10px"
  badge-pendente:
    backgroundColor: "rgba(59, 130, 246, 0.16)"
    textColor: "{colors.azul-conferido-texto}"
    rounded: "{rounded.badge}"
    padding: "3px 10px"
  card-kpi:
    backgroundColor: "rgba(242, 242, 244, 0.015)"
    rounded: "{rounded.xl}"
    padding: "12px 14px"
  list-group:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.2xl}"
  nav-item:
    textColor: "rgba(242, 242, 244, 0.65)"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  nav-item-active:
    backgroundColor: "rgba(37, 99, 235, 0.16)"
    textColor: "{colors.azul-conferido-texto}"
  menu-item-hover:
    backgroundColor: "rgba(242, 242, 244, 0.07)"
---

# Design System: SportsBet Manager

## Overview

**Creative North Star: "Nocturne"**

Um app noturno de controle: fundo quase preto, texto quase branco e um azul só, o Azul Conferido, que aparece onde há ação, seleção ou leitura pendente. Todo o resto é tom sobre tom. A cor que sobra na tela é a do resultado (ganho em verde, perda em vermelho), e ela pertence ao usuário, que pode trocá-la em Preferências. O clima é confiável, ágil e sério: uma ferramenta de controle de dinheiro, não um cassino. Nada brilha para chamar aposta.

A densidade é de ferramenta. Listas agrupadas por mês, números com algarismos tabulares, rótulos pequenos e apagados que organizam sem competir. O celular manda: quase tudo é registrado em pé, com uma mão, então cada alvo tem 44px, todo toque afunda o elemento (escala 0.97) e diálogos viram bottom sheets. O desktop é para conferir e analisar, com sidebar e mais colunas.

O movimento é curto e de uma curva só (desaceleração rápida no fim), usado para responder ao toque e mostrar o que mudou: o valor que pula quando a aposta é liquidada, a pílula que desliza no seletor, a tela empilhada que entra da direita. Tudo tem alternativa para quem reduz movimento. Rejeições confirmadas: hover azul chapado em menus (trocado por cinza sutil), roxo na marca (revertido para azul) e brilho neon nos botões (a sombra é escura).

**Key Characteristics:**
- Escuro por padrão, com tema claro de mesmos papéis e valores invertidos.
- Um azul só, em dois tons: superfície (#2563eb) e texto (#3b82f6).
- Cor de resultado escolhida pelo usuário; o resto é neutro.
- Tátil e rápido: 44px de alvo, toque que afunda, resposta em 130ms.
- Números tabulares em todo valor de dinheiro, odd e contagem.

## Colors

Paleta noturna monocromática com um único acento azul e um quarteto semântico de resultado.

### Primary
- **Azul Conferido** (#2563eb): superfície de ação. Botão principal, chip de filtro ativo, FAB "Nova aposta", avatar, faixa do calendário de período, foco (anel de 2px). Sempre com rótulo branco por cima (5.17:1).
- **Azul Conferido, tom de texto** (#3b82f6): o mesmo azul como texto e ícone sobre o fundo escuro: links, item de navegação ativo, botão ghost, aposta pendente, o brilho do GlowingBorder. No tema claro vira #1d4ed8.

### Neutral
- **Fundo Noturno** (#09090b): o chão de todas as telas.
- **Superfície** (#131316): cards, sidebar, diálogos, campos.
- **Superfície Elevada** (#1c1c20): segunda camada (pílula do seletor, linhas em destaque).
- **Texto** (#f2f2f4): texto principal.
- **Texto Secundário** (#a1a1aa): legendas, rótulos de gráfico, descrições.
- **Texto Apagado** (#85858d; no tema claro, #686871): rótulos de seção em caixa alta, status neutro (cancelada, zero), legendas de KPI.
- **Divisória** (rgba(255, 255, 255, 0.1)): bordas finas de card, campo e lista.

A escala zinc inteira vive em variáveis e inverte no tema claro, então `text-zinc-400` continua legível nos dois temas sem trocar classe.

### Semânticas de resultado e estado
- **Ganho** (#4ade9e) e **Perda** (#f0797e): leitura de resultado (lucro, status Ganha/Perdida). Seguem a cor escolhida em Preferências; no tema claro, #059669 e #dc2626.
- **Ganho Sólido** (#12a05c) e **Perda Sólida** (#c0272e): só como fundo de botão de ação com rótulo branco. Não seguem a preferência.
- **Atenção** (#fbbf24): campo lido pela IA com baixa confiança, acesso vencendo, casa parada. No claro, #b45309.
- **Cashout** (#8b5cf6): o único status fora do quarteto ganho/perda/pendente/neutro, em violeta para não se confundir com nenhum deles.

### Named Rules
**A Regra do Cinza Legível.** Nenhum texto fica abaixo de 4,5:1, nem o apagado: o cinza mais claro do texto é #85858d no escuro (5,4:1 no fundo, 4,6:1 na superfície elevada) e #686871 no claro. Apagar texto com opacidade baixa (45% ou menos) dá o mesmo contraste reprovado do cinza antigo.

**A Regra do Azul Único.** O app tem um azul. Pendente usa o mesmo azul em tom de texto; não existe segundo acento de marca. Ícone, favicon e logo também são azuis.

**A Regra do Azul Legível.** Azul de superfície (#2563eb) nunca vira texto sobre o fundo escuro (dá 3.29:1); texto e ícone azuis usam o tom de texto (#3b82f6, 5.41:1).

**A Regra da Cor do Usuário.** Verde e vermelho são leitura de resultado e de operação concluída ou com erro ("Lido pela IA", "Registrada"), e pertencem à preferência do usuário. Botão cheio usa as versões sólidas, que não mudam.

## Typography

**Display Font:** Archivo (com Inter, system-ui), só na landing
**Body Font:** Inter (com system-ui, sans-serif)

**Character:** Inter faz o app inteiro, neutra e precisa, em pesos 400 a 600. Archivo larga (largura 115%) aparece só nos títulos da landing, lembrando placar e grafismo de transmissão esportiva; o app não carrega essa fonte.

### Hierarchy
- **Display** (700, 44px no celular, 64px a partir de 640px, 76px a partir de 1024px, altura de linha 1.02): título de abertura e números grandes da landing. Seções da landing usam 32px e 42px.
- **Headline** (600, 24px, 1.25): título de tela (PageHeader).
- **Title** (600, 18px, 1.25): título de subtela com voltar; valor de KPI.
- **Numeric** (600, 18px, algarismos tabulares): todo valor de dinheiro, odd, ROI e contagem. Em lista, o tamanho segue a linha, mas o `tabular-nums` nunca sai.
- **Body** (400, 14px, 20px de linha): texto corrente, botões (500), itens de menu. Campos usam 16px no celular para o iOS não dar zoom.
- **Label** (500, 12px, 0.05em, caixa alta): rótulo de seção ("Em uso", "Lucro líquido") e rótulo de KPI (11px). Apagado, organiza sem competir. É a única caixa alta do app.

### Named Rules
**A Regra do Dinheiro Alinhado.** Todo número que se compara com outro usa algarismos tabulares. Coluna de valores que dança é bug.

**A Regra da Fonte da Landing.** Archivo fica só na landing e chega no chunk dela; telas do app continuam 100% Inter.

## Layout

Mobile-first. Abaixo de 640px a navegação é a bottom nav fixa com cinco destinos e o conteúdo usa margem lateral de 16px; diálogos viram bottom sheets. A partir de 640px aparece a sidebar recolhível, e de 1024px em diante as telas ganham colunas (painel do Dashboard, detalhe ao lado da lista). Breakpoints são os do Tailwind (640, 768, 1024, 1280); o container centraliza até 1400px.

O ritmo vertical é curto: 8px entre itens de uma pilha, 12px e 14px de respiro interno em card de KPI, 24px entre seções. Listas longas agrupam por mês com o rótulo de seção em cima. Grades de KPI usam duas colunas no celular e um card que sobra ocupa as duas.

**A Regra do Polegar.** Todo alvo de toque tem pelo menos 44px, mesmo quando o visual é menor (chip de 36px estende a área de toque até 44px com um pseudo-elemento).

## Elevation & Depth

O sistema é plano por padrão e separa camadas por tom (fundo, superfície, superfície elevada) e por borda fina de 1px. Sombra aparece onde algo flutua (diálogo, menu, FAB) ou é a ação principal (o botão "Nova aposta", com sombra escura e levantada de 1px no hover). Por decisão do dono, os cards têm um pouco mais de relevo: uma sombra escura e curta (token `--shadow-card`, classe `shadow-card`), somada à borda fina, para descolar do fundo. Vale só para card de primeiro nível; card dentro de card continua plano.

### Shadow Vocabulary
- **Anel** (`box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08)`): borda desenhada por sombra, padrão do `shadow`.
- **Flutuante médio** (`box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12), 0 6px 18px rgba(0, 0, 0, 0.65)`): menus e popovers.
- **Flutuante alto** (`box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18), 0 16px 40px rgba(0, 0, 0, 0.75)`): diálogos e FAB.
- **CTA** (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.04)`): a ação principal da tela.
- **Card** (`box-shadow: 0 1px 2px rgba(0, 0, 0, 0.45), 0 6px 16px rgba(0, 0, 0, 0.3)`): cards e grupos de lista no tema escuro. No claro, `0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.06)`.

### Named Rules
**A Regra da Sombra Escura.** Profundidade vem de sombra escura, nunca de brilho azul. Neon é estética de cassino.

## Shapes

Cantos suavemente arredondados, maiores quanto maior o bloco: 4px em detalhes, 6px em selos de status, 8px em botão e campo, 12px em card de KPI, 14px em item de navegação e cards de tela, 16px em grupos de lista do Perfil, e pílula inteira em chip, avatar, FAB e indicador da bottom nav. Atenção a uma peculiaridade do projeto: `rounded-lg` vale 14px e é maior que `rounded-xl` (12px), porque o `lg` foi remapeado para o token de raio do app.

Bordas são sempre de 1px na cor da divisória. Ícones são Phosphor, regular por padrão e `fill` no destino ativo da bottom nav. A marca é um quadrado azul arredondado com o ícone de gráfico em linha subindo.

## Components

### Buttons
Táteis e rápidos: todo botão afunda no toque (escala 0.97 em 130ms) porque o dedo cobre o elemento e só a mudança de cor não chega a ser sentida.
- **Shape:** cantos de 8px; 36px de altura no celular e 40px a partir de 640px; grande com 48px e 14px de raio.
- **Primary:** Azul Conferido cheio com rótulo branco, 500, 14px. A ação principal da tela (Salvar, Nova aposta, FAB).
- **Hover / Focus:** 90% de opacidade no hover; foco com anel azul de 2px e 2px de afastamento.
- **Secondary:** contorno na cor da divisória, fundo transparente; hover em cinza sutil (7% do texto).
- **Ghost:** só texto no azul de texto; hover com 10% de azul.
- **Destructive:** texto vermelho sem caixa, como em action sheet (Sair, Excluir, Desvincular).
- **Ícone:** redondo de 44px, neutro, com contador opcional no canto.
- **Carregando:** spinner na frente do rótulo, botão travado e sem apagar ("Salvando…").

### Chips
- **Style:** pílula de 36px (40px na tela de Tips), 13px, 500. Inativo com fundo 4% do texto e borda sutil; ativo em Azul Conferido com texto branco.
- **State:** contagem dentro do chip em mini pílula; chip que abre sheet leva a setinha para baixo.

### Selos de status
- **Style:** cantos de 6px, 12px, fundo do status a 16% e texto no tom do status: Ganha, Perdida, Pendente (azul de texto), Cancelada (apagado), Meio Ganha e Meio Perdida (10%), Cashout (violeta a 20%).
- **Selo IA:** campo preenchido pela IA leva o selo; baixa confiança fica em Atenção pedindo conferência; o selo some quando o usuário digita por cima.

### Cards / Containers
- **Corner Style:** 12px no card de KPI, 14px nos cards de tela, 16px nos grupos de lista.
- **Background:** card de KPI quase transparente (1,5% do texto) sobre o fundo; grupo de lista em Superfície com divisórias entre as linhas.
- **Shadow Strategy:** `shadow-card` no card de primeiro nível (ver Elevation & Depth); card aninhado fica plano.
- **Border:** 1px na divisória (7% do texto no card de KPI).
- **Internal Padding:** 12px por 14px no KPI.

### Inputs / Fields
- **Style:** fundo Superfície, borda de 1px na divisória, cantos de 8px, 44px de altura no celular (36px a partir de 640px), texto de 16px.
- **Focus:** a borda vira Azul Conferido; no hover a borda clareia para 45% do texto.
- **Error / Disabled:** desabilitado a 45% de opacidade com cursor bloqueado.

### Navigation
- **Sidebar (640px+):** fundo Superfície com borda direita, grupos com rótulo em caixa alta de 11px, itens de 14px e 500 a 65% do texto. Hover em cinza sutil; ativo com 16% de azul e texto no azul de texto. Contadores em mini pílula, em azul quando pedem ação.
- **Bottom nav (até 640px):** cinco destinos de 44px, rótulo de 12px; o ativo pinta o ícone de azul, troca para `fill` com um "pop" e fica sobre uma pílula de 15% de azul que desliza entre os itens.
- **Menus suspensos:** item com hover em cinza sutil (7% do texto), nunca azul chapado.

### Seletor segmentado
Opções lado a lado numa moldura de 14px de raio com borda fina; uma pílula de 8px em zinc-800 desliza até a opção ativa em 300ms com a curva do app (pela Web Animations API, porque a troca de tema desliga as transições CSS). Usado também no seletor de tema.

### Borda que brilha (GlowingBorder)
Anel de 1px em gradiente cônico no azul de texto, que segue o ponteiro perto do painel. Só com mouse e sem movimento reduzido. Um por tela, no painel principal (Dashboard e área de trabalho da landing).

## Do's and Don'ts

### Do:
- **Do** usar os tokens de papel (`bg-accent`, `text-accent-text`, `text-success`, `bg-success-solid`) em vez de hex no componente.
- **Do** dar 44px de alvo a todo toque e a classe `press` a todo elemento tocável.
- **Do** usar algarismos tabulares em todo valor de dinheiro, odd e contagem.
- **Do** usar a curva `--ease-out-soft` (cubic-bezier(0.22, 1, 0.36, 1)) com 130ms para resposta, 240ms para entrada e 420ms para subida; a cascata é de 40ms por item, com teto de 12 itens.
- **Do** dar a toda animação um bloco de `prefers-reduced-motion` que a desliga.
- **Do** marcar o que a IA preencheu e deixar em âmbar o que ela leu com baixa confiança.
- **Do** testar cada tela nos dois temas: o claro tem os mesmos papéis com valores invertidos.

### Don't:
- **Don't** usar hover azul chapado em menu, lista ou dropdown; o hover é cinza sutil (7% do texto).
- **Don't** usar #2563eb como texto sobre fundo escuro; texto azul é #3b82f6.
- **Don't** usar os tons de leitura de ganho e perda como fundo de botão com rótulo branco; use as versões sólidas.
- **Don't** introduzir um segundo acento de marca. O roxo foi testado e revertido: tudo é azul.
- **Don't** usar brilho, glow azul ou dourado de cassino em botão ou número; profundidade é sombra escura.
- **Don't** carregar Archivo nem as animações da landing nas telas do app.
- **Don't** colocar caixa alta fora dos rótulos de seção e de KPI.
