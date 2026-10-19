import { useEffect, useRef, useState, type AnimationEvent, type CSSProperties } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CaretDown,
  DotsThreeOutline,
  DownloadSimple,
  MagnifyingGlass,
  SlidersHorizontal,
  X,
} from "@phosphor-icons/react";
import { formatMoney, houseColor, houseInitials, signColor } from "@/lib/format";
import { DEFAULT_STALE_BET_DAYS, formatIdleDays } from "@/lib/house-activity";
import { cn } from "@/lib/utils";
import { at, reducedMotion } from "./motion";
import { useInView } from "./use-in-view";

/**
 * A tela Casas de apostas do app, recriada com dados de exemplo: os quatro
 * blocos do topo (HouseMetrics), a barra de ferramentas (HouseSearch) e a
 * lista agrupada (HouseListItem), com os mesmos rótulos. Ao aparecer, os
 * blocos contam do zero e as casas entram em cascata; depois, em loop, abre a
 * "Nova movimentação" de uma casa e o saldo dela muda. As voltas alternam
 * depósito e saque do mesmo valor, então o saldo vai e volta sem salto.
 */

type House = {
  name: string;
  available: number;
  open?: number;
  shortfall?: number;
  profit: number;
  bets: number;
  stake: number;
  /** Dias desde a última aposta. */
  idle: number;
};

// Casas escolhidas pra que iniciais e cores (houseInitials/houseColor) não se
// repitam: Betano, Bet365 e Betfair viravam três "BE".
const IN_USE: House[] = [
  { name: "Betano", available: 1245.8, open: 50, profit: 612.3, bets: 48, stake: 2380, idle: 0 },
  { name: "Sportingbet", available: 980, profit: 341.7, bets: 35, stake: 1750, idle: 1 },
  { name: "Superbet", available: 610.5, open: 100, profit: -128.4, bets: 22, stake: 1020, idle: 3 },
  { name: "Multibet", available: 0, shortfall: -42.1, profit: 56.2, bets: 9, stake: 310, idle: 6 },
];
// Parada além do limite padrão do app (DEFAULT_STALE_BET_DAYS) e com saldo: ganha o selo de sacar.
const STOPPED: House[] = [{ name: "Novibet", available: 646.1, profit: 402.7, bets: 17, stake: 900, idle: 32 }];
const ALL = [...IN_USE, ...STOPPED];

const MOVED = 9870;
const OPEN_STAKE = ALL.reduce((sum, h) => sum + (h.open ?? 0), 0);
const PROFIT = ALL.reduce((sum, h) => sum + h.profit, 0);
const SHORTFALL = ALL.filter((h) => h.shortfall);
const WITH_BALANCE = ALL.filter((h) => h.available > 0).length;

// A casa da movimentação e o valor de cada volta.
const TARGET = "Sportingbet";
const AMOUNT = 200;

const CYCLE_MS = 8000;
const T = {
  menu: 1600,
  modal: 1900,
  modalLen: 3000,
  // Máscara de centavos, como no app: 2 → 0,02 → 0,20 → 2,00 → 20,00 → 200,00.
  typing: [2600, 2800, 3000, 3200, 3400],
  add: 4100,
};
const TYPED = ["0,02", "0,20", "2,00", "20,00", "200,00"];

/** Vai até o alvo em ~0,9 s (desacelerando no fim). Com movimento reduzido, pula direto. */
function useTween(target: number, instant: boolean, ms = 900) {
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (instant || current.current === target) {
      current.current = target;
      setValue(target);
      return;
    }
    const origin = current.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const v = origin + (target - origin) * (1 - (1 - t) ** 3);
      current.current = v;
      setValue(v);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, instant, ms]);

  return value;
}

const cents = (v: number) => Math.round(v * 100) / 100;

function HouseBadge({ days }: { days: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning/10 px-1.5 py-px text-[10px] font-semibold leading-4 text-warning ring-1 ring-inset ring-warning/25">
      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
      sacar · {days}d parada
    </span>
  );
}

// No celular ficam avatar, nome e valores, como na lista do app; a barra, a
// última aposta e o "⋯" voltam do md pra cima.
const ROW_GRID =
  "grid items-center gap-3 grid-cols-[28px_minmax(0,1fr)_auto] md:grid-cols-[28px_minmax(150px,1fr)_minmax(80px,1fr)_110px_90px_28px]";

