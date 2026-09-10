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

export function TipsListDesktop({
  tips,
  selectedId,
  onSelect,
}: {
  tips: TipItem[];
  selectedId: number | null;
  onSelect: (tip: TipItem) => void;
}) {
  return (
    <div className="min-w-0">
      <TipColumnHeaderDesktop />
      {groupByDay(tips).map((grupo) => (
        <section key={grupo.date} className="min-w-0">
          <div className="flex items-baseline gap-2 border-b border-border px-3 py-2">
            <span className="text-[13px] font-semibold tracking-tight">{grupo.label}</span>
            <span className="text-xs opacity-40">
              {grupo.label === grupo.date ? "" : `· ${grupo.date}`}
            </span>
            <span className="ml-auto text-xs opacity-40">
              {grupo.tips.length} {grupo.tips.length === 1 ? "tip" : "tips"}
            </span>
          </div>
          {grupo.tips.map((tip) => (
            <TipRowDesktop
              key={tip.id}
              tip={tip}
              selected={tip.id === selectedId}
              onSelect={() => onSelect(tip)}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
