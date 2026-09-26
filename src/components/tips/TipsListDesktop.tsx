import type { ReactNode } from "react";
import { formatDate } from "@/lib/format";
import { TipColumnHeaderDesktop, TipRowDesktop } from "./TipRowDesktop";
import type { TipItem } from "@/api/routes/get-tips";

function dayLabel(iso: string) {
  const date = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  if (date.toDateString() === hoje.toDateString()) return "Hoje";
  if (date.toDateString() === ontem.toDateString()) return "Ontem";
  return formatDate(date);
}

// A lista já vem ordenada do backend (mais recente primeiro), então agrupar é
// só quebrar quando o dia muda — sem sort nem Map, a ordem é a que manda.
function groupByDay(tips: TipItem[]) {
  const grupos: { label: string; date: string; tips: TipItem[] }[] = [];
  for (const tip of tips) {
    const label = dayLabel(tip.createdAt);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.label === label) ultimo.tips.push(tip);
    else grupos.push({ label, date: formatDate(tip.createdAt), tips: [tip] });
  }
  return grupos;
}

export interface TipListGroup {
  key: string;
  label: string;
  hint?: string;
  tips: TipItem[];
  /** Ação do grupo inteiro, no cabeçalho (ex.: marcar as começadas como caiu). */
  action?: ReactNode;
}

export function TipsListDesktop({
  tips,
  groups,
  selectedId,
  onSelect,
  checkedIds,
  onToggle,
}: {
  tips: TipItem[];
  /** Agrupamento pronto (fila pendente, por horário do jogo). Sem ele, por dia de chegada. */
  groups?: TipListGroup[];
  selectedId: number | null;
  onSelect: (tip: TipItem) => void;
  checkedIds: Set<number>;
  onToggle?: (id: number, shiftKey: boolean) => void;
}) {
  const grupos: TipListGroup[] =
    groups ??
    groupByDay(tips).map((g) => ({
      key: g.date,
      label: g.label,
      hint: g.label === g.date ? undefined : g.date,
      tips: g.tips,
    }));

  return (
    <div className="min-w-0 overflow-x-auto">
      <div className="min-w-[900px]">
      <TipColumnHeaderDesktop selectable={!!onToggle} />
      {grupos.map((grupo) => (
        <section key={grupo.key} className="min-w-0">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <span className="text-[13px] font-semibold tracking-tight">{grupo.label}</span>
            {grupo.hint && <span className="text-xs opacity-40">· {grupo.hint}</span>}
            <span className="ml-auto text-xs opacity-40">
              {grupo.tips.length} {grupo.tips.length === 1 ? "tip" : "tips"}
            </span>
            {grupo.action}
          </div>
          {grupo.tips.map((tip) => (
            <TipRowDesktop
              key={tip.id}
              tip={tip}
              selected={tip.id === selectedId}
              onSelect={() => onSelect(tip)}
              checked={checkedIds.has(tip.id)}
              onToggle={onToggle ? (shiftKey) => onToggle(tip.id, shiftKey) : undefined}
            />
          ))}
        </section>
      ))}
      </div>
    </div>
  );
}
