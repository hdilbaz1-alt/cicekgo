'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminService, UserDto, RoleDto } from '@/services/adminService';
import { can, P } from '@/lib/permissions';
import { useEscClose } from '@/lib/useEscClose';
import { SkeletonCards, EmptyState } from './ui/Skeleton';
import { Plus, Users, CheckCircle2, ShieldCheck, UserCog, Pencil, type LucideIcon } from 'lucide-react';

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
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    roles: roles.length,
  }), [users, roles]);

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kullanıcılar</h1>
          </div>
          {canManage && (
            <button onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-blue-600/25 active:scale-95 transition-all">
              <Plus className="w-5 h-5" strokeWidth={2.4} />
              Kullanıcı Ekle
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-7 max-w-2xl">
          <StatCard label="Toplam Kullanıcı" value={stats.total} tone="bg-indigo-50 text-indigo-600" Icon={Users} />
          <StatCard label="Aktif" value={stats.active} tone="bg-emerald-50 text-emerald-600" Icon={CheckCircle2} />
          <StatCard label="Rol" value={stats.roles} tone="bg-violet-50 text-violet-600" Icon={ShieldCheck} />
        </div>

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {loading ? (
          <SkeletonCards count={6} />
        ) : users.length === 0 ? (
          <EmptyState icon={<UserCog className="w-7 h-7" />} title="Kullanıcı yok" hint={canManage ? 'İlk kullanıcıyı ekleyerek başla.' : undefined}
            action={canManage ? <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-semibold"><Plus className="w-4 h-4" /> Kullanıcı Ekle</button> : undefined} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {users.map((u) => (
              <div key={u.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${toneFor(u.fullName || u.username)}`}>
                      {(u.fullName || u.username).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 truncate flex items-center gap-2">
                        {u.fullName || u.username}
                        {!u.isActive && <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">pasif</span>}
                      </h3>
                      <div className="text-xs text-slate-400 truncate">@{u.username}</div>
                    </div>
                    {canManage && (
                      <button onClick={() => setEditUser(u)} title="Düzenle" className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors shrink-0"><Pencil className="w-4 h-4" /></button>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {u.roles.length ? u.roles.map((r) => (
                      <span key={r.id} className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{r.name}</span>
                    )) : <span className="text-[11px] text-slate-400">rol atanmamış</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(adding || editUser) && (
        <UserForm roles={roles} user={editUser}
          onClose={() => { setAdding(false); setEditUser(null); }}
          onSaved={(m) => { setAdding(false); setEditUser(null); showToast(m); load(); }} />
      )}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}

function StatCard({ label, value, tone, Icon }: { label: string; value: number; tone: string; Icon: LucideIcon }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${tone} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
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
      if (isEdit && user) {
        await adminService.updateMyUser(user.id, { fullName, email, isActive: active, roleIds, newPassword: password || null });
        onSaved('Kullanıcı güncellendi');
      } else {
        await adminService.createMyUser({ username, password, email, fullName, roleIds });
        onSaved('Kullanıcı oluşturuldu');
      }
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
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold">{isEdit ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        <div className="space-y-4">
          {!isEdit && (
            <div><label className="text-sm font-medium text-slate-700">Kullanıcı Adı</label><input className={inputCls + ' mt-1.5'} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus /></div>
          )}
          <div><label className="text-sm font-medium text-slate-700">Ad Soyad</label><input className={inputCls + ' mt-1.5'} value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><label className="text-sm font-medium text-slate-700">E-posta</label><input className={inputCls + ' mt-1.5'} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="text-sm font-medium text-slate-700">{isEdit ? 'Yeni Şifre (boş = değişmez)' : 'Şifre'}</label><input type="text" className={inputCls + ' mt-1.5'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? '••••••' : 'En az 6 karakter'} /></div>

          <div>
            <span className="text-sm font-medium text-slate-700">Yetkiler (Roller)</span>
            <div className="mt-2 space-y-2">
              {roles.map((r) => (
                <label key={r.id} className={`flex items-start gap-3 rounded-2xl px-4 py-3 cursor-pointer border transition-colors ${roleIds.includes(r.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
                  <input type="checkbox" checked={roleIds.includes(r.id)} onChange={() => toggleRole(r.id)} className="w-5 h-5 rounded accent-indigo-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">{r.name}</div>
                    <div className="text-xs text-slate-400">{r.description || `${r.permissions.length} izin`}</div>
                  </div>
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
