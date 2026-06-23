'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminService, UserDto, RoleDto } from '@/services/adminService';
import { can, P } from '@/lib/permissions';
import { groupPermissions, permLabel, PERMISSION_META } from '@/lib/permissionMeta';
import { useEscClose } from '@/lib/useEscClose';
import { SkeletonList, EmptyState } from './ui/Skeleton';
import {
  Plus, Users, CheckCircle2, ShieldCheck, UserCog, Pencil, Trash2, Lock, Search, Power, type LucideIcon,
} from 'lucide-react';

const AVATAR_TONES = [
  'bg-indigo-50 text-indigo-600', 'bg-emerald-50 text-emerald-600', 'bg-amber-50 text-amber-600',
  'bg-rose-50 text-rose-600', 'bg-violet-50 text-violet-600', 'bg-sky-50 text-sky-600',
];
const toneFor = (name: string) => AVATAR_TONES[(name.charCodeAt(0) || 0) % AVATAR_TONES.length];

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editUser, setEditUser] = useState<UserDto | null>(null);
  const [view, setView] = useState<'users' | 'roles'>('users');
  const [roleAdding, setRoleAdding] = useState(false);
  const [editRole, setEditRole] = useState<RoleDto | null>(null);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [u, r] = await Promise.all([adminService.listMyUsers(), adminService.listMyRoles()]);
      setUsers(u); setRoles(r);
    } catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const canManage = can(P.usersManage);
  const stats = useMemo(() => ({ total: users.length, active: users.filter((u) => u.isActive).length, roles: roles.length }), [users, roles]);

  const q = query.trim().toLowerCase();
  const fUsers = useMemo(() => !q ? users : users.filter((u) =>
    [u.fullName, u.username, u.email, ...u.roles.map((r) => r.name)].some((v) => (v || '').toLowerCase().includes(q))), [users, q]);
  const fRoles = useMemo(() => !q ? roles : roles.filter((r) => (r.name + ' ' + (r.description || '')).toLowerCase().includes(q)), [roles, q]);

  const toggleActive = async (u: UserDto) => {
    setBusyId(u.id);
    try { await adminService.updateMyUser(u.id, { isActive: !u.isActive }); setUsers((p) => p.map((x) => x.id === u.id ? { ...x, isActive: !x.isActive } : x)); showToast(!u.isActive ? 'Kullanıcı aktifleştirildi' : 'Kullanıcı pasifleştirildi'); }
    catch (e) { showToast(e instanceof Error ? e.message : 'İşlem başarısız'); } finally { setBusyId(null); }
  };
  const deleteUser = async (u: UserDto) => {
    if (!confirm(`"${u.username}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
    setBusyId(u.id);
    try { await adminService.deleteMyUser(u.id); showToast('Kullanıcı silindi'); load(); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Silinemedi'); setBusyId(null); }
  };
  const deleteRole = async (r: RoleDto) => {
    if (!confirm(`"${r.name}" rolünü silmek istediğinize emin misiniz? Bu role sahip kullanıcılardan rol kaldırılır.`)) return;
    setBusyId(r.id);
    try { await adminService.deleteMyRole(r.id); showToast('Rol silindi'); load(); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Silinemedi'); setBusyId(null); }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kullanıcılar &amp; Roller</h1>
          {canManage && (
            <button onClick={() => (view === 'users' ? setAdding(true) : setRoleAdding(true))}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-blue-600/25 active:scale-95 transition-all">
              <Plus className="w-5 h-5" strokeWidth={2.4} /> {view === 'users' ? 'Kullanıcı Ekle' : 'Yeni Rol'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 max-w-2xl">
          <StatCard label="Toplam Kullanıcı" value={stats.total} tone="bg-indigo-50 text-indigo-600" Icon={Users} />
          <StatCard label="Aktif" value={stats.active} tone="bg-emerald-50 text-emerald-600" Icon={CheckCircle2} />
          <StatCard label="Rol" value={stats.roles} tone="bg-violet-50 text-violet-600" Icon={ShieldCheck} />
        </div>

        {/* Görünüm + arama */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl">
            <button onClick={() => setView('users')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${view === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Kullanıcılar</button>
            <button onClick={() => setView('roles')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${view === 'roles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Roller</button>
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={view === 'users' ? 'Kullanıcı ara…' : 'Rol ara…'}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {loading ? (
          <SkeletonList rows={6} />
        ) : view === 'users' ? (
          fUsers.length === 0 ? (
            <EmptyState icon={<UserCog className="w-7 h-7" />} title={q ? 'Sonuç yok' : 'Kullanıcı yok'} hint={canManage && !q ? 'İlk kullanıcıyı ekleyerek başla.' : undefined}
              action={canManage && !q ? <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-semibold"><Plus className="w-4 h-4" /> Kullanıcı Ekle</button> : undefined} />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Kullanıcı</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">E-posta</th>
                      <th className="px-4 py-3 font-medium">Roller</th>
                      <th className="px-4 py-3 font-medium">Durum</th>
                      {canManage && <th className="px-4 py-3 font-medium text-right">İşlemler</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${toneFor(u.fullName || u.username)}`}>{(u.fullName || u.username).charAt(0).toUpperCase()}</div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate">{u.fullName || u.username}</div>
                              <div className="text-xs text-slate-400 truncate">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-600">{u.email || <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length ? u.roles.map((r) => (
                              <span key={r.id} className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{r.name}</span>
                            )) : <span className="text-[11px] text-slate-400">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {u.isActive
                            ? <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Aktif</span>
                            : <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Pasif</span>}
                        </td>
                        {canManage && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-0.5">
                              <button disabled={busyId === u.id} onClick={() => toggleActive(u)} title={u.isActive ? 'Pasifleştir' : 'Aktifleştir'} className={`p-2 rounded-lg disabled:opacity-40 ${u.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}><Power className="w-4 h-4" /></button>
                              <button onClick={() => setEditUser(u)} title="Düzenle" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                              <button disabled={busyId === u.id} onClick={() => deleteUser(u)} title="Sil" className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          fRoles.length === 0 ? (
            <EmptyState icon={<ShieldCheck className="w-7 h-7" />} title={q ? 'Sonuç yok' : 'Rol yok'} hint={canManage && !q ? 'Yeni bir rol oluşturarak başla.' : undefined}
              action={canManage && !q ? <button onClick={() => setRoleAdding(true)} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-semibold"><Plus className="w-4 h-4" /> Yeni Rol</button> : undefined} />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Rol</th>
                      <th className="px-4 py-3 font-medium">Tür</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">İzinler</th>
                      {canManage && <th className="px-4 py-3 font-medium text-right">İşlemler</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fRoles.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 align-top">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 grid place-items-center shrink-0">{r.isSystem ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}</span>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate">{r.name}</div>
                              {r.description && <div className="text-xs text-slate-400 truncate max-w-[220px]">{r.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {r.isSystem
                            ? <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Sistem</span>
                            : <span className="text-[11px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">Özel</span>}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[420px]">
                            {r.permissions.slice(0, 5).map((p) => <span key={p} className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">{permLabel(p)}</span>)}
                            {r.permissions.length > 5 && <span className="text-[11px] text-slate-400">+{r.permissions.length - 5}</span>}
                            {r.permissions.length === 0 && <span className="text-[11px] text-slate-300">izin yok</span>}
                          </div>
                        </td>
                        {canManage && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-0.5">
                              {r.isSystem ? (
                                <span className="text-[11px] text-slate-400 inline-flex items-center gap-1 pr-2"><Lock className="w-3.5 h-3.5" /> kilitli</span>
                              ) : (
                                <>
                                  <button onClick={() => setEditRole(r)} title="İzinleri düzenle" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                                  <button disabled={busyId === r.id} onClick={() => deleteRole(r)} title="Sil" className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {(adding || editUser) && (
        <UserForm roles={roles} user={editUser}
          onClose={() => { setAdding(false); setEditUser(null); }}
          onSaved={(m) => { setAdding(false); setEditUser(null); showToast(m); load(); }} />
      )}
      {(roleAdding || editRole) && (
        <RoleForm role={editRole}
          onClose={() => { setRoleAdding(false); setEditRole(null); }}
          onSaved={(m) => { setRoleAdding(false); setEditRole(null); showToast(m); load(); }} />
      )}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}

function StatCard({ label, value, tone, Icon }: { label: string; value: number; tone: string; Icon: LucideIcon }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${tone} flex items-center justify-center shrink-0`}><Icon className="w-5 h-5 sm:w-6 sm:h-6" /></div>
      <div>
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

const inputCls = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white';

function UserForm({ roles, user, onClose, onSaved }: {
  roles: RoleDto[]; user: UserDto | null; onClose: () => void; onSaved: (m: string) => void;
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
  useEscClose(onClose);

  const toggleRole = (id: number) => setRoleIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const save = async () => {
    setErr('');
    if (!isEdit && !username.trim()) return setErr('Kullanıcı adı gerekli');
    if (!isEdit && password.length < 6) return setErr('Şifre en az 6 karakter olmalı');
    setBusy(true);
    try {
      if (isEdit && user) { await adminService.updateMyUser(user.id, { fullName, email, isActive: active, roleIds, newPassword: password || null }); onSaved('Kullanıcı güncellendi'); }
      else { await adminService.createMyUser({ username, password, email, fullName, roleIds }); onSaved('Kullanıcı oluşturuldu'); }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Kaydedilemedi'); setBusy(false); }
  };

  const del = async () => {
    if (!user) return;
    if (!confirm(`"${user.username}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
    setBusy(true);
    try { await adminService.deleteMyUser(user.id); onSaved('Kullanıcı silindi'); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Silinemedi'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92dvh] overflow-y-auto p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold">{isEdit ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        <div className="space-y-4">
          {!isEdit && (<div><label className="text-sm font-medium text-slate-700">Kullanıcı Adı</label><input className={inputCls + ' mt-1.5'} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus /></div>)}
          <div><label className="text-sm font-medium text-slate-700">Ad Soyad</label><input className={inputCls + ' mt-1.5'} value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><label className="text-sm font-medium text-slate-700">E-posta</label><input className={inputCls + ' mt-1.5'} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="text-sm font-medium text-slate-700">{isEdit ? 'Yeni Şifre (boş = değişmez)' : 'Şifre'}</label><input type="text" className={inputCls + ' mt-1.5'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? '••••••' : 'En az 6 karakter'} /></div>

          <div>
            <span className="text-sm font-medium text-slate-700">Roller</span>
            <div className="mt-2 space-y-2">
              {roles.map((r) => (
                <label key={r.id} className={`flex items-start gap-3 rounded-2xl px-4 py-3 cursor-pointer border transition-colors ${roleIds.includes(r.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
                  <input type="checkbox" checked={roleIds.includes(r.id)} onChange={() => toggleRole(r.id)} className="w-5 h-5 rounded accent-indigo-600 mt-0.5" />
                  <div><div className="font-medium text-sm">{r.name}</div><div className="text-xs text-slate-400">{r.description || `${r.permissions.length} izin`}</div></div>
                </label>
              ))}
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3">
              <div className="font-medium text-sm">Aktif</div>
              <button onClick={() => setActive((a) => !a)} className={`w-12 h-7 rounded-full transition-colors relative ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${active ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          )}

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex gap-2 pt-1">
            {isEdit && <button onClick={del} disabled={busy} className="px-4 py-2.5 rounded-2xl font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">Sil</button>}
            <div className="flex-1" />
            <button onClick={onClose} className="px-4 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
            <button onClick={save} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ALLOWED_PERM_CODES = PERMISSION_META.map((m) => m.code).filter((c) => c !== 'tenants.manage');

function RoleForm({ role, onClose, onSaved }: { role: RoleDto | null; onClose: () => void; onSaved: (m: string) => void }) {
  const isEdit = !!role;
  const [name, setName] = useState(role?.name || '');
  const [desc, setDesc] = useState(role?.description || '');
  const [perms, setPerms] = useState<string[]>(role?.permissions || []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEscClose(onClose);
  const groups = useMemo(() => groupPermissions(ALLOWED_PERM_CODES), []);

  const toggle = (c: string) => setPerms((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const toggleGroup = (codes: string[]) => {
    const allOn = codes.every((c) => perms.includes(c));
    setPerms((p) => (allOn ? p.filter((c) => !codes.includes(c)) : Array.from(new Set([...p, ...codes]))));
  };

  const save = async () => {
    setErr('');
    if (!name.trim()) return setErr('Rol adı gerekli');
    if (perms.length === 0) return setErr('En az bir izin seçin');
    setBusy(true);
    try {
      const payload = { name: name.trim(), description: desc.trim() || null, permissions: perms };
      if (isEdit && role) { await adminService.updateMyRole(role.id, payload); onSaved('Rol güncellendi'); }
      else { await adminService.createMyRole(payload); onSaved('Rol oluşturuldu'); }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Kaydedilemedi'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold">{isEdit ? 'Rolü Düzenle' : 'Yeni Rol'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-700">Rol Adı</label><input className={inputCls + ' mt-1.5'} value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Mağaza Sorumlusu" autoFocus /></div>
          <div><label className="text-sm font-medium text-slate-700">Açıklama (opsiyonel)</label><input className={inputCls + ' mt-1.5'} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Bu rolün amacı" /></div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Özel İzinler</span>
              <span className="text-xs text-slate-400">{perms.length} seçili</span>
            </div>
            <div className="mt-2 space-y-3">
              {groups.map((g) => {
                const codes = g.items.map((i) => i.code);
                const allOn = codes.every((c) => perms.includes(c));
                const someOn = codes.some((c) => perms.includes(c));
                return (
                  <div key={g.group} className="border border-slate-200 rounded-2xl p-3">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" checked={allOn} ref={(el) => { if (el) el.indeterminate = !allOn && someOn; }} onChange={() => toggleGroup(codes)} className="w-4 h-4 rounded accent-indigo-600" />
                      <span className="text-sm font-semibold text-slate-700">{g.group}</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1">
                      {g.items.map((it) => (
                        <label key={it.code} className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 rounded-lg px-2 py-1 hover:bg-slate-50">
                          <input type="checkbox" checked={perms.includes(it.code)} onChange={() => toggle(it.code)} className="w-4 h-4 rounded accent-indigo-600 shrink-0" />
                          <span className="truncate">{it.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex gap-2 pt-1">
            <div className="flex-1" />
            <button onClick={onClose} className="px-4 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
            <button onClick={save} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? 'Kaydediliyor…' : isEdit ? 'Kaydet' : 'Rol Oluştur'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
