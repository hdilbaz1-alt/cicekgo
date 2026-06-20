# 🔧 API Konfigürasyonu

## 📍 API URL'ini Değiştirme

API URL'ini değiştirmek için `src/config/api.ts` dosyasını düzenleyin:

### 🏠 Local Development (Varsayılan)
```typescript
BASE_URL: 'https://localhost:7138',
```

### 🌐 Production Server
```typescript
BASE_URL: 'http://YOUR_API_HOST',
```

## 🔄 Nasıl Değiştirirsiniz?

1. **`src/config/api.ts`** dosyasını açın
2. **BASE_URL** satırını bulun
3. İstediğiniz URL'i yazın:

```typescript
// Local için:
BASE_URL: 'https://localhost:7138',

// Production için:
BASE_URL: 'http://YOUR_API_HOST',

// Başka bir server için:
BASE_URL: 'https://your-server.com',
```

## ✅ Avantajları

- ✅ **Tek yerden yönetim:** Tüm API çağrıları otomatik güncellenir
- ✅ **Kolay değişim:** Sadece bir satır değiştirmeniz yeterli
- ✅ **Hata önleme:** URL'ler merkezi olarak yönetilir
- ✅ **Geliştirici dostu:** TypeScript desteği ile

## 🚀 Kullanım

Kod içinde API çağrısı yaparken:

```typescript
import { getApiUrl, getEndpoint } from '../config/api';

// Login için
const response = await fetch(getApiUrl(getEndpoint('LOGIN')), {
  method: 'POST',
  // ...
});

// Siparişler için
const response = await fetch(getApiUrl(getEndpoint('ORDERS')), {
  method: 'GET',
  // ...
});
```

## 📝 Mevcut Endpoint'ler

- `LOGIN`: `/api/Auth/login`
- `ORDERS`: `/api/Orders`
- `CUSTOMERS`: `/api/Customer`
- `TENANT_PING`: `/api/TenantPing/info`

Yeni endpoint eklemek için `ENDPOINTS` objesine ekleyin!
