# ÇiçekGo Backend (.NET 9 · Clean Architecture · PostgreSQL)

Çok kiracılı (multi-tenant) çiçekçi yönetim API'si. Her **firma (tenant)** kendine ait
ayrı bir PostgreSQL veritabanına sahiptir; ortak bir **master** DB firma + kullanıcı +
rol/izin yönetimini tutar.

## Katmanlar

```
CicekGo.Domain         -> entity'ler (master + tenant), izin kataloğu
CicekGo.Application    -> DTO'lar, servis arayüzleri, ApiResponse, soyutlamalar
CicekGo.Infrastructure -> EF Core DbContext'ler, migrations, servisler, JWT, provisioning
CicekGo.Api            -> controller'lar, middleware, yetkilendirme, Program.cs
```

## Veritabanları

- **Master DB:** `cicekgo_master`
  Tablolar: `tenants`, `users`, `roles`, `permissions`, `role_permissions`, `user_roles`
- **Tenant DB (her firma):** `cicekgo_tenant_<slug>` (örn. `cicekgo_tenant_demo`)
  Tablolar: `order_statuses`, `product_types`, `payment_methods`, `order_code_sequences`,
  `customers`, `customer_billings`, `customer_groups`, `customer_group_members`,
  `orders`, `order_payments`, `customer_ledger`

Para alanları `numeric(18,2)`, tarihler `timestamptz`, tablo/kolon adları `snake_case`.

## Kurulum

1. PostgreSQL kurulu olsun. `appsettings.json` içindeki `Database` bölümünü kendi sunucuna göre düzenle:
   - `MasterConnection` — master DB bağlantısı
   - `TenantConnectionTemplate` — `{DBNAME}` yer tutucusu firma DB adıyla değiştirilir
   - `TenantDbPrefix` — yeni firma DB adı öneki (varsayılan `cicekgo_tenant_`)

   > Gerçek şifreleri repoya yazma; `dotnet user-secrets` veya ortam değişkeni kullan:
   > `dotnet user-secrets set "Database:MasterConnection" "..."`

2. `Jwt:Key` değerini güçlü, en az 32 baytlık bir değerle değiştir.
3. `Seed` bölümündeki platform admin kullanıcı/şifresini ayarla.

## Çalıştırma

```bash
cd backend
dotnet run --project CicekGo.Api
```

Uygulama açılışta **master DB'yi otomatik migrate eder** ve platform admin + izin kataloğunu seed eder.
Swagger: `http://localhost:<port>/swagger`

## Migrations

```bash
# yeni master migration
dotnet ef migrations add <Ad> --context MasterDbContext --project CicekGo.Infrastructure --startup-project CicekGo.Api --output-dir Persistence/Migrations/Master

# yeni tenant migration
dotnet ef migrations add <Ad> --context TenantDbContext --project CicekGo.Infrastructure --startup-project CicekGo.Api --output-dir Persistence/Migrations/Tenant
```

Master migration uygulamada otomatik çalışır. Tenant migration'ları her firma DB'sine
**provisioning sırasında** (`ITenantProvisioner`) uygulanır.

## Yeni firma oluşturma (super-admin)

1. Platform admin ile giriş yap: `POST /api/Auth/login` → `{ "userName": "superadmin", "password": "..." }`
2. Token ile firma oluştur:
   ```
   POST /api/Admin/tenants
   {
     "name": "Demo Çiçekçilik",
     "slug": "demo",
     "licenseEndUtc": "2026-12-31T00:00:00Z",
     "adminUsername": "demo_admin",
     "adminPassword": "Sifre!123"
   }
   ```
   Bu çağrı: `cicekgo_tenant_demo` DB'sini yaratır, şemayı migrate eder, varsayılanları
   (sipariş durumları, ödeme yöntemleri, ürün tipleri, sipariş kodu sayacı) seed eder,
   firma rollerini (FirmaAdmin / Operatör / Muhasebe) ve ilk admin kullanıcıyı oluşturur.
3. Firma admini ile giriş yapıp `GET /api/TenantPing/info` ile firma/lisans bilgisini doğrula.

## Yetkilendirme

Rol + ince izin modeli. İzin kodları `CicekGo.Domain/Authorization/Permissions.cs` içinde.
Controller'larda `[HasPermission("orders.manage")]` ile uygulanır; izinler JWT'deki `perms`
claim'inden okunur. Platform admin tüm izinlere sahiptir.

## Frontend bağlama

Kök dizindeki Next.js uygulamasında `src/config/api.ts` içindeki `BASE_URL`'i bu API'nin
adresine ayarla (örn. `http://localhost:5xxx`). API sözleşmesi (endpoint'ler + `ApiResponse`
zarfı) eski backend ile aynıdır.
