'use client';

import { useEffect, useState } from 'react';
import { adminService, UserDto } from '@/services/adminService';
import { orderService, OrderItem } from '@/services/orderService';
import { useEscClose } from '@/lib/useEscClose';
import { Truck, Check, X } from 'lucide-react';

export default function CourierAssignModal({ order, onClose, onAssigned }: { order: OrderItem; onClose: () => void; onAssigned: (m: string) => void }) {
  const [couriers, setCouriers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEscClose(onClose);

  useEffect(() => {
    (async () => {
      try { setCouriers(await adminService.listCouriers()); } catch { setCouriers([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const assign = async (id: number | null) => {
    setBusy(true);
    try {
      await orderService.assignCourier(order.orderCode, id);
      onAssigned(id ? 'Kurye atandı' : 'Kurye ataması kaldırıldı');
    } catch { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm max-h-[80dvh] overflow-y-auto p-5 sm:p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Truck className="w-5 h-5 text-indigo-600" /> Kurye Ata</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">{order.orderCode} · {order.recipientName || '—'}</p>

        {loading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-1.5">
            <button disabled={busy} onClick={() => assign(null)}
              className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-3 border border-slate-200 hover:bg-slate-50 text-left disabled:opacity-50">
              <span className="text-sm text-slate-500">Atanmadı (kaldır)</span>
              {!order.assignedCourierId && <Check className="w-4 h-4 text-indigo-600" />}
            </button>
            {couriers.map((c) => {
              const active = order.assignedCourierId === c.id;
              return (
                <button key={c.id} disabled={busy} onClick={() => assign(c.id)}
                  className={`w-full flex items-center justify-between gap-2 rounded-xl px-4 py-3 border text-left disabled:opacity-50 ${active ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <span className="text-sm font-medium text-slate-800 truncate">{c.fullName || c.username}</span>
                  {active && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              );
            })}
            {couriers.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Kurye yetkili kullanıcı yok.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
