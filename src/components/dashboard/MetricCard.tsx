import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "positive" | "negative" | "neutral";
  subtext?: string;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  icon, 
  trend = "neutral", 
  subtext,
  className 
}: MetricCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="bg-muted/20 py-3 px-4 border-b">
          <div className="flex items-center gap-2">
            {icon && (
              <div className={cn(
                "p-2 rounded-full",
                trend === "positive" && "bg-success/10 text-success",
                trend === "negative" && "bg-destructive/10 text-destructive",
                trend === "neutral" && "bg-primary/10 text-primary"
              )}>
                {icon}
              </div>
            )}
            <p className="text-sm font-medium uppercase tracking-wide">
              {title}
            </p>
          </div>
        </div>
        <div className="p-5">
          <p className={cn(
            "text-3xl font-bold",
            trend === "positive" && "text-success",
            trend === "negative" && "text-destructive",
            trend === "neutral" && "text-foreground"
          )}>
            {value}
          </p>
          {subtext && (
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              {subtext}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}