export function HousesPreview() {
  const [reduced] = useState(reducedMotion);
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: "0px 0px -15% 0px" });
  const [entered, setEntered] = useState(reduced);
  const [cycle, setCycle] = useState(0);
  // Quantas movimentações já entraram: ímpar = depósito feito, par = voltou com o saque.
  const [applied, setApplied] = useState(0);

  useEffect(() => {
    if (inView) setEntered(true);
  }, [inView]);

  const delta = applied % 2 === 1 ? AMOUNT : 0;
  const targetBalance = ALL.find((h) => h.name === TARGET)!.available + delta;
  const total = useTween(entered ? ALL.reduce((sum, h) => sum + h.available, 0) + delta : 0, reduced);
  const profit = useTween(entered ? PROFIT : 0, reduced);
  const moved = useTween(entered ? MOVED + applied * AMOUNT : 0, reduced);
  const conferir = useTween(entered ? SHORTFALL.length : 0, reduced, 500);
  const targetShown = useTween(targetBalance, reduced, 700);
  const maxBalance = Math.max(...ALL.map((h) => (h.name === TARGET ? targetShown : h.available)));

  // A volta pede depósito nas pares e saque nas ímpares.
  const op = cycle % 2 === 0 ? "DEPOSIT" : "WITHDRAWAL";
  const onModalEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setApplied((n) => n + 1);
  };

  const blocks = [
    {
      label: "Saldo total",
      value: formatMoney(cents(total)),
      hint: `${formatMoney(OPEN_STAKE)} em aberto · ${WITH_BALANCE} casas`,
    },
    { label: "Lucro consolidado", value: formatMoney(cents(profit), { signed: true }), valueClass: signColor(cents(profit)), hint: "desde o início" },
    { label: "Movimentado", value: formatMoney(cents(moved)), hint: "depósitos + saques" },
    {
      label: "A conferir",
      value: `${Math.round(conferir)} de ${ALL.length}`,
      valueClass: Math.round(conferir) > 0 ? "text-danger" : undefined,
      hint: `${formatMoney(Math.abs(SHORTFALL.reduce((s, h) => s + (h.shortfall ?? 0), 0)))} sem lançamento · ver casas`,
    },
  ];

  const row = (house: House, i: number) => {
    const balance = house.name === TARGET ? targetShown : house.available;
    const width = maxBalance > 0 ? (balance / maxBalance) * 100 : 0;
    const stale = house.idle >= DEFAULT_STALE_BET_DAYS && balance > 0;
    const isTarget = house.name === TARGET;
    return (
      <div key={house.name} className="ws-in relative" style={at(150 + i * 90)}>
        {isTarget && applied > 0 && (
          <span key={applied} aria-hidden className="lp-flash absolute -inset-x-2 inset-y-0 rounded-md" />
        )}
        <div className={cn(ROW_GRID, "relative border-b border-foreground/[0.07] py-2.5")}>
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-[7px] text-[11px] font-semibold tracking-tight text-white"
            style={{ background: houseColor(house.name) }}
          >
            {houseInitials(house.name)}
          </span>
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[14px] font-medium">{house.name}</span>
              {stale && (
                <span className="ws-in" style={at(900)}>
                  <HouseBadge days={house.idle} />
                </span>
              )}
            </span>
            {/* "a conferir" na frente, como na lista do celular do app: no fim, o corte da linha escondia. */}
            <span className="block truncate text-[12px]">
              {house.shortfall ? (
                <span className="text-danger">
                  a conferir {formatMoney(house.shortfall)}
                  <span className="text-zinc-400"> · </span>
                </span>
              ) : null}
              <span className="text-zinc-400">
                {house.bets} apostas · Stake {formatMoney(house.stake)}
                {house.open ? <> · {formatMoney(house.open)} em aberto</> : null}
              </span>
            </span>
          </span>
          <span className="hidden h-[3px] overflow-hidden rounded-full bg-foreground/[0.08] md:block">
            <span className={cn("block h-full rounded-full", house.shortfall ? "bg-danger" : "bg-accent")} style={{ width: `${width}%` }} />
          </span>
          <span className="text-right">
            <span className={cn("block text-[14px] tabular-nums", balance === 0 && "text-zinc-400")}>{formatMoney(cents(balance))}</span>
            <span className={cn("block text-[12px] tabular-nums", signColor(house.profit))}>{formatMoney(house.profit, { signed: true })}</span>
          </span>
          <span className={cn("hidden text-right text-[12px] tabular-nums md:block", stale ? "text-warning" : "text-zinc-400")}>
            aposta {formatIdleDays(house.idle)}
          </span>
          {/* O "⋯" da casa da movimentação afunda a cada volta, logo antes do modal abrir. */}
          <span
            key={isTarget ? `menu-${cycle}` : undefined}
            className={cn("hidden h-7 w-7 items-center justify-center rounded-lg text-foreground/55 md:flex", isTarget && !reduced && "ws-press")}
            style={isTarget ? at(T.menu) : undefined}
          >
            <DotsThreeOutline size={16} weight="fill" />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={ref}
      data-paused={!inView || undefined}
      role="img"
      aria-label="Tela Casas de apostas com dados de exemplo: saldo total, lucro consolidado, movimentado, casas a conferir e a lista de casas com saldo e lucro de cada uma."
      className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-[rgb(var(--rgb-surface))] p-3.5 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.7)] sm:p-6"
    >
      <div className="flex items-baseline gap-2">
        <p className="text-[16px] font-semibold">Casas de apostas</p>
        <p className="text-[12px] text-zinc-400">
          {ALL.length} casas · {WITH_BALANCE} com saldo
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 border-y border-foreground/[0.08] md:grid-cols-4">
        {blocks.map((b, i) => (
          <div
            key={b.label}
            className={cn(
              "min-w-0 py-3.5 pr-2 sm:pr-3",
              i > 0 && "md:border-l md:border-foreground/[0.08] md:pl-5",
              i % 2 === 1 && "border-l border-foreground/[0.08] pl-3 sm:pl-4",
              i > 1 && "border-t border-foreground/[0.08] md:border-t-0",
            )}
          >
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-400 sm:text-[11px] sm:tracking-wider">{b.label}</p>
            <p className={cn("truncate text-[17px] font-medium leading-tight tabular-nums sm:text-[24px]", b.valueClass)}>{b.value}</p>
            <p className="truncate text-[12px] text-zinc-400">{b.hint}</p>
          </div>
        ))}
      </div>

      {/* Barra de ferramentas parada: só mostra o que a tela oferece. */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
        <span className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-foreground/10 px-3 text-zinc-400 sm:max-w-[240px]">
          <MagnifyingGlass size={15} className="flex-none" /> Buscar casa
        </span>
        <span className="hidden h-9 items-center gap-2 px-1 text-zinc-300 sm:flex">
          <span className="h-4 w-4 rounded-sm border border-foreground/25" /> Só com saldo
        </span>
        <span className="flex h-9 items-center gap-1.5 rounded-lg border border-foreground/10 px-3 text-zinc-300">
          Saldo <CaretDown size={12} />
        </span>
        <span className="ml-auto hidden items-center gap-2 md:flex">
          <span className="flex h-9 items-center gap-1.5 rounded-lg border border-foreground/10 px-3 text-zinc-300">
            <DownloadSimple size={15} /> CSV
          </span>
          <span className="flex h-9 items-center gap-1.5 rounded-lg border border-foreground/10 px-3 text-zinc-300">
            <ArrowUpRight size={15} /> Saque em lote
          </span>
        </span>
      </div>

      <div className="mt-4 space-y-5">
        <section>
          <p className="flex items-baseline gap-2 border-b border-foreground/[0.08] pb-1.5">
            <span className="text-[13px] font-semibold">Em uso</span>
            <span className="text-[12px] tabular-nums text-zinc-400">{IN_USE.length}</span>
            <span className="hidden truncate text-[12px] text-zinc-400 sm:inline">· aposta recente ou saldo esperando</span>
          </p>
          {IN_USE.map((h, i) => row(h, i))}
        </section>
        <section>
          <p className="flex items-baseline gap-2 border-b border-foreground/[0.08] pb-1.5">
            <span className="text-[13px] font-semibold">Paradas</span>
            <span className="text-[12px] tabular-nums text-zinc-400">{STOPPED.length}</span>
            <span className="hidden truncate text-[12px] text-zinc-400 sm:inline">· sem apostar há mais tempo que o seu limite</span>
          </p>
          {STOPPED.map((h, i) => row(h, IN_USE.length + i))}
        </section>
      </div>

      {!reduced && (
        <>
          <span
            key={`clock-${cycle}`}
            aria-hidden
            className="lp-clock pointer-events-none absolute h-0 w-0"
            style={{ "--dur": `${CYCLE_MS}ms` } as CSSProperties}
            onAnimationEnd={() => setCycle((c) => c + 1)}
          />
          <MovementModal key={cycle} op={op} balance={targetBalance} onEnd={onModalEnd} />
        </>
      )}
    </div>
  );
}

