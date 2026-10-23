import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarX, CaretRight, Check, HandPalm } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SelectCheck } from "@/components/ui/select-check";
import { ResultIdEnum } from "@/api/routes/get-bets";
import type { SettlementReviewItem } from "@/api/routes/get-settlement";
import {
  aguardandoResultado,
  explicacaoLegivel,
  motivoCurto,
  quandoCurto,
} from "@/lib/settlement-view";
import { formatDate, formatInt, formatMoney, formatOdd, formatTime } from "@/lib/format";
import { usePerformanceColor } from "@/hooks/use-performance-color";
import { cn } from "@/lib/utils";
import type { FrameProps } from "./detail-frame";
import { Selecoes } from "./Selecoes";
import type { useSelecao } from "./selection";

const liquidarHref = (b: SettlementReviewItem) =>
  `/bets?status=${ResultIdEnum.PENDING}&period=tudo&q=${encodeURIComponent(b.game)}`;
const apostaDe = (b: SettlementReviewItem, cents: "auto" | true = "auto") =>
  `${formatMoney(Number(b.stake), { cents })} @ ${formatOdd(b.odd)}`;

/** O que liquidar como cada resultado faz com o lucro: a prévia dos três cartões. */
const OPCOES = [
  { resultId: ResultIdEnum.WON, rotulo: "Ganhou", sign: 1, lucro: (b: SettlementReviewItem) => Number(b.stake) * (Number(b.odd) - 1) },
  { resultId: ResultIdEnum.LOST, rotulo: "Perdeu", sign: -1, lucro: (b: SettlementReviewItem) => -Number(b.stake) },
  { resultId: ResultIdEnum.CANCELED, rotulo: "Anulada", sign: 0, lucro: () => 0 },
] as const;

const secaoCls = "px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500 md:px-5";

function Icone({ esperando }: { esperando: boolean }) {
  return esperando ? (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground/[0.05] text-zinc-500">
      <CalendarX size={14} />
    </span>
  ) : (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-warning/15 text-warning">
      <HandPalm size={14} weight="fill" />
    </span>
  );
}

function Linha({
  b,
  selecting,
  checked,
  ativa,
  onTap,
}: {
  b: SettlementReviewItem;
  selecting: boolean;
  checked: boolean;
  ativa: boolean;
  onTap: () => void;
}) {
  const esperando = aguardandoResultado(b);
  const motivo = motivoCurto(b);
  const quando = quandoCurto(b.eventStartAt);
  return (
    <li
      role="button"
      tabIndex={0}
      data-bet={b.betId}
      onClick={onTap}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onTap())}
      aria-pressed={selecting ? checked : undefined}
      aria-current={ativa || undefined}
      className={cn(
        "relative cursor-pointer border-t border-foreground/[0.06] transition-colors",
        checked ? "bg-accent/[0.08]" : ativa ? "bg-foreground/[0.04]" : "hover:bg-foreground/[0.025]",
        ativa && "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-accent",
      )}
    >
      {/* Mobile: o porquê em âmbar, que é o que o usuário precisa resolver. */}
      <div className="flex items-start gap-3 px-4 py-3.5 md:hidden">
        {selecting ? <SelectCheck checked={checked} className="mt-1" /> : <Icone esperando={esperando} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <p className={cn("min-w-0 flex-1 text-[15px] font-semibold leading-snug", esperando ? "text-zinc-300" : "text-foreground")}>
              {b.game}
            </p>
            <span className="whitespace-nowrap text-[14px] tabular-nums text-zinc-500">
              {formatMoney(Number(b.stake), { cents: "auto" })}
            </span>
            {!selecting && <CaretRight size={14} className="mt-1 shrink-0 text-zinc-600" />}
          </div>
          <p className="text-[13px] text-zinc-400">{b.market}</p>
          <p className={cn("mt-0.5 text-[13px]", esperando ? "text-zinc-500" : "text-warning")}>
            {motivo} · {quando}
          </p>
        </div>
      </div>

      <div className="hidden h-[64px] grid-cols-[28px_minmax(0,1.15fr)_minmax(0,1fr)_150px] items-center gap-4 px-5 md:grid">
        {selecting ? <SelectCheck checked={checked} className="justify-self-center" /> : <Icone esperando={esperando} />}
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-semibold", esperando ? "text-zinc-300" : "text-foreground")}>{b.game}</p>
          <p className="truncate text-[12.5px] text-zinc-500">{b.market}</p>
        </div>
        <p className={cn("truncate text-[13px]", esperando ? "text-zinc-500" : "text-zinc-300")}>{motivo}</p>
        <p className="text-right tabular-nums">
          <span className="block text-[13px] text-zinc-400">{apostaDe(b)}</span>
          <span className="block text-[11.5px] text-zinc-600">{quando}</span>
        </p>
      </div>
    </li>
  );
}

