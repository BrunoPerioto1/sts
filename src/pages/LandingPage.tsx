import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowsClockwise,
  Buildings,
  ChartLineUp,
  ClipboardText,
  DeviceMobile,
  FileCsv,
  TelegramLogo,
  type Icon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { HouseTicker } from "@/components/landing/HouseTicker";
import { LandingWorkspace } from "@/components/landing/LandingWorkspace";
import { useInView } from "@/components/landing/use-in-view";
import { cn } from "@/lib/utils";
import "@/components/landing/landing.css";

// Recharts e os componentes do Dashboard só baixam quando a seção chega perto
// da tela (ver Numbers): quem sai antes não paga o download dos gráficos.
const NumbersPreview = lazy(() => import("@/components/landing/NumbersPreview"));

const PRICE = "R$ 40";
const SIGNUP = "/login?cadastro=1";
// Rótulo dos CTAs principais: diz o que acontece ao tocar (o teste começa).
const START = "Começar teste gratuito";

// Números do produto na abertura. Só entra número confirmado (PRODUCT.md,
// "Evidence on Hand"), arredondado pra baixo: 11.979 apostas viram "+11 mil".
const PROOF: { value: string; label: string }[] = [
  { value: "+200", label: "usuários organizando suas apostas" },
  { value: "+11 mil", label: "apostas registradas no app" },
];

/**
 * Página de entrada pra quem ainda não tem conta. Sempre no escuro (a classe
 * `dark` redefine os tokens aqui dentro): é a cara do produto e a dos prints.
 * Tudo que é número aqui é exemplo, e a página não promete lucro — vende
 * controle.
 */
export default function LandingPage() {
  // A classe `dark` daqui não chega no <html>: pra quem usa o tema claro no
  // app, o fundo além da página (rolagem elástica) e a barra de rolagem
  // ficavam claros. Escurece os dois enquanto a landing está montada.
  useEffect(() => {
    const root = document.documentElement.style;
    const previous = [root.backgroundColor, root.colorScheme];
    root.backgroundColor = "#09090b";
    root.colorScheme = "dark";
    return () => {
      [root.backgroundColor, root.colorScheme] = previous;
    };
  }, []);

  return (
    <div className="dark min-h-dvh bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Features />
        <Numbers />
        <Pricing />
        <Faq />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}

function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent bg-accent/[0.12]">
        <ChartLineUp size={18} className="text-accent-text" />
      </span>
      {/* No celular o nome inteiro empurrava "Entrar" e quebrava em duas linhas. */}
      <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight">
        SportsBet<span className="hidden sm:inline"> Manager</span>
      </span>
    </Link>
  );
}

