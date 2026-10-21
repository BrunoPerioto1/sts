/**
 * Quem responde pelo Trackton nos Termos de Uso e na Política de Privacidade.
 * A PREENCHER pelo dono: enquanto um campo for null, as páginas mostram o
 * buraco marcado em amarelo ("[CPF ou CNPJ]"), pra não ir pro ar sem ninguém ver.
 */
export const LEGAL_INFO = {
  /** Nome completo (pessoa física) ou razão social (empresa). */
  owner: "Bruno ZP" as string | null,
  /**
   * CPF ou CNPJ de quem está em `owner`. Fica de fora de propósito por enquanto
   * (o dono não quer expor o CPF, 2026-10-21): null some do texto em vez de
   * virar buraco amarelo. Com um CNPJ (MEI), é só pôr aqui.
   */
  document: null as string | null,
  /** E-mail de suporte, privacidade (encarregado da LGPD) e pedidos de reembolso. */
  email: "betbp25@gmail.com" as string | null,
  /** Data da versão em vigor dos dois documentos. Atualize a cada mudança no texto. */
  updatedAt: "21 de outubro de 2026",
};
