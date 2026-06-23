'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { customerService, CustomerGroup, Customer, CustomerGroupMember } from '@/services/customerService';
import { useNotification } from '@/components/NotificationSystem';
import { can, P } from '@/lib/permissions';
import { useEscClose } from '@/lib/useEscClose';
import { SkeletonCards, EmptyState } from './ui/Skeleton';
import { Plus, Search, Users, UserPlus, Trash2, ChevronDown, X, Check } from 'lucide-react';

const AVATAR_TONES = [
  'bg-indigo-50 text-indigo-600', 'bg-emerald-50 text-emerald-600', 'bg-amber-50 text-amber-600',
  'bg-rose-50 text-rose-600', 'bg-violet-50 text-violet-600', 'bg-sky-50 text-sky-600',
];
const toneFor = (name: string) => AVATAR_TONES[(name.charCodeAt(0) || 0) % AVATAR_TONES.length];

export default function CustomerGroupsPage() {
  const { showNotification, showConfirm } = useNotification();
  const canManage = can(P.customersUpdate);

  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [members, setMembers] = useState<CustomerGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [deletingGroup, setDeletingGroup] = useState<number | null>(null);

  // Yeni grup modalı
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Üye ekleme modalı
  const [memberModalGroup, setMemberModalGroup] = useState<CustomerGroup | null>(null);
  const [available, setAvailable] = useState<Customer[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [addingMembers, setAddingMembers] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [gRes, mRes] = await Promise.all([
        customerService.getCustomerGroupList(),
        customerService.getCustomerGroups({ page: 1, pageSize: 500 }).catch(() => null),
      ]);
      const list = Array.isArray(gRes.data) ? gRes.data
        : (gRes.data && typeof gRes.data === 'object' && 'items' in gRes.data ? (gRes.data as { items: CustomerGroup[] }).items : []);
      setGroups(list || []);
      setMembers(mRes?.success ? (mRes.data.items || []) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Müşteri grupları yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const membersByGroup = useMemo(() => {
    const map = new Map<number, CustomerGroupMember[]>();
    members.forEach((m) => { const a = map.get(m.groupId) || []; a.push(m); map.set(m.groupId, a); });
    return map;
  }, [members]);

  const filteredGroups = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.groupName.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q));
  }, [groups, searchTerm]);

  const toggle = (id: number) => setExpanded((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  // ── Yeni grup ──
  const submitGroup = async () => {
    if (!newName.trim()) {
      showNotification({ type: 'warning', title: 'Uyarı', message: 'Grup adı gereklidir' });
      return;
    }
    setSaving(true);
    try {
      const res = await customerService.addCustomerGroup({ groupName: newName.trim(), description: newDesc.trim() });
      if (res.success) {
        setIsAddOpen(false); setNewName(''); setNewDesc('');
        showNotification({ type: 'success', title: 'Başarılı', message: 'Grup oluşturuldu' });
        await loadAll();
      } else {
        showNotification({ type: 'error', title: 'Hata', message: res.message || 'Grup oluşturulamadı' });
      }
    } catch (err) {
      showNotification({ type: 'error', title: 'Hata', message: err instanceof Error ? err.message : 'Grup oluşturulamadı' });
    } finally { setSaving(false); }
  };

  const deleteGroup = (g: CustomerGroup) => {
    showConfirm({
      title: 'Grubu Sil', message: `"${g.groupName}" grubunu silmek istediğinize emin misiniz? Üyelikler de silinir.`,
      confirmText: 'Sil', cancelText: 'İptal',
      onConfirm: async () => {
        setDeletingGroup(g.id);
        try {
          const res = await customerService.deleteCustomerGroup(g.id);
          if (res.success) { showNotification({ type: 'success', title: 'Başarılı', message: 'Grup silindi' }); await loadAll(); }
          else showNotification({ type: 'error', title: 'Hata', message: res.message || 'Grup silinemedi' });
        } catch (err) {
          showNotification({ type: 'error', title: 'Hata', message: err instanceof Error ? err.message : 'Grup silinemedi' });
        } finally { setDeletingGroup(null); }
      },
    });
  };

  // ── Üye ekleme ──
  const openMemberModal = async (g: CustomerGroup) => {
    setMemberModalGroup(g); setPicked([]); setMemberSearch('');
    try {
      const res = await customerService.getAvailableCustomers();
      if (res.success) {
        const existing = new Set((membersByGroup.get(g.id) || []).map((m) => m.customerId));
        setAvailable(res.data.filter((c) => !existing.has(c.customerId)));
      }
    } catch (err) {
      showNotification({ type: 'error', title: 'Hata', message: err instanceof Error ? err.message : 'Müşteriler yüklenemedi' });
    }
  };

  const submitMembers = async () => {
    if (!memberModalGroup || picked.length === 0) {
      showNotification({ type: 'warning', title: 'Uyarı', message: 'En az bir müşteri seçin' });
      return;
    }
    setAddingMembers(true);
    let ok = 0, fail = 0;
    for (const customerId of picked) {
      try { await customerService.addCustomerToGroup({ groupId: memberModalGroup.id, customerId }); ok++; }
      catch { fail++; }
    }
    setAddingMembers(false);
    if (ok > 0) {
      showNotification({ type: 'success', title: 'Başarılı', message: `${ok} müşteri eklendi${fail ? `, ${fail} eklenemedi` : ''}` });
      setExpanded((prev) => new Set(prev).add(memberModalGroup.id));
      setMemberModalGroup(null); setPicked([]);
      await loadAll();
    } else {
      showNotification({ type: 'error', title: 'Hata', message: 'Hiçbir müşteri eklenemedi' });
    }
  };

  const visibleAvailable = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    return q ? available.filter((c) => c.customerName.toLowerCase().includes(q)) : available;
  }, [available, memberSearch]);

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        {/* Başlık */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Müşteri Grupları</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Grup ara…"
                className="w-full sm:w-72 pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {canManage && (
              <button onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                <Plus className="w-5 h-5" /> Yeni Grup
              </button>
            )}
          </div>
        </div>

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {loading ? (
          <SkeletonCards count={6} />
        ) : filteredGroups.length === 0 ? (
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="Grup bulunamadı"
            hint={searchTerm ? 'Arama kriterlerine uygun grup yok.' : 'İlk müşteri grubunu oluşturarak başla.'}
            action={canManage && !searchTerm ? (
              <button onClick={() => setIsAddOpen(true)} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-semibold"><Plus className="w-4 h-4" /> Yeni Grup</button>
            ) : undefined}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredGroups.map((g) => {
              const gm = membersByGroup.get(g.id) || [];
              const open = expanded.has(g.id);
              return (
                <div key={g.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${toneFor(g.groupName)}`}>
                        {g.groupName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 truncate">{g.groupName}</h3>
                        <p className="text-sm text-slate-500 truncate">{g.description || 'Açıklama yok'}</p>
                      </div>
                      {canManage && (
                        <button onClick={() => deleteGroup(g)} disabled={deletingGroup === g.id}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50" title="Grubu sil">
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                        <Users className="w-3.5 h-3.5" /> {gm.length} üye
                      </span>
                      <span className="text-[11px] text-slate-400">{new Date(g.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {canManage && (
                        <button onClick={() => openMemberModal(g)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-xl hover:bg-indigo-100 transition-colors">
                          <UserPlus className="w-4 h-4" /> Üye Ekle
                        </button>
                      )}
                      <button onClick={() => toggle(g.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-100 transition-colors">
                        Üyeler <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
                      {gm.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-3">Bu grupta üye yok.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                          {gm.map((m) => (
                            <div key={m.id} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 border border-slate-100">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${toneFor(m.customerName)}`}>
                                {m.customerName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-slate-700 truncate">{m.customerName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Yeni Grup Modal */}
      {isAddOpen && (
        <GroupAddModal
          name={newName} desc={newDesc} saving={saving}
          onName={setNewName} onDesc={setNewDesc}
          onClose={() => setIsAddOpen(false)} onSubmit={submitGroup}
        />
      )}

      {/* Üye Ekle Modal */}
      {memberModalGroup && (
        <MemberAddModal
          group={memberModalGroup}
          customers={visibleAvailable}
          allCount={available.length}
          picked={picked}
          search={memberSearch}
          adding={addingMembers}
          onSearch={setMemberSearch}
          onToggle={(id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
          onClose={() => setMemberModalGroup(null)}
          onSubmit={submitMembers}
        />
      )}
    </div>
  );
}

function GroupAddModal({ name, desc, saving, onName, onDesc, onClose, onSubmit }: {
  name: string; desc: string; saving: boolean;
  onName: (v: string) => void; onDesc: (v: string) => void; onClose: () => void; onSubmit: () => void;
}) {
  useEscClose(onClose);
  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Yeni Grup</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Grup Adı</label>
            <input value={name} onChange={(e) => onName(e.target.value)} autoFocus placeholder="Örn. VIP Müşteriler" className={inputCls + ' mt-1'} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Açıklama <span className="text-slate-400 font-normal">(opsiyonel)</span></label>
            <textarea value={desc} onChange={(e) => onDesc(e.target.value)} rows={3} placeholder="Grup açıklaması" className={inputCls + ' mt-1'} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
          <button onClick={onSubmit} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">
            {saving ? 'Kaydediliyor…' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberAddModal({ group, customers, allCount, picked, search, adding, onSearch, onToggle, onClose, onSubmit }: {
  group: CustomerGroup; customers: Customer[]; allCount: number; picked: number[]; search: string; adding: boolean;
  onSearch: (v: string) => void; onToggle: (id: number) => void; onClose: () => void; onSubmit: () => void;
}) {
  useEscClose(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl max-h-[90dvh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{group.groupName} · Üye Ekle</h2>
            <p className="text-sm text-slate-500">Gruba eklemek için müşteri seç</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Müşteri ara…"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {allCount === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Eklenebilecek müşteri yok (tümü zaten bu grupta).</p>
            </div>
          ) : customers.length === 0 ? (
            <p className="text-center py-14 text-sm text-slate-400">Aramaya uygun müşteri yok.</p>
          ) : (
            <div className="space-y-2">
              {customers.map((c) => {
                const sel = picked.includes(c.customerId);
                return (
                  <button key={c.customerId} onClick={() => onToggle(c.customerId)}
                    className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 border text-left transition-colors ${sel ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${toneFor(c.customerName)}`}>
                      {c.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{c.customerName}</p>
                      <p className="text-xs text-slate-400">#{c.customerId}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${sel ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                      {sel && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-sm text-slate-500">{picked.length} müşteri seçildi</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-5 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
            <button onClick={onSubmit} disabled={picked.length === 0 || adding}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">
              {adding ? 'Ekleniyor…' : `Ekle${picked.length ? ` (${picked.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
