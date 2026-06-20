'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  adminService,
  TenantDto,
  UserDto,
  RoleDto,
  CreateTenantRequest,
} from '@/services/adminService';
import { useEscClose } from '@/lib/useEscClose';

/* ============================ Yardımcılar ============================ */

function daysLeft(end: string | null): number | null {
  if (!end) return null;
  const ms = new Date(end).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

function licensePercent(start: string | null, end: string | null): number {
  if (!end) return 100;
  const s = start ? new Date(start).getTime() : new Date().getTime() - 30 * 86400000;
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now >= e) return 0;
  if (now <= s) return 100;
  return Math.max(0, Math.min(100, Math.round(((e - now) / (e - s)) * 100)));
}

function fmtDate(d: string | null): string {
  if (!d) return 'Süresiz';
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toIsoOrNull(v: string): string | null {
  if (!v) return null;
  return new Date(v + 'T00:00:00Z').toISOString();
}

function statusColor(active: boolean, days: number | null): string {
  if (!active) return 'bg-gray-400';
  if (days === null) return 'bg-emerald-500';
  if (days <= 0) return 'bg-red-500';
  if (days <= 7) return 'bg-amber-500';
  return 'bg-emerald-500';
}

/* ============================ Ana Panel ============================ */

export default function SuperAdminPanel({ onLogout }: { onLogout: () => void }) {
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TenantDto | null>(null);
  const [managing, setManaging] = useState<TenantDto | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTenants(await adminService.listTenants());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Firmalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = tenants.filter((t) => t.isActive).length;
    const expiring = tenants.filter((t) => {
      const d = daysLeft(t.licenseEndUtc);
      return t.isActive && d !== null && d <= 7;
    }).length;
    return { total: tenants.length, active, expiring };
  }, [tenants]);

  const me = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const [section, setSection] = useState<'tenants' | 'settings'>('tenants');

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-gray-900 flex">
      {/* Sol menü */}
      <aside className="w-16 sm:w-60 shrink-0 bg-white border-r border-black/5 flex flex-col sticky top-0 h-screen">
        <div className="h-16 px-3 sm:px-5 flex items-center gap-3 border-b border-black/5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shrink-0">Ç</div>
          <div className="hidden sm:block min-w-0">
            <div className="font-semibold leading-tight truncate">ÇiçekGo · Platform</div>
            <div className="text-xs text-gray-500 leading-tight">Süper Yönetici</div>
          </div>
        </div>
        <nav className="flex-1 p-2 sm:p-3 space-y-1">
          <NavItem active={section === 'tenants'} onClick={() => setSection('tenants')} label="Firmalar"
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" />} />
          <NavItem active={section === 'settings'} onClick={() => setSection('settings')} label="Ayarlar"
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />} />
        </nav>
        <div className="p-2 sm:p-3 border-t border-black/5">
          <div className="hidden sm:block px-2 pb-1.5 text-xs text-gray-400 truncate">{me.userName}</div>
          <button onClick={onLogout} className="w-full flex items-center justify-center sm:justify-start gap-2 px-2 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
      </aside>

      {/* İçerik */}
      <div className="flex-1 min-w-0">
        <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
          {section === 'tenants' ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Firmalar</h1>
                  <p className="text-gray-500 mt-1">Müşteri firmalarını oluştur, yönet ve yetkilendir.</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-blue-600/20 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Yeni Firma
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <StatCard label="Toplam Firma" value={stats.total} accent="from-blue-500 to-indigo-600" />
                <StatCard label="Aktif" value={stats.active} accent="from-emerald-500 to-teal-600" />
                <StatCard label="Süresi Yaklaşan" value={stats.expiring} accent="from-amber-500 to-orange-600" />
              </div>

              {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[0, 1, 2].map((i) => <div key={i} className="h-44 rounded-3xl bg-white/60 animate-pulse" />)}
                </div>
              ) : tenants.length === 0 ? (
                <EmptyState onCreate={() => setShowCreate(true)} />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {tenants.map((t) => (
                    <TenantCard key={t.id} t={t} onEdit={() => setEditing(t)} onUsers={() => setManaging(t)} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <PlatformSettingsSection onToast={showToast} />
          )}
        </main>
      </div>

      {showCreate && (
        <CreateTenantWizard
          onClose={() => setShowCreate(false)}
          onDone={(name) => { setShowCreate(false); showToast(`"${name}" firması oluşturuldu 🎉`); load(); }}
        />
      )}

      {editing && (
        <EditTenantDrawer
          tenant={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => { setEditing(null); showToast(msg); load(); }}
          onError={(m) => showToast(m, false)}
        />
      )}

      {managing && (
        <UsersDrawer
          tenant={managing}
          onClose={() => setManaging(null)}
          onToast={showToast}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-medium ${toast.ok ? 'bg-gray-900' : 'bg-red-600'} animate-[fadeup_.3s_ease]`}>
          {toast.msg}
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeup { from { opacity:0; transform:translate(-50%,12px);} to {opacity:1; transform:translate(-50%,0);} }
      `}</style>
    </div>
  );
}

/* ============================ Alt bileşenler ============================ */

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-black/5">
      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${accent} mb-3 opacity-90`} />
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function NavItem({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} title={label}
      className={`w-full flex items-center justify-center sm:justify-start gap-3 px-2 sm:px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/* ---- Ayarlar: Platform geneli Google Maps anahtarı ---- */
function PlatformSettingsSection({ onToast }: { onToast: (m: string, ok?: boolean) => void }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try { const s = await adminService.getPlatformSettings(); setKey(s.googleMapsApiKey || ''); }
      catch (e) { onToast(e instanceof Error ? e.message : 'Ayarlar yüklenemedi', false); }
      finally { setLoading(false); }
    })();
  }, [onToast]);

  const save = async () => {
    setBusy(true);
    try { await adminService.savePlatformSettings(key.trim() || null); onToast('Google Maps anahtarı kaydedildi'); }
    catch (e) { onToast(e instanceof Error ? e.message : 'Kaydedilemedi', false); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-gray-500 mt-1">Platform geneli yapılandırma — tüm firmalar için ortak.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-black/5 max-w-xl">
        <h3 className="font-semibold text-lg mb-1">Google Maps API Anahtarı</h3>
        <p className="text-sm text-gray-500 mb-4">Sipariş formundaki “Haritadan Seç” özelliği için. Maps JavaScript API + Places + Geocoding etkin, referrer-kısıtlı bir tarayıcı anahtarı kullanın. Bu anahtar tüm firmalar tarafından kullanılır.</p>
        {loading ? (
          <div className="h-12 rounded-2xl bg-gray-100 animate-pulse" />
        ) : (
          <>
            <input className={inputCls} value={key} onChange={(e) => setKey(e.target.value)} placeholder="AIza…" />
            <button onClick={save} disabled={busy} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50 transition-colors">
              {busy ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </>
        )}
      </div>
    </>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-black/5">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto mb-5 flex items-center justify-center text-white text-2xl">🏢</div>
      <h3 className="text-xl font-semibold mb-1">Henüz firma yok</h3>
      <p className="text-gray-500 mb-6">İlk müşteri firmanı oluşturarak başla.</p>
      <button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold transition-colors">Yeni Firma Oluştur</button>
    </div>
  );
}

function TenantCard({ t, onEdit, onUsers }: { t: TenantDto; onEdit: () => void; onUsers: () => void }) {
  const days = daysLeft(t.licenseEndUtc);
  const pct = licensePercent(t.licenseStartUtc, t.licenseEndUtc);
  return (
    <div className="group bg-white rounded-3xl p-6 shadow-sm border border-black/5 hover:shadow-xl hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
            {t.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{t.name}</div>
            <div className="text-xs text-gray-400 truncate">{t.dbName}</div>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${t.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusColor(t.isActive, days)}`} />
          {t.isActive ? 'Aktif' : 'Pasif'}
        </span>
      </div>

      {/* Lisans yüzdesi */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Lisans</span>
          <span>{days === null ? 'Süresiz' : days <= 0 ? 'Doldu' : `${days} gün kaldı`}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${pct <= 15 ? 'bg-red-500' : pct <= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-[11px] text-gray-400 mt-1">Bitiş: {fmtDate(t.licenseEndUtc)}</div>
      </div>

      <div className="flex gap-2">
        <button onClick={onUsers} className="flex-1 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-xl py-2 transition-colors">Kullanıcılar</button>
        <button onClick={onEdit} className="flex-1 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-xl py-2 transition-colors">Düzenle</button>
      </div>
    </div>
  );
}

/* ---- Modal kabuğu (Apple tarzı) ---- */
function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  useEscClose(onClose);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-[fade_.2s_ease]" onClick={onClose} />
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto animate-[pop_.25s_cubic-bezier(.2,.8,.2,1)]`}>
        {children}
      </div>
      <style jsx global>{`
        @keyframes fade { from {opacity:0} to {opacity:1} }
        @keyframes pop { from {opacity:0; transform:scale(.96) translateY(8px)} to {opacity:1; transform:scale(1) translateY(0)} }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all';

/* ============================ Firma Oluşturma Sihirbazı ============================ */

const PROVISION_STEPS = [
  { p: 18, label: 'Firma kaydı oluşturuluyor' },
  { p: 45, label: 'Veritabanı hazırlanıyor' },
  { p: 70, label: 'Tablolar kuruluyor' },
  { p: 88, label: 'Varsayılan veriler yükleniyor' },
  { p: 96, label: 'Yönetici kullanıcı tanımlanıyor' },
];

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
}

function CreateTenantWizard({ onClose, onDone }: { onClose: () => void; onDone: (name: string) => void }) {
  const [step, setStep] = useState(1); // 1 bilgi, 2 lisans, 3 admin, 4 provisioning
  const [form, setForm] = useState<CreateTenantRequest>({
    name: '', slug: '', licenseEndUtc: null, adminUsername: '', adminPassword: '', adminEmail: '', adminFullName: '',
  });
  const [licenseDate, setLicenseDate] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [err, setErr] = useState('');
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState('');

  const set = (k: keyof CreateTenantRequest, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onNameChange = (v: string) => {
    setForm((f) => ({ ...f, name: v, slug: slugTouched ? f.slug : slugify(v) }));
  };

  const submit = async () => {
    setErr('');
    if (!form.name.trim()) return setErr('Firma adı gerekli');
    if (!/^[a-z0-9_]{2,40}$/.test(form.slug)) return setErr('Slug yalnızca a-z, 0-9, _ içerebilir (2-40)');
    if (!form.adminUsername.trim()) return setErr('Yönetici kullanıcı adı gerekli');
    if (form.adminPassword.length < 6) return setErr('Şifre en az 6 karakter olmalı');

    setStep(4);
    setProgress(0);

    // Animasyonlu ilerleme (sunucu işlemi sürerken)
    let i = 0;
    const timer = setInterval(() => {
      if (i < PROVISION_STEPS.length) {
        setProgress(PROVISION_STEPS[i].p);
        setStepLabel(PROVISION_STEPS[i].label);
        i++;
      }
    }, 700);

    try {
      await adminService.createTenant({
        ...form,
        licenseEndUtc: toIsoOrNull(licenseDate),
        licenseStartUtc: new Date().toISOString(),
      });
      clearInterval(timer);
      setProgress(100);
      setStepLabel('Hazır!');
      setTimeout(() => onDone(form.name), 900);
    } catch (e) {
      clearInterval(timer);
      setErr(e instanceof Error ? e.message : 'Firma oluşturulamadı');
      setStep(3);
    }
  };

  return (
    <Modal onClose={step === 4 ? () => {} : onClose}>
      <div className="p-7">
        {step !== 4 && (
          <>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-bold tracking-tight">Yeni Firma</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="flex gap-1.5 mb-6 mt-3">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Field label="Firma Adı">
              <input className={inputCls} value={form.name} onChange={(e) => onNameChange(e.target.value)} placeholder="Örn. Demo Çiçekçilik" autoFocus />
            </Field>
            <Field label="Slug (veritabanı adı için)">
              <input className={inputCls} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }} placeholder="demo_cicekcilik" />
              <p className="text-xs text-gray-400 mt-1">Veritabanı: <span className="font-mono">cicekgo_tenant_{form.slug || '...'}</span></p>
            </Field>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-end pt-2">
              <button onClick={() => { setErr(''); if (!form.name.trim()) return setErr('Firma adı gerekli'); setStep(2); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-semibold transition-colors">Devam</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Field label="Lisans Bitiş Tarihi">
              <input type="date" className={inputCls} value={licenseDate} onChange={(e) => setLicenseDate(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Boş bırakılırsa süresiz lisans verilir.</p>
            </Field>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700 px-4 py-2.5 font-medium">← Geri</button>
              <button onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-semibold transition-colors">Devam</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 -mt-2">Bu firmanın ilk yöneticisi (FirmaAdmin) oluşturulacak.</p>
            <Field label="Yönetici Kullanıcı Adı">
              <input className={inputCls} value={form.adminUsername} onChange={(e) => set('adminUsername', e.target.value)} placeholder="firma_admin" />
            </Field>
            <Field label="Şifre">
              <input type="text" className={inputCls} value={form.adminPassword} onChange={(e) => set('adminPassword', e.target.value)} placeholder="En az 6 karakter" />
            </Field>
            <Field label="E-posta (opsiyonel)">
              <input className={inputCls} value={form.adminEmail || ''} onChange={(e) => set('adminEmail', e.target.value)} placeholder="admin@firma.com" />
            </Field>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-700 px-4 py-2.5 font-medium">← Geri</button>
              <button onClick={submit} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-semibold transition-colors">Firmayı Oluştur</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="py-8 flex flex-col items-center text-center">
            <ProgressRing percent={progress} />
            <h3 className="text-xl font-semibold mt-6">{progress >= 100 ? 'Firma Hazır 🎉' : 'Firma Oluşturuluyor'}</h3>
            <p className="text-gray-500 mt-1 h-5">{stepLabel}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#eef0f3" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="url(#g)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * percent) / 100}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' }}
        />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{percent}%</span>
      </div>
    </div>
  );
}

/* ============================ Firma Düzenle ============================ */

function EditTenantDrawer({ tenant, onClose, onSaved, onError }: {
  tenant: TenantDto; onClose: () => void; onSaved: (msg: string) => void; onError: (m: string) => void;
}) {
  const [name, setName] = useState(tenant.name);
  const [active, setActive] = useState(tenant.isActive);
  const [licenseDate, setLicenseDate] = useState(tenant.licenseEndUtc ? tenant.licenseEndUtc.slice(0, 10) : '');
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [dropDb, setDropDb] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await adminService.updateTenant(tenant.id, {
        name, isActive: active, licenseEndUtc: licenseDate ? toIsoOrNull(licenseDate) : null,
      });
      onSaved('Firma güncellendi');
    } catch (e) { onError(e instanceof Error ? e.message : 'Güncellenemedi'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await adminService.deleteTenant(tenant.id, dropDb);
      onSaved(dropDb ? 'Firma ve veritabanı silindi' : 'Firma kaydı silindi');
    } catch (e) { onError(e instanceof Error ? e.message : 'Silinemedi'); setBusy(false); }
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-7">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{tenant.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {!confirmDel ? (
          <div className="space-y-4">
            <Field label="Firma Adı">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Lisans Bitiş Tarihi">
              <input type="date" className={inputCls} value={licenseDate} onChange={(e) => setLicenseDate(e.target.value)} />
            </Field>
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
              <div>
                <div className="font-medium text-sm">Firma Aktif</div>
                <div className="text-xs text-gray-400">Pasifte kullanıcılar giriş yapamaz</div>
              </div>
              <button onClick={() => setActive((a) => !a)} className={`w-12 h-7 rounded-full transition-colors relative ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${active ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setConfirmDel(true)} className="px-4 py-2.5 rounded-2xl font-medium text-red-600 hover:bg-red-50 transition-colors">Sil</button>
              <div className="flex-1" />
              <button onClick={onClose} className="px-4 py-2.5 rounded-2xl font-medium text-gray-500 hover:bg-gray-100">İptal</button>
              <button onClick={save} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
              <b>{tenant.name}</b> firmasını silmek üzeresin. Bu işlem firmanın kullanıcılarını ve rollerini kaldırır.
            </div>
            <label className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 cursor-pointer">
              <input type="checkbox" checked={dropDb} onChange={(e) => setDropDb(e.target.checked)} className="w-5 h-5 rounded accent-red-600" />
              <div>
                <div className="font-medium text-sm">Veritabanını da kalıcı olarak sil</div>
                <div className="text-xs text-gray-400">Tüm siparişler, müşteriler ve cari geri alınamaz şekilde silinir</div>
              </div>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setConfirmDel(false)} className="px-4 py-2.5 rounded-2xl font-medium text-gray-500 hover:bg-gray-100">Vazgeç</button>
              <button onClick={remove} disabled={busy} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? 'Siliniyor…' : (dropDb ? 'Firmayı ve DB’yi Sil' : 'Firmayı Sil')}</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ============================ Kullanıcı & Yetki Yönetimi ============================ */

function UsersDrawer({ tenant, onClose, onToast }: {
  tenant: TenantDto; onClose: () => void; onToast: (m: string, ok?: boolean) => void;
}) {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editUser, setEditUser] = useState<UserDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([adminService.listUsers(tenant.id), adminService.listRoles(tenant.id)]);
      setUsers(u); setRoles(r);
    } catch (e) { onToast(e instanceof Error ? e.message : 'Yüklenemedi', false); }
    finally { setLoading(false); }
  }, [tenant.id, onToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <Modal onClose={onClose} wide>
      <div className="p-7">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Kullanıcılar</h2>
            <p className="text-sm text-gray-500">{tenant.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex justify-end mb-4">
          <button onClick={() => setAdding(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Kullanıcı Ekle
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium flex items-center gap-2">
                    {u.username}
                    {!u.isActive && <span className="text-[11px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">pasif</span>}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{u.roles.map((r) => r.name).join(', ') || 'rol yok'}</div>
                </div>
                <button onClick={() => setEditUser(u)} className="text-sm font-medium text-gray-600 hover:text-blue-600">Düzenle</button>
              </div>
            ))}
            {users.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Henüz kullanıcı yok.</p>}
          </div>
        )}
      </div>

      {(adding || editUser) && (
        <UserForm
          tenantId={tenant.id}
          roles={roles}
          user={editUser}
          onClose={() => { setAdding(false); setEditUser(null); }}
          onSaved={(m) => { setAdding(false); setEditUser(null); onToast(m); load(); }}
          onError={(m) => onToast(m, false)}
        />
      )}
    </Modal>
  );
}

