import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Compass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Continuava sendo o 404 do template: fundo claro (`bg-gray-100`) num app
 * escuro e texto em inglês. Agora usa o mesmo vazio das outras telas.
 */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <EmptyState
        bare
        icon={<Compass size={34} />}
        title="Página não encontrada"
        description="O endereço acessado não existe ou foi movido."
        action={<Button asChild><Link to="/dashboard">Ir para o dashboard</Link></Button>}
      />
    </div>
  );
};

export default NotFound;
