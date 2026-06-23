'use client';
import { apiFetch } from '@/lib/api';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getApiUrl, getEndpoint } from '@/config/api';
import { can, P } from '@/lib/permissions';
import { useEscClose } from '@/lib/useEscClose';

interface TenantInfo { name: string; lkStart: string; lkEnd: string; isExpired?: boolean; logoBase64?: string | null; logoRemoveBg?: boolean }
interface ProfileModalProps { isOpen: boolean; onClose: () => void; tenantInfo: TenantInfo | null; remainingDays: number }

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';

export default function ProfileModal({ isOpen, onClose, tenantInfo, remainingDays }: ProfileModalProps) {
  const canManageCompany = can(P.settingsManage);
  const [tab, setTab] = useState<'license' | 'company'>('license');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    if (isOpen) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  useEffect(() => { if (isOpen) setTab('license'); }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Lisans yüzdesi
  let pct = 100;
  if (tenantInfo?.lkStart && tenantInfo?.lkEnd) {
    const s = new Date(tenantInfo.lkStart).getTime(), e = new Date(tenantInfo.lkEnd).getTime(), now = Date.now();
    pct = e <= s ? 100 : Math.max(0, Math.min(100, Math.round(((e - now) / (e - s)) * 100)));
  }
  const ringColor = remainingDays > 7 ? '#10b981' : remainingDays > 3 ? '#f59e0b' : '#ef4444';

  return createPortal((
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg sm:my-6 max-h-[92dvh] overflow-y-auto">
        {/* Üst */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-5 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl leading-none">×</button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center overflow-hidden">
              {tenantInfo?.logoBase64
                ? <img src={tenantInfo.logoBase64} alt="" className="max-h-10 max-w-10 object-contain" style={tenantInfo.logoRemoveBg ? { mixBlendMode: 'screen' } : undefined} />
                : <span className="text-xl font-bold">{(tenantInfo?.name || 'Ç').charAt(0)}</span>}
            </div>
            <div>
              <div className="text-lg font-bold leading-tight">{tenantInfo?.name || 'Profil'}</div>
              <div className="text-white/70 text-xs">Firma Profili</div>
            </div>
          </div>
        </div>

        {/* Sekmeler */}
        {canManageCompany && (
          <div className="flex border-b border-slate-100 px-6">
            <Tab active={tab === 'license'} onClick={() => setTab('license')}>Lisans</Tab>
            <Tab active={tab === 'company'} onClick={() => setTab('company')}>Firma Profili</Tab>
          </div>
        )}

        <div className="p-6">
          {tab === 'license' || !canManageCompany ? (
            <div className="space-y-5">
              <div className="flex items-center gap-5">
                <Ring pct={pct} color={ringColor} label={`${remainingDays}`} sub="gün" />
                <div className="space-y-2 text-sm flex-1">
                  <Row label="Lisans Başlangıç" value={fmtDate(tenantInfo?.lkStart)} />
                  <Row label="Lisans Bitiş" value={fmtDate(tenantInfo?.lkEnd)} />
                  <Row label="Kalan Süre" value={`${remainingDays} gün`} valueClass={remainingDays > 7 ? 'text-emerald-600' : remainingDays > 3 ? 'text-amber-600' : 'text-red-600'} />
                </div>
              </div>
              {tenantInfo?.isExpired && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">Lisans süreniz dolmuştur!</div>
              )}
            </div>
          ) : (
            <CompanyTab onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  ), document.body);
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{children}</button>
  );
}
function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return <div className="flex justify-between"><span className="text-slate-500">{label}</span><span className={`font-medium ${valueClass || 'text-slate-800'}`}>{value}</span></div>;
}
function Ring({ pct, color, label, sub }: { pct: number; color: string; label: string; sub: string }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#eef0f3" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - c * pct / 100} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-900 leading-none">{label}</span>
        <span className="text-[11px] text-slate-400">{sub}</span>
      </div>
    </div>
  );
}

