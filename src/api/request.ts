import type { AxiosResponse } from "axios";

/**
 * Endpoints de escrita rewrapam o erro do axios numa Error simples — quem
 * chama trata por `e.message`. Era um try/catch idêntico copiado em cada
 * função; agora é um só.
 */
export async function unwrap<T>(call: Promise<AxiosResponse<T>>): Promise<T> {
  try {
    return (await call).data;
  } catch (e) {
    throw new Error(`${(e as Error)?.message || e}`);
  }
}
