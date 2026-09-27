import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from "@phosphor-icons/react";
import type { HouseBalanceDto } from "@/api/routes/get-houses";
import { createTransaction, getTransactionTypes, type TransactionTypeDto } from "@/api/routes/get-transaction";

export type MovimentacaoType = "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT";

export const MOVIMENTACAO_META: Record<string, { label: string; icon: typeof ArrowDownLeft; submitLabel: string }> = {
  DEPOSIT: { label: "Depósito", icon: ArrowDownLeft, submitLabel: "Adicionar depósito" },
  WITHDRAWAL: { label: "Saque", icon: ArrowUpRight, submitLabel: "Registrar saque" },
  ADJUSTMENT: { label: "Saldo real", icon: SlidersHorizontal, submitLabel: "Ajustar saldo" },
};

// Ordem fixa: a API devolve ADJUSTMENT primeiro e o modal abria com
// "Saldo real" marcado. Deposito e o caso comum, entao vem na frente.
const ORDER: MovimentacaoType[] = ["DEPOSIT", "WITHDRAWAL", "ADJUSTMENT"];

// Estado e regra da "Nova movimentação", comum ao diálogo (desktop) e ao sheet
// (mobile). `house` null = fechado; cada abertura recarrega os tipos e zera o valor.
export function useNovaMovimentacao(house: HouseBalanceDto | null, initialType?: MovimentacaoType) {
  const [types, setTypes] = useState<TransactionTypeDto[]>([]);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [cents, setCentsState] = useState(0);
  const [typed, setTyped] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pelo id, não pelo objeto: um refetch da lista de casas com o formulário
  // aberto não pode zerar o que já foi digitado.
  const houseId = house?.houseId;
  useEffect(() => {
    if (houseId == null) return;
    setCentsState(0);
    setTyped(false);
    getTransactionTypes()
      .then((txTypes) => {
        const sorted = [...txTypes].sort(
          (a, b) => ORDER.indexOf(a.name as MovimentacaoType) - ORDER.indexOf(b.name as MovimentacaoType),
        );
        setTypes(sorted);
        setTypeId((sorted.find((t) => t.name === initialType) ?? sorted[0])?.id ?? null);
      })
      .catch(() => undefined);
  }, [houseId, initialType]);

  const selectedType = types.find((t) => t.id === typeId);
  const isAdjust = selectedType?.name === "ADJUSTMENT";
  const amount = cents / 100;
  // `houseBalance` vem clampado em zero pelo backend; o saldo "real" não, e é
  // ele que projeta certo o saldo de casa no vermelho.
  const balance = Number(house?.realHouseBalance ?? 0);
  // A casa mostra o saldo ja' sem o stake das apostas em aberto; aqui a
  // pendente ainda conta como saldo (lucro null). Comparar com o saldo cheio
  // gravava um ajuste negativo do tamanho das pendentes, que ficava pra sempre
  // depois que elas liquidavam.
  const openStake = Number(house?.openStake ?? 0);
  const available = balance - openStake;
  // "Saldo real": o valor digitado e' o saldo que a casa mostra; grava so' a
  // diferenca como ajuste. Fecha casa no vermelho por deposito nunca lancado.
  const diff = Math.round(cents - available * 100) / 100;
  const valid = typeId !== null && (isAdjust ? typed && diff !== 0 : cents > 0);

  // Valor digitado "de trás pra frente" (centavos primeiro); campo vazio volta
  // a mostrar o placeholder.
  const onInputChange = (raw: string) => {
    setTyped(raw !== "");
    setCentsState(Number(raw.replace(/\D/g, "")) || 0);
  };

  const setCents = (update: number | ((c: number) => number)) => {
    setTyped(true);
    setCentsState(update);
  };

  // Devolve true quando gravou, pra quem chamou fechar.
  const submit = async (): Promise<boolean> => {
    if (!house || typeId === null || !valid) return false;
    setLoading(true);
    try {
      await createTransaction({
        houseId: house.houseId,
        transactionTypeId: typeId,
        value: isAdjust ? diff : amount,
      });
      return true;
    } finally {
      setLoading(false);
    }
  };

  return {
    types,
    typeId,
    setTypeId,
    selectedType,
    isAdjust,
    cents,
    typed,
    amount,
    balance,
    openStake,
    available,
    diff,
    valid,
    loading,
    onInputChange,
    setCents,
    submit,
  };
}
