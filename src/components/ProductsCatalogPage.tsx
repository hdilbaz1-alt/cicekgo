'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { productService, ProductDto, ProductCategoryDto, UnitDto } from '@/services/productService';
import { can, P } from '@/lib/permissions';
import { useEscClose } from '@/lib/useEscClose';
import * as XLSX from 'xlsx';
import { Upload, FileDown } from 'lucide-react';

const money = (n: number) => `${(n ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const fmtDateTime = (d?: string | null) => d ? new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

export default function ProductsCatalogPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<ProductCategoryDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<number | 'all'>('all');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ProductDto | null>(null);
  const [adding, setAdding] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [stockFor, setStockFor] = useState<ProductDto | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const canManage = can(P.productsManage);
  const canStock = can(P.stockManage);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [p, c, u] = await Promise.all([productService.list(search), productService.categories(), productService.units()]);
      setProducts(p); setCategories(c); setUnits(u);
    } catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.isActive).length,
    tracked: products.filter((p) => p.trackStock).length,
    critical: products.filter((p) => p.trackStock && p.currentStock <= p.criticalStockLevel).length,
  }), [products]);

  const visible = useMemo(
    () => catFilter === 'all' ? products : products.filter((p) => p.categoryId === catFilter),
    [products, catFilter]
  );

  const remove = async (p: ProductDto) => {
    if (!confirm(`"${p.name}" ürününü silmek istediğinize emin misiniz?`)) return;
    try { await productService.remove(p.id); showToast('Ürün silindi'); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Silinemedi'); }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        {/* Başlık */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ürünler</h1>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <button onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-3 rounded-2xl font-semibold active:scale-95 transition-all">
                <Upload className="w-5 h-5" /> İçe Aktar
              </button>
              <button onClick={() => setAdding(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Yeni Ürün
              </button>
            </div>
          )}
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatCard label="Toplam Ürün" value={stats.total} tone="bg-indigo-50 text-indigo-600" icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          <StatCard label="Aktif" value={stats.active} tone="bg-emerald-50 text-emerald-600" icon="M5 13l4 4L19 7" />
          <StatCard label="Stok Takipli" value={stats.tracked} tone="bg-violet-50 text-violet-600" icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          <StatCard label="Kritik Stok" value={stats.critical} tone="bg-rose-50 text-rose-600" icon="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
        </div>

        {/* Arama + kategori filtreleri */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <svg className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ürün ara…"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Chip active={catFilter === 'all'} onClick={() => setCatFilter('all')}>Tümü</Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={catFilter === c.id} onClick={() => setCatFilter(c.id)}>{c.name}</Chip>
            ))}
          </div>
        </div>

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {/* Ürün kartları */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-52 rounded-3xl bg-white/70 border border-slate-100 animate-pulse" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-14 text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 mx-auto mb-4 flex items-center justify-center text-2xl">🌸</div>
            <h3 className="text-lg font-semibold text-slate-800">Ürün bulunamadı</h3>
            <p className="text-slate-500 mt-1">{canManage ? 'İlk ürünü ekleyerek başla.' : 'Henüz ürün yok.'}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visible.map((p) => {
              const critical = p.trackStock && p.currentStock <= p.criticalStockLevel;
              return (
                <div key={p.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{p.name}</h3>
                        <div className="mt-1 flex items-center gap-2">
                          {p.categoryName && <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{p.categoryName}</span>}
                          {!p.isActive && <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">pasif</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold text-slate-900">{money(p.salePrice)}</div>
                        {p.unit && <div className="text-[11px] text-slate-400">/ {p.unit}</div>}
                      </div>
                    </div>

                    <div className="mt-4">
                      {p.trackStock ? (
                        <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl ${critical ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${critical ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          Stok: {p.currentStock}{critical ? ' · kritik' : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-sm text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl">Stok takibi yok</span>
                      )}
                    </div>

                    {/* Tarihler */}
                    <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-0.5">
                      <div>Eklendi: {fmtDate(p.createdAt)}{p.createdBy ? ` · ${p.createdBy}` : ''}</div>
                      {p.updatedAt && <div>Güncellendi: {fmtDateTime(p.updatedAt)}{p.updatedBy ? ` · ${p.updatedBy}` : ''}</div>}
                    </div>

                    {/* Aksiyonlar */}
                    {(canManage || (canStock && p.trackStock)) && (
                      <div className="mt-4 flex gap-2">
                        {canStock && p.trackStock && (
                          <button onClick={() => setStockFor(p)} className="flex-1 text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl py-2 transition-colors">Stok</button>
                        )}
                        {canManage && <button onClick={() => setEditing(p)} className="flex-1 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl py-2 transition-colors">Düzenle</button>}
                        {canManage && <button onClick={() => remove(p)} className="text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl py-2 px-3 transition-colors">Sil</button>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(adding || editing) && (
        <ProductForm product={editing} categories={categories} units={units}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={(m) => { setAdding(false); setEditing(null); showToast(m); load(); }}
          onCategoryAdded={load} />
      )}
      {importOpen && <ProductImportModal onClose={() => setImportOpen(false)} onDone={(m) => { setImportOpen(false); showToast(m); load(); }} />}
      {stockFor && <StockModal product={stockFor} onClose={() => setStockFor(null)} onSaved={(m) => { setStockFor(null); showToast(m); load(); }} />}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}

function StatCard({ label, value, tone, icon }: { label: string; value: number; tone: string; icon: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl ${tone} flex items-center justify-center shrink-0`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
      {children}
    </button>
  );
}

