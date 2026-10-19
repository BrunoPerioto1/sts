import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowsClockwise,
  ArrowsLeftRight,
  ChartLineUp,
  Check,
  CursorClick,
  DeviceMobile,
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
import { HouseTicker } from "@/components/landing/HouseTicker";
import { LandingWorkspace } from "@/components/landing/LandingWorkspace";
import { EntryDiagram } from "@/components/landing/EntryDiagram";
import { Reveal } from "@/components/landing/Reveal";
import { StepCards } from "@/components/landing/StepCards";
import { ClosingArt } from "@/components/landing/ClosingArt";
import { useInView } from "@/components/landing/use-in-view";
import { cn } from "@/lib/utils";
import "@/components/landing/landing.css";

// As demos do meio da página só baixam quando a seção chega perto da tela (ver
// NearScreen): quem sai antes não paga o download, e o topo abre tão rápido
// quanto antes. Recharts e os componentes do Dashboard vêm no NumbersPreview.
const NumbersPreview = lazy(() => import("@/components/landing/NumbersPreview"));
const GroupsDemo = lazy(() => import("@/components/landing/TelegramGroups").then((m) => ({ default: m.GroupsDemo })));
const GroupPicker = lazy(() => import("@/components/landing/TelegramGroups").then((m) => ({ default: m.GroupPicker })));
const HousesPreview = lazy(() => import("@/components/landing/HousesPreview").then((m) => ({ default: m.HousesPreview })));

const PRICE = "R$ 39,99";
const SIGNUP = "/login?cadastro=1";
// Rótulo dos CTAs da página. Só os planos têm rótulo próprio (PLANS.cta), pra
// deixar claro o que cada botão faz.
const START = "Começar grátis";
// CTA do que é do Pro: toda conta nova testa o Pro por 3 dias.
const TRY_PRO = "Testar o Pro por 3 dias";
// Vai colado no CTA: é o que tira o medo de clicar.
const TRIAL = "3 dias de Pro grátis, sem cartão.";

