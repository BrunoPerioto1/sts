// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { 
//   getBets as fetchBets,
//   createBet as createBetRoute,
//   updateBet as updateBetRoute,
//   deleteBet as deleteBetRoute,
//   deleteMultipleBets as deleteMultipleBetsRoute,
//   finalizeMultipleBets as finalizeMultipleBetsRoute,
//   type BetItem,
//   ResultIdEnum,
// } from "@/api/routes/get-bets";
// import { getAllHouses, type HouseDto } from "@/api/routes/get-houses";
// import { useToast } from "@/hooks/use-toast";
// import { Edit2, Trash2, Plus, Search, CheckSquare, RefreshCw } from "lucide-react";
// import { cn } from "@/lib/utils";

// import { MainLayout } from "@/components/layout/MainLayout";

// function ApostasPageContent() {
//   const [apostas, setApostas] = useState<BetItem[]>([]);
//   const [casas, setCasas] = useState<HouseDto[]>([]);
//   const [loading, setLoading] = useState(false);
//   const { toast } = useToast();

//   const [selectedBets, setSelectedBets] = useState<number[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [houseFilter, setHouseFilter] = useState("");
//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
//   const [editingAposta, setEditingAposta] = useState<BetItem | null>(null);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);

//   // Form states
//   const [formData, setFormData] = useState({
//     game: "",
//     sport: "futebol",
//     market: "",
//     stake: "",
//     odd: "",
//     houseId: ""
//   });

//   const getStatusColor = (resultId: number) => {
//     switch (resultId) {
//       case ResultIdEnum.WON: return "bg-success text-success-foreground";
//       case ResultIdEnum.LOST: return "bg-destructive text-destructive-foreground";
//       case ResultIdEnum.PENDING: return "bg-secondary text-secondary-foreground";
//       case ResultIdEnum.CANCELED: return "bg-muted text-muted-foreground";
//       default: return "bg-muted text-muted-foreground";
//     }
//   };

//   const filteredApostas = apostas.filter(aposta => {
//     const game = (aposta.game || "").toLowerCase();
//     const market = (aposta.market || "").toLowerCase();
//     const house = String(aposta.houseId || "");
//     const matchesSearch = 
//       game.includes(searchTerm.toLowerCase()) ||
//       market.includes(searchTerm.toLowerCase()) ||
//       house.includes(searchTerm.toLowerCase());

//     const resultIdStr = String(aposta.resultId ?? "");
//     const houseIdStr = String(aposta.houseId ?? "");
//     const matchesStatus = !statusFilter || statusFilter === "all" || resultIdStr === statusFilter;
//     const matchesHouse = !houseFilter || houseFilter === "all" || houseIdStr === houseFilter;

//     return matchesSearch && matchesStatus && matchesHouse;
//   });

//   const handleSelectBet = (betId: number) => {
//     setSelectedBets(prev => 
//       prev.includes(betId) 
//         ? prev.filter(id => id !== betId)
//         : [...prev, betId]
//     );
//   };

//   const handleSelectAll = () => {
//     setSelectedBets(selectedBets.length === filteredApostas.length ? [] : filteredApostas.map(a => a.id));
//   };

//   const handleCreateAposta = async () => {
//     if (!formData.game || !formData.market || !formData.stake || !formData.odd || !formData.houseId) {
//       toast({
//         title: "Erro",
//         description: "Preencha todos os campos obrigatórios",
//         variant: "destructive"
//       });
//       return;
//     }

//     try {
//       setLoading(true);
//       const created = await createBetRoute({
//         game: formData.game,
//         sport: formData.sport,
//         market: formData.market,
//         stake: Number(formData.stake),
//         odd: Number(formData.odd),
//         houseId: Number(formData.houseId),
//         betTime: new Date().toISOString()
//       });
//       setApostas(prev => [created, ...prev]);
//     } catch (e: any) {
//       toast({ title: "Erro", description: e.message || "Falha ao criar aposta", variant: "destructive" });
//       return;
//     } finally {
//       setLoading(false);
//     }

//     setFormData({
//       game: "",
//       sport: "futebol", 
//       market: "",
//       stake: "",
//       odd: "",
//       houseId: ""
//     });
//     setIsCreateModalOpen(false);
    
//     toast({
//       title: "Sucesso",
//       description: "Aposta criada com sucesso!"
//     });
//   };

//   const handleEditAposta = (aposta: BetItem) => {
//     setEditingAposta(aposta);
//     setFormData({
//       game: aposta.game,
//       sport: aposta.sport,
//       market: aposta.market,
//       stake: aposta.stake.toString(),
//       odd: aposta.odd.toString(),
//       houseId: aposta.houseId.toString()
//     });
//     setIsEditModalOpen(true);
//   };

