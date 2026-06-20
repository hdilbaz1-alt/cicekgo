import { useEffect } from 'react';

/** Esc tuşuna basıldığında onClose çağırır. active=false ise dinlemez. */
export function useEscClose(onClose: () => void, active: boolean = true) {
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose, active]);
}
