import { B, Document, Email, Owner, P, Section, Ul } from "./legal-prose";

/**
 * Política de Privacidade. Rascunho escrito a partir do que o sistema faz de
 * verdade (backend: tabela users, deleteUserAndData, subscription_payments com
 * ON DELETE SET NULL; prints e áudios pra OpenAI, texto pra Groq, nada de
 * arquivo guardado). Se um desses comportamentos mudar, este texto muda junto.
 * Revisar com advogado antes de publicar.
 */
export function PrivacyContent() {
  return (
    <>
      <P>
        Esta Política explica quais dados pessoais o Trackton coleta, para que usa, com quem compartilha e quais são os seus direitos, de acordo
        com a Lei Geral de Proteção de Dados (Lei 13.709/2018, a LGPD).
      </P>

      <Section n={1} title="Quem cuida dos seus dados">
        <P>
          O controlador dos dados é <Owner />
          <Document />. Para qualquer assunto de privacidade, inclusive falar com o encarregado, escreva
          para <Email />.
        </P>
      </Section>

      <Section n={2} title="Quais dados coletamos">
        <Ul>
          <li>
            <B>Cadastro:</B> nome, e-mail e senha. A senha é guardada só em forma criptografada (hash), nunca como texto.
          </li>
          <li>
            <B>O que você registra:</B> apostas (evento, mercado, odd, valor, casa e resultado), depósitos, saques e ajustes das casas, banca,
            filtros e preferências do dashboard.
          </li>
          <li>
            <B>Telegram, se você vincular:</B> o seu ID e o seu @ do Telegram, a data do vínculo, as mensagens, prints e áudios que você manda
            ao bot e as tips entregues a você ou descartadas.
          </li>
          <li>
            <B>Assinatura, se você assinar o Pro:</B> o e-mail informado ao Mercado Pago, o identificador e a situação da assinatura e o
            histórico de mensalidades (valor e data). Os dados do cartão são digitados no Mercado Pago e não passam pelo Trackton.
          </li>
          <li>
            <B>Uso e segurança:</B> data de criação da conta e do último acesso, tentativas de login erradas (para bloquear ataques) e contadores
            de uso dos limites do plano.
          </li>
          <li>
            <B>No seu aparelho:</B> o navegador guarda a sua sessão (para você continuar conectado) e o tema escolhido. O Trackton não usa
            cookies de publicidade nem ferramentas de rastreamento.
          </li>
        </Ul>
      </Section>

      <Section n={3} title="Para que usamos">
        <Ul>
          <li>Prestar o serviço: registrar as suas apostas, calcular lucro, ROI e saldos e propor resultados pelo placar.</li>
          <li>Ler prints, áudios e mensagens por inteligência artificial e preencher a aposta.</li>
          <li>Falar com você pelo bot: confirmações, avisos da conta, tips dos grupos que você escolheu e o link de recuperação de senha.</li>
          <li>Mandar e-mails da conta, como o link de recuperação de senha.</li>
          <li>Cobrar a assinatura e liberar o Pro.</li>
          <li>Proteger a sua conta e o serviço, com bloqueio após tentativas erradas e limites de uso.</li>
          <li>Responder pedidos de suporte e cumprir obrigações legais.</li>
        </Ul>
        <P>
          <B>Não vendemos os seus dados e não os usamos para publicidade.</B>
        </P>
      </Section>

      <Section n={4} title="Bases legais">
        <Ul>
          <li>
            <B>Execução do contrato</B> (art. 7º, V, da LGPD): a maior parte do tratamento, porque sem ele o serviço não funciona.
          </li>
          <li>
            <B>Legítimo interesse</B> (art. 7º, IX): segurança da conta e prevenção de abuso.
          </li>
          <li>
            <B>Cumprimento de obrigação legal</B> (art. 7º, II): registros de pagamento.
          </li>
        </Ul>
      </Section>

      <Section n={5} title="Leitura por inteligência artificial">
        <P>
          Quando você manda um print ou um áudio, o arquivo é enviado à OpenAI; quando manda uma mensagem de texto, ela é enviada à Groq. Esses
          serviços leem o conteúdo e devolvem os campos da aposta. <B>O Trackton guarda só a aposta preenchida:</B> o print e o áudio não ficam
          armazenados no Trackton.
        </P>
      </Section>

      <Section n={6} title="Com quem compartilhamos">
        <P>Só com os fornecedores necessários para o Trackton funcionar, que tratam os dados em nosso nome:</P>
        <Ul>
          <li>
            <B>Vercel:</B> hospedagem do site e da API.
          </li>
          <li>
            <B>Supabase:</B> banco de dados.
          </li>
          <li>
            <B>OpenAI e Groq:</B> leitura por inteligência artificial.
          </li>
          <li>
            <B>Telegram:</B> entrega das mensagens do bot.
          </li>
          <li>
            <B>Mercado Pago:</B> cobrança da assinatura.
          </li>
          <li>
            <B>Resend:</B> envio de e-mails, como o link de recuperação de senha.
          </li>
          <li>
            <B>Google Fonts:</B> o navegador baixa as fontes do site dos servidores do Google, que recebem o seu endereço IP nesse pedido.
          </li>
        </Ul>
        <P>Também podemos compartilhar dados quando a lei ou uma ordem judicial exigir.</P>
      </Section>

      <Section n={7} title="Transferência internacional">
        <P>
          Alguns desses fornecedores tratam dados fora do Brasil, principalmente nos Estados Unidos. A transferência acontece porque é necessária
          para prestar o serviço que você contratou (art. 33, IX, da LGPD), e cada fornecedor segue as próprias regras de segurança e
          privacidade.
        </P>
      </Section>

      <Section n={8} title="Grupos do Telegram">
        <P>
          No recurso Grupos do Telegram (Pro), o Trackton lê só as mensagens dos grupos que você escolher, para identificar as tips. Ele nunca
          envia mensagens pela sua conta, e você pode desconectar quando quiser.
        </P>
      </Section>

      <Section n={9} title="Por quanto tempo guardamos">
        <Ul>
          <li>Enquanto a sua conta existir.</li>
          <li>
            Ao excluir a conta (Perfil, Conta, Excluir conta), apagamos na hora o cadastro, as apostas, as movimentações e as tips. Se houver
            assinatura ativa, ela é cancelada antes.
          </li>
          <li>O histórico de mensalidades é mantido, sem ligação com a sua conta, para conciliação e obrigações fiscais.</li>
          <li>Cópias de segurança do banco podem conter dados apagados por um período curto, até serem substituídas.</li>
        </Ul>
      </Section>

      <Section n={10} title="Seus direitos">
        <P>A LGPD (art. 18) garante a você:</P>
        <Ul>
          <li>confirmar se tratamos os seus dados e ter acesso a eles;</li>
          <li>corrigir dados incompletos, errados ou desatualizados;</li>
          <li>pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários ou tratados em desacordo com a lei;</li>
          <li>pedir a portabilidade dos dados;</li>
          <li>saber com quem compartilhamos os seus dados;</li>
          <li>pedir a eliminação dos dados e revogar o consentimento, quando ele for a base do tratamento.</li>
        </Ul>
        <P>
          Boa parte você faz sozinho no app: editar o perfil, exportar os dados em CSV (Pro) e excluir a conta. Para o resto, escreva para{" "}
          <Email />. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
        </P>
      </Section>

      <Section n={11} title="Segurança">
        <P>
          A conexão com o Trackton é criptografada (HTTPS), a senha é guardada só como hash, o acesso ao banco é restrito e a conta é bloqueada
          por um tempo depois de várias tentativas de senha erradas. Nenhum sistema é totalmente imune: se acontecer um incidente que traga risco
          a você, avisaremos e comunicaremos a ANPD, como a lei exige.
        </P>
      </Section>

      <Section n={12} title="Menores de idade">
        <P>
          O Trackton é só para maiores de 18 anos e não coleta dados de menores de propósito. Se identificarmos uma conta de menor, ela será
          excluída.
        </P>
      </Section>

      <Section n={13} title="Mudanças nesta Política">
        <P>Quando esta Política mudar, a data no topo é atualizada, e mudanças importantes são avisadas no site ou no app.</P>
      </Section>

      <Section n={14} title="Contato">
        <P>
          Assuntos de privacidade e pedidos sobre os seus dados: <Email />.
        </P>
      </Section>
    </>
  );
}
