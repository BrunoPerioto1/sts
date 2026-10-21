import type { ReactNode } from "react";
import { LEGAL_INFO } from "./legal-info";

/** Peças de texto dos documentos legais: a mesma tipografia nos dois. */

export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-12" aria-labelledby={`sec-${n}`}>
      <h2 id={`sec-${n}`} className="text-[19px] font-semibold tracking-tight text-foreground">
        {n}. {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[15.5px] leading-[1.75] text-zinc-300">{children}</p>;
}

export function Ul({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2.5 pl-5 text-[15.5px] leading-[1.7] text-zinc-300 marker:text-zinc-500">{children}</ul>;
}

export function B({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

/** Campo de legal-info.ts: o valor, ou o buraco marcado em amarelo enquanto não for preenchido. */
function Fill({ value, label }: { value: string | null; label: string }) {
  if (value) return <>{value}</>;
  return <mark className="rounded bg-warning/15 px-1 font-medium text-warning">[{label}]</mark>;
}

export const Owner = () => <Fill value={LEGAL_INFO.owner} label="nome ou razão social" />;
/** CPF ou CNPJ logo depois do nome, já com a vírgula. Sem ele (escolha do dono), some do texto. */
export const Document = () => (LEGAL_INFO.document ? <>, {LEGAL_INFO.document}</> : null);

export function Email() {
  if (!LEGAL_INFO.email) return <Fill value={null} label="e-mail de contato" />;
  return (
    <a href={`mailto:${LEGAL_INFO.email}`} className="text-accent-text underline-offset-4 hover:underline">
      {LEGAL_INFO.email}
    </a>
  );
}
