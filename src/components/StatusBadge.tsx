'use client';

import { useEffect, useState } from 'react';
import { statusColor, loadStatusColorMap } from '@/lib/statusColors';

/**
 * Sipariş durumu rozeti. Ayarlar'da o duruma özel renk seçildiyse onu kullanır,
 * yoksa anlamsal (anahtar kelime) renge düşer.
 */
export default function StatusBadge({ status, className = '' }: { status?: string | null; className?: string }) {
  const [color, setColor] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadStatusColorMap().then((m) => { if (alive) setColor((status && m[status]) || null); });
    return () => { alive = false; };
  }, [status]);

  const base = `inline-block px-2.5 py-1 rounded-full text-xs font-medium ${className}`;
  if (color) return <span className={base} style={{ backgroundColor: color + '22', color }}>{status || '—'}</span>;
  return <span className={`${base} ${statusColor(status)}`}>{status || '—'}</span>;
}
