import { apiFetch } from '@/lib/api';
import { getApiUrl, getEndpoint } from '@/config/api';

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  url?: string | null;
  type?: string | null;
  isRead: boolean;
  createdAtUtc: string;
}

export const notificationService = {
  async list(take = 50): Promise<NotificationItem[]> {
    try {
      const res = await apiFetch(`${getApiUrl(getEndpoint('NOTIF_LIST'))}?take=${take}`);
      const b = await res.json();
      return (b?.data as NotificationItem[]) || [];
    } catch { return []; }
  },

  async unreadCount(): Promise<number> {
    try {
      const res = await apiFetch(getApiUrl(getEndpoint('NOTIF_UNREAD')));
      const b = await res.json();
      return Number(b?.data) || 0;
    } catch { return 0; }
  },

  async markRead(id: number): Promise<void> {
    try { await apiFetch(`${getApiUrl(getEndpoint('NOTIF_READ'))}/${id}/read`, { method: 'POST' }); } catch { /* yoksay */ }
  },

  async markAllRead(): Promise<void> {
    try { await apiFetch(getApiUrl(getEndpoint('NOTIF_READ_ALL')), { method: 'POST' }); } catch { /* yoksay */ }
  },
};
