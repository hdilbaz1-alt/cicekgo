# ÇiçekGo Backend API — Kullanım Kılavuzu

ÇiçekGo, çiçekçiler için **çok-kiracılı (multi-tenant)**, **rol/izin bazlı** bir yönetim API'sidir.
.NET 9 (Clean Architecture) + PostgreSQL. Web paneli ve Flutter mobil uygulaması bu API'yi kullanır.

- **Canlı API:** `https://api-cicekgo-backend.hanyapp.com`
- **Swagger:** `https://api-cicekgo-backend.hanyapp.com/swagger`
- **Yerel:** `http://localhost:5080`

---

## 1. Mimari & Çok-Kiracılılık

- **Master DB** (`cicekgo_master`): firmalar (tenants), kullanıcılar, roller, izinler, lisanslar.
- **Tenant DB** (her firma için ayrı, `cicekgo_tenant_<slug>`): siparişler, müşteriler, cari, kasa, ürünler, audit vb.
- Giriş yapan kullanıcının JWT'sindeki `tenant_id` claim'i ile istek otomatik olarak doğru firma DB'sine yönlenir. **İstemci tarafında firma seçimi/gönderimi gerekmez.**
- **Platform admin** (süper-admin) `tenant_id` taşımaz; firma/kullanıcı yönetimi yapar (`/api/Admin/...`).

---

## 2. Kimlik Doğrulama (JWT)

Tüm uçlar (login hariç) **Bearer token** ister:

```
Authorization: Bearer <token>
```

- Token süresi: **8 saat** (480 dk). Süre dolunca 401 döner → yeniden login.
- Pasif (`IsActive=false`) veya silinmiş kullanıcı login olamaz.

### Login
`POST /api/Auth/login`  *(AllowAnonymous)*
```json
{ "userName": "kullanici", "password": "sifre" }
```
**Yanıt** (`data`):
```json
{
  "token": "eyJ...",
  "expiresAt": "2026-06-19T12:00:00Z",
  "userId": 12,
  "userName": "kullanici",
  "tenantId": 3,
  "roles": [ { "id": 1, "name": "Firma Sahibi" } ],
  "permissions": ["orders.view","orders.create", "..."]
}
```
> `permissions` dizisini istemci saklayıp menü/aksiyon yetkilendirmesinde kullanır.

### JWT claim'leri
`user_id`, `username`, `tenant_id`, `is_platform_admin`, `roles` (çoklu), `perms` (çoklu).

---

## 3. Yanıt Zarfı & Hata Yönetimi

**Tüm** uçlar şu zarfı döner:
```json
{ "data": <T|null>, "success": true, "message": "…", "statusCode": 200 }
```
- Başarılı: `success=true`, veri `data` içinde.
- Hata: `success=false`, açıklama `message` içinde.

HTTP durum kodları:
| Kod | Anlam |
|-----|-------|
| 200/201 | Başarılı |
| 400 | Geçersiz istek / iş kuralı hatası (`AppException`) |
| 401 | Token yok/geçersiz/süresi dolmuş |
| 403 | Yetki yok (gerekli izin eksik) veya kapsam dışı (kurye başka siparişe erişemez) |
| 404 | Kayıt bulunamadı |
| 500 | Beklenmeyen hata |

---

## 4. Genel Kurallar (Conventions)

- **Tarihler UTC**: gönderilen `DateTime` değerleri UTC kabul edilir. `yyyy-MM-ddTHH:mm:ss` veya `yyyy-MM-dd` kullanın.
- **Liste uçları `POST`**: birçok liste ucu gövdeli `POST .../list` şeklindedir (GET değil).
- **Sipariş listelerinde tarih aralığı zorunlu**: `startDate` ve `endDate` (`yyyy-MM-dd`) verilmelidir.
- **Para**: `decimal`, 2 ondalık.
- **İzinler**: her uç `[HasPermission("kod")]` ile korunur. İstemci, login'deki `permissions` ile butonları gizler; backend yine de zorunlu kılar.
- **Kurye izolasyonu**: yalnız `orders.view_own` olan kullanıcı sadece kendi atanmış siparişlerini görür/değiştirir (sunucu zorlar).

---

## 5. İzin Kataloğu

