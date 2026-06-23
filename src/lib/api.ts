import { getApiUrl } from '@/config/api';
import { authService } from '@/services/authService';

// Aynı anda gelen 401'ler için TEK refresh çalışsın (single-flight)
let refreshing: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const rt = authService.getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(getApiUrl('/api/Auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const b = await res.json();
    if (!b?.success || !b.data?.token) return false;
    authService.setSession({ token: b.data.token, refreshToken: b.data.refreshToken });
    return true;
  } catch { return false; }
}

/**
 * fetch yerine geçen merkezî sarmalayıcı.
 * - Her isteğe güncel access token'ı ekler.
 * - 401 dönerse: tek-uçuş refresh dener, başarılıysa isteği yeni token'la 1 kez tekrarlar.
 * - refresh de patlarsa oturumu temizler ve /login'e yönlendirir.
 * Kullanım: fetch(url, opts) → apiFetch(url, opts). url tam URL veya '/api/...' path olabilir.
 */
export async function apiFetch(input: string, init: RequestInit = {}, _retry = true): Promise<Response> {
  const url = input.startsWith('http') ? input : getApiUrl(input);
  const headers = new Headers(init.headers || {});
  const tok = authService.getToken();
  if (tok && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${tok}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(url, { ...init, headers });

  // Auth uçları (login/refresh) 401'de refresh denemez → sonsuz döngü engeli
  if (res.status !== 401 || !_retry || url.includes('/api/Auth/')) return res;

  refreshing = refreshing || doRefresh();
  const ok = await refreshing;
  refreshing = null;

  if (!ok) {
    authService.clearToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    return res;
  }
  return apiFetch(input, init, false); // yeni token'la tek sefer tekrar
}
