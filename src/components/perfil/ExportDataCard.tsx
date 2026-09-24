import { DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { exportAllBetsCsv, exportMonthlyCsv, exportTransactionsCsv } from "@/lib/bet-exports";

export function ExportDataCard({ totalBets }: { totalBets: number }) {
  const rows = [
    { label: "Apostas", sub: `${totalBets.toLocaleString("pt-BR")} linhas · todas as casas`, onClick: exportAllBetsCsv },
    { label: "Movimentações", sub: "depósitos, saques e ajustes", onClick: exportTransactionsCsv },
    { label: "Resumo mensal", sub: "lucro e ROI por mês", onClick: exportMonthlyCsv },
  ];

  return (
    <section aria-labelledby="export-title">
      <h2 id="export-title" className="text-base font-semibold">Dados</h2>
      <p className="text-[13px] text-zinc-400 mt-1 mb-3">Arquivos CSV com separador ";", que abrem direto no Excel.</p>
      <ul className="rounded-xl border border-border divide-y divide-border">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3 px-4 py-3">
            <span className="flex-1 min-w-0">
              <span className="block text-sm">{row.label}</span>
              <span className="block text-xs text-zinc-500">{row.sub}</span>
            </span>
            <Button size="sm" variant="outline" className="gap-2" onClick={row.onClick} aria-label={`Baixar ${row.label}`}>
              <DownloadSimple size={14} /> Baixar
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
