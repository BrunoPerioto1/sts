import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowsClockwise,
  ArrowsLeftRight,
  ChartLineUp,
  Check,
  Checks,
  CursorClick,
  FileCsv,
  HourglassMedium,
  ListChecks,
  Shield,
  Sliders,
  TelegramLogo,
  UsersThree,
  Vault,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { HeroMockup } from "@/components/landing/HeroMockup";
import { HoverTilt } from "@/components/landing/HoverTilt";
import { LandingStats } from "@/components/landing/LandingStats";
import { LandingWorkspace } from "@/components/landing/LandingWorkspace";
import { LANDING_STATS } from "@/components/landing/landing-stats";
import { at } from "@/components/landing/motion";
import { Reveal } from "@/components/landing/Reveal";
import { StepCards } from "@/components/landing/StepCards";
import { ClosingArt } from "@/components/landing/ClosingArt";
import { useInView } from "@/components/landing/use-in-view";
import { cn } from "@/lib/utils";
import "@/components/brand/display-font.css";
import "@/components/landing/landing.css";

// As demos do meio da página só baixam quando a seção chega perto da tela (ver
// NearScreen): quem sai antes não paga o download, e o topo abre tão rápido
// quanto antes. Recharts e os componentes do Dashboard vêm no NumbersPreview.
const NumbersPreview = lazy(() => import("@/components/landing/NumbersPreview"));
const GroupsDemo = lazy(() => import("@/components/landing/TelegramGroups").then((m) => ({ default: m.GroupsDemo })));
const GroupPicker = lazy(() => import("@/components/landing/TelegramGroups").then((m) => ({ default: m.GroupPicker })));
const HousesPreview = lazy(() => import("@/components/landing/HousesPreview").then((m) => ({ default: m.HousesPreview })));

const PRICE = "R$ 40";
const SIGNUP = "/login?cadastro=1";
// Rótulo dos CTAs da página. Só os planos têm rótulo próprio (PLANS.cta), pra
// deixar claro o que cada botão faz.
const START = "Começar grátis";
// CTA do que é do Pro: toda conta nova testa o Pro por 3 dias.
const TRY_PRO = "Testar o Pro por 3 dias";

/**
 * Página de entrada pra quem ainda não tem conta. Sempre no escuro (a classe
 * `dark` redefine os tokens aqui dentro): é a cara do produto e a dos prints.
 * Tudo que é número aqui é exemplo, e a página não promete lucro — vende
 * controle. O "quanto está lucrando" do título é escolha do dono.
 */
export default function LandingPage() {
  // A classe `dark` daqui não chega no <html>: pra quem usa o tema claro no
  // app, o fundo além da página (rolagem elástica) e a barra de rolagem
  // ficavam claros. Escurece os dois enquanto a landing está montada. O <body>
  // também: o Safari do iPhone pinta a barra de status e a sobra abaixo do
  // rodapé com a cor dele, que no tema claro vinha cinza.
  useEffect(() => {
    const root = document.documentElement.style;
    const body = document.body.style;
    const previous = [root.backgroundColor, root.colorScheme, body.backgroundColor];
    root.backgroundColor = "#050506";
    root.colorScheme = "dark";
    body.backgroundColor = "#050506";
    return () => {
      [root.backgroundColor, root.colorScheme, body.backgroundColor] = previous;
    };
  }, []);

  // Todo CTA daqui leva pro login, que carrega sob demanda: baixa na folga do
  // navegador, pra o clique não piscar uma tela vazia. (Safari não tem
  // requestIdleCallback; lá vai depois de 2 s.)
  useEffect(() => {
    const prefetch = () => void import("@/pages/AuthPage");
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(prefetch, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    // Do sm pra cima, a página inteira num quadro arredondado, rente às bordas
    // da tela: um tom mais escuro em volta, o quadro no fundo noturno do app.
    // No celular sem quadro: os 8px de cada lado só roubavam largura, e o
    // cabeçalho fixo deixava as linhas do quadro aparecendo em volta dele.
    // `brand-colors`: lucro, prejuízo e cinza com as cores da marca (landing.css).
    <div className="dark min-h-dvh bg-[#050506] text-foreground sm:p-3">
      <div className="brand-colors border-foreground/[0.08] bg-background sm:rounded-[28px] sm:border">
        <Header />
        <main>
          <Hero />
          <Stats />
          <Demo />
          <Steps />
          <Groups />
          <Features />
          <Houses />
          <Numbers />
          <Pricing />
          <Faq />
          <Closing />
        </main>
        <Footer />
      </div>
    </div>
  );
}

function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

function Brand({ size = "md" }: { size?: "md" | "xl" }) {
  return (
    <Link to="/" className="flex justify-self-start rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Logo size={size} />
    </Link>
  );
}

// `wide`: só a partir do lg. No md só cabem três links ao lado da marca e dos botões.
const NAV_LINKS: { label: string; href: string; wide?: boolean }[] = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Grupos", href: "#grupos", wide: true },
  { label: "Recursos", href: "#recursos", wide: true },
  { label: "Casas", href: "#casas", wide: true },
  { label: "Preço", href: "#preco" },
  { label: "Dúvidas", href: "#duvidas" },
];

/** Se a página já saiu do topo: o cabeçalho só ganha fundo e linha depois disso. */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return scrolled;
}