function UserForm({ tenantId, roles, user, onClose, onSaved, onError }: {
  tenantId: number; roles: RoleDto[]; user: UserDto | null;
  onClose: () => void; onSaved: (m: string) => void; onError: (m: string) => void;
}) {
  const isEdit = !!user;
  const [username, setUsername] = useState(user?.username || '');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [active, setActive] = useState(user?.isActive ?? true);
  const [roleIds, setRoleIds] = useState<number[]>(user?.roles.map((r) => r.id) || []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const toggleRole = (id: number) => setRoleIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const save = async () => {
    setErr('');
    if (!isEdit && !username.trim()) return setErr('Kullanıcı adı gerekli');
    if (!isEdit && password.length < 6) return setErr('Şifre en az 6 karakter olmalı');
    setBusy(true);
    try {
      if (isEdit && user) {
        await adminService.updateUser(tenantId, user.id, {
          fullName, email, isActive: active, roleIds, newPassword: password || null,
        });
        onSaved('Kullanıcı güncellendi');
      } else {
        await adminService.createUser(tenantId, { username, password, email, fullName, roleIds });
        onSaved('Kullanıcı oluşturuldu');
      }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Kaydedilemedi'); setBusy(false); }
  };

  const del = async () => {
    if (!user) return;
    setBusy(true);
    try { await adminService.deleteUser(tenantId, user.id); onSaved('Kullanıcı silindi'); }
    catch (e) { onError(e instanceof Error ? e.message : 'Silinemedi'); setBusy(false); }
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold">{isEdit ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="space-y-4">
          {!isEdit && (
            <Field label="Kullanıcı Adı"><input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus /></Field>
          )}
          <Field label="Ad Soyad"><input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
          <Field label="E-posta"><input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label={isEdit ? 'Yeni Şifre (boş = değişmez)' : 'Şifre'}>
            <input type="text" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? '••••••' : 'En az 6 karakter'} />
          </Field>

          {/* Yetki (rol) seçimi = yetki kısma */}
          <div>
            <span className="text-sm font-medium text-gray-700">Yetkiler (Roller)</span>
            <div className="mt-2 space-y-2">
              {roles.map((r) => (
                <label key={r.id} className={`flex items-start gap-3 rounded-2xl px-4 py-3 cursor-pointer border transition-colors ${roleIds.includes(r.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                  <input type="checkbox" checked={roleIds.includes(r.id)} onChange={() => toggleRole(r.id)} className="w-5 h-5 rounded accent-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">{r.name}</div>
                    <div className="text-xs text-gray-400">{r.description || r.permissions.join(', ')}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
              <div className="font-medium text-sm">Aktif</div>
              <button onClick={() => setActive((a) => !a)} className={`w-12 h-7 rounded-full transition-colors relative ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${active ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          )}

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex gap-2 pt-1">
            {isEdit && <button onClick={del} disabled={busy} className="px-4 py-2.5 rounded-2xl font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">Sil</button>}
            <div className="flex-1" />
            <button onClick={onClose} className="px-4 py-2.5 rounded-2xl font-medium text-gray-500 hover:bg-gray-100">İptal</button>
            <button onClick={save} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
