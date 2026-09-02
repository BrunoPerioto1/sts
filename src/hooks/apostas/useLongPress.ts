import { useCallback, useRef } from "react";

// Long-press pra mobile: dispara só se o dedo não se mover (senão qualquer
// scroll na lista contaria como toque longo).
export function useLongPress(onLongPress: () => void, delay = 400) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moved = useRef(false);

  const start = useCallback(() => {
    moved.current = false;
    timer.current = setTimeout(() => {
      if (!moved.current) onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const onMove = useCallback(() => {
    moved.current = true;
    cancel();
  }, [cancel]);

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: onMove,
    onTouchCancel: cancel,
  };
}