/* ===================== Firma Profili sekmesi ===================== */
function CompanyTab({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [removeBg, setRemoveBg] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(getApiUrl(getEndpoint('COMPANY_PROFILE')), { headers: headers() });
      const b = await res.json();
      if (b.success) { setName(b.data.name); setLogo(b.data.logoBase64); setRemoveBg(b.data.logoRemoveBg); }
    } catch { /* yoksay */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setErr('Lütfen görsel seçin.');
    if (file.size > 2 * 1024 * 1024) return setErr('En fazla 2 MB.');
    setErr('');
    const reader = new FileReader();
    reader.onload = () => setCropSrc(String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const res = await apiFetch(getApiUrl(getEndpoint('COMPANY_PROFILE')), {
        method: 'PUT', headers: headers(), body: JSON.stringify({ name, logoBase64: logo ?? '', logoRemoveBg: removeBg }),
      });
      const b = await res.json();
      if (!res.ok || b.success === false) throw new Error(b.message || 'Kaydedilemedi');
      try {
        const ti = JSON.parse(localStorage.getItem('tenantInfo') || '{}');
        ti.name = b.data.name; ti.logoBase64 = b.data.logoBase64; ti.logoRemoveBg = b.data.logoRemoveBg;
        localStorage.setItem('tenantInfo', JSON.stringify(ti));
      } catch { /* yoksay */ }
      setTimeout(() => window.location.reload(), 600);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Kaydedilemedi'); setBusy(false); }
  };

  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white';
  const checker = 'repeating-conic-gradient(#e2e8f0 0% 25%, #f8fafc 0% 50%) 50% / 14px 14px';

  if (loading) return <div className="h-40 rounded-2xl bg-slate-50 animate-pulse" />;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-600">Firma Adı</label>
        <input className={inputCls + ' mt-1'} value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600">Logo</label>
        <div className="mt-1 rounded-2xl border border-slate-200 p-4 flex items-center gap-4" style={{ background: checker }}>
          <div className="h-16 w-44 flex items-center justify-center bg-white/40 rounded-lg overflow-hidden">
            {logo ? <img src={logo} alt="logo" className="max-h-16 max-w-full object-contain" style={removeBg ? { mixBlendMode: 'multiply' } : undefined} /> : <span className="text-slate-400 text-xs">Logo yok</span>}
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Görsel Seç</button>
            {logo && <button onClick={() => setLogo(null)} className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-sm font-medium">Kaldır</button>}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); if (fileRef.current) fileRef.current.value=''; }} />
          </div>
        </div>
      </div>

      <label className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 cursor-pointer">
        <div><div className="font-medium text-sm">Arka planı kaldır</div><div className="text-xs text-slate-400">Beyaz zeminli logoyu şeffaf gibi gösterir</div></div>
        <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="w-5 h-5 rounded accent-blue-600" />
      </label>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="px-5 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">Kapat</button>
        <button onClick={save} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-semibold shadow-lg shadow-blue-600/25 disabled:opacity-50">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
      </div>

      {cropSrc && <LogoCropper src={cropSrc} onCancel={() => setCropSrc(null)} onApply={(b64) => { setLogo(b64); setCropSrc(null); }} />}
    </div>
  );
}

/* ===================== Logo Kırpıcı ===================== */
const BOX_W = 300, BOX_H = 84;
function LogoCropper({ src, onApply, onCancel }: { src: string; onApply: (b64: string) => void; onCancel: () => void }) {
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  useEscClose(onCancel);

  const onImgLoad = () => {
    const im = imgRef.current; if (!im) return;
    const nw = im.naturalWidth, nh = im.naturalHeight;
    const cover = Math.max(BOX_W / nw, BOX_H / nh);
    setNat({ w: nw, h: nh }); setMinScale(cover); setScale(cover);
    setTx((BOX_W - nw * cover) / 2); setTy((BOX_H - nh * cover) / 2);
  };

  const onDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, tx, ty }; (e.target as HTMLElement).setPointerCapture(e.pointerId); };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setTx(drag.current.tx + (e.clientX - drag.current.x));
    setTy(drag.current.ty + (e.clientY - drag.current.y));
  };
  const onUp = () => { drag.current = null; };

  const apply = () => {
    const k = 2; // çıktı kalitesi
    const canvas = document.createElement('canvas');
    canvas.width = BOX_W * k; canvas.height = BOX_H * k;
    const ctx = canvas.getContext('2d'); if (!ctx || !imgRef.current) return;
    ctx.drawImage(imgRef.current, tx * k, ty * k, nat.w * scale * k, nat.h * scale * k);
    onApply(canvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-1">Logoyu Kırp</h3>
        <p className="text-xs text-slate-400 mb-4">Sürükleyerek konumlandır, yakınlaştır. Üst bar oranında kırpılır.</p>
        <div className="mx-auto rounded-2xl border-2 border-blue-500 overflow-hidden touch-none select-none" style={{ width: BOX_W, height: BOX_H, background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #f8fafc 0% 50%) 50% / 14px 14px', cursor: 'grab' }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={src} alt="crop" onLoad={onImgLoad} draggable={false}
            style={{ position: 'relative', left: tx, top: ty, width: nat.w * scale, height: nat.h * scale, maxWidth: 'none' }} />
        </div>
        <div className="flex items-center gap-3 mt-4">
          <span className="text-xs text-slate-400">Yakınlaştır</span>
          <input type="range" min={minScale} max={minScale * 4} step={0.01} value={scale}
            onChange={(e) => setScale(Number(e.target.value))} className="flex-1 accent-blue-600" />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
          <button onClick={apply} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-semibold">Kırp & Kullan</button>
        </div>
      </div>
    </div>
  );
}
