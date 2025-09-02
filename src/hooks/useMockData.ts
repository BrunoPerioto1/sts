import { useState, useEffect } from 'react';

// Types
export interface Aposta {
  id: number;
  game: string;
  sport: string;
  market: string;
  stake: number;
  odd: number;
  casa_nome: string;
  house_id: number;
  result_id: number;
  lucro_calculado: number;
  bet_time: string;
  created_at: string;
}

export interface Casa {
  id: number;
  name: string;
  active: boolean;
  house_balance: number;
  real_house_balance: number;
  total_bets: number;
  total_deposits: number;
  total_withdrawals: number;
  total_adjustments: number;
}

export interface Transaction {
  id: number;
  house_id: number;
  casa_nome: string;
  transaction_type_id: number;
  transaction_type_name: string;
  valor: number;
  descricao: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalApostas: number;
  apostasGanhas: number;
  totalInvestido: number;
  totalRetorno: number;
  lucroTotal: number;
  roi: number;
  taxaAcerto: number;
}

// Mock data
const mockApostas: Aposta[] = [
  {
    id: 1,
    game: "Palmeiras vs Flamengo",
    sport: "futebol",
    market: "Vitória do Palmeiras",
    stake: 100,
    odd: 2.5,
    casa_nome: "Bet365",
    house_id: 1,
    result_id: 1, // ganhou
    lucro_calculado: 150,
    bet_time: "2024-01-15 14:30:00",
    created_at: "2024-01-15T14:30:00Z"
  },
  {
    id: 2,
    game: "Corinthians vs São Paulo",
    sport: "futebol", 
    market: "Over 2.5 gols",
    stake: 50,
    odd: 1.8,
    casa_nome: "Betfair",
    house_id: 2,
    result_id: 2, // perdeu
    lucro_calculado: -50,
    bet_time: "2024-01-16 16:00:00",
    created_at: "2024-01-16T16:00:00Z"
  },
  {
    id: 3,
    game: "Santos vs Vasco",
    sport: "futebol",
    market: "Ambas marcam",
    stake: 75,
    odd: 1.9,
    casa_nome: "Betano",
    house_id: 3,
    result_id: 9, // pendente
    lucro_calculado: 0,
    bet_time: "2024-01-17 20:00:00", 
    created_at: "2024-01-17T20:00:00Z"
  }
];

const mockCasas: Casa[] = [
  {
    id: 1,
    name: "Bet365",
    active: true,
    house_balance: 1500,
    real_house_balance: 1200,
    total_bets: 10,
    total_deposits: 2000,
    total_withdrawals: 300,
    total_adjustments: 0
  },
  {
    id: 2, 
    name: "Betfair",
    active: true,
    house_balance: 800,
    real_house_balance: 950,
    total_bets: 5,
    total_deposits: 1000,
    total_withdrawals: 200,
    total_adjustments: 50
  },
  {
    id: 3,
    name: "Betano", 
    active: true,
    house_balance: 600,
    real_house_balance: 575,
    total_bets: 8,
    total_deposits: 800,
    total_withdrawals: 0,
    total_adjustments: -25
  }
];

const mockTransactions: Transaction[] = [
  {
    id: 1,
    house_id: 1,
    casa_nome: "Bet365",
    transaction_type_id: 1,
    transaction_type_name: "Depósito",
    valor: 1000,
    descricao: "Depósito inicial",
    created_at: "2024-01-10T10:00:00Z"
  },
  {
    id: 2,
    house_id: 1,
    casa_nome: "Bet365", 
    transaction_type_id: 2,
    transaction_type_name: "Saque",
    valor: -300,
    descricao: "Saque de lucros",
    created_at: "2024-01-20T14:00:00Z"
  },
  {
    id: 3,
    house_id: 2,
    casa_nome: "Betfair",
    transaction_type_id: 1,
    transaction_type_name: "Depósito",
    valor: 500,
    descricao: "Recarga da conta",
    created_at: "2024-01-12T16:30:00Z"
  }
];

// Custom hooks
export function useMockApostas() {
  const [apostas, setApostas] = useState<Aposta[]>(mockApostas);
  const [loading, setLoading] = useState(false);

  const createAposta = (data: Partial<Aposta>) => {
    const newAposta: Aposta = {
      id: Math.max(...apostas.map(a => a.id)) + 1,
      game: data.game || '',
      sport: data.sport || 'futebol',
      market: data.market || '',
      stake: data.stake || 0,
      odd: data.odd || 0,
      casa_nome: data.casa_nome || '',
      house_id: data.house_id || 0,
      result_id: 9, // pendente
      lucro_calculado: 0,
      bet_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      created_at: new Date().toISOString()
    };
    setApostas(prev => [newAposta, ...prev]);
    return newAposta;
  };

  const updateAposta = (id: number, data: Partial<Aposta>) => {
    setApostas(prev => prev.map(aposta => 
      aposta.id === id ? { ...aposta, ...data } : aposta
    ));
  };

  const deleteAposta = (id: number) => {
    setApostas(prev => prev.filter(aposta => aposta.id !== id));
  };

  const deleteMultiple = (ids: number[]) => {
    setApostas(prev => prev.filter(aposta => !ids.includes(aposta.id)));
  };

  const finalizeMultiple = (ids: number[], resultId: number) => {
    setApostas(prev => prev.map(aposta => {
      if (ids.includes(aposta.id)) {
        const lucro = resultId === 1 ? (aposta.stake * aposta.odd) - aposta.stake : 
                     resultId === 2 ? -aposta.stake : 0;
        return { ...aposta, result_id: resultId, lucro_calculado: lucro };
      }
      return aposta;
    }));
  };

  return {
    apostas,
    loading,
    createAposta,
    updateAposta, 
    deleteAposta,
    deleteMultiple,
    finalizeMultiple
  };
}