```
orders.view, orders.view_all, orders.view_own, orders.create, orders.update,
orders.delete, orders.view_deleted, orders.restore, orders.assign_courier,
orders.view_price, orders.view_payment, orders.change_status
customers.view, customers.create, customers.update, customers.delete, customers.view_ledger
finance.view_general_ledger, finance.create_payment, finance.manual_movement, finance.view_cash
products.view, products.manage, stock.view, stock.manage
reports.view_sales, reports.view_customers, reports.view_products, reports.view_cash, reports.view_couriers, reports.export
users.manage, roles.manage, audit.view, settings.manage
tenants.manage   (yalnız platform admin)
```
Sistem rolleri (firma açılışında seed edilir): **Firma Sahibi** (tümü), Yönetici, Satış, Muhasebe, **Kurye** (`orders.view_own`,`orders.change_status`), Depo, SaltOkunur.

---

## 6. Uç Referansı

> Tüm yollar `https://api-cicekgo-backend.hanyapp.com` ile başlar. "İzin" sütunu gerekli izindir; boşsa sadece giriş yeterlidir.

### 6.1 Auth & Hesap (self-servis)
| Method | Yol | İzin | Açıklama |
|---|---|---|---|
| POST | `/api/Auth/login` | — (public) | Giriş, token döner |
| GET | `/api/Account/me` | giriş | Kendi profil + roller + izinler |
| POST | `/api/Account/change-password` | giriş | `{ currentPassword, newPassword }` (min 6) |
| PUT | `/api/Account/profile` | giriş | `{ fullName?, email? }` |
| DELETE | `/api/Account` | giriş | `{ password }` → hesabı sil (soft, giriş engellenir) |
| GET | `/api/TenantPing/info` | giriş | Firma adı, lisans (lkStart/lkEnd), logo |
| GET | `/api/Company/profile` | giriş | Firma adı + `logoBase64` + `logoRemoveBg` |
| PUT | `/api/Company/profile` | settings.manage | `{ name?, logoBase64?, logoRemoveBg? }` |

### 6.2 Siparişler
| Method | Yol | İzin | Açıklama |
|---|---|---|---|
| POST | `/api/Orders` | orders.create | Sipariş oluştur (aşağıda gövde) |
| POST | `/api/Orders/list` | orders.view | Liste (tarih aralığı zorunlu) |
| POST | `/api/Orders/my-assigned` | orders.view_own | Kuryeye atanmış siparişler |
| GET | `/api/Orders/deleted` | orders.view_deleted | Silinmiş siparişler |
| GET | `/api/Orders/{orderCode}` | orders.view | Sipariş detayı (kalemler dahil) |
| PUT | `/api/Orders/{orderCode}` | orders.update | Güncelle |
| DELETE | `/api/Orders/{orderCode}` | orders.delete | Sil `{ reason }` (soft-delete; cari/stok geri yansır) |
| POST | `/api/Orders/{orderCode}/restore` | orders.restore | Geri yükle |
| POST | `/api/Orders/{orderCode}/assign-courier` | orders.assign_courier | `{ courierUserId }` (null=kaldır) |
| POST | `/api/Orders/{orderCode}/change-status` | orders.change_status | `{ status, note? }` |

**Liste isteği** (`/list`, `/my-assigned`):
```json
{ "startDate": "2026-06-01", "endDate": "2026-06-30", "page": 1, "pageSize": 500 }
```
**Liste yanıtı:** `{ totalCount, page, pageSize, items: [OrderListItem...] }`

**Sipariş oluştur gövdesi** (`POST /api/Orders`):
```json
{
  "orderStatus": "Yeni",
  "orderTo": "Ayşe Yılmaz", "orderSender": "Mehmet Demir",
  "orderDeliveryDate": "2026-06-20T14:00:00",
  "orderProductType": "Aranjman",
  "customerId": 5,
  "senderName": "Mehmet Demir", "senderPhone": "0532...",
  "recipientName": "Ayşe Yılmaz", "recipientPhone": "0555...", "recipientAddress": "Çankaya/Ankara",
  "cardNote": "Doğum günün kutlu olsun", "customerNote": "", "extraNote": "", "deliveryNote": "",
  "isNotified": false,
  "source": "Telefon", "deliveryTimeRange": "14:00 - 16:00",
  "discountTotal": 0, "deliveryFee": 0, "extraFee": 0,
  "assignedCourierId": 18, "paymentStatus": "Kısmi",
  "items": [ { "productId": 3, "productName": "Gül Buketi", "quantity": 2, "unitPrice": 150, "discount": 0 } ],
  "payments": [ { "paymentAmount": 200, "paymentMethodId": 0, "paymentDate": "2026-06-19T10:00:00" } ]
}
```
Yanıt: `{ orderPkId, orderCode }`. `orderId/orderCode` boşsa backend sequence ile üretir.
> İş kuralı: müşteri bağlıysa sipariş **cari borç**, ödeme **tahsilat + kasa girişi** olarak otomatik işlenir. Silme açık borcu kapatır.

