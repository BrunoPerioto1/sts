import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Edit2, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";

interface ApostasListProps {
  apostas: BetItem[];
  onEdit?: (aposta: BetItem) => void;
  onDelete?: (id: number) => void;
  onStatusChange?: (id: number, newStatus: string) => void;
  selectedBets?: number[];
  onSelectBet?: (betId: number) => void;
  showCheckboxes?: boolean;
  isLoading?: boolean;
}

export function ApostasList({ 
  apostas, 
  onEdit, 
  onDelete, 
  onStatusChange,
  selectedBets = [], 
  onSelectBet, 
  showCheckboxes = false,
  isLoading = false
}: ApostasListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ganha":
        return "bg-success text-success-foreground";
      case "perdida":
        return "bg-destructive text-destructive-foreground";
      case "pendente":
        return "bg-blue-500 text-white";
      case "cancelada":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const mapResultToStatus = (aposta: BetItem): string => {
    if (aposta.resultName) {
      const rn = aposta.resultName.toLowerCase();
      if (rn.includes("won") || rn.includes("ganh")) return "ganha";
      if (rn.includes("lost") || rn.includes("perdid")) return "perdida";
      if (rn.includes("cancel")) return "cancelada";
    }
    switch (aposta.resultId) {
      case ResultIdEnum.WON:
        return "ganha";
      case ResultIdEnum.LOST:
        return "perdida";
      case ResultIdEnum.CANCELED:
        return "cancelada";
      default:
        return "pendente";
    }
  };

  const getRealReturn = (aposta: BetItem) => {
    const lucro = Number(aposta.profit || 0);
    return lucro >= 0 ? `+${lucro.toFixed(2)}` : lucro.toFixed(2);
  };

  const getReturnColor = (aposta: BetItem) => {
    const lucro = Number(aposta.profit || 0);
    if (lucro > 0) return "text-success";
    if (lucro < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const formatDate = (value: Date | string | undefined) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return "";
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatDateShort = (value: Date | string | undefined) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const isMobile = useIsMobile();

  // Renderizar card para mobile
  const renderMobileCard = (aposta: BetItem) => {
    const status = mapResultToStatus(aposta);
    return (
      <Card 
        key={aposta.id}
        className={cn(
          "border-l-4",
          status === "ganha" && "border-l-success",
          status === "perdida" && "border-l-destructive",
          status === "cancelada" && "border-l-muted",
          status === "pendente" && "border-l-primary"
        )}
      >
        <CardContent className="p-3 space-y-2.5">
          {/* Header com checkbox e ações */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {showCheckboxes && onSelectBet && (
                <Checkbox 
                  checked={selectedBets.includes(aposta.id)}
                  onCheckedChange={() => onSelectBet(aposta.id)}
                  className="shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight">{aposta.game}</h3>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5 line-clamp-2">{aposta.market}</p>
              </div>
            </div>
            <div className="flex gap-0.5 shrink-0">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(aposta)}
                  className="h-7 w-7 p-0"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(aposta.id)}
                  className="h-7 w-7 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          </div>

          {/* Informações principais */}
          <div className="grid grid-cols-2 gap-2.5 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Odd</p>
              <p className="font-semibold text-sm">{Number(aposta.odd || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Stake</p>
              <p className="font-semibold text-sm">R$ {Number(aposta.stake || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Casa</p>
              <p className="font-semibold text-xs truncate">{aposta.houseName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Data</p>
              <p className="font-semibold text-xs">{formatDateShort(aposta.betTime)}</p>
            </div>
          </div>

          {/* Status e Retorno */}
          <div className="flex items-center justify-between pt-1.5 border-t">
            <div className="flex items-center gap-1.5">
              {onStatusChange ? (
                <Select
                  value={status}
                  onValueChange={(value) => onStatusChange(aposta.id, value)}
                >
                  <SelectTrigger className="w-24 h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="ganha">Ganha</SelectItem>
                    <SelectItem value="perdida">Perdida</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={cn("text-[10px] px-1.5 py-0.5", getStatusColor(status))}>
                  {status.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground mb-0.5">Retorno</p>
              <p className={cn("font-bold text-xs", getReturnColor(aposta))}>
                R$ {getRealReturn(aposta)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando apostas...</p>
        </div>
      ) : apostas.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {"Nenhuma aposta encontrada com os critérios de busca."}
        </p>
      ) : isMobile ? (
        // Versão Mobile: Cards
        <div className="space-y-2">
          {apostas.map(renderMobileCard)}
        </div>
      ) : (
        // Versão Desktop: Tabela
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              {showCheckboxes && <TableHead className="w-12"></TableHead>}
              <TableHead className="font-bold">Jogo</TableHead>
              <TableHead className="font-bold">Mercado</TableHead>
              <TableHead className="font-bold">Odd</TableHead>
              <TableHead className="font-bold">Stake</TableHead>
              <TableHead className="font-bold">Casa</TableHead>
              <TableHead className="font-bold">Data/Hora</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Retorno</TableHead>
              <TableHead className="w-24 font-bold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apostas.map((aposta) => {
              const status = mapResultToStatus(aposta);
              const dateStr = formatDate(aposta.betTime);
              return (
                <TableRow key={aposta.id} className={cn(
                  "border-r-4",
                  status === "ganha" && "border-r-success/60",
                  status === "perdida" && "border-r-destructive/60", 
                  status === "cancelada" && "border-r-muted-foreground/50",
                  status === "pendente" && "border-r-primary/60"
                )}>
                  {showCheckboxes && onSelectBet && (
                    <TableCell>
                      <Checkbox 
                        checked={selectedBets.includes(aposta.id)}
                        onCheckedChange={() => onSelectBet(aposta.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{aposta.game}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{aposta.market}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{Number(aposta.odd || 0).toFixed(2)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">R$ {Number(aposta.stake || 0).toFixed(2)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{aposta.houseName }</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium whitespace-pre-line">{dateStr}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {onStatusChange ? (
                        <Select
                          value={status}
                          onValueChange={(value) => onStatusChange(aposta.id, value)}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="ganha">Ganha</SelectItem>
                            <SelectItem value="perdida">Perdida</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={cn("text-xs", getStatusColor(status))}>
                          {status.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className={cn("font-medium", getReturnColor(aposta))}>
                      R$ {getRealReturn(aposta)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(aposta)}
                          title="Editar aposta"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(aposta.id)}
                          title="Excluir aposta"
                        >
                          <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      )}
    </>
  );
}