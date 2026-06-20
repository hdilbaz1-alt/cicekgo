'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface CtxItem { label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }

export default function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: CtxItem[]; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const h = () => onClose();
    window.addEventListener('click', h);
    window.addEventListener('scroll', h, true);
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('click', h); window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); };
  }, [onClose]);
  if (!mounted) return null;

  const W = 220;
  const left = Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 1000) - W - 8);
  const top = Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 800) - (items.length * 44 + 16));

  return createPortal(
    <div className="fixed z-[200] bg-white rounded-2xl shadow-2xl border border-slate-100 py-1.5" style={{ top: Math.max(8, top), left: Math.max(8, left), minWidth: W }} onClick={(e) => e.stopPropagation()}>
      {items.map((it, i) => (
        <button key={i} onClick={() => { it.onClick(); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-slate-50 ${it.danger ? 'text-red-600' : 'text-slate-700'}`}>
          {it.icon}{it.label}
        </button>
      ))}
    </div>,
    document.body
  );
}
