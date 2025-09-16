import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HousesSearchProps {
  searchTerm: string;
  onChange: (val: string) => void;
}

export function HousesSearch({ searchTerm, onChange }: HousesSearchProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Buscar</span>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar casa de apostas..."
          value={searchTerm}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 bg-background"
        />
      </div>
    </div>
  );
}
