import { useEffect, useState } from "react";

export interface KeyboardInset {
  /** Altura ocupada pelo teclado virtual, em px (0 quando fechado). */
  inset: number;
  /** Altura visível acima do teclado, em px (0 quando ele está fechado). */
  viewportHeight: number;
}

const CLOSED: KeyboardInset = { inset: 0, viewportHeight: 0 };

/**
 * Onde o teclado virtual começa, para um bottom sheet `position: fixed`.
 *
 * No iOS o teclado NÃO encolhe o layout viewport — só o visual viewport. Como
 * `dvh` e `bottom: 0` se resolvem pelo layout viewport, um sheet ancorado no
 * fundo fica atrás do teclado. A diferença entre os dois viewports é
 * justamente a altura do teclado (mais a barra de acessório do Safari, que o
 * visual viewport também exclui).
 *
 * A altura do layout viewport é MEDIDA com uma sonda `fixed; top:0; bottom:0`
 * em vez de deduzida de `innerHeight`/`clientHeight`: no iOS esses dois
 * divergem do que o browser de fato usa pra resolver `bottom` (a barra inferior
 * do Safari recolhe junto com o teclado e cada um reage a isso de um jeito), e
 * errar por ~100px deixava o sheet flutuando com uma faixa da página aparecendo
 * embaixo dele. A sonda é a mesma coisa que o sheet: um elemento fixed. O que
 * ela mede é, por definição, o que ele vai obedecer.
 *
 * No Android o Chrome já encolhe o layout viewport, e no desktop os dois
 * viewports são iguais: a conta dá ~0 e nada muda.
 */
export function useKeyboardInset(): KeyboardInset {
  const [state, setState] = useState<KeyboardInset>(CLOSED);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;top:0;bottom:0;left:0;width:0;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);

    const update = () => {
      const layoutHeight = probe.getBoundingClientRect().height;
      // offsetTop entra na conta porque o iOS desloca o visual viewport quando
      // rola a página com o teclado aberto.
      const hidden = layoutHeight - vv.height - vv.offsetTop;
      // Abaixo de ~80px é ruído (barra de endereço encolhendo, safe area), não teclado.
      setState(hidden > 80 ? { inset: Math.round(hidden), viewportHeight: Math.round(vv.height) } : CLOSED);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      probe.remove();
    };
  }, []);

  return state;
}
