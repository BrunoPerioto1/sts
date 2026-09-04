/**
 * Vibracao curta no toque. Existe no Android/Chrome; no iOS Safari a API nao
 * existe e a chamada vira no-op — por isso o guard, nao por feature policy.
 */
export function tapHaptic(pattern: number | number[] = 8) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}
