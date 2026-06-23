'use client';
import { useCallback, useEffect, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { notificationService, type NotificationItem } from '@/services/notificationService';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return '';
  const s = Math.max(0, (Date.now() - d) / 1000);
  if (s < 60) return 'az önce';
  if (s < 3600) return `${Math.floor(s / 60)} dk`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa`;
  if (s < 604800) return `${Math.floor(s / 86400)} gün`;
  return new Date(iso).toLocaleDateString('tr-TR');
}

export default function NotificationBell({ onNavigate }: { onNavigate: (page: string, opts?: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshUnread = useCallback(async () => setUnread(await notificationService.unreadCount()), []);

  useEffect(() => {
    refreshUnread();
    const t = setInterval(refreshUnread, 60000);
    return () => clearInterval(t);
  }, [refreshUnread]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    notificationService.list(30).then((r) => { setItems(r); setLoading(false); });
  }, [open]);

  const handleClick = async (n: NotificationItem) => {
    setOpen(false);
    if (!n.isRead) { await notificationService.markRead(n.id); refreshUnread(); }
    if (n.url) {
      try {
        const u = new URL(n.url, window.location.origin);
        if (u.searchParams.get('go') === 'order' && u.searchParams.get('code')) {
          onNavigate('orders', { openOrderCode: u.searchParams.get('code')! });
          return;
        }
      } catch { /* yoksay */ }
    }
    onNavigate('notifications');
  };

  const markAll = async () => { await notificationService.markAllRead(); setItems((p) => p.map((x) => ({ ...x, isRead: true }))); refreshUnread(); };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button title="Bildirimler" className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] max-w-[calc(100vw-1.5rem)] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <span className="text-sm font-bold text-slate-900">Bildirimler{unread > 0 ? ` (${unread})` : ''}</span>
          {unread > 0 && (
            <button onClick={markAll} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
              <CheckCheck className="w-3.5 h-3.5" /> Tümünü okundu
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-sm text-slate-400">Yükleniyor…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-300 mx-auto mb-2 flex items-center justify-center"><Bell className="w-6 h-6" /></div>
              <p className="text-sm text-slate-400">Henüz bildirim yok</p>
            </div>
          ) : (
            items.map((n) => (
              <button key={n.id} onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 flex gap-3 border-b border-slate-50 transition-colors hover:bg-slate-50 ${n.isRead ? '' : 'bg-indigo-50/50'}`}>
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-indigo-500'}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-800 truncate">{n.title}</span>
                  <span className="block text-[13px] text-slate-500 line-clamp-2">{n.body}</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">{timeAgo(n.createdAtUtc)}</span>
                </span>
                {n.isRead && <Check className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1" />}
              </button>
            ))
          )}
        </div>

        <button onClick={() => { setOpen(false); onNavigate('notifications'); }}
          className="w-full px-4 py-2.5 text-sm font-medium text-indigo-600 hover:bg-slate-50 border-t border-slate-100">
          Tümünü gör
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