### 6.3 Müşteriler & Gruplar
| Method | Yol | İzin |
|---|---|---|
| POST | `/api/Customer/List` | customers.view — `{ search, page, pageSize }` → `{ items, total }` |
| GET | `/api/Customer/{id}` | customers.view |
| POST | `/api/Customer` | customers.create — `{ customerName*, phone, secondaryPhone, email, city, district, address, customerType, tag, openingBalance, creditLimit }` |
| PUT | `/api/Customer/{id}` | customers.update |
| DELETE | `/api/Customer/{id}` | customers.delete |
| GET | `/api/CustomerGroup/list` | customers.view |
| POST | `/api/CustomerGroup/add` | customers.update |
| DELETE | `/api/CustomerGroup/delete/{id}` | customers.update |
| POST | `/api/CustomerGroup/member/add` | customers.update |
| POST | `/api/CustomerGroup/member/list` | customers.view |

### 6.4 Cari Hesap (Ledger)
| Method | Yol | İzin | Açıklama |
|---|---|---|---|
| GET | `/api/CustomerLedger/balances` | finance.view_general_ledger | Müşteri bakiyeleri (balance>0 borçlu) |
| POST | `/api/CustomerLedger/list` | finance.view_general_ledger | `{ customerId, page, pageSize }` → hareketler |
| POST | `/api/CustomerLedger/payment` | finance.create_payment | `{ customerId, amount, description?, paymentDate? }` |
| POST | `/api/CustomerLedger/order-payment` | finance.create_payment | `{ customerId, orderCode, amount, description?, paymentDate? }` |
| POST | `/api/CustomerLedger/entry` | finance.manual_movement | Manuel borç/alacak kaydı |

### 6.5 Kasa & Gider (Finance)
| Method | Yol | İzin |
|---|---|---|
| GET | `/api/Cash/summary?from=&to=` | finance.view_general_ledger — satış/tahsilat/açık alacak/net kasa özeti |
| GET | `/api/Cash/movements?from=&to=` | finance.view_cash — kasa hareketleri |
| GET | `/api/Expense/list?from=&to=` | finance.view_cash |
| POST | `/api/Expense` | finance.manual_movement — `{ category, amount, paymentMethod?, description?, transactionDate? }` |
| DELETE | `/api/Expense/{id}` | finance.manual_movement |

### 6.6 Ürünler & Stok
| Method | Yol | İzin |
|---|---|---|
| GET | `/api/Product/list?search=` | products.view |
| GET | `/api/Product/{id}` | products.view |
| POST | `/api/Product` | products.manage — `{ name, categoryId?, salePrice, purchasePrice?, vatRate?, trackStock, currentStock, criticalStockLevel, unit, isActive }` |
| PUT/DELETE | `/api/Product/{id}` | products.manage |
| GET | `/api/Product/categories` | products.view |
| POST/PUT/DELETE | `/api/Product/categories[/{id}]` | products.manage |
| GET | `/api/Stock/movements` | stock.view |
| POST | `/api/Stock/movements` | stock.manage |
| GET | `/api/Stock/critical` | stock.view |
| GET | `/api/Unit/list` | products.view |
| POST/PUT/DELETE | `/api/Unit[/{id}]` | settings.manage |

### 6.7 Dashboard & Raporlar
| Method | Yol | İzin | Açıklama |
|---|---|---|---|
| GET | `/api/Dashboard/summary?from=&to=` | orders.view | Özet: orderCount, totalSales, collected, openReceivables, netCash, expenseTotal, criticalStockCount, statusCounts[], cashSeries[], topProducts[], topCustomers[] |
| GET | `/api/Reports/sales?from=&to=` | reports.view_sales | orderCount, totalSales, totalCollected, avgOrder, byDay[], byStatus[] |
| GET | `/api/Reports/products?from=&to=` | reports.view_products | [{name, quantity, revenue, orderCount}] |
| GET | `/api/Reports/customers?from=&to=` | reports.view_customers | [{name, orderCount, total, collected, balance}] |
| GET | `/api/Reports/cash?from=&to=` | reports.view_cash | in, out, net, byType[], expensesByCategory[] |
| GET | `/api/Reports/couriers?from=&to=` | reports.view_couriers | [{name, orderCount, deliveredCount, total}] |

