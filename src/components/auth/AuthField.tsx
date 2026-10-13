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
    <div className="flex flex-col gap-2 lg:gap-[7px]">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-[13.5px] lg:text-[13px] font-medium text-zinc-300">
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
            "w-full h-12 lg:h-10 rounded-[10px] lg:rounded-[8px] bg-card lg:bg-background px-3.5 lg:px-3 text-[15px] lg:text-sm text-foreground",
            "border transition-colors outline-none",
            "placeholder:text-zinc-600",
            "focus:ring-[3px] focus:ring-accent/25",
            error ? "border-danger focus:border-danger" : "border-foreground/10 focus:border-accent",
            (isPassword || valid) && "pr-11"
          )}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-0.5 top-0.5 h-11 w-11 lg:h-9 lg:w-9 rounded-[8px] lg:rounded-[6px] flex items-center justify-center text-zinc-500 hover:text-zinc-300"
          >
            {reveal ? <EyeSlash className="size-[18px] lg:size-4" /> : <Eye className="size-[18px] lg:size-4" />}
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
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-danger">
          <WarningCircle size={15} weight="fill" className="shrink-0 mt-[3px]" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});
