import { Check } from "lucide-react";
import { Buildings } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList, CommandEmpty, CommandInput } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface HouseOption {
  id: number;
  name: string;
}

interface HouseMultiSelectProps {
  options: HouseOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
}

export function HouseMultiSelect({ options, selected, onChange }: HouseMultiSelectProps) {
  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]);
  };

  const label = selected.length === 0 ? "Todas as casas" : `${selected.length} casa${selected.length > 1 ? "s" : ""} selecionada${selected.length > 1 ? "s" : ""}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-full sm:w-auto border-input bg-card text-foreground hover:border-foreground/45 hover:bg-card"
        >
          <Buildings size={14} className="opacity-60" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Buscar casa..." className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhuma casa encontrada.</CommandEmpty>
            <CommandGroup>
              {selected.length > 0 && (
                <CommandItem onSelect={() => onChange([])} className="text-accent">
                  Limpar seleção
                </CommandItem>
              )}
              {options.map((house) => {
                const isSelected = selected.includes(house.id);
                return (
                  <CommandItem key={house.id} onSelect={() => toggle(house.id)} className="gap-2">
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-accent",
                        isSelected && "bg-accent"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </span>
                    {house.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
