import { useEffect, useState } from "react";

/**
 * Altura ocupada pelo teclado virtual, em px (0 quando fechado).
 *
 * No iOS o teclado NÃO encolhe o layout viewport — só o visual viewport. Como
 * `dvh` e `position: fixed; bottom: 0` se resolvem pelo layout viewport, um
 * bottom sheet fica ancorado atrás do teclado: o campo em foco e o resultado
 * da busca somem embaixo dele. A diferença entre os dois viewports é
 * justamente a altura do teclado.
 *
 * No Android o Chrome já encolhe o layout viewport por padrão, então a conta
 * dá ~0 e nada muda. No desktop os dois viewports são iguais, idem.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // offsetTop entra na conta porque o iOS desloca o visual viewport quando
      // rola a página com o teclado aberto.
      const hidden = window.innerHeight - vv.height - vv.offsetTop;
      // Abaixo de ~80px é ruído (barra de endereço encolhendo, safe area), não teclado.
      setInset(hidden > 80 ? Math.round(hidden) : 0);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
