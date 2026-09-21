import { AxiosError, type AxiosResponse } from "axios";

/**
 * Endpoints de escrita rewrapam o erro do axios numa Error simples — quem
 * chama trata por `e.message`. Era um try/catch idêntico copiado em cada
 * função; agora é um só.
 *
 * A mensagem do backend vence a do axios: "Request failed with status code
 * 502" não diz nada pra quem está olhando a tela, enquanto o Nest já manda o
 * motivo em `data.message`.
 */
export async function unwrap<T>(call: Promise<AxiosResponse<T>>): Promise<T> {
  try {
    return (await call).data;
  } catch (e) {
    const error = e as AxiosError<{ message?: string | string[] }>;
    if (error.code === "ECONNABORTED")
      throw new Error("O servidor demorou demais para responder. Tente de novo.");
    const message = error.response?.data?.message;
    throw new Error(
      (Array.isArray(message) ? message.join(", ") : message) ||
        error.message ||
        String(e),
    );
  }
}
