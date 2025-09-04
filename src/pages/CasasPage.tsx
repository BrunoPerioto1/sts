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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMockCasas, useMockTransactions, Casa } from "@/hooks/useMockData";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Trash2, Plus, Building2, DollarSign, TrendingUp, TrendingDown, Search, Eye, History, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Dados mockados para detalhes da casa
interface HouseBalance {
  house_id: number;
  house_name: string;
  total_bets: number;
  total_stake: number;
  total_bet_profit: number;
  total_transactions: number;
  house_balance: number;
  real_house_balance: number;
  pending_bets: number;
  won_bets: number;
  lost_bets: number;
}

interface HouseTransaction {
  id: number;
  house_id: number;
  transaction_type: "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT";
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

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

// Dados mockados
const mockHouseBalances: { [key: number]: HouseBalance } = {
  1: {
    house_id: 1,
    house_name: "Bet365",
    total_bets: 15,
    total_stake: 750.50,
    total_bet_profit: 120.75,
    total_transactions: 8,
    house_balance: 250.00,
    real_house_balance: 250.00,
    pending_bets: 2,
    won_bets: 8,
    lost_bets: 5
  },
  2: {
    house_id: 2,
    house_name: "Betano",
    total_bets: 22,
    total_stake: 1100.00,
    total_bet_profit: 89.30,
    total_transactions: 12,
    house_balance: 180.50,
    real_house_balance: 180.50,
    pending_bets: 1,
    won_bets: 12,
    lost_bets: 9
  },
  3: {
    house_id: 3,
    house_name: "Novibet",
    total_bets: 8,
    total_stake: 400.00,
    total_bet_profit: -50.00,
    total_transactions: 5,
    house_balance: 75.25,
    real_house_balance: 75.25,
    pending_bets: 0,
    won_bets: 3,
    lost_bets: 5
  }
};

const mockHouseTransactions: { [key: number]: HouseTransaction[] } = {
  1: [
    {
      id: 1,
      house_id: 1,
      transaction_type: "DEPOSIT",
      value: "500.00",
      description: "Depósito inicial",
      created_at: "2025-09-02T10:30:00.000Z",
      updated_at: "2025-09-02T10:30:00.000Z"
    },
    {
      id: 2,
      house_id: 1,
      transaction_type: "WITHDRAWAL",
      value: "-200.00",
      description: "Saque parcial",
      created_at: "2025-09-01T15:45:00.000Z",
      updated_at: "2025-09-01T15:45:00.000Z"
    },
    {
      id: 3,
      house_id: 1,
      transaction_type: "DEPOSIT",
      value: "100.00",
      description: "Recarga",
      created_at: "2025-08-30T12:20:00.000Z",
      updated_at: "2025-08-30T12:20:00.000Z"
    }
  ],
  2: [
    {
      id: 4,
      house_id: 2,
      transaction_type: "DEPOSIT",
      value: "800.00",
      description: "Depósito inicial",
      created_at: "2025-09-01T09:15:00.000Z",
      updated_at: "2025-09-01T09:15:00.000Z"
    },
    {
      id: 5,
      house_id: 2,
      transaction_type: "WITHDRAWAL",
      value: "-150.00",
      description: "Saque de lucros",
      created_at: "2025-08-29T16:30:00.000Z",
      updated_at: "2025-08-29T16:30:00.000Z"
    }
  ],
  3: [
    {
      id: 6,
      house_id: 3,
      transaction_type: "DEPOSIT",
      value: "300.00",
      description: "Depósito inicial",
      created_at: "2025-08-28T14:00:00.000Z",
      updated_at: "2025-08-28T14:00:00.000Z"
    },
    {
      id: 7,
      house_id: 3,
      transaction_type: "ADJUSTMENT",
      value: "-25.00",
      description: "Ajuste de saldo",
      created_at: "2025-08-25T11:10:00.000Z",
      updated_at: "2025-08-25T11:10:00.000Z"
    }
  ]
};

// Histórico completo de movimentações (transações + apostas)
const mockHouseMovements: { [key: number]: HouseMovement[] } = {
  1: [
    {
      id: 3,
      profit: "500.00",
      created_at: "2025-09-02T07:30:00.000Z",
      movement_type: "DEPOSIT"
    },
    {
      id: 2,
      profit: "-200.00",
      created_at: "2025-09-01T12:45:00.000Z",
      movement_type: "WITHDRAWAL"
    },
    {
      id: 1,
      profit: "100.00",
      created_at: "2025-08-30T09:20:00.000Z",
      movement_type: "DEPOSIT"
    },
    {
      id: 4,
      game: "Aliassime x Rublev",
      stake: "25.00",
      odd: "3.50",
      market: "o4.5 sets",
      sport: "Tênis",
      profit: "62.50",
      created_at: "2025-09-01T16:31:59.525Z",
      result_id: 1,
      movement_type: "BET"
    },
    {
      id: 5,
      game: "Dupla Série B",
      stake: "32.80",
      odd: "3.00",
      market: "o1.5 nos jogos de Chapecoense e Cuiabá",
      sport: "Futebol",
      profit: "-32.80",
      created_at: "2025-09-01T16:31:59.521Z",
      result_id: 2,
      movement_type: "BET"
    }
  ],
  2: [
    {
      id: 6,
      profit: "800.00",
      created_at: "2025-09-01T09:15:00.000Z",
      movement_type: "DEPOSIT"
    },
    {
      id: 7,
      profit: "-150.00",
      created_at: "2025-08-29T16:30:00.000Z",
      movement_type: "WITHDRAWAL"
    }
  ],
  3: [
    {
      id: 8,
      profit: "300.00",
      created_at: "2025-08-28T14:00:00.000Z",
      movement_type: "DEPOSIT"
    },
    {
      id: 9,
      profit: "-25.00",
      created_at: "2025-08-25T11:10:00.000Z",
      movement_type: "WITHDRAWAL"
    }
  ]
};

import { MainLayout } from "@/components/layout/MainLayout";

function CasasPageContent() {
  const { casas, createCasa, updateCasa, deleteCasa } = useMockCasas();
  const { transactions, createTransaction } = useMockTransactions();
  const { toast } = useToast();

  const [selectedCasa, setSelectedCasa] = useState<Casa | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingCasa, setEditingCasa] = useState<Casa | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedHouseBalance, setSelectedHouseBalance] = useState<HouseBalance | null>(null);
  const [selectedHouseMovements, setSelectedHouseMovements] = useState<HouseTransaction[]>([]);

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

  const handleCreateCasa = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da casa é obrigatório",
        variant: "destructive"
      });
      return;
    }

    createCasa({
      name: formData.name,
      active: formData.active
    });

    setFormData({ name: "", active: true });
    setIsCreateModalOpen(false);
    
    toast({
      title: "Sucesso",
      description: "Casa criada com sucesso!"
    });
  };

  const handleEditCasa = (casa: Casa) => {
    setEditingCasa(casa);
    setFormData({
      name: casa.name,
      active: casa.active
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCasa = () => {
    if (!editingCasa) return;

    updateCasa(editingCasa.id, {
      name: formData.name,
      active: formData.active
    });

    setIsEditModalOpen(false);
    setEditingCasa(null);
    
    toast({
      title: "Sucesso",
      description: "Casa atualizada com sucesso!"
    });
  };

  const handleDeleteCasa = (id: number) => {
    deleteCasa(id);
    toast({
      title: "Sucesso",
      description: "Casa excluída com sucesso!"
    });
  };

  const handleCreateTransaction = () => {
    if (!transactionForm.house_id || !transactionForm.valor) {
      toast({
        title: "Erro", 
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const valor = Number(transactionForm.valor);
    if (transactionForm.transaction_type_id === "2" && valor > 0) {
      // Para saques, o valor deve ser negativo
        createTransaction({
          house_id: Number(transactionForm.house_id),
          transaction_type_id: Number(transactionForm.transaction_type_id),
          valor: -valor,
          descricao: transactionForm.descricao || `Saque de R$ ${valor.toFixed(2)}`
        });
    } else {
        createTransaction({
          house_id: Number(transactionForm.house_id),
          transaction_type_id: Number(transactionForm.transaction_type_id),
          valor: transactionForm.transaction_type_id === "3" ? valor : Math.abs(valor), // ajustes podem ser positivos ou negativos
          descricao: transactionForm.descricao || `${transactionForm.transaction_type_id === "1" ? "Depósito" : transactionForm.transaction_type_id === "2" ? "Saque" : "Ajuste"} de R$ ${valor.toFixed(2)}`
        });
    }

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

  const getCasaTransactions = (houseId: number) => {
    return transactions.filter(t => t.house_id === houseId);
  };

  const calculateCasaBalance = (casa: Casa) => {
    const casaTransactions = getCasaTransactions(casa.id);
    const balance = casaTransactions.reduce((acc, t) => acc + t.valor, 0);
    return balance;
  };

  const handleViewBalance = (casa: Casa) => {
    const balance = mockHouseBalances[casa.id] || {
      house_id: casa.id,
      house_name: casa.name,
      total_bets: 0,
      total_stake: 0,
      total_bet_profit: 0,
      total_transactions: 0,
      house_balance: calculateCasaBalance(casa),
      real_house_balance: calculateCasaBalance(casa),
      pending_bets: 0,
      won_bets: 0,
      lost_bets: 0
    };
    setSelectedHouseBalance(balance);
    setIsBalanceModalOpen(true);
  };

  const handleViewHistory = (casa: Casa) => {
    const houseTransactions = mockHouseTransactions[casa.id] || [];
    setSelectedHouseMovements(houseTransactions);
    setSelectedCasa(casa);
    setIsHistoryModalOpen(true);
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
  const filteredCasas = casas.filter(casa => 
    casa.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                    {casas.map(casa => (
                      <option key={casa.id} value={casa.id}>{casa.name}</option>
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
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
                <p className="text-2xl font-bold">
                  R$ {casas.reduce((acc, casa) => acc + calculateCasaBalance(casa), 0).toFixed(2)}
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
                <p className="text-sm font-medium text-muted-foreground">Total Investido</p>
                <p className="text-2xl font-bold">R$ 2.250,50</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Lucro</p>
                <p className="text-2xl font-bold text-success">R$ 160,05</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Bets</p>
                <p className="text-2xl font-bold">45</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
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
                    <TableHead>Status</TableHead>
                    <TableHead>Saldo Calculado</TableHead>
                    <TableHead>Total Apostas</TableHead>
                    <TableHead>Depósitos</TableHead>
                    <TableHead>Saques</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCasas.map((casa) => {
                    const saldoCalculado = calculateCasaBalance(casa);
                    const casaTransactions = getCasaTransactions(casa.id);
                    const depositos = casaTransactions.filter(t => t.transaction_type_id === 1).reduce((acc, t) => acc + t.valor, 0);
                    const saques = Math.abs(casaTransactions.filter(t => t.transaction_type_id === 2).reduce((acc, t) => acc + t.valor, 0));
                    
                    return (
                      <TableRow key={casa.id}>
                        <TableCell className="font-medium">{casa.name}</TableCell>
                        <TableCell>
                          <Badge variant={casa.active ? "default" : "secondary"}>
                            {casa.active ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={saldoCalculado >= 0 ? "text-success" : "text-destructive"}>
                            R$ {saldoCalculado.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>{casa.total_bets}</TableCell>
                        <TableCell>R$ {depositos.toFixed(2)}</TableCell>
                        <TableCell>R$ {saques.toFixed(2)}</TableCell>
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
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Histórico de Transações</CardTitle>
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar casa..."
                      value={transactionSearchTerm}
                      onChange={(e) => setTransactionSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Data inicial"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : "Data final"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  {(startDate || endDate) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStartDate(undefined);
                        setEndDate(undefined);
                      }}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Casa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions
                    .filter(transaction => {
                      const matchesSearch = transactionSearchTerm === "" || 
                        transaction.casa_nome.toLowerCase().includes(transactionSearchTerm.toLowerCase());
                      
                      const transactionDate = new Date(transaction.created_at);
                      const matchesDateRange = (!startDate || transactionDate >= startDate) && 
                                             (!endDate || transactionDate <= endDate);
                      
                      return matchesSearch && matchesDateRange;
                    })
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
                        <span className={transaction.valor >= 0 ? "text-success" : "text-destructive"}>
                          R$ {transaction.valor.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString('pt-BR')} {' '}
                        {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
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
                      <p className="text-xl font-bold">R$ {selectedHouseBalance.total_stake.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Lucro</p>
                      <p className={`text-xl font-bold ${selectedHouseBalance.total_bet_profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        R$ {selectedHouseBalance.total_bet_profit.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Saldo Atual</p>
                      <p className="text-xl font-bold text-primary">R$ {selectedHouseBalance.house_balance.toFixed(2)}</p>
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
              Histórico de Transações - {selectedCasa?.name}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedHouseMovements
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString('pt-BR')} {' '}
                        {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.transaction_type === "DEPOSIT" ? "default" :
                          transaction.transaction_type === "WITHDRAWAL" ? "destructive" : "secondary"
                        }>
                          {transaction.transaction_type === "DEPOSIT" ? "Depósito" :
                           transaction.transaction_type === "WITHDRAWAL" ? "Saque" : "Ajuste"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={parseFloat(transaction.value) >= 0 ? "text-success" : "text-destructive"}>
                          R$ {parseFloat(transaction.value).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.description}
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