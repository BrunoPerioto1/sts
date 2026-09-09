import { DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { exportAllBetsCsv, exportMonthlyCsv, exportTransactionsCsv } from "@/lib/bet-exports";

export function ExportDataCard({ totalBets }: { totalBets: number }) {
  const blocks = [
    { label: "Apostas", sub: `${totalBets.toLocaleString("pt-BR")} linhas`, onClick: exportAllBetsCsv },
    { label: "Movimentações", sub: "histórico completo", onClick: exportTransactionsCsv },
    { label: "Resumo mensal", sub: "por mês", onClick: exportMonthlyCsv },
  ];

  return (
    <div className="card elev-sm bg-card rounded-md p-[16px]">
      <h3 className="text-base font-medium mb-1">Exportar dados</h3>
      <p className="text-sm opacity-55 mb-3">Baixe seus registros em CSV para planilha ou imposto de renda.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {blocks.map((block) => (
          <div key={block.label} className="rounded-md p-[14px] flex flex-col gap-2" style={{ background: "var(--color-bg)" }}>
            <span className="text-sm font-medium">{block.label}</span>
            <span className="text-xs opacity-55">{block.sub}</span>
            <Button size="sm" variant="outline" className="gap-2 self-start" onClick={block.onClick}>
              <DownloadSimple size={14} /> Baixar CSV
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs opacity-40 mt-3">Exporta todos os registros · separador ponto-e-vírgula (;)</p>
    </div>
  );
}
