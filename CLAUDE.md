# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

No test suite is configured. Backend API defaults to `http://localhost:8080` via `NEXT_PUBLIC_API_BASE_URL`.

## Code & UI Quality Standard

Every change must be production-ready. Specifically:

- **UI/UX** — Match the existing ZingZing design language (brand colors, spacing rhythm, component patterns). Prefer polished micro-interactions (transitions, hover states, focus rings) over bare functional implementations. Use Framer Motion for anything that animates in/out.
- **Consistency** — Reuse existing `cn()`, formatters, and service methods before writing new ones. New components must follow the same file/naming conventions as their neighbors.
- **No half-measures** — Edge cases (loading, empty, error states) must be handled. Responsive behavior must be verified across mobile and desktop breakpoints.
- **Clean code** — No dead imports, no commented-out code, no `any` types unless unavoidable. Keep components focused; extract logic into hooks or utilities when it gets complex.

## Stack

- **Next.js 15 App Router** — all routes live under `app/`. Server components by default; feature components use `'use client'`.
- **Tailwind CSS v4** — no `tailwind.config.js`; configured via `@import 'tailwindcss'` in `globals.css`. Arbitrary values are used heavily for brand colors.
- **shadcn/ui** (New York style) — primitives in `components/ui/`. Extend them in place; don't modify radix internals.
- **Zustand** for client state, **TanStack React Query** for server state. Both are set up in `components/providers.tsx`.
- **Framer Motion** for animations throughout.

## Architecture

### Route structure
Three authenticated zones, each with its own `layout.tsx`:
- `/creator/*` — creator dashboard, packages, offers, earnings, messages, insights, ambassador program
- `/brand/*` — brand dashboard, explore creators, offers (CRUD), orders, analytics
- `/admin/*` — platform admin: users, orders, payments, verification

Public pages: `/`, `/login`, `/signup`, `/forgot-password`, `/about`, `/pricing`, `/help`, etc.

### Data flow
```
API (http://localhost:8080)
  └─ lib/api/client.ts (ApiClient class, token injection, error handling)
       └─ lib/api/mappers.ts (backend → frontend type transformation)
            └─ services/*.service.ts (domain-specific methods)
                 └─ Zustand stores / React Query hooks
                      └─ Components
```

### API client (`lib/api/client.ts`)
`ApiClient` is a fetch wrapper that injects `Authorization: Bearer <token>` from sessionStorage, handles the backend's envelope format, and throws `ApiError` on non-2xx. Token is read/written via `getToken()` / `setToken()` in the same file.

### Services (`services/`)
One file per domain: `auth`, `creators`, `offers`, `orders`, `packages`, `payments`, `messages`, `notifications`, `earnings`, `analytics`, `reviews`, `uploads`, `admin`, `ambassador`, `brands`, `saved-creators`, `metadata`. Each exports a singleton service object.

### Stores (`store/`)
- **`auth-store.ts`** — central store. Holds `user`, `isAuthenticated`, `hasHydrated`. Exposes `login`, `loginWithGoogle`, `loginWithPhone`, `requestOtp`, `logout`. Persisted via Zustand `persist` middleware with version migration. Always check `hasHydrated` before reading auth state in components.
- `creator-packages-store.ts`, `ambassador-store.ts`, `filter-store.ts` — domain-specific stores.

### Three user roles
`UserRole = 'creator' | 'brand' | 'platform_admin'`. Most conditional logic branches on `user.role`. The `Navbar` component (`components/navbar.tsx`) has extensive per-role logic — treat it carefully.

### Types (`types/index.ts`)
Single file for all shared types. Key domain types: `User`, `Creator`, `Brand`, `Package`, `PackageTier`, `Order`, `BrandOffer`, `BrandOfferReaction`, `PlatformAmbassador`. Deal types: `'paid' | 'barter' | 'hybrid'`.

### Brand colors (hardcoded, not CSS vars)
The creator-facing UI uses hardcoded Tailwind arbitrary values — don't replace with CSS variables:
- Dark green: `#1e3d2e`, `#2d6b4e`, `#1f5239` (primary dark / primary / hover)
- Secondary text: `#496159`
- Panel/card bg: `#244c39`
- Cream background: `#fbfaf5`, `#f4f2e9`, `#e6eceb`
- Border: `#d1ddd6`, `#cddad1`
- Amber accent: `#e3a52f`, `#b77a12`, `#f7e8c8`

### Auth shell
`components/auth/auth-shell.tsx` wraps `/login` and `/signup` in a two-column layout (dark green panel left, form right). On desktop it uses `lg:justify-center` to center the card; on mobile the section has no min-height so the card sits near the top.

### Key utilities (`lib/utils.ts`)
`cn()` (Tailwind merge), `formatFollowers()`, `formatPrice()` (PKR), `formatDate()` / `formatRelativeTime()` (Asia/Karachi TZ), `getInitials()`.

Pakistan-specific data (cities, platforms, languages) lives in `lib/localization.ts`.