export function useMockCasas() {
  const [casas, setCasas] = useState<Casa[]>(mockCasas);
  const [loading, setLoading] = useState(false);

  const createCasa = (data: { name: string; active?: boolean }) => {
    const newCasa: Casa = {
      id: Math.max(...casas.map(c => c.id)) + 1,
      name: data.name,
      active: data.active ?? true,
      house_balance: 0,
      real_house_balance: 0,
      total_bets: 0,
      total_deposits: 0,
      total_withdrawals: 0,
      total_adjustments: 0
    };
    setCasas(prev => [...prev, newCasa]);
    return newCasa;
  };

  const updateCasa = (id: number, data: Partial<Casa>) => {
    setCasas(prev => prev.map(casa => 
      casa.id === id ? { ...casa, ...data } : casa
    ));
  };

  const deleteCasa = (id: number) => {
    setCasas(prev => prev.filter(casa => casa.id !== id));
  };

  return {
    casas,
    loading,
    createCasa,
    updateCasa,
    deleteCasa
  };
}

export function useMockTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [loading, setLoading] = useState(false);

  const createTransaction = (data: {
    house_id: number;
    transaction_type_id: number;
    valor: number;
    descricao: string;
  }) => {
    const casa = mockCasas.find(c => c.id === data.house_id);
    const typeNames = { 1: "Depósito", 2: "Saque", 3: "Ajuste" };
    
    const newTransaction: Transaction = {
      id: Math.max(...transactions.map(t => t.id)) + 1,
      house_id: data.house_id,
      casa_nome: casa?.name || '',
      transaction_type_id: data.transaction_type_id,
      transaction_type_name: typeNames[data.transaction_type_id as keyof typeof typeNames] || '',
      valor: data.valor,
      descricao: data.descricao,
      created_at: new Date().toISOString()
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  };

  return {
    transactions,
    loading,
    createTransaction
  };
}

export function useMockDashboard() {
  const [loading, setLoading] = useState(false);

  const getMetrics = (filters?: { house_id?: number; startDate?: string; endDate?: string }): DashboardMetrics => {
    let filteredApostas = mockApostas;
    
    if (filters?.house_id) {
      filteredApostas = filteredApostas.filter(a => a.house_id === filters.house_id);
    }
    
    if (filters?.startDate) {
      filteredApostas = filteredApostas.filter(a => a.bet_time >= filters.startDate!);
    }
    
    if (filters?.endDate) {
      filteredApostas = filteredApostas.filter(a => a.bet_time <= filters.endDate!);
    }

    const totalApostas = filteredApostas.length;
    const apostasGanhas = filteredApostas.filter(a => a.result_id === 1).length;
    const apostasFinalizadas = filteredApostas.filter(a => a.result_id !== 9);
    const totalInvestido = apostasFinalizadas.reduce((acc, a) => acc + a.stake, 0);
    const totalRetorno = filteredApostas.filter(a => a.result_id === 1).reduce((acc, a) => acc + (a.stake * a.odd), 0);
    const lucroTotal = totalRetorno - totalInvestido;
    const roi = totalInvestido > 0 ? (lucroTotal / totalInvestido) * 100 : 0;
    const taxaAcerto = apostasFinalizadas.length > 0 ? (apostasGanhas / apostasFinalizadas.length) * 100 : 0;

    return {
      totalApostas,
      apostasGanhas,
      totalInvestido,
      totalRetorno,
      lucroTotal,
      roi,
      taxaAcerto
    };
  };

  const getChartData = () => {
    const metrics = getMetrics();
    return [
      { date: "Investido", value: metrics.totalInvestido },
      { date: "Retorno", value: metrics.totalRetorno },
      { date: "Lucro", value: metrics.lucroTotal }
    ];
  };

  const getDailySummary = () => {
    // Simular dados diários
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        apostas: Math.floor(Math.random() * 5),
        lucro: (Math.random() - 0.5) * 200
      };
    }).reverse();
  };

  return {
    loading,
    getMetrics,
    getChartData,
    getDailySummary
  };
}