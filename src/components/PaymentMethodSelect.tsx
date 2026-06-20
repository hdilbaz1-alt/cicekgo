'use client';

import { useEffect } from 'react';
import { paymentMethodService, PaymentMethodDto } from '@/services/paymentMethodService';

let _cache: PaymentMethodDto[] | null = null;
let _inflight: Promise<PaymentMethodDto[]> | null = null;

/** Aktif ödeme yöntemlerini (önbellekli) getirir. */
export async function loadActivePaymentMethods(): Promise<PaymentMethodDto[]> {
  if (_cache) return _cache.filter((m) => m.isActive);
  if (!_inflight) _inflight = paymentMethodService.list().then((l) => { _cache = l; _inflight = null; return l; });
  const all = await _inflight;
  return all.filter((m) => m.isActive);
}
export function clearPaymentMethodCache() { _cache = null; }

/**
 * Zorunlu ödeme yöntemi seçici. Yöntemler yüklendiğinde value boşsa varsayılanı otomatik seçer.
 */
export default function PaymentMethodSelect({ value, onChange, methods, setMethods, className = '' }: {
  value: number | '';
  onChange: (id: number) => void;
  methods: PaymentMethodDto[];
  setMethods: (m: PaymentMethodDto[]) => void;
  className?: string;
}) {
  useEffect(() => {
    let alive = true;
    if (methods.length === 0) {
      loadActivePaymentMethods().then((l) => {
        if (!alive) return;
        setMethods(l);
        if (value === '') { const def = l.find((m) => m.isDefault) || l[0]; if (def) onChange(def.id); }
      });
    } else if (value === '') {
      const def = methods.find((m) => m.isDefault) || methods[0];
      if (def) onChange(def.id);
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methods]);

  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={className} required>
      {value === '' && <option value="">Seçiniz…</option>}
      {methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
    </select>
  );
}