const TYPES = [
  { id: "DEPOSIT", label: "Depósito", icon: ArrowDownLeft },
  { id: "WITHDRAWAL", label: "Saque", icon: ArrowUpRight },
  { id: "ADJUSTMENT", label: "Saldo real", icon: SlidersHorizontal },
] as const;

/** O "Nova movimentação" do app (HouseDialog + NovaTransacaoModal), sobre a lista. */
function MovementModal({ op, balance, onEnd }: { op: "DEPOSIT" | "WITHDRAWAL"; balance: number; onEnd: (e: AnimationEvent<HTMLDivElement>) => void }) {
  const timing = { ...at(T.modal), "--len": `${T.modalLen}ms` } as CSSProperties;
  return (
    <>
      <span aria-hidden className="lp-scrim absolute inset-0 bg-black/55" style={timing} />
      {/* Centraliza por fora: a animação do modal mexe no transform dele. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center p-3 sm:p-4">
        <div
          className="lp-modal w-full max-w-[360px] rounded-xl border border-foreground/10 bg-[rgb(var(--rgb-surface-2))] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)]"
          style={timing}
          onAnimationEnd={onEnd}
        >
          <div className="flex items-baseline gap-2 border-b border-foreground/[0.08] px-4 py-4 sm:px-5">
            <span className="whitespace-nowrap text-[14px] font-semibold sm:text-[15px]">Nova movimentação</span>
            <span className="truncate text-[11px] font-medium uppercase tracking-wider text-zinc-400 sm:text-[12px]">{TARGET}</span>
            <X size={15} className="ml-auto flex-none self-start text-zinc-400" />
          </div>
          <div className="space-y-4 px-4 py-4 sm:px-5">
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400">Tipo</p>
              <div className="grid grid-cols-3 divide-x divide-foreground/[0.08] overflow-hidden rounded-lg border border-foreground/[0.08]">
                {TYPES.map(({ id, label, icon: IconComponent }) => (
                  <span
                    key={id}
                    className={cn(
                      "flex items-center justify-center gap-1.5 whitespace-nowrap py-2.5 text-[12px] font-medium sm:text-[13px]",
                      id === op ? "bg-foreground/[0.10] text-foreground" : "text-zinc-400",
                    )}
                  >
                    {/* Sem ícone no celular: "Saldo real" quebrava em duas linhas. */}
                    <IconComponent size={14} className="hidden sm:block" /> {label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400">Valor</p>
              <div className="flex items-baseline gap-2 border-b border-foreground/[0.08] pb-2">
                <span className="text-lg text-zinc-400">R$</span>
                <span className="relative flex-1 text-2xl tabular-nums">
                  {/* Reserva a altura da linha; cada etapa da digitação aparece por cima na sua vez. */}
                  <span className="invisible">0,00</span>
                  {TYPED.map((text, i) =>
                    i < TYPED.length - 1 ? (
                      <span
                        key={text}
                        className="lp-blip absolute left-0 top-0"
                        style={{ ...at(T.typing[i]), "--len": `${T.typing[i + 1] - T.typing[i]}ms` } as CSSProperties}
                      >
                        {text}
                      </span>
                    ) : (
                      <span key={text} className="ws-in absolute left-0 top-0" style={at(T.typing[i])}>
                        {text}
                      </span>
                    ),
                  )}
                </span>
                <span className="hidden whitespace-nowrap text-[12px] text-zinc-400 sm:inline">Saldo atual {formatMoney(balance)}</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="px-3 py-2 text-[13px] text-zinc-400">Cancelar</span>
              <span className="ws-press rounded-md bg-accent px-3.5 py-2 text-[13px] font-medium text-white" style={at(T.add)}>
                Adicionar
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
