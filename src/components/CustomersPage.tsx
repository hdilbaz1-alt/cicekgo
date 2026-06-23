'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { customerService, CustomerDetail, CustomerSaveRequest } from '@/services/customerService';
import { can, P } from '@/lib/permissions';
import { useEscClose } from '@/lib/useEscClose';
import { Plus, Search, Users, CheckCircle2, Building2, Star, Pencil, Trash2, Phone, MapPin, type LucideIcon } from 'lucide-react';
import { SkeletonCards, EmptyState } from './ui/Skeleton';

const TYPES = ['Bireysel', 'Kurumsal', 'Bayi', 'Özel'];
const TAGS = ['', 'Sadık', 'VIP', 'Borçlu', 'Riskli', 'Kurumsal'];

const AVATAR_TONES = [
  'bg-indigo-50 text-indigo-600', 'bg-emerald-50 text-emerald-600', 'bg-amber-50 text-amber-600',
  'bg-rose-50 text-rose-600', 'bg-violet-50 text-violet-600', 'bg-sky-50 text-sky-600',
];
const toneFor = (name: string) => AVATAR_TONES[(name.charCodeAt(0) || 0) % AVATAR_TONES.length];

export default function CustomersPage() {
  const [list, setList] = useState<CustomerDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CustomerDetail | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const canManage = can(P.customersCreate) || can(P.customersUpdate);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const r = await customerService.getCustomers(search, 1, 500); setList(r.items); }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi'); }
    finally { setLoading(false); }
  }, [search]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const stats = useMemo(() => ({
    total: list.length,
    active: list.filter((c) => c.isActive).length,
    corporate: list.filter((c) => c.customerType === 'Kurumsal').length,
    vip: list.filter((c) => c.tag === 'VIP').length,
  }), [list]);

  const remove = async (c: CustomerDetail) => {
    if (!confirm(`"${c.customerName}" müşterisini silmek istediğinize emin misiniz?`)) return;
    try { await customerService.deleteCustomer(c.customerId); showToast('Müşteri silindi'); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Silinemedi'); }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Müşteriler</h1>
          </div>
          {can(P.customersCreate) && (
            <button onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-blue-600/25 active:scale-95 transition-all">
              <Plus className="w-5 h-5" strokeWidth={2.4} />
              Yeni Müşteri
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Stat label="Toplam Müşteri" value={stats.total} tone="bg-indigo-50 text-indigo-600" Icon={Users} />
          <Stat label="Aktif" value={stats.active} tone="bg-emerald-50 text-emerald-600" Icon={CheckCircle2} />
          <Stat label="Kurumsal" value={stats.corporate} tone="bg-violet-50 text-violet-600" Icon={Building2} />
          <Stat label="VIP" value={stats.vip} tone="bg-amber-50 text-amber-600" Icon={Star} />
        </div>

        <div className="relative max-w-md mb-5">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Müşteri ara…"
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {loading ? (
          <SkeletonCards count={6} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="Müşteri yok"
            hint={can(P.customersCreate) ? 'İlk müşterini ekleyerek başla.' : 'Henüz müşteri yok.'}
            action={can(P.customersCreate) ? (
              <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-semibold"><Plus className="w-4 h-4" /> Yeni Müşteri</button>
            ) : undefined}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((c) => (
              <div key={c.customerId} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${toneFor(c.customerName)}`}>
                      {c.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 truncate flex items-center gap-2">
                        {c.customerName}
                        {!c.isActive && <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">pasif</span>}
                      </h3>
                      {c.cardName && <p className="text-sm text-slate-500 truncate">{c.cardName}</p>}
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        {can(P.customersUpdate) && (
                          <button onClick={() => setEditing(c)} title="Düzenle" className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Pencil className="w-4 h-4" /></button>
                        )}
                        {can(P.customersDelete) && (
                          <button onClick={() => remove(c)} title="Sil" className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-4 h-4 text-slate-400 shrink-0" /><span className="truncate">{c.phone || '—'}</span></div>
                    {(c.city || c.district) && <div className="flex items-center gap-2 text-sm text-slate-600"><MapPin className="w-4 h-4 text-slate-400 shrink-0" /><span className="truncate">{[c.district, c.city].filter(Boolean).join(', ')}</span></div>}
                  </div>

                  {(c.customerType || c.tag || (c.customerGroup && c.customerGroup !== 'Diğer')) && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {c.customerType && <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{c.customerType}</span>}
                      {c.tag && <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">{c.tag}</span>}
                      {c.customerGroup && c.customerGroup !== 'Diğer' && <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">{c.customerGroup}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(adding || editing) && (
        <CustomerForm customer={editing} onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={(m) => { setAdding(false); setEditing(null); showToast(m); load(); }} />
      )}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}

function Stat({ label, value, tone, Icon }: { label: string; value: number; tone: string; Icon: LucideIcon }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${tone} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div><div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div>
    </div>
  );
}

const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm';
const lbl = 'text-xs font-medium text-slate-600';

function CustomerForm({ customer, onClose, onSaved }: { customer: CustomerDetail | null; onClose: () => void; onSaved: (m: string) => void }) {
  const isEdit = !!customer;
  const [f, setF] = useState<CustomerSaveRequest>({
    customerName: customer?.customerName || '',
    cardName: customer?.cardName || '',
    customerGroup: customer?.customerGroup || 'Diğer',
    phone: customer?.phone || '',
    secondaryPhone: customer?.secondaryPhone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    city: customer?.city || '',
    district: customer?.district || '',
    customerType: customer?.customerType || 'Bireysel',
    tag: customer?.tag || '',
    openingBalance: customer?.openingBalance ?? 0,
    creditLimit: customer?.creditLimit ?? null,
    extraNote: customer?.extraNote || '',
    isActive: customer?.isActive ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [adv, setAdv] = useState(false);
  useEscClose(onClose);
  const set = (k: keyof CustomerSaveRequest, v: string | number | boolean | null) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setErr('');
    if (!f.customerName.trim()) return setErr('Müşteri adı gerekli');
    setBusy(true);
    try {
      if (isEdit && customer) { await customerService.updateCustomer(customer.customerId, f); onSaved('Müşteri güncellendi'); }
      else { await customerService.createCustomer(f); onSaved('Müşteri oluşturuldu'); }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Kaydedilemedi'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg sm:my-6 max-h-[92dvh] overflow-y-auto p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{isEdit ? 'Müşteriyi Düzenle' : 'Yeni Müşteri'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        {/* Esaslar */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className={lbl}>Ad / Ünvan *</label><input className={inputCls + ' mt-1'} value={f.customerName} onChange={(e) => set('customerName', e.target.value)} autoFocus placeholder="Müşteri adı veya firma" /></div>
          <div><label className={lbl}>Telefon</label><input type="tel" inputMode="numeric" maxLength={11} placeholder="05531234567" className={inputCls + ' mt-1'} value={f.phone || ''} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 11))} /></div>
          <div>
            <label className={lbl}>Müşteri Tipi</label>
            <select className={inputCls + ' mt-1'} value={f.customerType || ''} onChange={(e) => set('customerType', e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Detaylar (katlanır) */}
        <button type="button" onClick={() => setAdv((v) => !v)} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-800">
          <span className={`transition-transform ${adv ? 'rotate-90' : ''}`}>▸</span> Detaylar (etiket, adres, bakiye, not)
        </button>
        {adv && (
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <div><label className={lbl}>Etiket</label>
              <select className={inputCls + ' mt-1'} value={f.tag || ''} onChange={(e) => set('tag', e.target.value)}>
                {TAGS.map((t) => <option key={t} value={t}>{t || '—'}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Grup</label><input className={inputCls + ' mt-1'} value={f.customerGroup || ''} onChange={(e) => set('customerGroup', e.target.value)} /></div>
            <div><label className={lbl}>Kart Adı</label><input className={inputCls + ' mt-1'} value={f.cardName || ''} onChange={(e) => set('cardName', e.target.value)} /></div>
            <div><label className={lbl}>2. Telefon</label><input type="tel" inputMode="numeric" maxLength={11} placeholder="05531234567" className={inputCls + ' mt-1'} value={f.secondaryPhone || ''} onChange={(e) => set('secondaryPhone', e.target.value.replace(/\D/g, '').slice(0, 11))} /></div>
            <div className="sm:col-span-2"><label className={lbl}>E-posta</label><input className={inputCls + ' mt-1'} value={f.email || ''} onChange={(e) => set('email', e.target.value)} /></div>
            <div className="sm:col-span-2"><label className={lbl}>Adres</label><textarea rows={2} className={inputCls + ' mt-1'} value={f.address || ''} onChange={(e) => set('address', e.target.value)} /></div>
            <div><label className={lbl}>İl</label><input className={inputCls + ' mt-1'} value={f.city || ''} onChange={(e) => set('city', e.target.value)} /></div>
            <div><label className={lbl}>İlçe</label><input className={inputCls + ' mt-1'} value={f.district || ''} onChange={(e) => set('district', e.target.value)} /></div>
            <div><label className={lbl}>Açılış Bakiyesi</label><input type="number" className={inputCls + ' mt-1'} value={f.openingBalance ?? 0} onChange={(e) => set('openingBalance', Number(e.target.value))} /></div>
            <div><label className={lbl}>Borç Limiti</label><input type="number" className={inputCls + ' mt-1'} value={f.creditLimit ?? ''} onChange={(e) => set('creditLimit', e.target.value === '' ? null : Number(e.target.value))} /></div>
            <div className="sm:col-span-2"><label className={lbl}>Not</label><textarea rows={2} className={inputCls + ' mt-1'} value={f.extraNote || ''} onChange={(e) => set('extraNote', e.target.value)} /></div>
          </div>
        )}
        {isEdit && (
          <label className="mt-3 flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-2.5">
            <span className="font-medium text-sm">Aktif</span>
            <input type="checkbox" checked={!!f.isActive} onChange={(e) => set('isActive', e.target.checked)} className="w-5 h-5 rounded accent-emerald-600" />
          </label>
        )}
        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-5 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
          <button onClick={save} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
        </div>
        <p className="text-xs text-slate-400 mt-3">Açılış bakiyesi pozitif = müşteri borçlu. Fatura bilgileri ileride ayrı sekmede eklenecek.</p>
      </div>
    </div>
  );
}
