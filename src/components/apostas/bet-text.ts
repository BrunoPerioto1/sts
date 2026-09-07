// Nome do evento encolhe conforme o texto cresce pra não estourar duas linhas
// no card/linha da tabela.
export function eventTextClass(text: string) {
  if (text.length > 70) return "text-xs leading-snug";
  if (text.length > 45) return "text-sm leading-snug";
  return "text-sm";
}