//   const handleUpdateAposta = async () => {
//     if (!editingAposta) return;

//     try {
//       setLoading(true);
//       const updated = await updateBetRoute(editingAposta.id, {
//         game: formData.game,
//         sport: formData.sport,
//         market: formData.market,
//         stake: Number(formData.stake),
//         odd: Number(formData.odd),
//         houseId: Number(formData.houseId)
//       });
//       setApostas(prev => prev.map(a => a.id === editingAposta.id ? { ...a, ...updated } : a));
//     } catch (e: any) {
//       toast({ title: "Erro", description: e.message || "Falha ao atualizar aposta", variant: "destructive" });
//       return;
//     } finally {
//       setLoading(false);
//     }

//     setIsEditModalOpen(false);
//     setEditingAposta(null);
    
//     toast({
//       title: "Sucesso", 
//       description: "Aposta atualizada com sucesso!"
//     });
//   };

//   const handleDeleteSelected = async () => {
//     if (selectedBets.length === 0) return;
//     try {
//       setLoading(true);
//       await deleteMultipleBetsRoute(selectedBets);
//       setApostas(prev => prev.filter(a => !selectedBets.includes(a.id)));
//     } catch (e: any) {
//       toast({ title: "Erro", description: e.message || "Falha ao excluir apostas", variant: "destructive" });
//       return;
//     } finally {
//       setLoading(false);
//     }
//     setSelectedBets([]);
    
//     toast({
//       title: "Sucesso",
//       description: `${selectedBets.length} aposta(s) excluída(s)`
//     });
//   };

//   const handleBulkStatusChange = async (resultId: number) => {
//     if (selectedBets.length === 0) return;
//     try {
//       setLoading(true);
//       await finalizeMultipleBetsRoute({ betIds: selectedBets, resultId });
//       const data = await fetchBets();
//       setApostas(data);
//     } catch (e: any) {
//       toast({ title: "Erro", description: e.message || "Falha ao atualizar status", variant: "destructive" });
//       return;
//     } finally {
//       setLoading(false);
//     }
//     setSelectedBets([]);
    
//     toast({
//       title: "Status atualizado",
//       description: `${selectedBets.length} aposta(s) alterada(s)`
//     });
//   };

//   const handleStatusChange = async (id: number, resultId: number) => {
//     try {
//       setLoading(true);
//       await finalizeMultipleBetsRoute({ betIds: [id], resultId });
//       const data = await fetchBets();
//       setApostas(data);
//     } catch (e: any) {
//       toast({ title: "Erro", description: e.message || "Falha ao alterar status", variant: "destructive" });
//       return;
//     } finally {
//       setLoading(false);
//     }
//     toast({
//       title: "Status atualizado",
//       description: "Status da aposta alterado"
//     });
//   };

//   const refresh = async () => {
//     try {
//       setLoading(true);
//       const [bets, houseRows] = await Promise.all([fetchBets(), getAllHouses()]);
//       setApostas(bets);
//       setCasas(houseRows || []);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // initial load
//   useEffect(() => {
//     refresh();
//   }, []);

//   const casasMap = new Map(casas.map(c => [c.houseId, c.houseName] as const));

//   return (
//     <div className="space-y-6">
//       {/* Header com ações */}
//       <div className="flex justify-between items-center">
//         <div className="flex items-center gap-4">
//           <Button variant="outline" className="flex items-center gap-2" onClick={refresh} disabled={loading}>
//             <RefreshCw className="h-4 w-4" />
//             Atualizar
//           </Button>
          
//           {filteredApostas.length > 0 && (
//             <>
//               <Button
//                 variant="outline"
//                 onClick={handleSelectAll}
//                 className="flex items-center gap-2"
//               >
//                 <CheckSquare className="h-4 w-4" />
//                 {selectedBets.length === filteredApostas.length ? "Desmarcar Todas" : "Selecionar Todas"}
//               </Button>
              
//               {selectedBets.length > 0 && (
//                 <>
//                   <Select onValueChange={(value) => handleBulkStatusChange(Number(value))}>
//                     <SelectTrigger className="w-40">
//                       <SelectValue placeholder="Alterar Status" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value={String(ResultIdEnum.PENDING)}>Pendente</SelectItem>
//                       <SelectItem value={String(ResultIdEnum.WON)}>Ganha</SelectItem>
//                       <SelectItem value={String(ResultIdEnum.LOST)}>Perdida</SelectItem>
//                       <SelectItem value={String(ResultIdEnum.CANCELED)}>Cancelada</SelectItem>
//                     </SelectContent>
//                   </Select>
                  
