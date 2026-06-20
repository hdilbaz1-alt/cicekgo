'use client';

import { useCallback, useEffect, useState } from 'react';
import { orderService, DeletedOrderItem } from '@/services/orderService';
import { can, P } from '@/lib/permissions';

export default function DeletedOrdersPage() {
  const [items, setItems] = useState<DeletedOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await orderService.getDeletedOrders()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const restore = async (code: string) => {
    if (!confirm(`"${code}" siparişini geri yüklemek istediğinize emin misiniz?`)) return;
    setBusy(code);
    try { await orderService.restoreOrder(code); await load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Geri yüklenemedi'); }
    finally { setBusy(null); }
  };

  const fmt = (d?: string | null) => d ? new Date(d).toLocaleString('tr-TR') : '-';
  const money = (n: number) => `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Silinen Siparişler</h1>
            <p className="text-gray-500 mt-1">Soft-delete edilmiş siparişler ve geri yükleme.</p>
          </div>
          <button onClick={load} className="text-sm font-medium bg-white border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-100">Yenile</button>
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Yükleniyor…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Silinen sipariş yok.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Sipariş No</th>
                    <th className="px-4 py-3 font-medium">Gönderici</th>
                    <th className="px-4 py-3 font-medium">Alıcı</th>
                    <th className="px-4 py-3 font-medium">Tutar</th>
                    <th className="px-4 py-3 font-medium">Silen</th>
                    <th className="px-4 py-3 font-medium">Silinme</th>
                    <th className="px-4 py-3 font-medium">Sebep</th>
                    <th className="px-4 py-3 font-medium text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((o) => (
                    <tr key={o.orderPkId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{o.orderCode}</td>
                      <td className="px-4 py-3">{o.senderName || '-'}</td>
                      <td className="px-4 py-3">{o.recipientName || '-'}</td>
                      <td className="px-4 py-3">{money(o.orderAmount)}</td>
                      <td className="px-4 py-3">{o.deletedByUserName || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt(o.deletedAt)}</td>
                      <td className="px-4 py-3 text-gray-500">{o.deleteReason || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {can(P.ordersRestore) && (
                          <button
                            onClick={() => restore(o.orderCode)}
                            disabled={busy === o.orderCode}
                            className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                          >
                            {busy === o.orderCode ? 'Geri yükleniyor…' : 'Geri Yükle'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
