import { Link } from "react-router-dom";
import { LockKey } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Tela inteira que é do Pro, aberta por quem está no Grátis. */
export function ProUpsell({ title, description }: { title: string; description: string }) {
  return (
    <EmptyState
      icon={<LockKey size={34} />}
      title={title}
      description={description}
      action={
        <Button asChild>
          <Link to="/plano">Ver planos</Link>
        </Button>
      }
    />
  );
}
