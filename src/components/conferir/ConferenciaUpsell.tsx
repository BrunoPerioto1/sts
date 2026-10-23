import { Link } from "react-router-dom";
import { ArrowRight, Broadcast, Checks, CheckCircle, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { SettlementSuggestion } from "@/api/routes/get-settlement";
import { ResultIdEnum } from "@/api/routes/result-id";
import { usePlan } from "@/hooks/queries/use-plan";
import { tintStyle, usePerformanceColor } from "@/hooks/use-performance-color";
import { lucroSugerido } from "@/lib/settlement-view";
import { formatMoney } from "@/lib/format";
import { ProposalPanel } from "./SuggestionDetail";

// A amostra do convite: uma proposta de verdade no formato, com dados de exemplo.
const EXEMPLO: SettlementSuggestion = {
  betId: 0,
  game: "Flamengo x Palmeiras",
  market: "Resultado final: Flamengo",
  stake: 50,
  odd: 2.1,
  eventStartAt: "2026-10-22T21:59:00",
  suggestedResultId: ResultIdEnum.WON,
  explanation: "Flamengo venceu por 2×1",
  homeScore: 2,
  awayScore: 1,
};

const PASSOS = [
  { titulo: "O placar chega sozinho", texto: "Futebol, basquete, e-sports: o resultado entra quando o jogo termina." },
  { titulo: "O bot propõe e explica", texto: "Ganhou, perdeu ou anulada, com o motivo: “Flamengo venceu por 2×1”." },
  { titulo: "Você confirma", texto: "Uma a uma, ou todas as ganhas de uma vez. Nada vira saldo antes disso." },
];

const DESTAQUES = [
  { Icone: Broadcast, texto: "O placar entra quando o jogo termina" },
  { Icone: Sparkle, texto: "O bot propõe e diz o porquê" },
  { Icone: Checks, texto: "Você confirma uma a uma ou em lote" },
];

const noop = () => undefined;

function Selo() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-text">
      <Sparkle size={13} weight="fill" /> Recurso do Pro
    </span>
  );
}

/** Cartão compacto do celular: o jogo, o placar e o veredito, sem o resto do detalhe. */
function AmostraCompacta() {
  const color = usePerformanceColor();
  const cor = color(1);
  return (
    <div aria-hidden className="space-y-3 rounded-2xl border border-foreground/10 bg-card p-3.5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[15px] font-semibold">{EXEMPLO.game}</p>
        <span className="rounded-md border border-foreground/15 px-1.5 py-px font-mono text-[12.5px] font-semibold">2×1</span>
      </div>
      <div className="rounded-xl border px-4 py-3" style={tintStyle(cor, 8, 30)}>
        <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider opacity-80">
          <span>O bot propõe</span>
          <span>Lucro</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between text-2xl font-semibold tabular-nums">
          <span>Ganhou</span>
          <span>+{formatMoney(lucroSugerido(EXEMPLO))}</span>
        </div>
        <p className="mt-3 flex items-center gap-2.5 border-t pt-3 text-[13.5px] text-zinc-200" style={{ borderColor: "inherit" }}>
          <CheckCircle size={17} /> {EXEMPLO.explanation}
        </p>
      </div>
    </div>
  );
}

/**
 * A Conferência aberta por quem está no Grátis: o que ela faz, com uma
 * proposta de exemplo no formato real. A tela de verdade nem chega a montar —
 * as consultas dela dariam 403.
 */
export function ConferenciaUpsell() {
  const { plan } = usePlan();
  const assinar = plan?.price ? `Assinar Pro · ${formatMoney(plan.price, { cents: "auto" })}/mês` : "Assinar Pro";

  return (
    <>
      {/* Celular */}
      <div className="space-y-5 pb-36 sm:hidden">
        <Selo />
        <div className="space-y-2">
          <h2 className="text-[28px] font-bold leading-[1.1] tracking-tight">Pare de marcar resultado na mão.</h2>
          <p className="text-[15px] leading-relaxed text-zinc-400">
            O placar chega sozinho e o bot propõe o resultado de cada aposta. Você só confere e confirma.
          </p>
        </div>
        <AmostraCompacta />
        <ul className="space-y-3.5 pt-1">
          {DESTAQUES.map(({ Icone, texto }) => (
            <li key={texto} className="flex items-center gap-3 text-[15px] text-zinc-200">
              <Icone size={19} className="shrink-0 text-accent-text" /> {texto}
            </li>
          ))}
        </ul>
      </div>
      <div
        className="fixed inset-x-0 z-30 space-y-2.5 bg-background px-4 pt-3 sm:hidden"
        style={{ bottom: "calc(64px + env(safe-area-inset-bottom))", paddingBottom: 12 }}
      >
        <Button asChild size="lg" className="h-12 w-full rounded-xl">
          <Link to="/plano">{assinar}</Link>
        </Button>
        <p className="text-center text-[13px] text-zinc-500">
          No Grátis, marque em{" "}
          <Link to="/bets" className="inline-flex items-center gap-1 text-accent-text">
            Apostas <ArrowRight size={12} />
          </Link>
        </p>
      </div>

      {/* Desktop */}
      <div
        className="relative hidden overflow-hidden rounded-2xl border border-foreground/10 sm:block"
        style={{ background: "radial-gradient(ellipse 70% 90% at 85% 50%, rgb(37 99 235 / 0.08), transparent 70%)" }}
      >
        <div className="grid min-h-[620px] items-center gap-10 p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:p-16">
          <div className="max-w-[520px] space-y-6">
            <Selo />
            <div className="space-y-3">
              <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">Pare de marcar resultado na mão.</h2>
              <p className="text-[15px] leading-relaxed text-zinc-400">
                Quando o jogo acaba, o placar chega sozinho e o bot propõe o resultado de cada aposta. Você só confere e confirma.
              </p>
            </div>
            <ol className="space-y-4">
              {PASSOS.map((p, i) => (
                <li key={p.titulo} className="flex gap-3.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-foreground/15 text-xs tabular-nums text-zinc-400">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-foreground">{p.titulo}</span>
                    <span className="block text-[13px] text-zinc-500">{p.texto}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="lg" className="rounded-lg">
                <Link to="/plano">{assinar}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="rounded-lg">
                <Link to="/plano">Comparar planos</Link>
              </Button>
            </div>
            <p className="text-[13px] text-zinc-500">
              No Grátis, você marca o resultado direto na lista de apostas.{" "}
              <Link to="/bets" className="inline-flex items-center gap-1 text-accent-text hover:underline">
                Ir para Apostas <ArrowRight size={12} />
              </Link>
            </p>
          </div>
          <ProposalPanel
            preview
            className="pointer-events-none hidden select-none lg:flex"
            suggestion={EXEMPLO}
            posicao={3}
            total={24}
            onPrev={noop}
            onNext={noop}
            busy={false}
            onConfirm={noop}
            onReject={noop}
          />
        </div>
      </div>
    </>
  );
}
