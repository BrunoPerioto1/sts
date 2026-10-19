import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LockKey } from "@phosphor-icons/react";
import type { ProFeature } from "@/api/routes/get-me";
import { actionToast } from "@/lib/action-toast";
import { ME_KEY, useMe } from "./use-me";

/**
 * Plano da conta, lido do /users/me. Sem `plan` na resposta (me ainda
 * carregando, ou API de antes dos planos) tudo conta como liberado: quem
 * barra de verdade é o backend, a tela só evita oferecer o que daria 403.
 */
export function usePlan() {
  const { me } = useMe();
  const plan = me?.plan ?? null;
  return {
    plan,
    loaded: !!me,
    isPro: plan ? plan.plan === "pro" : true,
    can: (feature: ProFeature) => (plan ? plan.features[feature] : true),
  };
}

/** Releitura do /me depois de uma leitura por IA: o "3 de 5 hoje" anda junto. */
export function useRefreshPlan() {
  const qc = useQueryClient();
  return useCallback(() => void qc.invalidateQueries({ queryKey: ME_KEY }), [qc]);
}

/**
 * Porta dos recursos do Pro. Devolve true quando pode seguir; no Grátis,
 * avisa com um atalho pra página Plano e devolve false.
 */
export function useProGate() {
  const navigate = useNavigate();
  const { can } = usePlan();
  return useCallback(
    (feature: ProFeature, label: string) => {
      if (can(feature)) return true;
      actionToast.success({
        icon: LockKey,
        title: `${label} é do plano Pro`,
        description: "Assine pra liberar.",
        action: { label: "Ver planos", onClick: () => navigate("/plano") },
        duration: 4500,
      });
      return false;
    },
    [can, navigate],
  );
}
