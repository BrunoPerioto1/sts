import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "positive" | "negative" | "neutral";
  className?: string;
}

export function MetricCard({ title, value, icon, trend = "neutral", className }: MetricCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className={cn(
              "text-3xl font-bold mt-2",
              trend === "positive" && "text-success",
              trend === "negative" && "text-destructive",
              trend === "neutral" && "text-foreground"
            )}>
              {value}
            </p>
          </div>
          {icon && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}