//                   <Button
//                     variant="destructive"
//                     onClick={handleDeleteSelected}
//                     className="flex items-center gap-2"
//                   >
//                     <Trash2 className="h-4 w-4" />
//                     Excluir ({selectedBets.length})
//                   </Button>
//                 </>
//               )}
//             </>
//           )}
//         </div>

//         <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
//           <DialogTrigger asChild>
//             <Button className="flex items-center gap-2">
//               <Plus className="h-4 w-4" />
//               Nova Aposta
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Criar Nova Aposta</DialogTitle>
//             </DialogHeader>
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label>Jogo *</Label>
//                 <Input
//                   placeholder="Ex: Palmeiras vs Flamengo"
//                   value={formData.game}
//                   onChange={(e) => setFormData(prev => ({ ...prev, game: e.target.value }))}
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <Label>Esporte</Label>
//                 <Input
//                   placeholder="Ex: futebol"
//                   value={formData.sport}
//                   onChange={(e) => setFormData(prev => ({ ...prev, sport: e.target.value }))}
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <Label>Mercado *</Label>
//                 <Input
//                   placeholder="Ex: Vitória do Palmeiras"
//                   value={formData.market}
//                   onChange={(e) => setFormData(prev => ({ ...prev, market: e.target.value }))}
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <Label>Casa *</Label>
//                 <Select value={formData.houseId} onValueChange={(value) => setFormData(prev => ({ ...prev, houseId: value }))}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Selecione a casa" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {casas.map(casa => (
//                       <SelectItem key={casa.houseId || Math.random()} value={(casa.houseId || 0).toString()}>
//                         {casa.houseName || 'Casa sem nome'}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
              
//               <div className="space-y-2">
//                 <Label>Stake (R$) *</Label>
//                 <Input
//                   type="number"
//                   step="0.01"
//                   placeholder="100.00"
//                   value={formData.stake}
//                   onChange={(e) => setFormData(prev => ({ ...prev, stake: e.target.value }))}
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <Label>Odd *</Label>
//                 <Input
//                   type="number"
//                   step="0.01"
//                   placeholder="2.50"
//                   value={formData.odd}
//                   onChange={(e) => setFormData(prev => ({ ...prev, odd: e.target.value }))}
//                 />
//               </div>
//             </div>
            
//             <div className="flex justify-end gap-2 mt-4">
//               <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
//                 Cancelar
//               </Button>
//               <Button onClick={handleCreateAposta}>
//                 Criar Aposta
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Filtros */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Filtros</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
//               <Input
//                 placeholder="Buscar apostas..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
            
//             <Select value={statusFilter} onValueChange={setStatusFilter}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Status" />
//               </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">Todos</SelectItem>
//                   <SelectItem value={String(ResultIdEnum.PENDING)}>Pendente</SelectItem>
//                   <SelectItem value={String(ResultIdEnum.WON)}>Ganha</SelectItem>
//                   <SelectItem value={String(ResultIdEnum.LOST)}>Perdida</SelectItem>
//                   <SelectItem value={String(ResultIdEnum.CANCELED)}>Cancelada</SelectItem>
//                 </SelectContent>
//             </Select>
            
//             <Select value={houseFilter} onValueChange={setHouseFilter}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Casa" />
//               </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">Todas</SelectItem>
//                   {casas.map(casa => (
//                     <SelectItem key={casa.houseId || Math.random()} value={(casa.houseId || 0).toString()}>
//                       {casa.houseName || 'Casa sem nome'}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//             </Select>
            
