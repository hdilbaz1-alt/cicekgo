'use client';
import { apiFetch } from '@/lib/api';
import { useEffect, useState } from 'react';
import { can, P } from '@/lib/permissions';
import { getApiUrl, getEndpoint } from '@/config/api';
import { accountService, type AccountMe } from '@/services/accountService';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import LogoUploader from '@/components/logo/LogoUploader';
import LogoPreview from '@/components/logo/LogoPreview';
import { permLabel } from '@/lib/permissionMeta';
import {
  User as UserIcon, Mail, CalendarDays, ShieldCheck, Clock, BadgeCheck, KeyRound,
  Building2, Pencil, Save, X, type LucideIcon,
} from 'lucide-react';

const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm';
const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString('tr-TR') : '—');

function InfoRow({ Icon, label, children }: { Icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-slate-50 last:border-0">
      <span className="flex items-center gap-2.5 text-sm text-slate-500"><Icon className="w-4 h-4 text-slate-400" />{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right">{children}</span>
    </div>
  );
}

export default function AccountPage({ onNavigate }: { onNavigate?: (page: string, opts?: Record<string, unknown>) => void }) {
  const [me, setMe] = useState<AccountMe | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const note = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2800); };
  void onNavigate;

  useEffect(() => { accountService.me().then(setMe); }, []);

  // Hesap bilgileri düzenleme
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const startEdit = () => { setFullName(me?.fullName || ''); setEmail(me?.email || ''); setEditing(true); };
  const saveProfile = async () => {
    setSavingProfile(true);
    const r = await accountService.updateProfile({ fullName: fullName.trim(), email: email.trim() || null });
    setSavingProfile(false);
    if (r.ok) { if (r.data) setMe(r.data); setEditing(false); note('Bilgiler güncellendi'); }
    else note(r.message || 'Güncellenemedi');
  };

  // Şifre değiştir
  const [curPw, setCurPw] = useState(''); const [newPw, setNewPw] = useState(''); const [newPw2, setNewPw2] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const changePw = async () => {
    if (newPw.length < 6) return note('Yeni şifre en az 6 karakter olmalı');
    if (newPw !== newPw2) return note('Yeni şifreler eşleşmiyor');
    setSavingPw(true);
    const r = await accountService.changePassword(curPw, newPw);
    setSavingPw(false);
    if (r.ok) { setCurPw(''); setNewPw(''); setNewPw2(''); note('Şifre değiştirildi ✓'); }
    else note(r.message || 'Değiştirilemedi');
  };

  // Firma ayarları
  const canManage = can(P.settingsManage);
  const canViewLicense = can(P.licenseView);
  const [coName, setCoName] = useState(''); const [coLogo, setCoLogo] = useState<string | null>(null);
  const [coLoaded, setCoLoaded] = useState(false); const [savingCo, setSavingCo] = useState(false);
  const loadCompany = async () => {
    try {
      const res = await apiFetch(getApiUrl(getEndpoint('COMPANY_PROFILE')));
      const b = await res.json();
      if (b?.success) { setCoName(b.data.name || ''); setCoLogo(b.data.logoBase64 || null); }
    } catch { /* yoksay */ } finally { setCoLoaded(true); }
  };
  useEffect(() => { if (canManage) loadCompany(); }, [canManage]);
  const saveCompany = async () => {
    setSavingCo(true);
    try {
      // Yeni akışta şeffaflık doğrudan PNG'ye işleniyor → logoRemoveBg=false
      const res = await apiFetch(getApiUrl(getEndpoint('COMPANY_PROFILE')), { method: 'PUT', body: JSON.stringify({ name: coName, logoBase64: coLogo ?? '', logoRemoveBg: false }) });
      const b = await res.json();
      if (res.ok && b?.success) {
        try { const ti = JSON.parse(localStorage.getItem('tenantInfo') || '{}'); ti.name = b.data.name; ti.logoBase64 = b.data.logoBase64; ti.logoRemoveBg = b.data.logoRemoveBg; localStorage.setItem('tenantInfo', JSON.stringify(ti)); } catch { /* yoksay */ }
        // Topbar'ı (Header) anında güncelle
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('tenantinfo:update'));
        note('Firma bilgileri kaydedildi');
      } else note(b?.message || 'Kaydedilemedi');
    } catch { note('Bağlantı hatası'); } finally { setSavingCo(false); }
  };

  const remainingDays = me?.lkEnd ? Math.max(0, Math.ceil((new Date(me.lkEnd).getTime() - Date.now()) / 86400000)) : null;
  const licenseActive = remainingDays === null ? true : remainingDays > 0;

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8 max-w-[920px]">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Hesap Ayarları</h1>
        <p className="text-slate-500 text-sm mb-6">Hesap, lisans ve firma ayarlarınızı buradan yönetebilirsiniz.</p>

        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account"><UserIcon className="w-4 h-4" /> Hesap Bilgileri</TabsTrigger>
            {canViewLicense && <TabsTrigger value="license"><BadgeCheck className="w-4 h-4" /> Lisans Bilgileri</TabsTrigger>}
            <TabsTrigger value="user"><ShieldCheck className="w-4 h-4" /> Kullanıcı Bilgileri</TabsTrigger>
            <TabsTrigger value="password"><KeyRound className="w-4 h-4" /> Şifre Değiştir</TabsTrigger>
            {canManage && <TabsTrigger value="company"><Building2 className="w-4 h-4" /> Firma Ayarları</TabsTrigger>}
          </TabsList>

          {/* Hesap Bilgileri */}
          <TabsContent value="account">
            <Card className="p-6 max-w-[560px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900">Hesap Bilgilerim</h3>
                {!editing && <button onClick={startEdit} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl"><Pencil className="w-3.5 h-3.5" /> Düzenle</button>}
              </div>
              {!editing ? (
                <div>
                  <InfoRow Icon={UserIcon} label="Ad Soyad">{me?.fullName || '—'}</InfoRow>
                  <InfoRow Icon={Mail} label="E-posta">{me?.email || '—'}</InfoRow>
                  <InfoRow Icon={UserIcon} label="Kullanıcı Adı">{me?.username || '—'}</InfoRow>
                  <InfoRow Icon={CalendarDays} label="Kayıt Tarihi">{fmtDate(me?.createdAtUtc)}</InfoRow>
                  <InfoRow Icon={ShieldCheck} label="Kullanıcı Rolü">
                    {(me?.roles?.length ? me.roles : ['—']).map((r) => (
                      <span key={r} className="inline-block ml-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">{r}</span>
                    ))}
                  </InfoRow>
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  <div><label className="text-xs font-medium text-slate-600">Ad Soyad</label><input className={inputCls + ' mt-1'} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad Soyad" /></div>
                  <div><label className="text-xs font-medium text-slate-600">E-posta</label><input className={inputCls + ' mt-1'} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@firma.com" type="email" /></div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveProfile} disabled={savingProfile} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-50"><Save className="w-4 h-4" />{savingProfile ? 'Kaydediliyor…' : 'Kaydet'}</button>
                    <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 text-slate-500 px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-slate-100"><X className="w-4 h-4" />İptal</button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Lisans Bilgileri */}
          {canViewLicense && <TabsContent value="license">
            <Card className="p-6 max-w-[560px]">
              <h3 className="font-semibold text-slate-900 mb-2">Lisans Bilgilerim</h3>
              <InfoRow Icon={BadgeCheck} label="Lisans Durumu">
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${licenseActive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>{licenseActive ? 'Aktif' : 'Süresi Doldu'}</span>
              </InfoRow>
              <InfoRow Icon={CalendarDays} label="Başlangıç Tarihi">{fmtDate(me?.lkStart)}</InfoRow>
              <InfoRow Icon={CalendarDays} label="Bitiş Tarihi">{fmtDate(me?.lkEnd)}</InfoRow>
              <InfoRow Icon={Clock} label="Kalan Gün">
                <span className={remainingDays !== null && remainingDays <= 7 ? 'text-rose-600' : 'text-emerald-600'}>{remainingDays === null ? '—' : `${remainingDays} gün`}</span>
              </InfoRow>
              <InfoRow Icon={Building2} label="Firma">{me?.tenantName || '—'}</InfoRow>
            </Card>
          </TabsContent>}

          {/* Kullanıcı Bilgileri */}
          <TabsContent value="user">
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Roller</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {(me?.roles?.length ? me.roles : ['—']).map((r) => (
                  <span key={r} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full"><ShieldCheck className="w-4 h-4" />{r}</span>
                ))}
              </div>
              <h3 className="font-semibold text-slate-900 mb-3">İzinler <span className="text-xs font-normal text-slate-400">({me?.permissions?.length || 0})</span></h3>
              {me?.permissions?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {me.permissions.map((p) => (
                    <span key={p} title={p} className="inline-flex items-center gap-1.5 text-sm text-slate-700 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> <span className="truncate">{permLabel(p)}</span>
                    </span>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400">İzin bilgisi yok.</p>}
            </Card>
          </TabsContent>

          {/* Şifre Değiştir */}
          <TabsContent value="password">
            <Card className="p-6 max-w-[480px]">
              <h3 className="font-semibold text-slate-900 mb-4">Şifre Değiştir</h3>
              <div className="space-y-3">
                <div><label className="text-xs font-medium text-slate-600">Mevcut Şifre</label><input type="password" className={inputCls + ' mt-1'} value={curPw} onChange={(e) => setCurPw(e.target.value)} autoComplete="current-password" /></div>
                <div><label className="text-xs font-medium text-slate-600">Yeni Şifre</label><input type="password" className={inputCls + ' mt-1'} value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" placeholder="En az 6 karakter" /></div>
                <div><label className="text-xs font-medium text-slate-600">Yeni Şifre (Tekrar)</label><input type="password" className={inputCls + ' mt-1'} value={newPw2} onChange={(e) => setNewPw2(e.target.value)} autoComplete="new-password" /></div>
                <button onClick={changePw} disabled={savingPw || !curPw || !newPw} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-50"><KeyRound className="w-4 h-4" />{savingPw ? 'Kaydediliyor…' : 'Şifreyi Değiştir'}</button>
              </div>
            </Card>
          </TabsContent>

          {/* Firma Ayarları */}
          {canManage && (
            <TabsContent value="company">
              <Card className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Firma Ayarları</h3>
                {!coLoaded ? <p className="text-sm text-slate-400">Yükleniyor…</p> : (
                  <div className="grid lg:grid-cols-2 gap-6 items-start">
                    {/* Sol: form */}
                    <div className="space-y-5">
                      <div><label className="text-xs font-medium text-slate-600">Firma Adı</label><input className={inputCls + ' mt-1'} value={coName} onChange={(e) => setCoName(e.target.value)} placeholder="Firma adı" /></div>
                      <LogoUploader value={coLogo} name={coName} onChange={setCoLogo} onMessage={note} showPreview={false} />
                      <button onClick={saveCompany} disabled={savingCo} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-50"><Save className="w-4 h-4" />{savingCo ? 'Kaydediliyor…' : 'Kaydet'}</button>
                    </div>
                    {/* Sağ: web sitesi önizleme (canlı, açık tema) */}
                    <div className="lg:sticky lg:top-4">
                      <span className="text-xs font-medium text-slate-600">Web Sitesi Önizleme</span>
                      <div className="mt-1.5"><LogoPreview src={coLogo} name={coName} /></div>
                      <p className="text-[11px] text-slate-400 mt-1.5">Logonuzun üst barda nasıl görüneceğinin canlı örneği.</p>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
      {toast && <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}
