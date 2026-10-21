import { useEffect, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { Logo } from "@/components/brand/Logo";
import { LEGAL_INFO } from "@/components/legal/legal-info";
import { PrivacyContent } from "@/components/legal/PrivacyContent";
import { TermsContent } from "@/components/legal/TermsContent";

const DOCS: Record<LegalDoc, { title: string; Content: ComponentType; other: LegalDoc }> = {
  termos: { title: "Termos de uso", Content: TermsContent, other: "privacidade" },
  privacidade: { title: "Política de privacidade", Content: PrivacyContent, other: "termos" },
};

export type LegalDoc = "termos" | "privacidade";

/**
 * Termos de uso e Política de privacidade (links do rodapé da landing). O
 * texto mora em components/legal; quem responde por ele, em legal-info.ts.
 * Escura como a landing, venha a pessoa de qual tema vier.
 */
export default function LegalPage({ doc }: { doc: LegalDoc }) {
  const { title, Content, other } = DOCS[doc];

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} - Trackton`;
    // O link de um documento pro outro troca a rota sem recarregar: sem isto, o segundo abriria no meio.
    window.scrollTo(0, 0);
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <div className="dark min-h-dvh bg-background text-foreground">
      <header className="border-b border-foreground/[0.06]">
        <div className="mx-auto flex h-16 w-full max-w-[760px] items-center px-4 sm:h-20 sm:px-6">
          <Link to="/" className="flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Logo size="md" />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[760px] px-4 py-14 sm:px-6 sm:py-20">
        <h1 className="font-display text-[34px] font-bold leading-[1.05] tracking-[-0.025em] [font-stretch:115%] sm:text-[46px]">{title}</h1>
        <p className="mb-10 mt-4 text-[14px] text-zinc-400">Última atualização: {LEGAL_INFO.updatedAt}</p>
        <Content />
        <div className="mt-16 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-foreground/[0.06] pt-6 text-[15px]">
          <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 text-zinc-400 hover:text-foreground">
            <ArrowLeft size={15} aria-hidden />
            Voltar para o início
          </Link>
          <Link to={`/${other}`} className="inline-flex min-h-11 items-center text-zinc-400 hover:text-foreground">
            {DOCS[other].title}
          </Link>
        </div>
      </main>
    </div>
  );
}