/**
 * A seção do menu que está no meio da tela (uma faixa fina a 45% da altura),
 * pra acender o link dela. Fora das seções do menu (topo, números, demo), nenhum.
 */
function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const ids = NAV_LINKS.map(({ href }) => href.slice(1));
    const inBand = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) inBand.set(entry.target.id, entry.isIntersecting);
        setActive(ids.find((id) => inBand.get(id)) ?? null);
      },
      { rootMargin: "-45% 0px -54% 0px" },
    );
    for (const id of ids) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);
  return active;
}

/**
 * Do md pra cima, grade de três colunas iguais nas pontas: o menu fica no
 * centro da página, não no meio do que sobra entre a marca e os botões (que
 * têm larguras diferentes). No topo da página o cabeçalho é transparente e
 * sem linha, pra não cortar o hero; ao rolar, ganha o fundo desfocado.
 */
function Header() {
  const scrolled = useScrolled();
  const active = useActiveSection();
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 sm:rounded-t-[28px]",
        scrolled ? "border-foreground/[0.06] bg-background/80" : "border-transparent bg-background/0",
      )}
    >
      {/* No celular o respiro mínimo é 12px: com o wordmark maior, 24px empurrava os botões pra fora num aparelho de 360px. */}
      {/* Menu em 14px e respiros curtos até o xl: com a marca e os botões, os seis links só cabem cheios de 1280px pra cima. */}
      <Container className="flex h-16 items-center justify-between gap-3 sm:h-20 sm:gap-6 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-3 lg:gap-4 xl:gap-6">
        <Brand />
        <nav className="hidden items-center gap-0.5 whitespace-nowrap text-[14px] text-zinc-400 md:flex xl:gap-1 xl:text-[15px]" aria-label="Seções">
          {NAV_LINKS.map(({ label, href, wide }) => (
            <a
              key={href}
              href={href}
              aria-current={active === href.slice(1) ? "true" : undefined}
              className={cn(
                "rounded-full px-2 py-1.5 transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-2.5 xl:px-3",
                "aria-[current=true]:bg-foreground/[0.08] aria-[current=true]:text-foreground",
                wide && "hidden lg:inline",
              )}
            >
              {label}
            </a>
          ))}
        </nav>
        {/* Botões de 32px no celular (40px do sm pra cima): o pseudo-elemento leva o toque a 44px ou mais
            (8px pra cada lado, porque ele conta de dentro da borda de 1px). */}
        <div className="flex items-center gap-1.5 justify-self-end sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="relative px-2 text-zinc-300 after:absolute after:inset-x-0 after:-inset-y-2 hover:bg-foreground/[0.07] hover:text-foreground sm:h-10 sm:px-4 sm:text-[15px]">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm" className="relative after:absolute after:inset-x-0 after:-inset-y-2 sm:h-10 sm:px-4 sm:text-[15px]">
            <Link to={SIGNUP}>{START}</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}

/**
 * Topo em duas colunas: o recado à esquerda e, à direita, o bot do Telegram em
 * cascata (HeroMockup). Fundo: a base escura de sempre, a grade fina que some
 * nas bordas (.hero-grid) e o brilho azul atrás do mockup. No celular, texto em
 * cima e os cards empilhados embaixo.
 */
