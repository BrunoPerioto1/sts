import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Segmented } from "@/components/ui/segmented";

const OPTIONS = [
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "light", label: "Claro", icon: Sun },
  { value: "system", label: "Sistema", icon: Desktop },
] as const;

// Três botões e não um select: são poucas opções e a troca é imediata, sem
// "Salvar" — o next-themes guarda a escolha no localStorage deste aparelho.
export function ThemeSelect({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <Segmented
      label="Tema"
      className={className}
      value={(theme ?? "dark") as (typeof OPTIONS)[number]["value"]}
      options={OPTIONS}
      onChange={setTheme}
    />
  );
}
