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

interface Aposta {
  id: number;
  evento: string;
  mercado: string;
  odd: number;
  valor: number;
  status: string;
  data: string;
  hora: string;
  casa: string;
  observacoes?: string;
}

interface ApostasListProps {
  apostas: Aposta[];
  onEdit?: (aposta: Aposta) => void;
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

  const calculateRealReturn = (aposta: Aposta) => {
    switch (aposta.status) {
      case "ganha":
        // Lucro = (stake × odd) - stake = stake × (odd - 1)
        const lucro = (aposta.valor * aposta.odd) - aposta.valor;
        return lucro >= 0 ? `+${lucro.toFixed(2)}` : lucro.toFixed(2);
      case "perdida":
        // Stake negativo quando perde
        return `-${aposta.valor.toFixed(2)}`;
      case "pendente":
        return "0.00";
      case "cancelada":
        return "0.00";
      default:
        return "0.00";
    }
  };

  const getReturnColor = (status: string) => {
    switch (status) {
      case "ganha":
        return "text-success";
      case "perdida":
        return "text-destructive";
      case "pendente":
        return "text-muted-foreground";
      case "cancelada":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const filteredApostas = apostas.filter(aposta =>
    aposta.evento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aposta.mercado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aposta.casa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aposta.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              {filteredApostas.map((aposta) => (
                <TableRow key={aposta.id} className={cn(
                  "border-r-4",
                  aposta.status === "ganha" && "border-r-success/60",
                  aposta.status === "perdida" && "border-r-destructive/60", 
                  aposta.status === "cancelada" && "border-r-muted-foreground/50",
                  aposta.status === "pendente" && "border-r-primary/60"
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
                      {/* Indicador visual adicional */}
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        aposta.status === "ganha" && "bg-success",
                        aposta.status === "perdida" && "bg-destructive", 
                        aposta.status === "cancelada" && "bg-muted-foreground",
                        aposta.status === "pendente" && "bg-primary"
                      )} />
                      <p className="font-medium text-sm">{aposta.evento}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{aposta.mercado}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{aposta.odd.toFixed(2)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">R$ {aposta.valor.toFixed(2)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{aposta.casa}</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(aposta.data).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(aposta.data).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {onStatusChange ? (
                        <Select
                          value={aposta.status}
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
                        <Badge className={cn("text-xs", getStatusColor(aposta.status))}>
                          {aposta.status.toUpperCase()}
                        </Badge>
                      )}
                      {/* Badge visual extra */}
                      {aposta.status === "ganha" && <span className="text-success font-bold text-lg">✓</span>}
                      {aposta.status === "perdida" && <span className="text-destructive font-bold text-lg">✗</span>}
                      {aposta.status === "cancelada" && <span className="text-muted-foreground font-bold text-lg">⦸</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className={cn("font-medium", getReturnColor(aposta.status))}>
                      {aposta.status === "ganha" || aposta.status === "perdida" || aposta.status === "pendente" || aposta.status === "cancelada" ? "R$ " : ""}{calculateRealReturn(aposta)}
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
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}