import { useEffect } from 'react';

// Açık modal sayısı: ilk modalda body kilitlenir, sonuncusu kapanınca açılır.
let escLockCount = 0;
let escPrevOverflow = '';

/**
 * Esc tuşuna basıldığında onClose çağırır + modal açıkken body scroll'unu kilitler
 * (mobilde arka planın kayması / "modal sıkışması" sorununu çözer). active=false ise pasiftir.
 */
export function useEscClose(onClose: () => void, active: boolean = true) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;

    // Body scroll kilidi (sayım bazlı, iç içe modal güvenli)
    if (escLockCount === 0) {
      escPrevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    escLockCount++;

    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);

    return () => {
      document.removeEventListener('keydown', h);
      escLockCount = Math.max(0, escLockCount - 1);
      if (escLockCount === 0) document.body.style.overflow = escPrevOverflow;
    };
  }, [onClose, active]);
}
