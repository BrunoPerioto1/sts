import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit2, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";

interface ApostasListProps {
  apostas: BetItem[];
  onEdit?: (aposta: BetItem) => void;
  onDelete?: (id: number) => void;
  onStatusChange?: (id: number, newStatus: string) => void;
  selectedBets?: number[];
  onSelectBet?: (betId: number) => void;
  showCheckboxes?: boolean;
}

export function ApostasList({ 
  apostas, 
  onEdit, 
  onDelete, 
  onStatusChange,
  selectedBets = [], 
  onSelectBet, 
  showCheckboxes = false 
}: ApostasListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ganha":
        return "bg-success text-success-foreground";
      case "perdida":
        return "bg-destructive text-destructive-foreground";
      case "pendente":
        return "bg-secondary text-secondary-foreground";
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

  const filteredApostas = apostas.filter(aposta =>
    aposta.game.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aposta.market.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (aposta.resultName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (value: Date | string | undefined) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return "";
    return `${d.toLocaleDateString('pt-BR')}\n${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Apostas Registradas</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar apostas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredApostas.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {apostas.length === 0 
              ? "Nenhuma aposta registrada ainda. Registre sua primeira aposta!"
              : "Nenhuma aposta encontrada com os critérios de busca."
            }
          </p>
        ) : (
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
              {filteredApostas.map((aposta) => {
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
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          status === "ganha" && "bg-success",
                          status === "perdida" && "bg-destructive", 
                          status === "cancelada" && "bg-muted-foreground",
                          status === "pendente" && "bg-primary"
                        )} />
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
                        {status === "ganha" && <span className="text-success font-bold text-lg">✓</span>}
                        {status === "perdida" && <span className="text-destructive font-bold text-lg">✗</span>}
                        {status === "cancelada" && <span className="text-muted-foreground font-bold text-lg">⦸</span>}
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
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(aposta.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}