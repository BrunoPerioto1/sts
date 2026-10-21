# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Qualquer apostador esportivo no Brasil que quer sair da planilha e ter controle de verdade do que aposta, siga ou não um canal de tips. Aposta em várias casas e registra quase sempre pelo celular, muitas vezes em pé, logo depois de fazer a aposta no app da casa. O trabalho dele: registrar cada aposta sem digitar, saber o resultado e o saldo de cada casa, e enxergar se está ganhando ou perdendo.

Outra audiência confirmada: o admin que opera o serviço (saúde do pipeline, usuários e acesso, cadastro global de casas).

## Product Purpose

Trackton é o controle pessoal de apostas esportivas. A aposta entra pelo print do bilhete (lido por IA), pelo Telegram ou digitada na mão. O resultado é proposto a partir do placar do jogo, o saldo de cada casa é conciliado com depósitos, saques e resultados, e o dashboard mostra lucro, ROI e taxa de acerto reais.

Sucesso: o apostador registra tudo o que aposta sem atrito e confia nos números, porque nada é salvo nem liquidado sem a confirmação dele.

## Positioning

- O print vira formulário: a IA lê evento, mercado, odd, valor e casa do bilhete e preenche a aposta. Campo preenchido pela IA leva o selo IA, campo de baixa confiança fica em âmbar, e nada é salvo sem o usuário conferir.
- O resultado vem do placar: o backend coleta os placares e propõe o resultado de cada aposta pendente; o usuário confirma uma a uma ou em lote.
- Saldo conciliado por casa, em mais de 80 casas cadastradas.
- Feito para o celular: bottom sheets, câmera e galeria direto, PWA que recebe o print pelo "compartilhar" do sistema.

## Operating Context

- Fluxo típico: aposta feita no app da casa, print do bilhete, compartilhar para o Trackton (ou Ctrl+V, arrastar, câmera), conferir os campos e registrar.
- Tips chegam de um canal do Telegram por um bot e caem numa fila (pendentes, planilhadas, caíram), com valor sugerido e % da banca.
- Conferência periódica dos resultados propostos pelo placar.
- Exportação em CSV com separador ponto-e-vírgula (o que o Excel em português espera), usada para planilha e declaração de imposto.
- Assinatura do Pro pelo Mercado Pago (página Plano): cartão de crédito cobra sozinho todo mês; Pix e boleto ficam pendentes e o Mercado Pago avisa o cliente. Faltando poucos dias pro fim do Pro sem assinatura, um aviso no topo leva à página Plano.
- Recuperação de senha com código enviado pelo bot do Telegram.

## Capabilities and Constraints

- Dois planos (regras em `meu-bot-telegram/src/users/plan.ts`):
  - Grátis: registro digitado sem limite (site e bot), 5 leituras de print ou áudio por IA por dia, saldo por casa e dashboard.
  - Pro, R$ 40 por mês, sem fidelidade: tudo do Grátis, leitura por IA sem limite, conferência pelo placar, exportação em CSV e planilhar as tips do grupo.
- Conta nova tem 3 dias de Pro grátis, sem cartão. Acabou o Pro, a conta cai no Grátis: nada é bloqueado nem apagado.
- O grupo de tips do Telegram é vendido à parte e não está incluído nos R$ 40. A fila de Tips do app espelha esse grupo; não vender o acesso ao grupo como parte do plano.
- Aberto ao público geral (não é só para quem segue tips).
- Não é casa de apostas: não recebe, não paga e não intermedia apostas. Público 18+.
- A instância de produção guarda movimentação financeira real do operador. Não existe demo pública; superfícies de marketing usam dados de exemplo, rotulados como exemplo.
- Termos do domínio: aposta, bilhete, tip, casa, banca, unidade (1% da banca), odd, stake/valor, planilhar, conferência, liquidação (Ganha, Perdida, Meio Ganha, Meio Perdida, Cashout, Cancelada).

## Brand Commitments

- Nome: Trackton, provisório ("primeiramente", nas palavras do dono). Em espaço curto, "Trackton".
- Cor da marca: azul em tudo (logo, favicon e ícones do app), porque o tema de destaque do software é azul. Decisão explícita do dono.
- Língua: português do Brasil. Voz direta e simples, do ponto de vista do apostador; vende controle, nunca lucro.

## Evidence on Hand

- O próprio produto funcionando, com os componentes reais do Dashboard renderizáveis com dados de exemplo (`src/components/landing/NumbersPreview.tsx`).
- Mais de 80 casas cadastradas no cadastro global.
- Mais de 200 usuários: número informado pelo dono em 2026-10-18 e usado na abertura da landing.
- 11.979 apostas registradas na plataforma (sem as apagadas), 247 delas nos últimos 30 dias: consulta no banco feita pelo dono em 2026-10-18. A landing usa "+11 mil".
- Ausências que não podem ser inventadas: depoimentos, resultados de clientes, logos de parceria com casas, estatísticas de lucro ou acerto de usuários.
- `docs/screenshots/` mostra a UI antiga com dados reais do admin; não usar em material público.

## Product Principles

1. A IA propõe, o apostador confirma: nada é salvo nem liquidado sem um clique dele.
2. Vender controle, não lucro: nenhuma promessa de ganho, números de exemplo modestos.
3. O celular é o lugar principal de uso; o desktop é para conferir e analisar.
4. O que o usuário afirma vence o que foi inferido (legenda digitada, depois o select, depois a logo lida no print).
5. Jogo responsável sempre visível: 18+, aviso de risco e "não é casa de apostas".
