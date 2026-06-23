'use client';
import { apiFetch } from '@/lib/api';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiUrl, getEndpoint } from '@/config/api';
import { can, P } from '@/lib/permissions';

const money = (n: number) => `${(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dm = (s: string) => { const d = new Date(s); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; };

type TabKey = 'sales' | 'products' | 'customers' | 'cash' | 'couriers';
const TABS: { key: TabKey; label: string; perm: string; endpoint: string }[] = [
  { key: 'sales', label: 'Satış', perm: P.reportsViewSales, endpoint: 'REPORT_SALES' },
  { key: 'products', label: 'Ürün', perm: P.reportsViewProducts, endpoint: 'REPORT_PRODUCTS' },
  { key: 'customers', label: 'Müşteri', perm: P.reportsViewCustomers, endpoint: 'REPORT_CUSTOMERS' },
  { key: 'cash', label: 'Kasa', perm: P.reportsViewCash, endpoint: 'REPORT_CASH' },
  { key: 'couriers', label: 'Kurye', perm: P.reportsViewCouriers, endpoint: 'REPORT_COURIERS' },
];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <svg className="w-8 h-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
      </svg>
    </div>
  );
}

export default function ReportsPage() {
  const available = useMemo(() => TABS.filter((t) => can(t.perm)), []);
  const [tab, setTab] = useState<TabKey>(available[0]?.key ?? 'sales');
  const [preset, setPreset] = useState('month');
  const [customFrom, setCustomFrom] = useState(iso(new Date()));
  const [customTo, setCustomTo] = useState(iso(new Date()));
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const computeRange = useCallback((): { from?: string; to?: string } => {
    const now = new Date();
    if (preset === 'today') return { from: iso(now), to: iso(now) };
    if (preset === 'week') { const a = new Date(now); a.setDate(now.getDate() - 6); return { from: iso(a), to: iso(now) }; }
    if (preset === 'month') return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
    if (preset === 'year') return { from: iso(new Date(now.getFullYear(), 0, 1)), to: iso(now) };
    if (preset === 'custom') return { from: customFrom, to: customTo };
    return {};
  }, [preset, customFrom, customTo]);

  const current = TABS.find((t) => t.key === tab)!;
  const load = useCallback(async () => {
    setLoading(true); setData(null);
    const { from, to } = computeRange();
    const p = new URLSearchParams(); if (from) p.set('from', from); if (to) p.set('to', to);
    try {
      const res = await apiFetch(`${getApiUrl(getEndpoint(current.endpoint as never))}?${p}`, { headers: headers() });
      const body = await res.json();
      if (body.success) setData(body.data);
    } catch { /* yoksay */ }
    finally { setLoading(false); }
  }, [computeRange, current.endpoint]);
  useEffect(() => { load(); }, [load]);

  const rangeLabel = () => { const { from, to } = computeRange(); return from ? `${dm(from)} — ${dm(to!)}` : 'Tüm zamanlar'; };

  const exportCsv = () => {
    const { rows, name } = csvFor(tab, data);
    if (!rows.length) return;
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${name}-${iso(new Date())}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const { rows, name } = csvFor(tab, data);
    if (!rows.length) return;
    let company = '';
    try { company = JSON.parse(localStorage.getItem('tenantInfo') || '{}').name || ''; } catch { /* yoksay */ }
    const head = rows[0]; const body = rows.slice(1);
    const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${name}</title>
    <style>body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;padding:24px}
    h1{font-size:20px;margin:0}.meta{color:#64748b;font-size:12px;margin:4px 0 16px}
    table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:7px 9px;border-bottom:1px solid #e2e8f0;text-align:left}
    th{background:#f1f5f9;text-transform:uppercase;font-size:11px;color:#475569}</style></head><body>
    <h1>${company || 'ÇiçekGo'} — ${name}</h1><div class="meta">${rangeLabel()} · ${new Date().toLocaleString('tr-TR')}</div>
    <table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${String(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <script>window.onload=function(){window.print()}</script></body></html>`;
    const w = window.open('', '_blank', 'width=900,height=700'); if (!w) return;
    w.document.open(); w.document.write(html); w.document.close();
  };

  if (available.length === 0) {
    return <div className="min-h-full bg-gradient-to-b from-slate-50 to-white"><div className="w-full px-5 sm:px-8 lg:px-10 py-10 text-slate-500">Rapor görüntüleme yetkiniz yok.</div></div>;
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Raporlar</h1>
            <p className="text-slate-500 mt-1">{rangeLabel()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[['today', 'Bugün'], ['week', 'Hafta'], ['month', 'Ay'], ['year', 'Yıl'], ['all', 'Tümü'], ['custom', 'Özel']].map(([k, l]) => (
              <button key={k} onClick={() => setPreset(k)} className={`px-4 py-2 rounded-2xl text-sm font-medium ${preset === k ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{l}</button>
            ))}
          </div>
        </div>

        {preset === 'custom' && (
          <div className="flex flex-wrap items-end gap-3 mb-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div><label className="text-xs font-medium text-slate-600">Başlangıç</label><input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="block mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <div><label className="text-xs font-medium text-slate-600">Bitiş</label><input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="block mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            <button onClick={load} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Uygula</button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {available.map((t) => (
              <button key={t.key} onClick={() => { if (t.key !== tab) { setData(null); setLoading(true); setTab(t.key); } }} className={`px-4 py-2 rounded-2xl text-sm font-medium ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{t.label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv} className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-sm font-medium">CSV</button>
            <button onClick={printReport} className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-sm font-medium">Yazdır</button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
          {loading ? <Spinner /> : <ReportBody tab={tab} data={data} />}
        </div>
      </div>
    </div>
  );
}

/* ---- Tablo gövdeleri ---- */
function Th({ children, r }: { children: React.ReactNode; r?: boolean }) { return <th className={`px-4 py-3 font-medium ${r ? 'text-right' : ''}`}>{children}</th>; }
function Td({ children, r, b }: { children: React.ReactNode; r?: boolean; b?: boolean }) { return <td className={`px-4 py-2.5 ${r ? 'text-right' : ''} ${b ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{children}</td>; }
function StatCards({ items }: { items: [string, string][] }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 border-b border-slate-100">{items.map(([l, v], i) => <div key={i} className="bg-slate-50 rounded-2xl p-4"><div className="text-lg font-bold text-slate-900">{v}</div><div className="text-xs text-slate-500">{l}</div></div>)}</div>;
}
function EmptyRow({ cols }: { cols: number }) { return <tr><td colSpan={cols} className="px-4 py-10 text-center text-slate-400">Veri yok.</td></tr>; }

/* eslint-disable @typescript-eslint/no-explicit-any */
function ReportBody({ tab, data }: { tab: TabKey; data: any }) {
  const arr: any[] = Array.isArray(data) ? data : [];
  const obj = data && !Array.isArray(data) ? data : {};

  if (tab === 'products') {
    return <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-left"><tr><Th>Ürün</Th><Th r>Adet</Th><Th r>Sipariş</Th><Th r>Ciro</Th></tr></thead>
      <tbody className="divide-y divide-slate-100">{arr.length === 0 ? <EmptyRow cols={4} /> : arr.map((d: any, i: number) => <tr key={i} className="hover:bg-slate-50"><Td b>{d.name}</Td><Td r>{d.quantity}</Td><Td r>{d.orderCount}</Td><Td r b>{money(d.revenue)}</Td></tr>)}</tbody></table>;
  }
  if (tab === 'customers') {
    return <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-left"><tr><Th>Müşteri</Th><Th r>Sipariş</Th><Th r>Tutar</Th><Th r>Tahsilat</Th><Th r>Bakiye</Th></tr></thead>
      <tbody className="divide-y divide-slate-100">{arr.length === 0 ? <EmptyRow cols={5} /> : arr.map((d: any, i: number) => <tr key={i} className="hover:bg-slate-50"><Td b>{d.name}</Td><Td r>{d.orderCount}</Td><Td r>{money(d.total)}</Td><Td r>{money(d.collected)}</Td><Td r b><span className={d.balance > 0 ? 'text-rose-600' : d.balance < 0 ? 'text-emerald-600' : ''}>{money(d.balance)}</span></Td></tr>)}</tbody></table>;
  }
  if (tab === 'couriers') {
    return <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-left"><tr><Th>Kurye</Th><Th r>Sipariş</Th><Th r>Teslim</Th><Th r>Tutar</Th></tr></thead>
      <tbody className="divide-y divide-slate-100">{arr.length === 0 ? <EmptyRow cols={4} /> : arr.map((d: any, i: number) => <tr key={i} className="hover:bg-slate-50"><Td b>{d.name}</Td><Td r>{d.orderCount}</Td><Td r>{d.deliveredCount}</Td><Td r b>{money(d.total)}</Td></tr>)}</tbody></table>;
  }
  if (tab === 'cash') {
    const byType: any[] = Array.isArray(obj.byType) ? obj.byType : [];
    const byMethod: any[] = Array.isArray(obj.byMethod) ? obj.byMethod : [];
    const expCat: any[] = Array.isArray(obj.expensesByCategory) ? obj.expensesByCategory : [];
    return (
      <div>
        <StatCards items={[['Giriş', money(obj.in)], ['Çıkış', money(obj.out)], ['Net', money(obj.net)], ['Gider Kalemi', String(expCat.length)]]} />
        <div className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 border-y border-slate-100">Ödeme Yöntemine Göre</div>
        <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-left"><tr><Th>Yöntem</Th><Th r>Giriş</Th><Th r>Çıkış</Th><Th r>Net</Th><Th r>Adet</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">{byMethod.length === 0 ? <EmptyRow cols={5} /> : byMethod.map((d: any, i: number) => <tr key={i}><Td>{d.method}</Td><Td r>{money(d.in)}</Td><Td r>{money(d.out)}</Td><Td r b>{money(d.net)}</Td><Td r>{d.count}</Td></tr>)}</tbody>
        </table>
        <div className="grid lg:grid-cols-2 border-t border-slate-100">
          <table className="w-full text-sm border-r border-slate-100"><thead className="bg-slate-50 text-slate-500 text-left"><tr><Th>Tür</Th><Th>Yön</Th><Th r>Adet</Th><Th r>Tutar</Th></tr></thead>
            <tbody className="divide-y divide-slate-100">{byType.length === 0 ? <EmptyRow cols={4} /> : byType.map((d: any, i: number) => <tr key={i}><Td>{d.type}</Td><Td>{d.direction === 'IN' ? 'Giriş' : 'Çıkış'}</Td><Td r>{d.count}</Td><Td r b>{money(d.total)}</Td></tr>)}</tbody>
          </table>
          <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-left"><tr><Th>Gider Kategorisi</Th><Th r>Tutar</Th></tr></thead>
            <tbody className="divide-y divide-slate-100">{expCat.length === 0 ? <EmptyRow cols={2} /> : expCat.map((d: any, i: number) => <tr key={i}><Td>{d.category}</Td><Td r b>{money(d.total)}</Td></tr>)}</tbody>
          </table>
        </div>
      </div>
    );
  }
  // sales (varsayılan)
  const byDay: any[] = Array.isArray(obj.byDay) ? obj.byDay : [];
  const byStatus: any[] = Array.isArray(obj.byStatus) ? obj.byStatus : [];
  return (
    <div>
      <StatCards items={[['Sipariş', String(obj.orderCount ?? 0)], ['Toplam Satış', money(obj.totalSales)], ['Tahsilat', money(obj.totalCollected)], ['Ort. Sipariş', money(obj.avgOrder)]]} />
      <div className="grid lg:grid-cols-2">
        <table className="w-full text-sm border-r border-slate-100"><thead className="bg-slate-50 text-slate-500 text-left"><tr><Th>Gün</Th><Th r>Adet</Th><Th r>Tutar</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">{byDay.length === 0 ? <EmptyRow cols={3} /> : byDay.map((d: any, i: number) => <tr key={i}><Td>{dm(d.date)}</Td><Td r>{d.count}</Td><Td r b>{money(d.total)}</Td></tr>)}</tbody>
        </table>
        <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-left"><tr><Th>Durum</Th><Th r>Adet</Th><Th r>Tutar</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">{byStatus.length === 0 ? <EmptyRow cols={3} /> : byStatus.map((d: any, i: number) => <tr key={i}><Td>{d.status}</Td><Td r>{d.count}</Td><Td r b>{money(d.total)}</Td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function csvFor(tab: TabKey, data: any): { rows: (string | number)[][]; name: string } {
  const arr: any[] = Array.isArray(data) ? data : [];
  const obj = data && !Array.isArray(data) ? data : {};
  if (tab === 'products') return { name: 'urun-raporu', rows: [['Ürün', 'Adet', 'Sipariş', 'Ciro'], ...arr.map((d: any) => [d.name, d.quantity, d.orderCount, d.revenue])] };
  if (tab === 'customers') return { name: 'musteri-raporu', rows: [['Müşteri', 'Sipariş', 'Tutar', 'Tahsilat', 'Bakiye'], ...arr.map((d: any) => [d.name, d.orderCount, d.total, d.collected, d.balance])] };
  if (tab === 'couriers') return { name: 'kurye-raporu', rows: [['Kurye', 'Sipariş', 'Teslim', 'Tutar'], ...arr.map((d: any) => [d.name, d.orderCount, d.deliveredCount, d.total])] };
  if (tab === 'cash') return { name: 'kasa-raporu', rows: [['Tür', 'Yön', 'Adet', 'Tutar'], ...(Array.isArray(obj.byType) ? obj.byType : []).map((d: any) => [d.type, d.direction, d.count, d.total])] };
  return { name: 'satis-raporu', rows: [['Gün', 'Adet', 'Tutar'], ...(Array.isArray(obj.byDay) ? obj.byDay : []).map((d: any) => [dm(d.date), d.count, d.total])] };
}