function Header() {
  const links = [
    ["Como funciona", "#como-funciona"],
    ["Recursos", "#recursos"],
    ["Preço", "#preco"],
    ["Dúvidas", "#duvidas"],
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/[0.06] bg-background/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Brand />
        <nav className="hidden items-center gap-7 text-[14px] text-zinc-400 md:flex" aria-label="Seções">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="transition-colors hover:text-foreground">
              {label}
            </a>
          ))}
        </nav>
        {/* Botões de 32px no celular: o pseudo-elemento leva o toque a 44px ou mais
            (8px pra cada lado, porque ele conta de dentro da borda de 1px). */}
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="relative text-zinc-300 after:absolute after:inset-x-0 after:-inset-y-2 hover:bg-foreground/[0.07] hover:text-foreground">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm" className="relative after:absolute after:inset-x-0 after:-inset-y-2">
            <Link to={SIGNUP}>Criar conta</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-14 sm:pt-20" aria-labelledby="hero-title">
      {/* Grade de pontos que some nas bordas, a mesma do login. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px] [background-image:radial-gradient(rgb(var(--rgb-text)/0.10)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />
      <Container className="relative">
        {/* Título grande à esquerda e o resto alinhado ao pé dele, à direita. */}
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
          <h1 id="hero-title" className="landing-display max-w-[13ch] text-[44px] sm:text-[64px] lg:text-[76px]">
            Chega de digitar aposta em planilha.
          </h1>
          <div className="lg:pb-2">
            <p className="max-w-[52ch] text-[17px] leading-relaxed text-zinc-300">
              Cole o print do bilhete e a IA preenche evento, mercado, odd e valor. O placar propõe o resultado, o saldo de cada casa acompanha e
              você vê seu ROI de verdade, sem conta de cabeça.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to={SIGNUP}>{START}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href="#como-funciona">Ver funcionando</a>
              </Button>
            </div>
            <p className="mt-4 text-[14px] text-zinc-400">3 dias de teste gratuito. Depois, {PRICE}/mês via PIX, sem fidelidade.</p>
            {/* Número em cima e rótulo embaixo, em duas colunas: lado a lado o
                rótulo quebrava em três linhas. */}
            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-foreground/[0.07] pt-6">
              {PROOF.map(({ value, label }) => (
                <p key={label} className="flex flex-col gap-1.5">
                  <span className="landing-display text-[34px] tabular-nums sm:text-[40px]">{value}</span>
                  <span className="max-w-[22ch] text-balance text-[14px] leading-snug text-zinc-400">{label}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-foreground/[0.07] pt-6 sm:flex-row sm:items-center sm:gap-8">
          <p className="flex-none text-[14px] text-zinc-400">Compatível com as principais casas do Brasil</p>
          <div className="min-w-0 flex-1">
            <HouseTicker />
          </div>
        </div>

        <div id="como-funciona" className="scroll-mt-24 pb-6 pt-10 sm:pt-12">
          <LandingWorkspace />
          <p className="mt-4 text-center text-[13px] text-zinc-400">Demonstração com dados de exemplo. A IA preenche, mas nada é salvo sem você conferir.</p>
        </div>
      </Container>
    </section>
  );
}

const FEATURES: { icon: Icon; title: string; text: string }[] = [
  {
    icon: ClipboardText,
    title: "Resultado pelo placar",
    text: "O placar dos jogos chega sozinho e o app propõe o resultado de cada aposta pendente. Você confirma uma a uma ou em lote, e nada é liquidado sem esse clique.",
  },
  {
    icon: Buildings,
    title: "Saldo de cada casa",
    text: "Depósitos, saques e resultados formam o saldo de cada casa. Casa com saldo que não fecha aparece em “A conferir”, pra você lançar o que faltou.",
  },
  {
    icon: TelegramLogo,
    title: "Tips do Telegram",
    text: "Para assinantes do grupo de tips, comercializado separadamente: vincule o Telegram com um código de seis dígitos e as tips chegam numa fila com a stake sugerida pela sua banca, prontas para planilhar com um clique.",
  },
  {
    icon: ArrowsClockwise,
    title: "Vários bilhetes de uma vez",
    text: "Escolha cinco prints e registre cinco apostas em sequência. Bilhete grande, que não coube numa tela, vai em partes e é lido como uma aposta só.",
  },
  {
    icon: DeviceMobile,
    title: "Feito pro celular",
    text: "Funciona no navegador e pode ficar na tela inicial. Com ele instalado no Android, dá pra compartilhar o print direto do app da casa pro SportsBet.",
  },
  {
    icon: FileCsv,
    title: "Exporta pro Excel",
    text: "Apostas, movimentações e resumo mensal em CSV no formato do Excel em português. Serve pra sua planilha e pra declaração de imposto.",
  },
];

function SectionHeading({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-[640px]">
      <h2 id={id} className="landing-display text-balance text-[32px] sm:text-[42px]">
        {title}
      </h2>
      {children && <p className="mt-4 text-[16px] leading-relaxed text-zinc-400">{children}</p>}
    </div>
  );
}

function Features() {
  return (
    <section id="recursos" className="scroll-mt-20 py-20 sm:py-28" aria-labelledby="recursos-title">
      <Container>
        <SectionHeading id="recursos-title" title="Registrar é o começo. O resto acompanha.">
          Depois que a aposta entra, o app cuida do que costuma ficar atrasado na planilha.
        </SectionHeading>
        <dl className="mt-14 grid gap-x-12 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: IconComponent, title, text }) => (
            <div key={title}>
              <dt className="flex items-center gap-2.5 text-[16px] font-semibold">
                <IconComponent size={20} className="text-accent-text" />
                {title}
              </dt>
              <dd className="mt-2.5 text-[15px] leading-relaxed text-zinc-400">{text}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

function Numbers() {
  // Começa a baixar uma tela e pouco antes de aparecer, então chega pronto.
  const [ref, near] = useInView<HTMLDivElement>({ rootMargin: "800px 0px", once: true });
  const placeholder = <div className="h-[560px] rounded-2xl border border-foreground/10" aria-hidden />;
  return (
    <section className="border-t border-foreground/[0.06] py-20 sm:py-28" aria-labelledby="numeros-title">
      <Container>
        <SectionHeading id="numeros-title" title="Seus números, do jeito que eles são.">
          Lucro, ROI, unidades, taxa de acerto e odd média contam só o que já foi liquidado. Você escolhe quais números
          aparecem e em que ordem.
        </SectionHeading>
        <div ref={ref} className="mt-12">
          {near ? (
            <Suspense fallback={placeholder}>
              <NumbersPreview />
            </Suspense>
          ) : (
            placeholder
          )}
          <p className="mt-3 text-[13px] text-zinc-400">Dashboard real do app, com um mês de dados de exemplo.</p>
        </div>
      </Container>
    </section>
  );
}

// O grupo de tips é vendido à parte (PRODUCT.md): não entra nesta lista, e o
// aviso logo abaixo dela diz isso com todas as letras.
const INCLUDED = [
  "Leitura do print do bilhete por IA",
  "Conferência de resultado pelo placar",
  "Saldo por casa e comparador de casas",
  "Dashboard personalizável e exportação em CSV",
];

const STEPS = [
  { title: "Crie sua conta", text: "Informe nome, e-mail e senha. O cadastro leva menos de um minuto." },
  { title: "Teste por 3 dias", text: "Use todos os recursos sem custo, com as suas próprias apostas." },
  { title: `Assine por ${PRICE}/mês`, text: "Ao fim do teste, o pagamento é feito via PIX, por QR Code ou código copia e cola. Em seguida, basta tocar em “Já paguei”." },
];

function Pricing() {
  return (
    <section id="preco" className="scroll-mt-20 border-t border-foreground/[0.06] py-20 sm:py-28" aria-labelledby="preco-title">
      <Container className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 id="preco-title" className="landing-display text-balance text-[32px] sm:text-[42px]">
            Plano único, acesso completo.
          </h2>
          <p className="mt-8 flex items-baseline gap-3">
            <span className="landing-display text-[72px] tabular-nums">{PRICE}</span>
            <span className="text-[16px] text-zinc-400">por mês</span>
          </p>
          <p className="mt-2 text-[15px] text-zinc-400">
            Teste gratuito de 3 dias. Após esse período, a assinatura é paga via PIX, sem cobrança automática e sem fidelidade.
          </p>
          <ul className="mt-8 space-y-3 text-[15px]">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-accent-text" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[15px] text-zinc-400">O grupo de tips do Telegram é comercializado separadamente e não está incluído no plano.</p>
          <Button asChild size="lg" className="mt-10">
            <Link to={SIGNUP}>{START}</Link>
          </Button>
        </div>

        <div>
          <h3 className="text-[18px] font-semibold">Como começar</h3>
          <ol className="mt-6 space-y-7">
            {STEPS.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[40px_minmax(0,1fr)] gap-4">
                <span className="landing-display flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 text-[17px] tabular-nums">
                  {i + 1}
                </span>
                <div className="pt-1.5">
                  <p className="text-[16px] font-semibold">{step.title}</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-400">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

const QUESTIONS: { q: string; a: string }[] = [
  {
    q: "O SportsBet faz apostas por mim?",
    a: "Não. Ele não é casa de apostas: não recebe apostas, não movimenta seu dinheiro e não acessa sua conta nas casas. É onde você registra e acompanha as apostas que fez.",
  },
  {
    q: "A IA registra a aposta sozinha?",
    a: "Ela preenche os campos a partir do print e marca o que leu. Nada é salvo antes de você conferir e tocar em registrar. Se você corrigir um campo, vale o que você digitou.",
  },
  {
    q: "Funciona com a casa que eu uso?",
    a: "Mais de 80 casas já estão cadastradas, das maiores às menores, e a lista continua crescendo.",
  },
  {
    q: "Preciso instalar alguma coisa?",
    a: "Não. Funciona no navegador do computador e do celular. Se quiser, adicione à tela inicial do celular pra abrir como um app.",
  },
  {
    q: "Como funciona o pagamento?",
    a: `Toda conta nova tem 3 dias de teste gratuito. Após esse período, a assinatura custa ${PRICE} por mês, paga via PIX por QR Code ou código copia e cola. Confirmado o pagamento, o acesso é liberado por 30 dias. Não há cobrança automática.`,
  },
  {
    q: "As tips estão incluídas no plano?",
    a: `Não. A assinatura de ${PRICE} dá acesso ao app de controle. O grupo de tips do Telegram é comercializado separadamente, e seus assinantes recebem as tips diretamente na fila do app.`,
  },
  {
    q: "Preciso usar o Telegram?",
    a: "Não. O Telegram serve para recuperar a senha e, para assinantes do grupo de tips, para receber as tips na fila. É possível usar o app apenas com os prints e o registro manual.",
  },
];

function Faq() {
  return (
    <section id="duvidas" className="scroll-mt-20 border-t border-foreground/[0.06] py-20 sm:py-28" aria-labelledby="duvidas-title">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20">
        <SectionHeading id="duvidas-title" title="Dúvidas comuns" />
        <div className="divide-y divide-foreground/[0.08] border-y border-foreground/[0.08]">
          {QUESTIONS.map(({ q, a }) => (
            // O respiro vertical fica no <summary>: a linha inteira é o alvo do toque, não só o texto.
            <details key={q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-md py-5 text-[16px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                {q}
                <span
                  aria-hidden
                  className="relative h-3.5 w-3.5 flex-none before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-zinc-400 after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-zinc-400 after:transition-transform group-open:after:scale-y-0"
                />
              </summary>
              <p className="-mt-2 max-w-[64ch] pb-5 text-[15px] leading-relaxed text-zinc-400">{a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Closing() {
  return (
    <section className="border-t border-foreground/[0.06] py-20 sm:py-24">
      <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <h2 className="landing-display text-balance max-w-[18ch] text-[32px] sm:text-[42px]">Seu próximo bilhete já pode entrar pelo print.</h2>
        <Button asChild size="lg">
          <Link to={SIGNUP}>{START}</Link>
        </Button>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-foreground/[0.06] py-12">
      <Container className="space-y-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <Brand />
          <nav className="flex gap-6 text-[14px] text-zinc-400" aria-label="Conta">
            <Link to="/login" className="inline-flex min-h-11 items-center hover:text-foreground">
              Entrar
            </Link>
            <Link to={SIGNUP} className="inline-flex min-h-11 items-center hover:text-foreground">
              Criar conta
            </Link>
          </nav>
        </div>
        <div className="space-y-2 text-[13px] leading-relaxed text-zinc-400">
          <p className="flex items-center gap-2 font-medium text-zinc-300">
            <span className="rounded border border-zinc-600 px-1.5 text-[12px] font-semibold">18+</span>
            Proibido para menores de 18 anos.
          </p>
          <p className="max-w-[65ch]">
            Apostas envolvem risco de perda e podem causar dependência. Aposte com responsabilidade e só o que pode perder. O SportsBet Manager é uma
            ferramenta de controle: não é casa de apostas, não recebe apostas e não movimenta dinheiro.
          </p>
          <p>© {new Date().getFullYear()} SportsBet Manager</p>
        </div>
      </Container>
    </footer>
  );
}
