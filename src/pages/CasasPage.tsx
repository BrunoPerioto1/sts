import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  createHouseApi,
  updateHouseApi,
  deleteHouseApi,
  getAllTransactions,
  createTransactionApi,
  getAllHousesBalance,
  getHouseHistory,
  type HouseTransaction,
  type HouseBalance
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Trash2, Plus, Building2, DollarSign, TrendingUp, TrendingDown, Search, Eye, History } from "lucide-react";

// Dados mockados para detalhes da casa
interface HouseMovement {
  id: number;
  profit: string;
  created_at: string;
  movement_type: "DEPOSIT" | "WITHDRAWAL" | "BET";
  game?: string;
  stake?: string;
  odd?: string;
  market?: string;
  sport?: string;
  result_id?: number;
}

// Removido: todos os mocks substituídos por chamadas reais

import { MainLayout } from "@/components/layout/MainLayout";

function CasasPageContent() {
  const [houseBalances, setHouseBalances] = useState<HouseBalance[]>([]);
  const [transactions, setTransactions] = useState<HouseTransaction[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [selectedCasa, setSelectedCasa] = useState<HouseBalance | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingCasa, setEditingCasa] = useState<HouseBalance | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHouseBalance, setSelectedHouseBalance] = useState<HouseBalance | null>(null);
  const [selectedHouseMovements, setSelectedHouseMovements] = useState<HouseMovement[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    active: true
  });

  const [transactionForm, setTransactionForm] = useState({
    house_id: "",
    transaction_type_id: "1",
    valor: "",
    descricao: ""
  });

  const handleCreateCasa = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da casa é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await createHouseApi({ name: formData.name, active: formData.active });
      await refresh(); // Recarrega casas e saldos
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao criar casa", variant: "destructive" });
      return;
    } finally { setLoading(false); }

    setFormData({ name: "", active: true });
    setIsCreateModalOpen(false);
    
    toast({
      title: "Sucesso",
      description: "Casa criada com sucesso!"
    });
  };

  const handleEditCasa = (casa: HouseBalance) => {
    setEditingCasa(casa);
    setFormData({
      name: casa.house_name,
      active: true // Assumimos que casas com apostas estão ativas
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCasa = async () => {
    if (!editingCasa) return;
    try {
      setLoading(true);
      await updateHouseApi(editingCasa.house_id, { name: formData.name, active: formData.active });
      await refresh(); // Recarrega casas e saldos
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao atualizar casa", variant: "destructive" });
      return;
    } finally { setLoading(false); }

    setIsEditModalOpen(false);
    setEditingCasa(null);
    
    toast({
      title: "Sucesso",
      description: "Casa atualizada com sucesso!"
    });
  };

  const handleDeleteCasa = async (id: number) => {
    try {
      setLoading(true);
      await deleteHouseApi(id);
      await refresh(); // Recarrega casas e saldos
    } finally { setLoading(false); }
    toast({
      title: "Sucesso",
      description: "Casa excluída com sucesso!"
    });
  };

  const handleCreateTransaction = async () => {
    if (!transactionForm.house_id || !transactionForm.valor || !transactionForm.descricao) {
      toast({
        title: "Erro", 
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const valor = Number(transactionForm.valor);
    try {
      setLoading(true);
      const payload = {
        house_id: Number(transactionForm.house_id),
        transaction_type_id: Number(transactionForm.transaction_type_id),
        valor: transactionForm.transaction_type_id === "2" ? -Math.abs(valor) : valor,
        descricao: transactionForm.descricao
      };
      await createTransactionApi(payload);
      await refresh(); // Recarrega transações e saldos
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao criar transação", variant: "destructive" });
      return;
    } finally { setLoading(false); }

    setTransactionForm({
      house_id: "",
      transaction_type_id: "1",
      valor: "",
      descricao: ""
    });
    setIsTransactionModalOpen(false);
    
    toast({
      title: "Sucesso",
      description: "Transação criada com sucesso!"
    });
  };



  const handleViewBalance = async (casa: HouseBalance) => {
    try {
      setLoading(true);
      setSelectedHouseBalance(casa);
      setIsBalanceModalOpen(true);
    } finally { setLoading(false); }
  };

  const handleViewHistory = async (casa: HouseBalance) => {
    try {
      setLoading(true);
      const history = await getHouseHistory(casa.house_id);
      const mapped: HouseMovement[] = history.map((h: any) => ({
        id: h.id,
        profit: String(h.profit ?? 0),
        created_at: h.created_at,
        movement_type: h.movement_type,
        game: h.game,
        stake: h.stake,
        odd: h.odd,
        market: h.market,
        sport: h.sport,
        result_id: h.result_id
      }));
      setSelectedHouseMovements(mapped);
    setSelectedCasa(casa);
    setIsHistoryModalOpen(true);
    } finally { setLoading(false); }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case "DEPOSIT": return "default";
      case "WITHDRAWAL": return "destructive";
      case "BET": return "secondary";
      default: return "secondary";
    }
  };

  const getMovementTypeName = (type: string) => {
    switch (type) {
      case "DEPOSIT": return "Depósito";
      case "WITHDRAWAL": return "Saque";
      case "BET": return "Aposta";
      default: return type;
    }
  };

  // Filtrar casas baseado no termo de pesquisa
  const filteredCasas = houseBalances.filter(casa => casa.house_name.toLowerCase().includes(searchTerm.toLowerCase()));

  const refresh = async () => {
    try {
      setLoading(true);
      const [t, b] = await Promise.all([getAllTransactions(), getAllHousesBalance()]);
      setTransactions(t as any);
      setHouseBalances(b as any);
    } finally { setLoading(false); }
  };

  // initial
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => { refresh(); return undefined; });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Casas de Apostas</h2>
          <p className="text-muted-foreground">
            Gerencie suas casas e acompanhe saldos e transações
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Casa *</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={transactionForm.house_id}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, house_id: e.target.value }))}
                  >
                    <option value="">Selecione a casa</option>
                    {houseBalances.map(casa => (
                      <option key={casa.house_id} value={casa.house_id}>{casa.house_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={transactionForm.transaction_type_id}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, transaction_type_id: e.target.value }))}
                  >
                    <option value="1">Depósito</option>
                    <option value="2">Saque</option>
                    <option value="3">Ajuste</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    value={transactionForm.valor}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, valor: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição *</Label>
                  <Input
                    placeholder="Descrição da transação"
                    value={transactionForm.descricao}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, descricao: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsTransactionModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTransaction}>
                  Criar Transação
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Casa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Casa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Ex: Bet365"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Ativa</Label>
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCasa}>
                  Criar Casa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Casas com Apostas</p>
                <p className="text-2xl font-bold">{houseBalances.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Apostas</p>
                <p className="text-2xl font-bold">{houseBalances.reduce((acc, balance) => acc + balance.total_bets, 0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
                <p className="text-2xl font-bold">
                  R$ {Number(houseBalances.reduce((acc, balance) => acc + balance.house_balance, 0)).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lucro Total</p>
                <p className={`text-2xl font-bold ${houseBalances.reduce((acc, balance) => acc + balance.total_bet_profit, 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  R$ {Number(houseBalances.reduce((acc, balance) => acc + balance.total_bet_profit, 0)).toFixed(2)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="casas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="casas">Casas</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
        </TabsList>

        <TabsContent value="casas">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Casas</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar casa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Total de Apostas</TableHead>
                    <TableHead>Total Investido</TableHead>
                    <TableHead>Lucro das Apostas</TableHead>
                    <TableHead>Transações</TableHead>
                    <TableHead>Saldo Atual</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCasas.map((casa) => {
                    return (
                      <TableRow key={casa.house_id}>
                        <TableCell className="font-medium">{casa.house_name}</TableCell>
                        <TableCell>{casa.total_bets}</TableCell>
                        <TableCell>R$ {Number(casa.total_stake).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={Number(casa.total_bet_profit) >= 0 ? "text-success" : "text-destructive"}>
                            R$ {Number(casa.total_bet_profit).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>R$ {Number(casa.total_transactions).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={Number(casa.house_balance) >= 0 ? "text-success" : "text-destructive"}>
                            R$ {Number(casa.house_balance).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBalance(casa)}
                              title="Ver Detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHistory(casa)}
                              title="Ver Transações"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCasa(casa)}
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCasa(casa.house_id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transacoes">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Casa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.casa_nome}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            transaction.transaction_type_id === 1 ? "default" :
                            transaction.transaction_type_id === 2 ? "destructive" : "secondary"
                          }
                        >
                          {transaction.transaction_type_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={Number(transaction.valor ?? 0) >= 0 ? "text-success" : "text-destructive"}>
                          R$ {Number(transaction.valor ?? 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.descricao}</TableCell>
                      <TableCell>
                        {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString('pt-BR') : "-"} {' '}
                        {transaction.created_at ? new Date(transaction.created_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Casa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Ativa</Label>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCasa}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Casa */}
      <Dialog open={isBalanceModalOpen} onOpenChange={setIsBalanceModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Casa - {selectedHouseBalance?.house_name}</DialogTitle>
          </DialogHeader>
          {selectedHouseBalance && (
            <div className="space-y-6">
              {/* Cards de resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Apostas</p>
                      <p className="text-xl font-bold">{selectedHouseBalance.total_bets}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Investido</p>
                      <p className="text-xl font-bold">R$ {Number(selectedHouseBalance.total_stake ?? 0).toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Lucro</p>
                      <p className={`text-xl font-bold ${Number(selectedHouseBalance.total_bet_profit ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        R$ {Number(selectedHouseBalance.total_bet_profit ?? 0).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Saldo Atual</p>
                      <p className="text-xl font-bold text-primary">R$ {Number(selectedHouseBalance.house_balance ?? 0).toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Estatísticas detalhadas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Apostas Ganhas</p>
                        <p className="text-lg font-semibold text-success">{selectedHouseBalance.won_bets}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-success" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Apostas Perdidas</p>
                        <p className="text-lg font-semibold text-destructive">{selectedHouseBalance.lost_bets}</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-destructive" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Apostas Pendentes</p>
                        <p className="text-lg font-semibold text-warning">{selectedHouseBalance.pending_bets}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-warning" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button variant="outline" onClick={() => setIsBalanceModalOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Histórico Completo */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Transações - {selectedCasa?.house_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto">
            {selectedHouseMovements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma movimentação encontrada para esta casa.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedHouseMovements
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {new Date(movement.created_at).toLocaleDateString('pt-BR')} {' '}
                        {new Date(movement.created_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getMovementTypeColor(movement.movement_type)}>
                          {getMovementTypeName(movement.movement_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={parseFloat(movement.profit) >= 0 ? "text-success" : "text-destructive"}>
                          R$ {parseFloat(movement.profit).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {movement.movement_type === "BET" ? (
                          <div className="space-y-1">
                            <div className="font-medium">{movement.game}</div>
                            <div className="text-sm text-muted-foreground">{movement.market}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            {movement.movement_type === "DEPOSIT" ? "Depósito inicial" : "Saque parcial"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {movement.movement_type === "BET" ? (
                          <div className="text-sm space-y-1">
                            <div><span className="font-medium">Esporte:</span> {movement.sport}</div>
                            <div><span className="font-medium">Stake:</span> R$ {movement.stake}</div>
                            <div><span className="font-medium">Odd:</span> {movement.odd}</div>
                            <div>
                              <Badge variant={movement.result_id === 1 ? "default" : "destructive"}>
                                {movement.result_id === 1 ? "Ganhou" : "Perdeu"}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CasasPage() {
  return (
    <MainLayout title="Casas de Apostas">
      <CasasPageContent />
    </MainLayout>
  );
}