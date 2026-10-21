import { Link } from "react-router-dom";
import { B, Document, Email, Owner, P, Section, Ul } from "./legal-prose";

/**
 * Termos de Uso. Rascunho escrito a partir do que o app faz de verdade
 * (planos em src/users/plan.ts do backend, cancelamento na página Plano,
 * exclusão em Perfil > Conta). Revisar com advogado antes de publicar.
 */
export function TermsContent() {
  return (
    <>
      <P>
        Estes Termos de Uso regulam o uso do Trackton: o site, o app e o bot do Trackton no Telegram. O Trackton é oferecido por <Owner />
        <Document /> (“Trackton”, “nós”). Ao criar uma conta ou usar o serviço, você declara que leu e concorda com estes Termos e com a{" "}
        <Link to="/privacidade" className="text-accent-text underline-offset-4 hover:underline">
          Política de Privacidade
        </Link>
        .
      </P>

      <Section n={1} title="O que o Trackton é">
        <P>
          O Trackton é uma ferramenta de registro e controle pessoal de apostas esportivas. Você registra as apostas que fez, e o app calcula
          lucro, ROI, saldo por casa e outros números a partir do que você registrou.
        </P>
        <P>
          <B>O Trackton não é casa de apostas.</B> Ele não recebe apostas, não intermedeia apostas, não movimenta dinheiro e não acessa a sua
          conta nas casas de apostas. Os números mostram o que já aconteceu com as suas apostas, não o que vai acontecer: o Trackton não
          promete lucro nem resultado.
        </P>
        <P>
          Tips que cheguem pelo bot são conteúdo de quem as publicou no grupo de origem. O Trackton só organiza e entrega essas mensagens; a
          decisão de apostar, e o risco dela, são sempre seus.
        </P>
      </Section>

      <Section n={2} title="Idade mínima">
        <P>
          O Trackton é só para maiores de 18 anos. Ao criar a conta, você declara ter 18 anos ou mais. Se identificarmos que uma conta pertence a
          menor de idade, ela será encerrada e os dados, apagados.
        </P>
      </Section>

      <Section n={3} title="Sua conta">
        <Ul>
          <li>Informe dados verdadeiros e mantenha o seu e-mail atualizado.</li>
          <li>
            A senha é pessoal. Você responde pelo que for feito com a sua conta; se suspeitar de acesso indevido, troque a senha e fale com a
            gente.
          </li>
          <li>Ao vincular o Telegram, o bot passa a tratar as mensagens que você envia a ele como vindas da sua conta.</li>
        </Ul>
      </Section>

      <Section n={4} title="Leitura por IA e resultados pelo placar">
        <P>
          O Trackton usa inteligência artificial para ler prints, áudios e mensagens e preencher os campos da aposta. A leitura pode errar:
          confira os campos antes de registrar. <B>Nenhuma aposta é salva sem a sua confirmação.</B>
        </P>
        <P>
          No Pro, o resultado das apostas é proposto a partir do placar do jogo e também só é gravado depois que você confirma. Você é
          responsável por conferir o que registra e o que confirma.
        </P>
      </Section>

      <Section n={5} title="Planos, teste e pagamento">
        <Ul>
          <li>
            <B>Grátis:</B> registro manual sem limite, um número diário de leituras por IA, saldo por casa e dashboard.
          </li>
          <li>
            <B>Pro:</B> assinatura mensal com os recursos e o preço mostrados na página de preços no momento da assinatura.
          </li>
          <li>
            <B>Teste:</B> toda conta nova pode usar o Pro por 3 dias, sem cartão. Ao fim do teste, a conta volta pro Grátis sozinha, sem
            cobrança.
          </li>
        </Ul>
        <P>
          O Pro é uma assinatura recorrente processada pelo Mercado Pago. No cartão, a cobrança se repete todo mês automaticamente até você
          cancelar. Os dados de pagamento são informados direto ao Mercado Pago, que segue os próprios termos.
        </P>
        <P>
          Os recursos e limites de cada plano podem mudar. Se o preço do Pro mudar, avisaremos antes, e o novo valor só vale a partir da
          cobrança seguinte ao aviso.
        </P>
      </Section>

      <Section n={6} title="Cancelamento e reembolso">
        <Ul>
          <li>
            Você pode cancelar o Pro quando quiser, na página Plano do app, em Cancelar assinatura. A cobrança para na hora; o Pro já pago
            continua até o fim do período, e depois a conta vira Grátis, com tudo o que você registrou.
          </li>
          <li>
            <B>Direito de arrependimento:</B> na primeira assinatura, você pode desistir em até 7 dias da contratação e receber de volta o
            valor pago, como prevê o art. 49 do Código de Defesa do Consumidor. Peça pelo e-mail <Email />.
          </li>
          <li>Fora desse prazo, o período já pago não é reembolsado, salvo quando a lei exigir.</li>
        </Ul>
      </Section>

      <Section n={7} title="Uso permitido">
        <P>Ao usar o Trackton, você não pode:</P>
        <Ul>
          <li>usar o serviço para qualquer fim ilegal;</li>
          <li>tentar acessar contas, dados ou partes do sistema que não são suas;</li>
          <li>burlar limites de plano, de uso ou de segurança, ou automatizar o uso de forma abusiva;</li>
          <li>copiar, revender ou explorar comercialmente o serviço sem autorização;</li>
          <li>enviar conteúdo ilegal ou que viole direitos de terceiros.</li>
        </Ul>
      </Section>

      <Section n={8} title="Seus dados">
        <P>
          As apostas, movimentações e preferências que você registra são suas. Você pode excluir a conta a qualquer momento em Perfil, Conta, e
          os dados são apagados como explica a Política de Privacidade. No Pro, você também pode exportar os seus dados em CSV.
        </P>
      </Section>

      <Section n={9} title="Disponibilidade do serviço">
        <P>
          Fazemos o possível para manter o Trackton no ar e correto, mas o serviço pode ter falhas, ficar fora do ar para manutenção ou depender
          de serviços de terceiros, como o Telegram, o Mercado Pago e os provedores de IA. Recursos podem ser alterados, melhorados ou
          descontinuados.
        </P>
      </Section>

      <Section n={10} title="Responsabilidade">
        <P>Na medida permitida pela lei, o Trackton não responde por:</P>
        <Ul>
          <li>decisões de aposta e os seus resultados, ganhos ou perdas;</li>
          <li>saldos, apostas e operações feitas nas casas de apostas;</li>
          <li>dados que você registrou ou confirmou sem conferir;</li>
          <li>falhas de serviços de terceiros.</li>
        </Ul>
        <P>Nada nestes Termos limita direitos que a lei garante ao consumidor.</P>
      </Section>

      <Section n={11} title="Jogo responsável">
        <P>
          Apostas envolvem risco de perda e podem causar dependência. Aposte só o que pode perder. Se sentir que perdeu o controle, pare e procure
          ajuda: o CVV atende de graça, 24 horas, pelo telefone 188.
        </P>
      </Section>

      <Section n={12} title="Suspensão e encerramento">
        <P>
          Podemos suspender ou encerrar contas que violem estes Termos, com aviso quando possível. Você pode encerrar a sua quando quiser,
          excluindo a conta; se houver assinatura ativa, ela é cancelada antes.
        </P>
      </Section>

      <Section n={13} title="Mudanças nestes Termos">
        <P>
          Podemos atualizar estes Termos. Mudanças importantes serão avisadas no site ou no app antes de valer. A data da versão em vigor fica no
          topo desta página.
        </P>
      </Section>

      <Section n={14} title="Lei aplicável e foro">
        <P>Estes Termos seguem as leis do Brasil. Fica eleito o foro do domicílio do usuário para resolver qualquer questão sobre eles.</P>
      </Section>

      <Section n={15} title="Contato">
        <P>
          Dúvidas, suporte ou pedidos de reembolso: <Email />.
        </P>
      </Section>
    </>
  );
}