### 6.8 Ayarlar
| Method | Yol | İzin |
|---|---|---|
| GET | `/api/OrderStatus/list` | giriş — sipariş durumları |
| POST/PUT/DELETE | `/api/OrderStatus[...]` | settings.manage |
| GET | `/api/OrderCode/list` | orders.view |
| POST `/Add` · PUT `/update/{id}` · DELETE `/delete/{id}` | `/api/OrderCode/...` | settings.manage |
| GET | `/api/StoreSettings` | giriş — `{ openTime, closeTime, slotMinutes, deliverySlots[] }` |
| PUT | `/api/StoreSettings` | settings.manage — `{ openTime, closeTime, slotMinutes }` |
| GET | `/api/PrintTemplate/list` | giriş — yazdırma şablonları |
| POST · PUT `/{id}` · DELETE `/{id}` · POST `/{id}/default` | `/api/PrintTemplate/...` | settings.manage |

**PrintTemplate gövdesi:** `{ name, paperType("A5"/"A4"), rotation, isDefault, showOrderCode, showCreatedDate, showPrice, showPaymentStatus, showExtraNote, showRecipientPhone, showSenderPhone, showQr, noteFont, noteBold, noteFontStyle, noteFontSize, noteColor, cardSize, noteContent }` ( `{{kart_notu}}` yer tutucusu kart notuyla değişir ).

### 6.9 Audit
| Method | Yol | İzin |
|---|---|---|
| POST | `/api/Audit/list` | audit.view — `{ startDate?, endDate?, actionType?, search?, page, pageSize }` |

### 6.10 Platform Admin (süper-admin)
| Method | Yol | İzin |
|---|---|---|
| GET/POST | `/api/Admin/tenants` | tenants.manage — firma listele/oluştur |
| PUT/DELETE | `/api/Admin/tenants/{id}` | tenants.manage (`?dropDatabase=true` ile DB sil) |
| GET/POST | `/api/Admin/tenants/{id}/users` | tenants.manage |
| GET | `/api/Admin/tenants/{id}/roles` | tenants.manage |
| PUT/DELETE | `/api/Admin/tenants/{id}/users/{userId}` | tenants.manage |
| GET | `/api/Admin/permissions` | giriş — tüm izin kataloğu |

### 6.11 Firma içi kullanıcı/rol yönetimi (Firma Sahibi)
| Method | Yol | İzin |
|---|---|---|
| GET | `/api/Admin/couriers` | orders.assign_courier — kurye seçim listesi |
| GET/POST | `/api/Admin/users` | users.manage |
| PUT/DELETE | `/api/Admin/users/{userId}` | users.manage |
| GET/POST | `/api/Admin/roles` | users.manage |

---

## 7. Örnek Akış (curl)

```bash
BASE=https://api-cicekgo-backend.hanyapp.com

# 1) Login
TOKEN=$(curl -s -X POST $BASE/api/Auth/login -H "Content-Type: application/json" \
  -d '{"userName":"kullanici","password":"sifre"}' | jq -r .data.token)

# 2) Bugünün siparişleri
curl -s -X POST $BASE/api/Orders/list -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-06-19","endDate":"2026-06-19","page":1,"pageSize":100}' | jq .data.items

# 3) Sipariş durumunu güncelle
curl -s -X POST $BASE/api/Orders/SIP2026000123/change-status -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"Teslim Edildi","note":"kapıda teslim"}'

# 4) Tahsilat al
curl -s -X POST $BASE/api/CustomerLedger/payment -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"customerId":5,"amount":250,"description":"Nakit"}'
```

---

## 8. İstemci Notları (Web & Flutter)

- Login yanıtındaki **token** güvenli depoda (web: localStorage, mobil: secure storage), **permissions** ile menü/aksiyon gizlenir.
- 401 alınınca oturum temizlenip login'e yönlendirilir.
- Tarih filtreli uçlarda (`Cash`, `Reports`, `Dashboard`) `from/to` **query string** (`?from=yyyy-MM-dd&to=...`), sipariş listelerinde ise **gövdede** `startDate/endDate`.
- Yazdırma çıktısı için: `Company/profile` (logo) + `PrintTemplate/list` (varsayılan şablon) çekilip sipariş verisiyle birleştirilir — web ve mobil aynı şablonu kullanır.