function Hero() {
  return (
    // Do lg pra cima o topo ocupa a altura da tela (menos o cabeçalho): os números ficam pra depois da dobra.
    <section
      className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:flex lg:min-h-[calc(100svh-5rem)] lg:items-center lg:px-8 lg:pb-24 lg:pt-20"
      aria-labelledby="hero-title"
    >
      <div aria-hidden className="hero-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid w-full max-w-[1136px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8">
        <div>
          {/* "Mande o print." sempre na primeira linha; a segunda frase quebra equilibrada ao lado do
              mockup ("A gente faz / a planilha."), pra nenhuma palavra sobrar sozinha. */}
          <h1 id="hero-title" className="hero-in landing-display text-balance text-[40px] sm:text-[56px] lg:text-[50px] xl:text-[60px]" style={at(0)}>
            Mande o print. <span className="sm:block">A gente faz a planilha.</span>
          </h1>
          <p className="hero-in mt-5 max-w-[46ch] text-[17px] leading-relaxed text-zinc-300 sm:text-[18px]" style={at(80)}>
            Registre apostas pelo Telegram em segundos. O resultado vem pelo placar e você vê lucro, ROI e saldo de cada casa.
          </p>
          <div className="hero-in mt-8 flex flex-wrap gap-3" style={at(160)}>
            <Button asChild size="lg">
              <Link to={SIGNUP}>{START}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#demonstracao">Ver funcionando</a>
            </Button>
          </div>
          <p className="hero-in mt-4 text-balance text-[13px] text-zinc-400" style={at(240)}>
            3 dias de Pro grátis, sem cartão · depois {PRICE}/mês ou plano Grátis
          </p>
        </div>
        {/* Mockup 15% maior do xl pra cima (zoom refaz o layout, sem borrar o texto). No lg não:
            a coluna do título ficaria estreita demais pra "Mande o print." numa linha. */}
        <div className="hero-in xl:[zoom:1.15]" style={at(200)}>
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}

/** Três números com contexto e as casas, logo depois do topo. Sem linha de corte entre os dois. */
function Stats() {
  return (
    <section className="pb-20 sm:pb-24 lg:pt-12" aria-label="O Trackton em números">
      <Container>
        <LandingStats />
      </Container>
    </section>
  );
}

/** A demonstração do app, larga, logo abaixo do topo. */
function Demo() {
  return (
    <section
      id="demonstracao"
      className="scroll-mt-20 border-t border-foreground/[0.06] px-2 py-20 sm:px-6 sm:py-28 lg:px-10"
      aria-labelledby="demo-title"
    >
      <Reveal className="mx-auto max-w-[640px] px-2 text-center">
        <h2 id="demo-title" className="landing-display text-balance text-[32px] sm:text-[42px]">
          Veja o app trabalhando.
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-zinc-400">Três cenas do dia a dia, com dados de exemplo.</p>
      </Reveal>
      <Reveal delay={60} className="mx-auto mt-12 max-w-[1280px]">
        <LandingWorkspace />
      </Reveal>
    </section>
  );
}

/** Os três passos de toda aposta: título à esquerda, recado à direita e um card por passo. */
function Steps() {
  return (
    <section id="como-funciona" className="scroll-mt-20 border-t border-foreground/[0.06] py-20 sm:py-28" aria-labelledby="como-funciona-title">
      <Container className="max-w-[1280px]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end lg:gap-16">
          <Reveal>
            <h2 id="como-funciona-title" className="landing-display max-w-[16ch] text-balance text-[34px] sm:text-[46px]">
              A IA preenche. Você confere. O app registra.
            </h2>
          </Reveal>
          <Reveal delay={60} className="lg:pb-2">
            <p className="max-w-[46ch] text-[16px] leading-relaxed text-zinc-400">
              Nada entra na sua conta sem o seu clique. E o Trackton não é casa de apostas: não aposta por você, não recebe apostas e não mexe
              no seu dinheiro.
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link to={SIGNUP}>{START}</Link>
            </Button>
          </Reveal>
        </div>
        <div className="mt-14">
          <StepCards />
        </div>
      </Container>
    </section>
  );
}

const GROUP_STEPS = ["Conecte o Telegram", "Escolha os grupos", "Planilhe"];

const GROUP_BENEFITS: Benefit[] = [
  {
    icon: UsersThree,
    title: "Acompanhe seus grupos de tips num lugar só",
    text: "As tips de todos os grupos que você escolheu chegam no mesmo bot.",
  },
  { icon: ListChecks, title: "Receba as apostas já organizadas", text: "Esporte, jogo, mercado, odd e stake separados, no seu privado." },
  { icon: CursorClick, title: "Planilhe com um clique", text: "Um toque em Planilhar e a aposta entra na planilha." },
  {
    icon: Sliders,
    title: "Configure como cada grupo escreve as apostas",
    text: "Mostre onde ficam a odd, a stake e o esporte nas mensagens de cada grupo.",
  },
];

/**
 * Grupos do Telegram (Pro): os grupos de tips que a pessoa já segue chegam
 * organizados no privado e viram planilha num clique. Demo larga em cima; o
 * caminho, os benefícios e a escolha dos grupos embaixo.
 */
function Groups() {
  return (
    <section id="grupos" className="scroll-mt-20 border-t border-foreground/[0.06] py-20 sm:py-28" aria-labelledby="grupos-title">
      <Container className="max-w-[1280px]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end lg:gap-16">
          <Reveal>
            <p className="flex items-center gap-2 text-[14px] font-medium text-accent-text">
              <TelegramLogo size={18} weight="fill" />
              Grupos do Telegram
              <span className="rounded-md bg-accent/[0.18] px-2 py-0.5 text-[12px] font-semibold">Pro</span>
            </p>
            <h2 id="grupos-title" className="landing-display mt-4 max-w-[17ch] text-balance text-[34px] sm:text-[46px]">
              Os grupos que você já segue viram planilha.
            </h2>
          </Reveal>
          <Reveal delay={60} className="lg:pb-2">
            <p className="max-w-[46ch] text-[16px] leading-relaxed text-zinc-400">
              Pare de copiar aposta na mão. Conecte seu Telegram, escolha os grupos de tips que você acompanha e cada aposta nova chega no seu
              privado pelo nosso bot, já organizada. Um clique em Planilhar e ela está na planilha.
            </p>
          </Reveal>
        </div>

        <Reveal delay={60} className="mt-12">
          <NearScreen size="h-[932px] sm:h-[956px] lg:h-[349px]">
            <GroupsDemo />
          </NearScreen>
        </Reveal>
        <p className="mt-3 text-[13px] text-zinc-400">Demonstração com dados de exemplo.</p>

        {/* "Seus grupos" com 320px e respiro de 48px: a partir do lg sobram ~550px pros três passos numa linha só (precisam de ~515px). */}
        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <Reveal>
              <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-x-3" aria-label="Como começar">
                {GROUP_STEPS.map((step, i) => (
                  <li key={step} className="flex items-center gap-2.5 whitespace-nowrap text-[15px] font-medium">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent/[0.15] text-[12px] font-semibold tabular-nums text-accent-text">
                      {i + 1}
                    </span>
                    {step}
                    {i < GROUP_STEPS.length - 1 && <ArrowRight size={15} aria-hidden className="ml-1 hidden text-zinc-400 sm:block" />}
                  </li>
                ))}
              </ol>
            </Reveal>
            <Benefits items={GROUP_BENEFITS} className="mt-10" />
            <Reveal className="mt-10">
              <Button asChild size="lg">
                <Link to={SIGNUP}>{TRY_PRO}</Link>
              </Button>
              <p className="mt-4 flex max-w-[52ch] gap-2.5 text-[14px] leading-relaxed text-zinc-400">
                <Shield size={18} className="mt-0.5 flex-none text-accent-text" />
                O Trackton só lê os grupos que você escolher e nunca envia mensagens pela sua conta. Dá pra desconectar quando quiser.
              </p>
            </Reveal>
          </div>
          <Reveal delay={60}>
            <NearScreen size="h-[383px]">
              <GroupPicker />
            </NearScreen>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

// O motivo de trocar a planilha, linha a linha: o mesmo trabalho, de um lado
// feito à mão e do outro já resolvido. Só o que o app faz de verdade.
const VERSUS: { sheet: string; app: string }[] = [
  { sheet: "Você digita evento, mercado, odd e valor de cada aposta.", app: "O print vira aposta preenchida, e você só confere." },
  { sheet: "Você procura o placar de cada jogo pra marcar o resultado.", app: "O placar chega sozinho e o resultado vem proposto." },
  { sheet: "O saldo das casas não bate com o que está lá.", app: "Depósitos, saques e resultados formam o saldo de cada casa." },
  { sheet: "Lucro, ROI e acerto dependem de fórmula certa.", app: "Lucro, ROI e acerto prontos, contando só o que já foi liquidado." },
];

const FEATURES: { icon: Icon; title: string; text: string }[] = [
  {
    icon: TelegramLogo,
    title: "Pelo Telegram",
    text: "Mande a aposta por mensagem ou áudio pro bot e confirme ali mesmo, sem abrir o app.",
  },
  { icon: ArrowsClockwise, title: "Vários bilhetes de uma vez", text: "Escolha vários prints e registre um atrás do outro." },
  // A barra de seleção da lista de apostas (components/apostas/BulkActionBar.tsx): Ganha, Perdida ou Pendente em lote.
  { icon: Checks, title: "Resultado em lote", text: "Marque várias apostas e dê Ganha ou Perdida pra todas de uma vez." },
  { icon: FileCsv, title: "Exporta pro Excel", text: "Apostas, movimentações e resumo mensal em CSV, no formato do Excel." },
];

type Benefit = { icon: Icon; title: string; text: string };

/** Ícone, título e uma linha: a mesma grade nos recursos, nos grupos e nas casas. */
function Benefits({ items, className }: { items: Benefit[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-10 gap-y-9 sm:grid-cols-2", className)}>
      {items.map(({ icon: IconComponent, title, text }, i) => (
        <Reveal key={title} delay={i * 50}>
          <dt className="flex items-start gap-2.5 text-pretty text-[16px] font-semibold leading-snug">
            <IconComponent size={20} className="mt-px flex-none text-accent-text" />
            {title}
          </dt>
          <dd className="mt-2 text-[15px] leading-relaxed text-zinc-400">{text}</dd>
        </Reveal>
      ))}
    </dl>
  );
}

function SectionHeading({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  return (
    <Reveal className="max-w-[640px]">
      <h2 id={id} className="landing-display text-balance text-[32px] sm:text-[42px]">
        {title}
      </h2>
      {children && <p className="mt-4 text-[16px] leading-relaxed text-zinc-400">{children}</p>}
    </Reveal>
  );
}

function Features() {
  return (
    <section id="recursos" className="scroll-mt-20 border-t border-foreground/[0.06] py-20 sm:py-28" aria-labelledby="recursos-title">
      <Container>
        {/* Espaço inquebrável: o "O" não fica sozinho no fim da linha. */}
        <SectionHeading id="recursos-title" title={"A planilha anota. O Trackton acompanha."}>
          Depois que a aposta entra, o app cuida do que costuma ficar atrasado na planilha.
        </SectionHeading>

        <div className="mt-12">
          <div className="hidden grid-cols-2 gap-12 pb-3 text-[13px] text-zinc-400 sm:grid" aria-hidden>
            <span>Na planilha</span>
            <span>No Trackton</span>
          </div>
          <ul className="divide-y divide-foreground/[0.08] border-y border-foreground/[0.08]">
            {VERSUS.map(({ sheet, app }, i) => (
              <li key={app}>
                <Reveal delay={i * 50} className="grid gap-2.5 py-5 sm:grid-cols-2 sm:gap-12">
                  <p className="flex gap-3 text-[15px] leading-relaxed text-zinc-400">
                    <X size={16} className="mt-[5px] flex-none text-zinc-500" aria-label="Na planilha:" />
                    {sheet}
                  </p>
                  <p className="flex gap-3 text-[15px] leading-relaxed">
                    <Check size={16} weight="bold" className="mt-[5px] flex-none text-accent-text" aria-label="No Trackton:" />
                    {app}
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        <Benefits items={FEATURES} className="mt-14 lg:grid-cols-4" />
      </Container>
    </section>
  );
}

const HOUSE_BENEFITS: Benefit[] = [
  {
    icon: Vault,
    title: "Saldo de todas as casas numa tela só",
    text: "Saldo total, quanto está preso em aposta aberta e quanto já foi movimentado.",
  },
  { icon: ChartLineUp, title: "Lucro ou prejuízo por casa", text: "Verde onde você está ganhando, vermelho onde está perdendo." },
  {
    icon: ArrowsLeftRight,
    title: "Depósitos, saques e ajustes com histórico",
    text: "Lance o depósito, o saque ou o saldo que o site da casa mostra.",
  },
  {
    icon: HourglassMedium,
    title: "Aviso das casas paradas",
    text: "Casa sem aposta há mais tempo que o seu limite ganha o aviso de sacar.",
  },
];

/** A tela Casas do app, que a landing não mostrava: saldo, lucro e paradas de cada casa. */
function Houses() {
  return (
    <section id="casas" className="scroll-mt-20 border-t border-foreground/[0.06] py-20 sm:py-28" aria-labelledby="casas-title">
      <Container>
        <SectionHeading id="casas-title" title="Saiba quanto você tem em cada casa.">
          E onde está ganhando ou perdendo. Depósitos, saques e resultados fecham o saldo de cada casa, e as que ficaram paradas aparecem
          separadas.
        </SectionHeading>
        <Reveal delay={60} className="mt-12">
          <NearScreen size="h-[682px] sm:h-[722px] md:h-[639px] lg:h-[629px]">
            <HousesPreview />
          </NearScreen>
        </Reveal>
        <p className="mt-3 text-[13px] text-zinc-400">Tela Casas de apostas do app, com dados de exemplo.</p>
        <Benefits items={HOUSE_BENEFITS} className="mt-14 lg:grid-cols-4" />
        <Reveal className="mt-12">
          <Button asChild size="lg">
            <Link to={SIGNUP}>{START}</Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}

/**
 * Monta a peça só quando ela chega perto da tela. Começa a baixar uma tela e
 * pouco antes de aparecer, então chega pronta; até lá, uma caixa da mesma
 * altura (`size`) segura o lugar pra página não pular.
 */
function NearScreen({ size, children }: { size: string; children: ReactNode }) {
  const [ref, near] = useInView<HTMLDivElement>({ rootMargin: "800px 0px", once: true });
  const placeholder = <div className={cn("rounded-2xl border border-foreground/10", size)} aria-hidden />;
  return <div ref={ref}>{near ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder}</div>;
}

function Numbers() {
  return (
    <section className="border-t border-foreground/[0.06] py-20 sm:py-28" aria-labelledby="numeros-title">
      <Container>
        <SectionHeading id="numeros-title" title="Seus números, do jeito que eles são.">
          Lucro, ROI, unidades, taxa de acerto e odd média contam só o que já foi liquidado. Você escolhe quais números
          aparecem e em que ordem.
        </SectionHeading>
        <div className="mt-12">
          <HoverTilt>
            {/* Alturas medidas da peça montada (390, 700, 900 e 1280px de tela): com 560px fixos, o clique em "Preço" parava 440px acima no tablet quando ela carregava. */}
            <NearScreen size="h-[1597px] sm:h-[1688px] md:h-[1380px] lg:h-[884px]">
              <NumbersPreview />
            </NearScreen>
          </HoverTilt>
          <p className="mt-3 text-[13px] text-zinc-400">Dashboard real do app, com um mês de dados de exemplo.</p>
        </div>
      </Container>
    </section>
  );
}

// Vitrine dos dois planos; as regras moram no backend (src/users/plan.ts). Ficam
// de fora de propósito (pedido do dono): o meio de pagamento, porque aqui se fala
// do que cada plano faz e não de como se paga; e o grupo VIP de tips, vendido à
// parte. Os Grupos do Telegram do Pro são os grupos que a própria pessoa segue.
const PLANS: {
  name: string;
  description: string;
  price: string;
  note: string;
  badge?: string;
  lead: string;
  highlight?: boolean;
  /**
   * `strong` abre o item em negrito: é o que muda de um plano pro outro.
   * `hint` explica embaixo, menor, o que o item faz na prática.
   */
  items: { strong?: string; text?: string; hint?: string }[];
  cta: string;
  // Colada no botão: é o que tira o medo de clicar. Uma linha só, sem repetir o topo.
  fine?: string;
}[] = [
  {
    name: "Grátis",
    description: "Pra começar a controlar suas apostas.",
    price: "R$ 0",
    note: "pra sempre",
    lead: "Inclui:",
    items: [
      { text: "Registro manual sem limite" },
      { strong: "5 registros por IA", text: "por dia" },
      { text: "Saldo de cada casa" },
      { text: "Dashboard com lucro, ROI e acerto" },
    ],
    cta: START,
  },
  {
    name: "Pro",
    description: "Pra automatizar o registro e acompanhar seus resultados sem digitar nada.",
    price: PRICE,
    // O "cancele quando quiser" fica só no recado do botão (`fine`): aqui ele repetia a mesma coisa três linhas acima.
    note: "por mês",
    // "Mais escolhido" pediria um número que não existe (PRODUCT.md, Evidence on Hand).
    badge: "Recomendado",
    lead: "Tudo do Grátis +",
    highlight: true,
    items: [
      { strong: "IA ilimitada", text: "pra registrar suas apostas", hint: "Mande um print ou áudio e a aposta vem preenchida." },
      // "Automático" com o "você confirma" junto: nada é liquidado sem o clique (PRODUCT.md, princípio 1).
      { strong: "Resultados automáticos", text: "pelo placar", hint: "Você só confere e confirma." },
      { strong: "Exportação pro Excel" },
      { strong: "Grupos do Telegram", hint: "As tips dos seus grupos, planilhadas num clique." },
    ],
    cta: TRY_PRO,
    fine: "Sem cartão. Cancele quando quiser.",
  },
];

/**
 * Cada plano é uma coluna só, do nome ao botão. O Pro se destaca pela borda
 * azul cheia, pelo fundo um tom acima, pela sombra escura e pelo selo; o azul
 * cheio fica só no botão dele (DESIGN.md, Regra do Azul Único).
 */
function Pricing() {
  return (
    <section id="preco" className="scroll-mt-20 border-t border-foreground/[0.06] py-20 sm:py-28" aria-labelledby="preco-title">
      <Container>
        {/* 760px: "Automatize quando quiser." pede ~725px a 52px e precisa caber numa linha. */}
        <Reveal className="mx-auto max-w-[760px] text-center">
          {/* Fala dos dois planos ("começar" é o Grátis, "automatizar" é o Pro) e não repete o título do topo. */}
          <h2 id="preco-title" className="landing-display text-balance text-[36px] sm:text-[52px]">
            {/* No desktop, uma frase por linha: o "Automatize" não fica no fim da primeira. */}
            Comece grátis. <span className="sm:block">Automatize quando quiser.</span>
          </h2>
          {/* Sem o "Sem cartão de crédito." aqui: o recado já está no topo e embaixo do botão do Pro, onde a pessoa decide. */}
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-[880px] gap-4 md:grid-cols-2 md:gap-5">
          {PLANS.map((plan, i) => (
            <Reveal
              key={plan.name}
              delay={60 + i * 50}
              className={cn(
                "flex flex-col rounded-[22px] border p-6 sm:p-7",
                plan.highlight ? "border-accent bg-[rgb(var(--rgb-surface))] shadow-card" : "border-foreground/[0.09] bg-background",
              )}
            >
              <div className="flex min-h-7 items-center justify-between gap-3">
                <h3 className="text-[17px] font-semibold">{plan.name}</h3>
                {plan.badge && (
                  <span className="rounded-md bg-accent/[0.18] px-2.5 py-1 text-[13px] font-semibold text-accent-text">{plan.badge}</span>
                )}
              </div>
              <p className="landing-display mt-6 text-[48px] tabular-nums">{plan.price}</p>
              <p className="mt-1 text-[14px] text-zinc-400">{plan.note}</p>
              <p className="mt-5 text-[15px] leading-snug text-zinc-200 md:min-h-[42px]">{plan.description}</p>

              <div className="mt-6 border-t border-foreground/[0.08] pt-6">
                <p className="text-[13px] text-zinc-400">{plan.lead}</p>
                <ul className="mt-3.5 space-y-3 text-pretty text-[14px] leading-snug text-zinc-200">
                  {plan.items.map(({ strong, text, hint }) => (
                    <li key={`${strong ?? ""}${text ?? ""}`} className="flex gap-3">
                      <Check
                        size={16}
                        weight="bold"
                        className={cn("mt-px flex-none", plan.highlight ? "text-accent-text" : "text-zinc-300")}
                        aria-hidden
                      />
                      <span>
                        {strong && <strong className="font-semibold text-foreground">{strong}</strong>}
                        {strong && text && " "}
                        {text}
                        {hint && <span className="mt-1 block text-[13px] text-zinc-400">{hint}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-8">
                <Button asChild size="lg" variant={plan.highlight ? "primary" : "secondary"} className="group/cta w-full">
                  <Link to={SIGNUP}>
                    {plan.cta}
                    {plan.highlight && (
                      <ArrowRight weight="bold" aria-hidden className="transition-transform duration-200 group-hover/cta:translate-x-0.5" />
                    )}
                  </Link>
                </Button>
                {/* Sem recado no Grátis, a linha fica vazia lado a lado: os dois botões alinham. */}
                <p className={cn("mt-3 text-balance text-center text-[13px] text-zinc-400", !plan.fine && "hidden md:block md:min-h-5")}>
                  {plan.fine}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

// Só as dúvidas que a página não responde em outro lugar, em três blocos: o que o
// produto é, o Telegram e a cobrança. Saíram em 2026-10-21 (pedido do dono): "A
// IA registra sozinha?" (é o título dos passos), "O que tem no Grátis?" (os
// cards de preço logo acima) e "Preciso instalar?".
const QUESTIONS: { q: string; a: string }[] = [
  {
    q: "O Trackton faz apostas por mim?",
    a: "Não. Ele não é casa de apostas: não recebe apostas, não movimenta seu dinheiro e não acessa sua conta nas casas. É onde você registra e acompanha as apostas que fez.",
  },
  {
    q: "Funciona com a casa que eu uso?",
    a: `Mais de ${LANDING_STATS.houses} casas já estão cadastradas, das maiores às menores, e a lista continua crescendo.`,
  },
  {
    q: "Preciso usar o Telegram?",
    a: "Não. O Telegram serve para recuperar a senha, mandar apostas pelo bot e, no Pro, receber as tips dos grupos que você escolher. É possível usar o app apenas com os prints e o registro manual.",
  },
  {
    q: "O Trackton lê minhas conversas do Telegram?",
    a: "Não. Ele só lê os grupos que você escolher e nunca envia mensagens pela sua conta. Dá pra desconectar quando quiser.",
  },
  {
    q: "O que acontece depois dos 3 dias de Pro?",
    a: `A conta volta pro Grátis sozinha: nada é cobrado, porque o teste não pede cartão, e nada do que você registrou se perde. Se quiser seguir no Pro, assine por ${PRICE} por mês, sem fidelidade.`,
  },
  {
    q: "Como cancelo o Pro?",
    a: "Na página Plano, dentro do app, em Cancelar assinatura. A cobrança para na hora, o Pro já pago continua até o fim do período e depois a conta vira Grátis, com tudo o que você registrou.",
  },
];

/**
 * Título à esquerda, parado no topo da seção, e as perguntas à direita em
 * linhas altas. O convite pro cadastro fica só embaixo do título.
 */
function Faq() {
  return (
    // Fundo preto como o resto do meio da página: o azul de fundo fica só no topo (landing.css, .hero-grid).
    <section id="duvidas" className="scroll-mt-20 border-t border-foreground/[0.06] py-20 sm:py-28" aria-labelledby="duvidas-title">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-24">
        {/* Sem sticky (pedido do dono): o título não acompanha mais a rolagem, fica no topo da coluna. */}
        <Reveal className="lg:self-start">
          <h2 id="duvidas-title" className="landing-display max-w-[12ch] text-[40px] sm:text-[52px]">
            Perguntas frequentes.
          </h2>
          <p className="mt-5 max-w-[34ch] text-[16px] leading-relaxed text-zinc-400">
            Respostas rápidas sobre o app e os planos. O resto você descobre usando: são 3 dias de Pro grátis.
          </p>
          <Link
            to={SIGNUP}
            className="group/link mt-5 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-foreground hover:text-accent-text"
          >
            {START}
            <ArrowRight size={15} className="transition-transform duration-200 group-hover/link:translate-x-0.5" />
          </Link>
        </Reveal>

        <Reveal delay={60}>
          <div className="faq divide-y divide-foreground/[0.08] border-y border-foreground/[0.08]">
            {QUESTIONS.map(({ q, a }) => (
              // O respiro vertical fica no <summary>: a linha inteira é o alvo do toque, não só o texto.
              <details key={q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-md py-6 text-[16px] font-medium transition-[color,padding] group-open:pb-3 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[17px] [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden
                    className="relative h-3 w-3 flex-none transition-transform duration-300 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-zinc-400 after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-zinc-400 after:transition-transform group-open:rotate-180 group-open:after:scale-y-0"
                  />
                </summary>
                <p className="max-w-[64ch] pb-6 text-[15px] leading-relaxed text-zinc-400">{a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/**
 * Fechamento num card dividido: o convite à esquerda, escuro como a página, e
 * o app numa cena à direita, sobre a noite azul dos cards dos passos. O azul
 * cheio fica só no botão (DESIGN.md, Regra do Azul Único).
 */
function Closing() {
  return (
    <section className="border-t border-foreground/[0.06] px-2 py-20 sm:px-6 sm:py-28 lg:px-10" aria-labelledby="fechamento-title">
      <Reveal className="mx-auto max-w-[1180px]">
        <div className="grid overflow-hidden rounded-[28px] border border-foreground/[0.08] bg-[rgb(var(--rgb-surface))] shadow-card lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-14">
            <h2 id="fechamento-title" className="landing-display max-w-[15ch] text-balance text-[34px] sm:text-[46px]">
              Seu próximo bilhete já pode entrar pelo print.
            </h2>
            <p className="mt-5 max-w-[44ch] text-[16px] leading-relaxed text-zinc-400 sm:text-[17px]">
              Crie a conta, mande o primeiro print e veja a aposta preenchida em segundos. Daí pra frente, o app acompanha o resultado e o
              saldo de cada casa.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button asChild size="lg">
                <Link to={SIGNUP}>{START}</Link>
              </Button>
              <a href="#preco" className="group/link inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium hover:text-accent-text">
                Ver planos
                <ArrowRight size={15} className="transition-transform duration-200 group-hover/link:translate-x-0.5" />
              </a>
            </div>
            <p className="mt-5 text-[13px] text-zinc-400">3 dias de Pro grátis · Cancele quando quiser</p>
          </div>
          <ClosingArt />
        </div>
      </Reveal>
    </section>
  );
}

// `#` é âncora desta página (<a>); o resto é rota do app (<Link>).
const FOOTER_GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Produto",
    links: [
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Recursos", href: "#recursos" },
      { label: "Preço", href: "#preco" },
      { label: "Dúvidas", href: "#duvidas" },
    ],
  },
  {
    title: "Conta",
    links: [
      { label: "Entrar", href: "/login" },
      { label: "Criar conta", href: SIGNUP },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Termos de uso", href: "/termos" },
      { label: "Política de privacidade", href: "/privacidade" },
    ],
  },
];

const FOOTER_LINK =
  "inline-flex min-h-8 items-center rounded-sm text-[14px] text-zinc-400 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Encerramento compacto: marca e slogan à esquerda, três grupos de links à
 * direita e, depois de uma linha só, o aviso de 18+ e o ©. O aviso fica menor,
 * mas inteiro: é produto de apostas.
 */
function Footer() {
  return (
    <footer className="border-t border-foreground/[0.06] pb-10 pt-14">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div>
            <Brand size="xl" />
            <p className="mt-4 text-[14px] text-zinc-400">Sua aposta no controle.</p>
          </div>
          {/* No celular, duas colunas: Produto (a mais longa) ocupa a esquerda inteira e Conta e Legal empilham na direita. */}
          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 sm:gap-x-16">
            {FOOTER_GROUPS.map(({ title, links }, i) => (
              <div key={title} className={cn(i === 0 && "row-span-2 sm:row-span-1")}>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-zinc-300">{title}</p>
                <ul className="mt-3" aria-label={title}>
                  {links.map(({ label, href }) => (
                    <li key={href}>
                      {href.startsWith("#") ? (
                        <a href={href} className={FOOTER_LINK}>
                          {label}
                        </a>
                      ) : (
                        <Link to={href} className={FOOTER_LINK}>
                          {label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-12 border-t border-foreground/[0.06] pt-6 text-[12.5px] leading-relaxed text-zinc-500">
          <p className="max-w-[100ch]">
            <span className="mr-1.5 inline-flex items-center gap-2 font-medium text-zinc-300">
              <span className="rounded border border-zinc-600 px-1 text-[11px] font-semibold">18+</span>
              Proibido para menores de 18 anos.
            </span>
            Apostas envolvem risco de perda e podem causar dependência. Aposte com responsabilidade e só o que pode perder. O Trackton é uma
            ferramenta de controle: não é casa de apostas, não recebe apostas e não movimenta dinheiro.
          </p>
          <p className="mt-4">© {new Date().getFullYear()} Trackton</p>
        </div>
      </Container>
    </footer>
  );
}
