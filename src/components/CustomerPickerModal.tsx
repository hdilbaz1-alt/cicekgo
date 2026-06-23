'use client';

import { useEffect, useState } from 'react';
import { customerService, CustomerDetail } from '@/services/customerService';
import { useEscClose } from '@/lib/useEscClose';

export default function CustomerPickerModal({ onClose, onPick }: {
  onClose: () => void; onPick: (c: CustomerDetail) => void;
}) {
  useEscClose(onClose);
  const [q, setQ] = useState('');
  const [list, setList] = useState<CustomerDetail[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async (search: string) => {
    setLoading(true);
    try { const r = await customerService.getCustomers(search, 1, 50); setList(r.items); }
    catch { setList([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(''); }, []);
  useEffect(() => { const t = setTimeout(() => load(q), 300); return () => clearTimeout(t); }, [q]);

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md sm:my-8 max-h-[85dvh] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-900">Müşteri Seç</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
          </div>
          <div className="relative">
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ad / telefon ara…"
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="overflow-y-auto p-2">
          {loading ? (
            <div className="p-6 text-center text-slate-400 text-sm">Yükleniyor…</div>
          ) : list.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">Müşteri bulunamadı.</div>
          ) : list.map((c) => (
            <button key={c.customerId} onClick={() => onPick(c)}
              className="w-full text-left px-3 py-2.5 rounded-2xl hover:bg-slate-50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold shrink-0">
                {c.customerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-slate-800 truncate">{c.customerName}</div>
                <div className="text-xs text-slate-400 truncate">{c.phone || '—'}{c.cardName ? ` · ${c.cardName}` : ''}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
