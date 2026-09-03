import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Motor de empilhamento/posicionamento/swipe/timers do sonner reaproveitado
// pelo sistema de action-toast (src/lib/action-toast.tsx) — o conteúdo visual
// de cada toast é 100% custom via toast.custom(), então aqui só configuramos
// unstyled + layout. Ver index.css para o ajuste fino de opacidade da pilha.
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const isMobile = useIsMobile()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      visibleToasts={isMobile ? 1 : 3}
      gap={10}
      offset={24}
      mobileOffset={{ bottom: 88, left: 16, right: 16 }}
      toastOptions={{ unstyled: true }}
      {...props}
    />
  )
}

export { Toaster, toast }
