'use client';

import { useCallback, useEffect, useState } from 'react';
import { templateService, PrintTemplate } from '@/services/templateService';
import { can, P } from '@/lib/permissions';
import PrintDesigner from './PrintDesigner';
import { parseDoc } from '@/lib/printDoc';
import { Plus, Pencil, Trash2, Star, FileText, LayoutTemplate } from 'lucide-react';

export default function PrintTemplatesPage() {
  const [items, setItems] = useState<PrintTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [designer, setDesigner] = useState<{ open: boolean; template: PrintTemplate | null }>({ open: false, template: null });
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };
  const canManage = can(P.settingsManage);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await templateService.list()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (t: PrintTemplate) => {
    if (!confirm(`"${t.name}" şablonunu silmek istediğinize emin misiniz?`)) return;
    try { await templateService.remove(t.id); showToast('Silindi'); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Silinemedi'); }
  };
  const setDefault = async (t: PrintTemplate) => {
    try { await templateService.setDefault(t.id); showToast('Varsayılan yapıldı'); load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Olmadı'); }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Yazdırma Şablonları</h1>
          {canManage && (
            <button onClick={() => setDesigner({ open: true, template: null })}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
              <Plus className="w-5 h-5" /> Yeni Şablon
            </button>
          )}
        </div>

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-40 rounded-3xl" />)}</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 mx-auto mb-4 flex items-center justify-center"><LayoutTemplate className="w-7 h-7" /></div>
            <h3 className="text-base font-semibold text-slate-800">Şablon yok</h3>
            <p className="text-sm text-slate-400 mt-1">Sürükle-bırak tasarımcı ile ilk şablonunu oluştur.</p>
            {canManage && <button onClick={() => setDesigner({ open: true, template: null })} className="mt-5 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-semibold"><Plus className="w-4 h-4" /> Yeni Şablon</button>}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((t) => {
              const hasDesign = !!parseDoc(t.elementsJson);
              return (
                <div key={t.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><FileText className="w-6 h-6" /></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 truncate flex items-center gap-2">
                        {t.name}
                        {t.isDefault && <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Star className="w-3 h-3" />Varsayılan</span>}
                      </h3>
                      <p className="text-sm text-slate-500">{t.paperType} · {t.rotation === 'Yatay' ? 'Yatay' : 'Dikey'} · {hasDesign ? 'Tasarımcı' : 'Klasik'}</p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button onClick={() => setDesigner({ open: true, template: t })} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-xl hover:bg-indigo-100"><Pencil className="w-4 h-4" />Düzenle</button>
                      {!t.isDefault && <button onClick={() => setDefault(t)} title="Varsayılan yap" className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl"><Star className="w-4 h-4" /></button>}
                      <button onClick={() => remove(t)} title="Sil" className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {designer.open && (
        <PrintDesigner template={designer.template} onClose={() => setDesigner({ open: false, template: null })}
          onSaved={() => { setDesigner({ open: false, template: null }); showToast('Şablon kaydedildi'); load(); }} />
      )}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}
