'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ value, onCopied, className = '', size = 14 }: {
  value?: string | null; onCopied?: (v: string) => void; className?: string; size?: number;
}) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(value); } catch { /* yoksay */ }
    setDone(true); onCopied?.(value); setTimeout(() => setDone(false), 1200);
  };
  return (
    <button type="button" onClick={copy} title="Kopyala"
      className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors ${done ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'} ${className}`}>
      {done ? <Check style={{ width: size, height: size }} /> : <Copy style={{ width: size, height: size }} />}
    </button>
  );
}
