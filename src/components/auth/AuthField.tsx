import { forwardRef, useState } from "react";
import { CheckCircle, Eye, EyeSlash, WarningCircle } from "@phosphor-icons/react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AuthFieldProps extends Omit<React.ComponentProps<"input">, "className"> {
  label: string;
  // Texto curto à direita do rótulo (força da senha, "Boa"/"Fraca").
  hint?: React.ReactNode;
  error?: string | null;
  valid?: boolean;
}

/**
 * Campo dos formulários de conta, com os quatro estados que a tela precisa:
 *
 * - repouso: borda neutra
 * - foco: borda de acento + anel de 2px
 * - válido: check azul à direita, borda inalterada — o certo não grita
 * - erro: borda vermelha e mensagem escrita; nunca só a cor, senão quem não
 *   distingue vermelho não recebe o aviso
 *
 * Senha ganha o olho de mostrar/ocultar sozinha, por `type="password"`.
 */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, hint, error, valid, id, type, ...props },
  ref
) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && reveal ? "text" : type;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-normal text-zinc-400">
          {label}
        </Label>
        {hint}
      </div>

      <div className="relative">
        <input
          {...props}
          ref={ref}
          id={id}
          type={inputType}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={cn(
            "w-full min-h-[48px] rounded-lg bg-card px-3.5 text-base text-foreground",
            "border transition-colors outline-none",
            "placeholder:text-zinc-600",
            "focus:ring-2 focus:ring-accent/25",
            error ? "border-negative focus:border-negative" : "border-white/[0.14] focus:border-accent",
            (isPassword || valid) && "pr-11"
          )}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-zinc-500 hover:text-zinc-200"
          >
            {reveal ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        ) : (
          valid && (
            <CheckCircle
              size={18}
              weight="fill"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-accent pointer-events-none"
              aria-hidden
            />
          )
        )}
      </div>

      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-negative">
          <WarningCircle size={15} weight="fill" className="shrink-0 mt-[3px]" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});