/**
 * Lista da aba "Liquidar na mão", em duas seções: o que o bot não soube
 * decidir (precisa de você) e o que nem tem placar ainda (esperando).
 */
export function NaMaoLista({
  lista,
  sel,
  ativaId,
  onAbrir,
}: {
  lista: SettlementReviewItem[];
  sel: ReturnType<typeof useSelecao>;
  ativaId: number | null;
  onAbrir: (betId: number) => void;
}) {
  const precisam = lista.filter((b) => !aguardandoResultado(b));
  const esperando = lista.filter(aguardandoResultado);
  const secoes = [
    { titulo: "Precisam de você", itens: precisam, cor: "text-warning" },
    { titulo: "Esperando resultado", itens: esperando, cor: "text-zinc-500" },
  ].filter((s) => s.itens.length);

  return (
    <div className="-mx-4 border-y border-foreground/[0.07] md:mx-0 md:overflow-hidden md:rounded-2xl md:border md:border-foreground/10 md:bg-card md:shadow-card">
      {secoes.map((s, i) => (
        <section key={s.titulo} className={cn(i > 0 && "border-t border-foreground/[0.07]")}>
          <h3 className={cn(secaoCls, "flex h-10 items-center gap-2")}>
            {s.titulo} <span className={cn("tabular-nums", s.cor)}>{formatInt(s.itens.length)}</span>
          </h3>
          <ul>
            {s.itens.map((b) => (
              <Linha
                key={b.betId}
                b={b}
                selecting={sel.selecting}
                checked={sel.selected.has(b.betId)}
                ativa={!sel.selecting && ativaId === b.betId}
                onTap={() => (sel.selecting ? sel.toggle(b.betId) : onAbrir(b.betId))}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Precisam de você primeiro, esperando depois: a ordem da lista e do anterior/próxima. */
export function ordemNaMao(lista: SettlementReviewItem[]) {
  return [...lista.filter((b) => !aguardandoResultado(b)), ...lista.filter(aguardandoResultado)];
}

function CorpoMao({
  b,
  escolha,
  onEscolha,
}: {
  b: SettlementReviewItem;
  escolha: ResultIdEnum | null;
  onEscolha: (r: ResultIdEnum) => void;
}) {
  const color = usePerformanceColor();
  const esperando = aguardandoResultado(b);
  const texto = explicacaoLegivel(b.explanation);
  return (
    <div className="space-y-5">
      <div
        className={cn(
          "flex gap-3 rounded-xl border px-4 py-3",
          esperando ? "border-foreground/10 bg-foreground/[0.04]" : "border-warning/30 bg-warning/[0.07]",
        )}
      >
        {esperando ? (
          <CalendarX size={18} className="mt-px shrink-0 text-zinc-400" />
        ) : (
          <HandPalm size={18} weight="fill" className="mt-px shrink-0 text-warning" />
        )}
        <div className="min-w-0 text-[13.5px]">
          <p className="font-semibold text-foreground">{esperando ? "Ainda sem resultado" : "O bot não conseguiu fechar essa"}</p>
          <p className="mt-0.5 leading-snug text-zinc-300">
            {esperando ? `${motivoCurto(b)}. Se você já sabe como terminou, pode liquidar.` : texto || motivoCurto(b)}
          </p>
        </div>
      </div>

      <Selecoes market={b.market} />

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Como terminou?</p>
        <div role="radiogroup" aria-label="Como terminou" className="grid grid-cols-3 gap-2">
          {OPCOES.map((o) => {
            const ativo = escolha === o.resultId;
            const cor = o.sign ? color(o.sign) : "var(--color-text)";
            const lucro = o.lucro(b);
            return (
              <button
                key={o.resultId}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => onEscolha(o.resultId)}
                className={cn(
                  "press rounded-xl border px-3 py-2.5 text-left transition-colors",
                  ativo ? "border-2 px-[11px] py-[9px]" : "border-foreground/10 hover:bg-foreground/[0.04]",
                )}
                style={ativo ? { borderColor: cor, background: `color-mix(in srgb, ${cor} 8%, transparent)` } : undefined}
              >
                <span className="block text-[14.5px] font-semibold" style={{ color: ativo ? cor : undefined }}>
                  {o.rotulo}
                </span>
                <span className="block text-[12.5px] tabular-nums" style={{ color: ativo ? cor : undefined }}>
                  <span className={cn(!ativo && "text-zinc-500")}>
                    {lucro > 0 ? "+" : ""}
                    {formatMoney(lucro)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[13px] text-zinc-500">
          Cashout ou meio green?{" "}
          <Link to={liquidarHref(b)} className="inline-flex items-center gap-0.5 text-accent-text hover:underline">
            Abrir em Apostas <ArrowUpRight size={12} />
          </Link>
        </p>
      </div>
    </div>
  );
}

function AcoesMao({
  escolha,
  busy,
  onPular,
  onLiquidar,
}: {
  escolha: ResultIdEnum | null;
  busy: boolean;
  onPular?: () => void;
  onLiquidar: () => void;
}) {
  const rotulo = OPCOES.find((o) => o.resultId === escolha)?.rotulo;
  return (
    <div className="grid grid-cols-[0.75fr_1.6fr] gap-2.5">
      <Button variant="secondary" className="h-12 rounded-xl" disabled={!onPular} onClick={onPular}>
        Pular
      </Button>
      <Button className="h-12 rounded-xl font-semibold" disabled={busy || !rotulo} onClick={onLiquidar}>
        {rotulo ? (
          <>
            <Check size={16} weight="bold" /> Liquidar como {rotulo.toLowerCase()}
          </>
        ) : (
          "Escolha como terminou"
        )}
      </Button>
    </div>
  );
}

/** Detalhe de uma aposta da aba, na moldura comum (painel, gaveta ou sheet). */
export function naMaoFrame(p: {
  b: SettlementReviewItem;
  posicao: number;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
  escolha: ResultIdEnum | null;
  onEscolha: (r: ResultIdEnum) => void;
  busy: boolean;
  onLiquidar: () => void;
}): FrameProps {
  const { b } = p;
  const quando = b.eventStartAt ? `${formatDate(b.eventStartAt)} · ${formatTime(b.eventStartAt)} · ` : "";
  return {
    rotulo: "Liquidar",
    posicao: p.posicao,
    total: p.total,
    titulo: b.game,
    subtitulo: `${quando}${apostaDe(b, true)}`,
    onPrev: p.onPrev,
    onNext: p.onNext,
    corpo: <CorpoMao b={b} escolha={p.escolha} onEscolha={p.onEscolha} />,
    acoes: <AcoesMao escolha={p.escolha} busy={p.busy} onPular={p.onNext} onLiquidar={p.onLiquidar} />,
    nota: "Ao liquidar, abre a próxima.",
  };
}
