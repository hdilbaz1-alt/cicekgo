# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ÇiçekGo is a multi-tenant SaaS for managing florist businesses (orders, customers, customer groups/ledgers, product types, order statuses). The repo holds two independently-deployed apps:

- **Frontend** (repo root): Next.js 15 (App Router) + React 19 + TypeScript + Tailwind 3, deployed separately from the API.
- **Backend** (`cicekgo.API/`): ASP.NET Core 8 Web API using Dapper (raw SQL, **not** EF Core for queries) against SQL Server.

The two talk only over HTTP/JSON; there is no shared code. The UI is in Turkish.

## Commands

**Frontend** (run from repo root):
```bash
npm run dev      # dev server with Turbopack on http://localhost:3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # next lint (eslint-config-next)
```
There is no frontend test setup.

**Backend** (run from `cicekgo.API/`):
```bash
dotnet build cicekgo.API.sln
dotnet run --project cicekgo.API/cicekgo.API.csproj            # http profile -> http://localhost:5167
dotnet run --project cicekgo.API/cicekgo.API.csproj --launch-profile https   # https://localhost:7138
```
Swagger UI is enabled in every environment at `/swagger`. There is no backend test project.

> Bash-tool note: `cd` persists across calls in this environment, and several paths are nested two levels deep (`cicekgo.API/cicekgo.API/...`). Prefer absolute paths to avoid the second `cd` landing in the wrong place.

## Multi-tenancy (the core architectural concept)

There are **two kinds of database**:

1. **Identity DB** (`IdentityConnection`) — one shared "master" DB. Holds the `dbo.Tenant` registry (DbName, license window `LkStart`/`LkEnd`, `IsActive`), `AppUser`, roles, and user↔tenant mappings. Accessed via `IIdentityDbFactory` (singleton).
2. **Tenant DBs** (`TenantConnectionTemplate` with `{DBNAME}` placeholder) — one physical DB **per tenant** holding that tenant's business data (Orders, Customers, etc.). Accessed via `ITenantDbFactory` (scoped), which builds the connection string from the resolved tenant's `DbName`.

Request flow that wires this together (see `cicekgo.API/cicekgo.API/Program.cs` pipeline order — it matters):
1. JWT login (`UserAuthService`) embeds a `tenant_id` claim in the token, plus `user_id`, `username`, `roles`, `special_roles`, `role_ids`, `special_role_ids`.
2. `UseAuthentication()` validates the JWT.
3. `TenantResolutionMiddleware` (registered as `UseTenantResolution()`) runs **after** auth: for authenticated requests it calls `ITenantResolver`, which reads `tenant_id`, looks up the `DbName` from the Identity DB (cached in `IMemoryCache` for 3 min), and populates the scoped `ITenantContext`.
4. Repositories call `_tenantDbFactory.CreateConnection()` — which throws if `ITenantContext` was never set — so every tenant-scoped query is automatically isolated to the caller's DB.

When adding a tenant-scoped feature, inject `ITenantDbFactory`; for anything touching tenants/users/licensing, inject `IIdentityDbFactory`. Never hardcode a connection string.

## Backend layering (Clean Architecture)

Strict project dependency direction: `API` → `Business` → `Data` → `Domain`, with `Core` (DTOs/contracts) referenced by all.

- **`cicekgo.API`** — Controllers only. Each controller is thin: validate input, call a service, wrap the result in `ApiResponse<T>`, and translate exceptions to HTTP status codes (`ArgumentException`→400, sentinel `InvalidOperationException`→404, anything else→500). See `OrdersController.cs` for the canonical pattern.
- **`cicekgo.Business`** — `Services/Interfaces` + `Services/Implementations` holding business logic. `ICurrentUser`/`CurrentUser` exposes the authenticated principal's claims to services.
- **`cicekgo.Data`** — `Repositories/Interfaces` + `Repositories/Implementations` using **Dapper with inline SQL**. Multi-statement writes use explicit `IDbConnection` transactions (see `OrderRepository.CreateOrderAggregateAsync`). The two DB factories live in `Common/Implementations`.
- **`cicekgo.Core`** — request/response DTOs (grouped by feature: `Orders/Dtos`, `Customers/Dtos`, …), `ApiResponse<T>`, `PagedRequest`, JWT options.
- **`cicekgo.Domain`** — entity POCOs (`AppUser`, `Order`, `Tenant`, roles).

DI registration for everything (repos, services, factories, JWT, CORS, Swagger) is centralized in `Program.cs` — register new repositories/services there as `Scoped`.

Every DI registration follows the interface→implementation convention (`IXxxService`/`XxxService`, `IXxxRepository`/`XxxRepository`); add new pairs the same way.

## API response & auth conventions

- **All** endpoints return `ApiResponse<T>` (`{ data, success, message, statusCode }`). Use `ApiResponse<T>.Ok(...)` / `.Fail(...)`. The frontend's TS interfaces mirror this envelope exactly — keep them in sync.
- Endpoints are `[Authorize]` and expect `Authorization: Bearer <token>`. Several "list" endpoints are `HttpPost` with a request-body DTO (e.g. `POST /api/Orders/list`) rather than GET — match the existing verb when adding siblings.
- Passwords use PBKDF2 (SHA256, 100k iterations, 32-byte hash) verified with `CryptographicOperations.FixedTimeEquals` (`UserAuthService.VerifyPassword`).

## Frontend structure & conventions

- Single-page shell: `src/app/page.tsx` is a `'use client'` component that gates on `authService.isAuthenticated()`, then switches between feature "pages" (`OrdersPage`, `CustomersPage`, `CustomerLedgerPage`, etc.) via local `currentPage` state — there is **no per-feature route**; only `/` and `/login` exist as routes. Navigation is `Sidebar` (desktop) + `BottomNavigation` (mobile).
- **API base URL is configured manually** in `src/config/api.ts` by assigning `BASE_URL` to either `LOCAL_BASE_URL` or `PROD_BASE_URL` — there is no env var. All endpoint paths live in the `ENDPOINTS` map; add new ones there and call via `getApiUrl(getEndpoint('KEY'))`. (See also `API_CONFIG_README.md`.)
- Data access goes through service singletons in `src/services/` (`authService`, `orderService`, `customerService`), each exporting TS interfaces for the `ApiResponse` envelope and attaching the bearer token from `localStorage`.
- Auth state lives entirely in `localStorage` (`token`, `user`, `tenantInfo`); `authService` is the single owner of those keys. License expiry is derived client-side from `tenantInfo.lkEnd`.
- `@/*` path alias maps to `src/*`. PDF export uses `jspdf` + `jspdf-autotable` (frontend) and iText7 (backend `PdfService`).

## Security notes for this repo

`cicekgo.API/cicekgo.API/appsettings.json` currently contains **real SQL Server credentials and a server IP**, and CORS is set to `AllowAll` with `RequireHttpsMetadata = false`. These are dev/checked-in values; do not propagate them into new files, logs, or commits, and prefer the `FrontendOnly` CORS policy (already defined) when touching production config.