const inputCls = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white';

function ProductForm({ product, categories, units, onClose, onSaved, onCategoryAdded }: {
  product: ProductDto | null; categories: ProductCategoryDto[]; units: UnitDto[];
  onClose: () => void; onSaved: (m: string) => void; onCategoryAdded: () => void;
}) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState<number | ''>(product?.categoryId || '');
  const [salePrice, setSalePrice] = useState(product?.salePrice?.toString() || '');
  const [purchasePrice, setPurchasePrice] = useState(product?.purchasePrice?.toString() || '');
  const [unit, setUnit] = useState(product?.unit || (units[0]?.name ?? 'Adet'));
  const [trackStock, setTrackStock] = useState(product?.trackStock ?? false);
  const [currentStock, setCurrentStock] = useState(product?.currentStock?.toString() || '0');
  const [criticalLevel, setCriticalLevel] = useState(product?.criticalStockLevel?.toString() || '0');
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [newCat, setNewCat] = useState('');
  useEscClose(onClose);

  const addCat = async () => {
    if (!newCat.trim()) return;
    try { await productService.createCategory(newCat.trim()); setNewCat(''); onCategoryAdded(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Kategori eklenemedi'); }
  };

  const save = async () => {
    setErr('');
    if (!name.trim()) return setErr('Ürün adı gerekli');
    setBusy(true);
    const payload = {
      name: name.trim(),
      categoryId: categoryId === '' ? null : Number(categoryId),
      salePrice: Number(salePrice) || 0,
      purchasePrice: purchasePrice === '' ? null : Number(purchasePrice),
      unit,
      trackStock,
      currentStock: Number(currentStock) || 0,
      criticalStockLevel: Number(criticalLevel) || 0,
      isActive,
    };
    try {
      if (isEdit && product) { await productService.update(product.id, payload); onSaved('Ürün güncellendi'); }
      else { await productService.create(payload); onSaved('Ürün oluşturuldu'); }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Kaydedilemedi'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold">{isEdit ? 'Ürünü Düzenle' : 'Yeni Ürün'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-700">Ürün Adı</label><input className={inputCls + ' mt-1.5'} value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
          <div>
            <label className="text-sm font-medium text-slate-700">Kategori</label>
            <select className={inputCls + ' mt-1.5'} value={categoryId} onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">— Kategorisiz —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2 mt-2">
              <input className={inputCls} value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Yeni kategori ekle" />
              <button onClick={addCat} type="button" className="px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-sm font-medium">Ekle</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-slate-700">Satış Fiyatı</label><input type="number" className={inputCls + ' mt-1.5'} value={salePrice} onChange={(e) => setSalePrice(e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700">Alış Fiyatı</label><input type="number" className={inputCls + ' mt-1.5'} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} /></div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Birim</label>
            <select className={inputCls + ' mt-1.5'} value={unit} onChange={(e) => setUnit(e.target.value)}>
              {units.length === 0 && <option value="Adet">Adet</option>}
              {units.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">Birimler, Ayarlar bölümündeki Birim Ayarları menüsünden yönetilir.</p>
          </div>

          <label className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 cursor-pointer">
            <div><div className="font-medium text-sm">Stok Takibi</div><div className="text-xs text-slate-400">Kapalıysa siparişte stok düşmez</div></div>
            <input type="checkbox" checked={trackStock} onChange={(e) => setTrackStock(e.target.checked)} className="w-5 h-5 rounded accent-blue-600" />
          </label>
          {trackStock && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-slate-700">{isEdit ? 'Mevcut Stok (düzenlenmez)' : 'Açılış Stoğu'}</label><input type="number" disabled={isEdit} className={inputCls + ' mt-1.5 disabled:opacity-60'} value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} /></div>
              <div><label className="text-sm font-medium text-slate-700">Kritik Seviye</label><input type="number" className={inputCls + ' mt-1.5'} value={criticalLevel} onChange={(e) => setCriticalLevel(e.target.value)} /></div>
            </div>
          )}
          {isEdit && (
            <label className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 cursor-pointer">
              <div className="font-medium text-sm">Aktif</div>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-5 h-5 rounded accent-emerald-600" />
            </label>
          )}
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
            <button onClick={save} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StockModal({ product, onClose, onSaved }: { product: ProductDto; onClose: () => void; onSaved: (m: string) => void }) {
  const [type, setType] = useState('IN');
  const [qty, setQty] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEscClose(onClose);

  const save = async () => {
    setErr('');
    const q = Number(qty);
    if (!q || q <= 0) return setErr('Geçerli bir miktar girin');
    setBusy(true);
    try { await productService.addMovement({ productId: product.id, movementType: type, quantity: q, description: desc }); onSaved('Stok hareketi eklendi'); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Eklenemedi'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xl font-bold">Stok Hareketi</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        <p className="text-sm text-slate-500 mb-4">{product.name} · Mevcut: {product.currentStock} {product.unit}</p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">İşlem</label>
            <select className={inputCls + ' mt-1.5'} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="IN">Giriş (+)</option>
              <option value="OUT">Çıkış (−)</option>
              <option value="WASTE">Fire/Zayi (−)</option>
              <option value="ADJUST">Sayım/Düzeltme (= yeni değer)</option>
            </select>
          </div>
          <div><label className="text-sm font-medium text-slate-700">Miktar</label><input type="number" className={inputCls + ' mt-1.5'} value={qty} onChange={(e) => setQty(e.target.value)} autoFocus /></div>
          <div><label className="text-sm font-medium text-slate-700">Açıklama</label><input className={inputCls + ' mt-1.5'} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
            <button onClick={save} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? 'Kaydediliyor…' : 'Uygula'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductImportModal({ onClose, onDone }: { onClose: () => void; onDone: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  useEscClose(onClose);

  const downloadTemplate = () => {
    const aoa = [
      ['Ürün Adı', 'Satış Fiyatı', 'Alış Fiyatı'],
      ['Kırmızı Gül', 150, 90],
      ['Beyaz Lilyum', 220, 130],
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
    XLSX.writeFile(wb, 'urun_sablonu.xlsx');
  };

  const handleFile = async (file: File) => {
    setErr(''); setBusy(true); setFileName(file.name); setProgress(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, blankrows: false });
      if (rows.length < 2) throw new Error('Dosyada veri satırı yok.');

      // Başlık eşleştirme (yoksa sıra: ad, satış, alış)
      const head = (rows[0] || []).map((h) => String(h).toLocaleLowerCase('tr'));
      const findIdx = (kw: string[], def: number) => {
        const i = head.findIndex((h) => kw.some((k) => h.includes(k)));
        return i >= 0 ? i : def;
      };
      const ni = findIdx(['ürün', 'urun', 'ad'], 0);
      const si = findIdx(['satış', 'satis'], 1);
      const pi = findIdx(['alış', 'alis'], 2);

      const num = (v: unknown) => {
        if (v == null || v === '') return 0;
        const n = Number(String(v).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
        return isNaN(n) ? 0 : n;
      };

      const items = rows.slice(1)
        .map((r) => ({ name: String(r[ni] ?? '').trim(), sale: num(r[si]), purchase: num(r[pi]) }))
        .filter((x) => x.name);

      if (items.length === 0) throw new Error('Geçerli ürün satırı bulunamadı.');

      let ok = 0, fail = 0;
      setProgress({ done: 0, total: items.length });
      for (const it of items) {
        try {
          await productService.create({
            name: it.name,
            salePrice: it.sale,
            purchasePrice: it.purchase || null,
            unit: 'Adet',
            trackStock: false,
            currentStock: 0,
            criticalStockLevel: 0,
            categoryId: null,
            isActive: true,
          });
          ok++;
        } catch { fail++; }
        setProgress({ done: ok + fail, total: items.length });
      }
      onDone(`${ok} ürün içe aktarıldı${fail ? `, ${fail} başarısız` : ''}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Dosya okunamadı');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Upload className="w-5 h-5" /></div>
          <h3 className="text-lg font-bold text-slate-900">Excel ile İçe Aktar</h3>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 space-y-1.5">
          <p>Yalnızca <b>Ürün Adı</b>, <b>Satış Fiyatı</b> ve <b>Alış Fiyatı</b> girilir.</p>
          <p className="text-slate-500">İçe aktarılan ürünler otomatik olarak: birim <b>Adet</b>, <b>stok takibi kapalı</b> ve <b>kategorisiz</b> eklenir. Sonradan düzenleyebilirsiniz.</p>
        </div>

        <button onClick={downloadTemplate} className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-2xl font-medium">
          <FileDown className="w-4 h-4" /> Örnek Excel İndir
        </button>

        <label className={`mt-3 block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${busy ? 'border-slate-200 opacity-60' : 'border-indigo-200 hover:bg-indigo-50/50'}`}>
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <Upload className="w-7 h-7 mx-auto text-indigo-400 mb-2" />
          <div className="text-sm font-medium text-slate-700">{fileName || 'Doldurduğun Excel’i seç'}</div>
          <div className="text-xs text-slate-400 mt-0.5">.xlsx, .xls veya .csv</div>
        </label>

        {progress && <div className="mt-3 text-sm text-slate-600 text-center">{progress.done}/{progress.total} ürün işleniyor…</div>}
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="flex justify-end mt-5">
          <button onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50">{busy ? 'İçe aktarılıyor…' : 'Kapat'}</button>
        </div>
      </div>
    </div>
  );
}
