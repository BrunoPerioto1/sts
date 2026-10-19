import { useLayoutEffect, useRef, useState } from "react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: Icon;
}

type PillBox = { left: number; width: number };

// Poucas opções exclusivas com troca imediata (tema, cor dos resultados):
// todas à vista, a ativa em destaque.
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
  className,
}: {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const pillEl = useRef<HTMLSpanElement>(null);
  // O destaque é uma peça só que desliza até a opção ativa (as "Animated Tabs"
  // do Aceternity). Medido no DOM porque os rótulos têm larguras diferentes.
  const [pill, setPill] = useState<PillBox | null>(null);
  const shown = useRef<PillBox | null>(null);

  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    // `slide` só na troca de opção: sheet abrindo ou tela girando reposiciona
    // sem animar.
    const measure = (slide: boolean) => {
      const active = el.querySelector<HTMLElement>('[aria-checked="true"]');
      const next = active ? { left: active.offsetLeft, width: active.offsetWidth } : null;
      const from = shown.current;
      shown.current = next;
      setPill((prev) => (prev && next && prev.left === next.left && prev.width === next.width ? prev : next));
      if (!slide || !from || !next || !pillEl.current) return;
      if (from.left === next.left && from.width === next.width) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // Web Animations e não `transition`: ao trocar o tema o next-themes
      // desliga toda transition da página (disableTransitionOnChange) e o
      // destaque do seletor de tema pulava em vez de deslizar.
      pillEl.current.animate(
        [
          { transform: `translateX(${from.left}px)`, width: `${from.width}px` },
          { transform: `translateX(${next.left}px)`, width: `${next.width}px` },
        ],
        { duration: 300, easing: getComputedStyle(el).getPropertyValue("--ease-out-soft").trim() || "ease-out" },
      );
    };
    measure(true);
    const observer = new ResizeObserver(() => measure(false));
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, options.length]);

  return (
    <div
      ref={container}
      className={cn("relative inline-flex gap-1 rounded-lg border border-border p-1", className)}
      role="radiogroup"
      aria-label={label}
    >
      {pill && (
        <span
          ref={pillEl}
          aria-hidden
          // Preenchido, sem borda: mesmo jeito de "selecionado" do resto do app.
          className={cn("absolute inset-y-1 left-0 rounded-md bg-zinc-800", disabled && "opacity-50")}
          style={{ width: pill.width, transform: `translateX(${pill.left}px)` }}
        />
      )}
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "press relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors disabled:opacity-50",
              active ? "text-foreground" : "text-zinc-400 hover:text-foreground"
            )}
          >
            {o.icon && <o.icon size={14} />} {o.label}
          </button>
        );
      })}
    </div>
  );
}