//             <Button variant="outline" onClick={() => {
//               setSearchTerm("");
//               setStatusFilter("");
//               setHouseFilter("");
//             }}>
//               Limpar
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Tabela de apostas */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Apostas ({filteredApostas.length})</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead className="w-12">
//                   <Checkbox 
//                     checked={selectedBets.length === filteredApostas.length}
//                     onCheckedChange={handleSelectAll}
//                   />
//                 </TableHead>
//                 <TableHead>Jogo</TableHead>
//                 <TableHead>Esporte</TableHead>
//                 <TableHead>Mercado</TableHead>
//                 <TableHead>Stake</TableHead>
//                 <TableHead>Odd</TableHead>
//                 <TableHead>Casa</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Lucro</TableHead>
//                 <TableHead>Data</TableHead>
//                 <TableHead className="w-24">Ações</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredApostas.map((aposta) => (
//                 <TableRow key={aposta.id}>
//                   <TableCell>
//                     <Checkbox 
//                       checked={selectedBets.includes(aposta.id)}
//                       onCheckedChange={() => handleSelectBet(aposta.id)}
//                     />
//                   </TableCell>
//                   <TableCell className="font-medium">{aposta.game}</TableCell>
//                   <TableCell>{aposta.sport}</TableCell>
//                   <TableCell>{aposta.market}</TableCell>
//                   <TableCell>R$ {Number(aposta.stake ?? 0).toFixed(2)}</TableCell>
//                   <TableCell>{Number(aposta.odd ?? 0).toFixed(2)}</TableCell>
//                   <TableCell>{aposta.houseName || casasMap.get(aposta.houseId) || `#${aposta.houseId}`}</TableCell>
//                   <TableCell>
//                     <Select
//                       value={String(aposta.resultId)}
//                       onValueChange={(value) => handleStatusChange(aposta.id, Number(value))}
//                     >
//                       <SelectTrigger className="w-28 h-8">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value={String(ResultIdEnum.PENDING)}>Pendente</SelectItem>
//                         <SelectItem value={String(ResultIdEnum.WON)}>Ganha</SelectItem>
//                         <SelectItem value={String(ResultIdEnum.LOST)}>Perdida</SelectItem>  
//                         <SelectItem value={String(ResultIdEnum.CANCELED)}>Cancelada</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </TableCell>
//                   <TableCell>
//                     <span className={cn(
//                       "font-medium",
//                       Number(aposta.profit ?? 0) > 0 ? "text-success" : 
//                       Number(aposta.profit ?? 0) < 0 ? "text-destructive" : "text-muted-foreground"
//                     )}>
//                       R$ {Number(aposta.profit ?? 0).toFixed(2)}
//                     </span>
//                   </TableCell>
//                   <TableCell>
//                     {aposta.betTime ? new Date(aposta.betTime).toLocaleDateString('pt-BR') : "-"}
//                   </TableCell>
//                   <TableCell>
//                     <div className="flex gap-1">
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleEditAposta(aposta)}
//                       >
//                         <Edit2 className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={async () => {
//                           try {
//                             setLoading(true);
//                             await deleteBetRoute(aposta.id);
//                             setApostas(prev => prev.filter(a => a.id !== aposta.id));
//                           } finally { setLoading(false); }
//                         }}
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>

//       {/* Modal de edição */}
//       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Editar Aposta</DialogTitle>
//           </DialogHeader>
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label>Jogo *</Label>
//               <Input
//                 value={formData.game}
//                 onChange={(e) => setFormData(prev => ({ ...prev, game: e.target.value }))}
//               />
//             </div>
            
//             <div className="space-y-2">
//               <Label>Esporte</Label>
//               <Input
//                 value={formData.sport}
//                 onChange={(e) => setFormData(prev => ({ ...prev, sport: e.target.value }))}
//               />
//             </div>
            
//             <div className="space-y-2">
//               <Label>Mercado *</Label>
//               <Input
//                 value={formData.market}
//                 onChange={(e) => setFormData(prev => ({ ...prev, market: e.target.value }))}
//               />
//             </div>
            
//             <div className="space-y-2">
//               <Label>Casa *</Label>
//               <Select value={formData.houseId} onValueChange={(value) => setFormData(prev => ({ ...prev, houseId: value }))}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {casas.map(casa => (
//                     <SelectItem key={casa.houseId || Math.random()} value={(casa.houseId || 0).toString()}>
//                       {casa.houseName || 'Casa sem nome'}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
            
//             <div className="space-y-2">
//               <Label>Stake (R$) *</Label>
//               <Input
//                 type="number"
//                 step="0.01"
//                 value={formData.stake}
//                 onChange={(e) => setFormData(prev => ({ ...prev, stake: e.target.value }))}
//               />
//             </div>
            
//             <div className="space-y-2">
//               <Label>Odd *</Label>
//               <Input
//                 type="number"
//                 step="0.01"
//                 value={formData.odd}
//                 onChange={(e) => setFormData(prev => ({ ...prev, odd: e.target.value }))}
//               />
//             </div>
//           </div>
          
//           <div className="flex justify-end gap-2 mt-4">
//             <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
//               Cancelar
//             </Button>
//             <Button onClick={handleUpdateAposta}>
//               Salvar Alterações
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// export function ApostasPage() {
//   return (
//     <MainLayout title="Gestão de Apostas">
//       <ApostasPageContent />
//     </MainLayout>
//   );
// }