// Números do produto na abertura. Só entra número confirmado (PRODUCT.md,
// "Evidence on Hand"), arredondado pra baixo: 11.979 apostas viram "+11 mil".
// `short` é o rótulo da prova social embaixo dos planos.
const PROOF: { value: string; label: string; short: string }[] = [
  { value: "+200", label: "usuários organizando suas apostas", short: "apostadores já usam o SportsBet" },
  { value: "+11 mil", label: "apostas registradas no app", short: "apostas registradas" },
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
    root.backgroundColor = "#050506";
    root.colorScheme = "dark";
    return () => {
      [root.backgroundColor, root.colorScheme] = previous;
    };
  }, []);

  return (
    // A página inteira num quadro arredondado, rente às bordas da tela: um tom
    // mais escuro em volta, o quadro no fundo noturno do app.
    <div className="dark min-h-dvh bg-[#050506] p-2 text-foreground sm:p-3">
      <div className="rounded-[22px] border border-foreground/[0.08] bg-background sm:rounded-[28px]">
        <Header />
        <main>
          <Hero />
          <Proof />
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
  // `wide`: só a partir do lg. No md os seis links não cabem ao lado da marca e dos botões.
  const links: { label: string; href: string; wide?: boolean }[] = [
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Grupos", href: "#grupos", wide: true },
    { label: "Recursos", href: "#recursos" },
    { label: "Casas", href: "#casas", wide: true },
    { label: "Preço", href: "#preco" },
    { label: "Dúvidas", href: "#duvidas" },
  ];
  return (
    <header className="sticky top-0 z-40 rounded-t-[22px] border-b border-foreground/[0.06] bg-background/80 backdrop-blur-md sm:rounded-t-[28px]">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Brand />
        <nav className="hidden items-center gap-7 text-[14px] text-zinc-400 md:flex" aria-label="Seções">
          {links.map(({ label, href, wide }) => (
            <a key={href} href={href} className={cn("transition-colors hover:text-foreground", wide && "hidden lg:inline")}>
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
            <Link to={SIGNUP}>{START}</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-24" aria-labelledby="hero-title">
      {/* Grade de pontos que some nas bordas, a mesma do login. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[760px] [background-image:radial-gradient(rgb(var(--rgb-text)/0.09)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black,transparent)]"
      />
      <div className="relative mx-auto max-w-[1100px] text-center">
        <h1 id="hero-title" className="landing-display mx-auto max-w-[18ch] text-balance text-[44px] sm:text-[64px] lg:text-[80px]">
          Chega de digitar aposta em planilha.
        </h1>
        <p className="mx-auto mt-6 max-w-[56ch] text-balance text-[17px] leading-relaxed text-zinc-300 sm:text-[18px]">
          Registre do seu jeito e o SportsBet acompanha o resto: propõe o resultado pelo placar, fecha o saldo de cada casa e mostra seu
          lucro e ROI de verdade, sem conta de cabeça.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to={SIGNUP}>{START}</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href="#demonstracao">Ver funcionando</a>
          </Button>
        </div>
        <p className="mt-4 text-[14px] text-zinc-400">
          <span className="font-medium text-zinc-200">{TRIAL}</span> Depois, siga no Grátis ou assine por {PRICE}/mês.
        </p>
      </div>

      <div className="relative mx-auto mt-16 max-w-[1100px] sm:mt-24">
        <EntryDiagram />
      </div>
    </section>
  );
}

/** Números e casas numa faixa só, logo depois do topo. */
function Proof() {
  return (
    <section className="border-t border-foreground/[0.06]" aria-label="Números do SportsBet">
      <Container className="grid gap-8 py-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-14">
        {/* Número em cima e rótulo embaixo: lado a lado o rótulo quebrava em três linhas. */}
        <div className="grid grid-cols-2 gap-8 sm:flex sm:gap-12">
          {PROOF.map(({ value, label }) => (
            <p key={label} className="flex flex-col gap-1.5">
              <span className="landing-display text-[32px] tabular-nums sm:text-[36px]">{value}</span>
              <span className="max-w-[24ch] text-balance text-[14px] leading-snug text-zinc-400">{label}</span>
            </p>
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-3 border-t border-foreground/[0.07] pt-6 lg:border-l lg:border-t-0 lg:pl-14 lg:pt-0">
          <p className="text-[14px] text-zinc-400">Compatível com as principais casas do Brasil</p>
          <HouseTicker />
        </div>
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
      <Reveal delay={120} className="mx-auto mt-12 max-w-[1280px]">
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
          <Reveal delay={100} className="lg:pb-2">
            <p className="max-w-[46ch] text-[16px] leading-relaxed text-zinc-400">
              Nada entra na sua conta sem o seu clique. E o SportsBet não é casa de apostas: não aposta por você, não recebe apostas e não mexe
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
          <Reveal delay={100} className="lg:pb-2">
            <p className="max-w-[46ch] text-[16px] leading-relaxed text-zinc-400">
              Pare de copiar aposta na mão. Conecte seu Telegram, escolha os grupos de tips que você acompanha e cada aposta nova chega no seu
              privado pelo nosso bot, já organizada. Um clique em Planilhar e ela está na planilha.
            </p>
          </Reveal>
        </div>

        <Reveal delay={120} className="mt-12">
          <NearScreen size="h-[932px] sm:h-[956px] lg:h-[349px]">
            <GroupsDemo />
          </NearScreen>
        </Reveal>
        <p className="mt-3 text-[13px] text-zinc-400">Demonstração com dados de exemplo.</p>

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          <div>
            <Reveal>
              <ol className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3" aria-label="Como começar">
                {GROUP_STEPS.map((step, i) => (
                  <li key={step} className="flex items-center gap-2.5 text-[15px] font-medium">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent/[0.15] text-[13px] font-semibold tabular-nums text-accent-text">
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
                O SportsBet só lê os grupos que você escolher e nunca envia mensagens pela sua conta. Dá pra desconectar quando quiser.
              </p>
            </Reveal>
          </div>
          <Reveal delay={100}>
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
  { icon: DeviceMobile, title: "Feito pro celular", text: "Fica na tela inicial e, no Android, recebe o print direto do app da casa." },
  { icon: FileCsv, title: "Exporta pro Excel", text: "Apostas, movimentações e resumo mensal em CSV, no formato do Excel." },
];

type Benefit = { icon: Icon; title: string; text: string };

/** Ícone, título e uma linha: a mesma grade nos recursos, nos grupos e nas casas. */
function Benefits({ items, className }: { items: Benefit[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-10 gap-y-9 sm:grid-cols-2", className)}>
      {items.map(({ icon: IconComponent, title, text }, i) => (
        <Reveal key={title} delay={i * 80}>
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
        <SectionHeading id="recursos-title" title={"A planilha anota. O SportsBet acompanha."}>
          Depois que a aposta entra, o app cuida do que costuma ficar atrasado na planilha.
        </SectionHeading>

        <div className="mt-12">
          <div className="hidden grid-cols-2 gap-12 pb-3 text-[13px] text-zinc-400 sm:grid" aria-hidden>
            <span>Na planilha</span>
            <span>No SportsBet</span>
          </div>
          <ul className="divide-y divide-foreground/[0.08] border-y border-foreground/[0.08]">
            {VERSUS.map(({ sheet, app }, i) => (
              <li key={app}>
                <Reveal delay={i * 80} className="grid gap-2.5 py-5 sm:grid-cols-2 sm:gap-12">
                  <p className="flex gap-3 text-[15px] leading-relaxed text-zinc-400">
                    <X size={16} className="mt-[5px] flex-none text-zinc-500" aria-label="Na planilha:" />
                    {sheet}
                  </p>
                  <p className="flex gap-3 text-[15px] leading-relaxed">
                    <Check size={16} weight="bold" className="mt-[5px] flex-none text-accent-text" aria-label="No SportsBet:" />
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
        <Reveal delay={120} className="mt-12">
          <NearScreen size="h-[682px] md:h-[639px] lg:h-[629px]">
            <HousesPreview />
          </NearScreen>
        </Reveal>
        <p className="mt-3 text-[13px] text-zinc-400">Tela Casas de apostas do app, com dados de exemplo.</p>
        <Benefits items={HOUSE_BENEFITS} className="mt-14 lg:grid-cols-4" />
        <Reveal className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button asChild size="lg">
            <Link to={SIGNUP}>{START}</Link>
          </Button>
          <p className="text-[14px] text-zinc-400">O saldo por casa já vem no plano Grátis.</p>
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
          <NearScreen size="h-[560px]">
            <NumbersPreview />
          </NearScreen>
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
    note: "por mês · cancele quando quiser",
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
        <Reveal className="mx-auto max-w-[640px] text-center">
          {/* "se está lucrando", não "quanto lucra": a página vende controle, não promete lucro (PRODUCT.md). */}
          <h2 id="preco-title" className="landing-display text-balance text-[36px] sm:text-[52px]">
            {/* No desktop, uma frase por linha: o "Saiba" não fica no fim da primeira. */}
            Controle suas apostas. <span className="sm:block">Saiba se está lucrando.</span>
          </h2>
          <p className="mt-4 text-balance text-[16px] leading-relaxed text-zinc-400">Comece grátis. Sem cartão de crédito.</p>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-[880px] gap-4 md:grid-cols-2 md:gap-5">
          {PLANS.map((plan, i) => (
            <Reveal
              key={plan.name}
              delay={120 + i * 80}
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

        <div className="mx-auto mt-14 flex max-w-[880px] justify-center gap-10 text-center sm:gap-20">
          {PROOF.map(({ value, short }) => (
            <p key={short} className="flex flex-col items-center gap-1.5">
              <span className="landing-display text-[34px] tabular-nums sm:text-[44px]">{value}</span>
              <span className="max-w-[18ch] text-balance text-[14px] leading-snug text-zinc-400 sm:max-w-none">{short}</span>
            </p>
          ))}
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
    q: "O que tem no plano Grátis?",
    a: "Registro digitado sem limite, no site e no bot, 5 leituras de print ou áudio por IA por dia, saldo por casa e dashboard. Leitura por IA sem limite, conferência pelo placar, exportação em CSV e os Grupos do Telegram são do Pro.",
  },
  {
    q: "O que acontece depois dos 3 dias de Pro?",
    a: `A conta volta pro Grátis sozinha: nada é cobrado, porque o teste não pede cartão, e nada do que você registrou se perde. Se quiser seguir no Pro, assine por ${PRICE} por mês, sem fidelidade.`,
  },
  {
    q: "Como cancelo o Pro?",
    a: "Na página Plano, dentro do app, em Cancelar assinatura. A cobrança para na hora, o Pro já pago continua até o fim do período e depois a conta vira Grátis, com tudo o que você registrou.",
  },
  {
    q: "Preciso usar o Telegram?",
    a: "Não. O Telegram serve para recuperar a senha, mandar apostas pelo bot e, no Pro, receber as tips dos grupos que você escolher. É possível usar o app apenas com os prints e o registro manual.",
  },
  {
    q: "O SportsBet lê minhas conversas do Telegram?",
    a: "Não. Ele só lê os grupos que você escolher e nunca envia mensagens pela sua conta. Dá pra desconectar quando quiser.",
  },
];

/**
 * Título à esquerda, que acompanha a rolagem no desktop, e as perguntas à
 * direita em linhas altas. No fim, uma linha de destaque pra quem ainda ficou
 * em dúvida: o teste do Pro, que é a resposta mais curta pra quase tudo.
 */
function Faq() {
  return (
    <section id="duvidas" className="scroll-mt-20 border-t border-foreground/[0.06] py-20 sm:py-28" aria-labelledby="duvidas-title">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-24">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
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

        <Reveal delay={100}>
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
          <Link
            to={SIGNUP}
            className="group/cta mt-4 flex min-h-14 items-center justify-between gap-4 rounded-xl bg-foreground/[0.04] px-5 py-4 transition-colors hover:bg-foreground/[0.07]"
          >
            <span className="text-[16px] font-medium">Ainda com dúvida?</span>
            <span className="flex items-center gap-2 text-[14px] text-zinc-400">
              <span className="hidden sm:inline">Teste 3 dias de Pro grátis</span>
              <span className="sm:hidden">Teste grátis</span>
              <ArrowRight size={15} className="transition-transform duration-200 group-hover/cta:translate-x-0.5" />
            </span>
          </Link>
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
            <p className="mt-5 text-[13px] text-zinc-400">3 dias de Pro grátis · Sem cartão · Cancele quando quiser</p>
          </div>
          <ClosingArt />
        </div>
      </Reveal>
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
