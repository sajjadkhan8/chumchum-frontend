# ChamCham API Contract Audit

Date: 2026-06-03
Frontend source: `ChumChum-frontend`
Backend source: `chumchum-backend`
Related roadmap tracker: `docs/production-gap-matrix.md`

## Purpose

This document inventories the frontend's expected API surface against the backend's current Spring Boot controllers and DTOs. It is the first P0 production task from the gap matrix.

Use this as the integration fix queue. A route being present does not mean the contract is production-ready; payload names, response names, auth rules, status enums, pagination envelopes, and business side effects still need verification.

## Status Legend

| Status | Meaning |
| --- | --- |
| Match | Frontend route exists in backend and the visible contract appears aligned |
| Partial | Route exists, but request/response shape, auth, fallback behavior, or business semantics need fixes/tests |
| Missing | Frontend calls an endpoint not found in backend controllers |
| Backend-only | Backend exposes an endpoint not currently called by the frontend service layer |

## High-Risk Findings

| Priority | Finding | Evidence | Recommended Fix |
| --- | --- | --- | --- |
| Resolved | Frontend used non-existent "current creator" fallback routes | Frontend previously tried `GET /api/v1/creators/me` and `GET /api/v1/creator/profile`; backend exposes `GET /api/v1/creators/me/profile` | Updated `creatorsService.getMe()` to call `/api/v1/creators/me/profile`. |
| Resolved | Frontend calls metadata endpoints not found in backend | Frontend tries `/api/v1/creators/metadata`, `/api/v1/creators/filters`, `/api/v1/metadata/creators` | Added public metadata aliases returning the frontend creator filter vocabulary. |
| Resolved | Frontend calls ambassador info endpoints not found in backend | Frontend tries `/api/v1/ambassador/benefits`, `/api/v1/ambassador/eligibility`, `/api/v1/ambassador/requirements` | Added public benefits and eligibility/requirements aliases, and permitted public ambassador routes without auth. |
| Resolved | Frontend mappers mix snake_case and camelCase expectations | Creator/brand/package DTOs are `@JsonNaming(SnakeCaseStrategy)`, order/message/conversation DTOs are camelCase, and nested order deliverables are snake_case | Live verified the current split matches frontend mapper expectations for creator, brand, package, order, deliverable, conversation, and message responses. |
| Resolved | Package create/edit/status persistence was not fully production-wired | Backend requires `name`, `title`, `platform`, `type`, `price`, `deliverables`, `deliveryDays`; frontend package wizard now builds the required snake_case request through the package store | Live create/edit/status/read-back verified; remaining improvement is to replace the loose `Record<string, unknown>` service signature with an exported typed request. |
| Resolved | Order creation and deliverable review flow was not fully production-wired | Backend exposes `POST /api/v1/orders` plus deliverable submit/status endpoints; frontend now creates package orders, accepted quick deals create real orders, order lists read persisted deliverables, and submit/review uses backend IDs | Package purchase, quick deal acceptance, order list/status, deliverable creation, submit, approve, and read-back are live verified. |
| Resolved | Upload endpoints were not consistently wired in frontend services | Backend exposes `/api/v1/uploads/*`; frontend now has `uploads.service.ts`; creator avatar/cover, brand logo, deliverable submit, and package wizard media use multipart uploads | Live verified upload/read-back for creator profile media, brand logo, package media, and deliverables. |
| Resolved | Admin roadmap surface had no matching backend contract | Roadmap requires admin verification, user moderation, order oversight, analytics; backend now exposes admin dashboard, users, orders, verification, and ambassador review contracts | Build the admin frontend shell/pages against the verified admin MVP routes. |

## Frontend Endpoint Inventory

### Auth & Current User

| Frontend Call | Source | Backend Route | Status | Notes |
| --- | --- | --- | --- | --- |
| `POST /api/v1/auth/login` | `services/auth.service.ts` | `POST /api/v1/auth/login` | Match | Request `{ email, password }`; response expected `{ accessToken, refreshToken, user }`. |
| `POST /api/v1/auth/register` | `services/auth.service.ts` | `POST /api/v1/auth/register` | Match | Frontend sends role uppercase. Verify backend creates role-specific Creator/Brand records. |
| `POST /api/v1/auth/send-otp` | `services/auth.service.ts` | `POST /api/v1/auth/send-otp` | Match | Frontend expects `{ message, expiresIn }`. |
| `POST /api/v1/auth/verify-otp` | `services/auth.service.ts` | `POST /api/v1/auth/verify-otp` | Match | Frontend expects token response. |
| `POST /api/v1/auth/refresh` | `lib/api/client.ts` | `POST /api/v1/auth/refresh` | Match | Used automatically after 401. |
| `POST /api/v1/auth/logout` | `services/auth.service.ts` | `POST /api/v1/auth/logout` | Match | Verify server-side invalidation vs client token clear. |
| `GET /api/v1/users/me` | `services/auth.service.ts` | `GET /api/v1/users/me` | Match | Frontend maps user role/name/avatar. |
| `POST /api/v1/auth/forgot-password` | `services/auth.service.ts`, `app/forgot-password/page.tsx` | `POST /api/v1/auth/forgot-password` | Match | Forgot password page now submits email and shows neutral success messaging. Live verified request accepted. |
| `POST /api/v1/auth/reset-password` | `services/auth.service.ts`, `app/forgot-password/page.tsx?token=...` | `POST /api/v1/auth/reset-password` | Match | Forgot password page now supports token-based reset mode with password confirmation. Live verified invalid token rejection. |
| `PATCH /api/v1/users/me/password` | `services/users.service.ts`, creator/brand settings security tabs | `PATCH /api/v1/users/me/password` | Match | Settings security tabs now send `{ currentPassword, newPassword }`. Live verified old password is rejected and new password works after change. |
| `DELETE /api/v1/users/me` | `services/users.service.ts`, creator/brand settings security tabs | `DELETE /api/v1/users/me` | Match | Settings security tabs now require password confirmation and clear local auth after deletion. Backend now blocks deleted accounts from login/token use. Live verified. |

### Creator Discovery & Profile

| Frontend Call | Source | Backend Route | Status | Notes |
| --- | --- | --- | --- | --- |
| `GET /api/v1/creators` | `services/creators.service.ts` | `GET /api/v1/creators` | Match | Live verified backend-supported filters include search, city, follower/rating/price ranges, trust level, availability, barter, sorting, and limit. Category/platform/deal-type combinations remain frontend-side refinements after API results. |
| `GET /api/v1/creators/{id}` | `services/creators.service.ts`, mappers | `GET /api/v1/creators/{creatorId}` | Partial | Route exists. Creator DTO is snake_case; mapper expects old user fields like `user.username` and `user.image`. Verify `ProfileUserResponse`. |
| `GET /api/v1/creators/trending` | `services/creators.service.ts` | `GET /api/v1/creators/trending` | Match | Verify limit param support. |
| `GET /api/v1/creators/barter-friendly` | `services/creators.service.ts` | `GET /api/v1/creators/barter-friendly` | Match | Verify response envelope. |
| `GET /api/v1/creators/fast-responders` | `services/creators.service.ts` | `GET /api/v1/creators/fast-responders` | Match | Verify response fields for `isFastResponder` if needed. |
| `GET /api/v1/creators/by-city` | `services/creators.service.ts` | `GET /api/v1/creators/by-city` | Match | Frontend sends `city`, `limit`. |
| `GET /api/v1/creators/me/profile` | `services/creators.service.ts` | `GET /api/v1/creators/me/profile` | Match | Used by `creatorsService.getMe()` for creator dashboard and ambassador program profile lookup. |
| `PATCH /api/v1/creators/me/profile` | `services/creators.service.ts`, `app/creator/settings/page.tsx` | `PATCH /api/v1/creators/me/profile` | Match | Live PATCH/read-back verified for full creator settings profile fields. |
| `PUT /api/v1/creators/me/social-accounts` | `services/creators.service.ts`, `app/creator/settings/page.tsx` | `PUT /api/v1/creators/me/social-accounts` | Match | Live PUT/read-back verified for social accounts. |
| `PATCH /api/v1/creators/me/preferences` | Not found in service inventory | `PATCH /api/v1/creators/me/preferences` | Backend-only | Needed for creator preference settings. |
| `PATCH /api/v1/creators/me/payment-settings` | Not found in service inventory | `PATCH /api/v1/creators/me/payment-settings` | Backend-only | Needed for creator payment settings. |
| `GET /api/v1/creators/{creatorId}/packages` | Not called by packages service | `GET /api/v1/creators/{creatorId}/packages` | Backend-only | Frontend currently queries `/api/v1/packages?creatorId=...`; either is fine if both work. |
| `GET /api/v1/creators/metadata` | `services/metadata.service.ts` | `GET /api/v1/creators/metadata` | Match | Public metadata endpoint returns categories, cities, platforms, deal types, barter types, follower ranges, and price ranges. Live verified unauthenticated. |
| `GET /api/v1/creators/filters` | `services/metadata.service.ts` | `GET /api/v1/creators/filters` | Match | Alias for creator filter metadata. Live verified unauthenticated. |
| `GET /api/v1/metadata/creators` | `services/metadata.service.ts` | `GET /api/v1/metadata/creators` | Match | Alias for creator filter metadata. Live verified unauthenticated. |

### Brand

| Frontend Call | Source | Backend Route | Status | Notes |
| --- | --- | --- | --- | --- |
| `GET /api/v1/brands/{id}` | `services/messages.service.ts`, `services/orders.service.ts` | `GET /api/v1/brands/{brandId}` | Partial | Used to enrich messages/orders. Mapper expects snake_case fields `logo_url`, `monthly_budget`, but `BrandResponse` needs verification. |
| `GET /api/v1/brands/me/profile` | Not found in service inventory | `GET /api/v1/brands/me/profile` | Backend-only | Needed for brand settings/onboarding. |
| `PATCH /api/v1/brands/me/profile` | Not found in service inventory | `PATCH /api/v1/brands/me/profile` | Backend-only | Needed for brand profile edit. |
| `GET /api/v1/brands` | Not found in service inventory | `GET /api/v1/brands` | Backend-only | May be admin/internal only. |
| `POST /api/v1/brands` | Not found in service inventory | `POST /api/v1/brands` | Backend-only | Verify whether auth register creates brand automatically. |

### Packages

| Frontend Call | Source | Backend Route | Status | Notes |
| --- | --- | --- | --- | --- |
| `GET /api/v1/packages` | `services/packages.service.ts` | `GET /api/v1/packages` | Match | Public package listing accepts paged `{ content }`; frontend normalizes array or page responses. |
| `GET /api/v1/packages/mine` | `services/packages.service.ts` | `GET /api/v1/packages/mine` | Match | Added authenticated creator inventory endpoint so drafts, paused, archived, and private packages remain visible in Package Studio. |
| `GET /api/v1/packages/{id}` | `services/packages.service.ts` | `GET /api/v1/packages/{id}` | Match | Response uses snake_case because `ServicePackageResponse` has `@JsonNaming`. |
| `GET /api/v1/packages/featured` | `services/packages.service.ts` | `GET /api/v1/packages/featured` | Match | Verify route ordering does not conflict with `/{id}`. In Spring, literal route should win. |
| `POST /api/v1/packages` | `services/packages.service.ts` | `POST /api/v1/packages` | Match | Live create/read-back verified with required snake_case payload, hybrid pricing, deliverables, tags, media, status, and visibility. |
| `PATCH /api/v1/packages/{id}` | `services/packages.service.ts` | `PATCH /api/v1/packages/{id}` | Match | Live edit/read-back verified. Backend now clears incompatible barter/hybrid fields when deal type changes to paid. |
| `PATCH /api/v1/packages/{id}/status` | `services/packages.service.ts` | `PATCH /api/v1/packages/{id}/status` | Match | Live `ACTIVE -> PAUSED -> ACTIVE -> ARCHIVED` verified. Frontend only shows pause/resume actions for active/paused packages. |
| `POST /api/v1/packages/{id}/duplicate` | `services/packages.service.ts` | `POST /api/v1/packages/{id}/duplicate` | Match | Permissions enforced by owner/admin check; duplicate copies pricing metadata and saves as draft. |
| `DELETE /api/v1/packages/{id}` | `services/packages.service.ts` | `DELETE /api/v1/packages/{id}` | Match | Verify frontend handles no-content response. |
| `GET /api/v1/packages/{id}/analytics` | `services/packages.service.ts` | `GET /api/v1/packages/{id}/analytics` | Partial | Frontend expects `PackageAnalytics` camelCase fields. Verify backend response shape. |

### Saved Creators

| Frontend Call | Source | Backend Route | Status | Notes |
| --- | --- | --- | --- | --- |
| `GET /api/v1/saved-creators` | `services/saved-creators.service.ts`, `store/auth-store.ts`, `app/brand/saved/page.tsx` | `GET /api/v1/saved-creators` | Match | Backend returns `{ creators, total }`; brand saved page now loads full saved creator profiles directly. Backend saved list fetches creator relation to avoid lazy-loading failures. |
| `POST /api/v1/saved-creators/{creatorId}` | `services/saved-creators.service.ts`, `store/auth-store.ts` | `POST /api/v1/saved-creators/{creatorId}` | Match | Idempotent save verified. |
| `DELETE /api/v1/saved-creators/{creatorId}` | `services/saved-creators.service.ts`, `store/auth-store.ts` | `DELETE /api/v1/saved-creators/{creatorId}` | Match | Remove persistence verified. |

### Conversations, Messages, Quick Deals

| Frontend Call | Source | Backend Route | Status | Notes |
| --- | --- | --- | --- | --- |
| `GET /api/v1/conversations` | `services/messages.service.ts` | `GET /api/v1/conversations` | Match | Response is camelCase and mapper expects camelCase. Backend now exposes `unreadCountCreator` and `unreadCountBrand`; frontend maps the role-specific count for conversation badges. |
| `POST /api/v1/conversations` | `services/messages.service.ts` | `POST /api/v1/conversations` | Match | Frontend sends `{ to: creatorId }`; backend `ConversationCreateRequest` accepts `to`, optional `from`. |
| `GET /api/v1/conversations/{conversationId}/messages` | `services/messages.service.ts` | `GET /api/v1/conversations/{conversationId}/messages` | Match | Response is camelCase and mapper expects camelCase. |
| `POST /api/v1/conversations/{conversationId}/messages` | `services/messages.service.ts` | `POST /api/v1/conversations/{conversationId}/messages` | Match | Frontend sends `{ content }`; backend accepts `MessageCreateRequest`. |
| `POST /api/v1/conversations/{conversationId}/messages/offer` | `services/messages.service.ts` | `POST /api/v1/conversations/{conversationId}/messages/offer` | Partial | Frontend sends `offerCreatorExpectation` only through quick deal, not message offer. Backend `MessageCreateRequest` lacks creator expectation. |
| `POST /api/v1/conversations/{conversationId}/messages/attachment` | `services/messages.service.ts`, `app/messages/page.tsx` | `POST /api/v1/conversations/{conversationId}/messages/attachment` | Match | Multipart `file`. Shared messages UI now sends image/file attachments and renders returned `attachmentUrl` links. Live verified upload, brand/creator message read-back, and static file fetch. |
| `PATCH /api/v1/conversations/{conversationId}/read` | `services/messages.service.ts` | `PATCH /api/v1/conversations/{conversationId}/read` | Match | Verify unread count semantics. |
| `POST /api/v1/quick-deals` | `services/messages.service.ts`, `app/messages/page.tsx` | `POST /api/v1/quick-deals` | Match | Frontend sends camelCase; backend request has camelCase fields and enum `DealType`. Brand message flow now opens the quick-deal modal from the selected conversation and read-back includes creator expectation fields. |
| `PATCH /api/v1/quick-deals/{offerId}/respond` | `services/messages.service.ts`, `app/messages/page.tsx` | `PATCH /api/v1/quick-deals/{offerId}/respond` | Match | Frontend action values are lowercase `accepted`/`rejected`; backend normalizes to `OfferStatus`. Accepting an offer creates a private quick-deal package plus a pending order and returns `orderId`; accepted offer messages now read back with `offerOrderId`. Live verified creator/brand order and message read-back. |

### Orders & Deliverables

| Frontend Call | Source | Backend Route | Status | Notes |
| --- | --- | --- | --- | --- |
| `GET /api/v1/orders` | `services/orders.service.ts` | `GET /api/v1/orders` | Match | Live verified raw array response for brand and creator participants. Backend order queries now fetch required associations for mapper read-back. |
| `GET /api/v1/orders/{id}` | `services/orders.service.ts` | `GET /api/v1/orders/{orderId}` | Match | Response is camelCase and mapper expects camelCase. |
| `PATCH /api/v1/orders/{orderId}/status` | `services/orders.service.ts` | `PATCH /api/v1/orders/{orderId}/status` | Partial | Frontend sends uppercase status from TS enum. Verify backend `OrderStatus` values and transition rules. |
| `PATCH /api/v1/orders/{orderId}/progress` | `services/orders.service.ts` | `PATCH /api/v1/orders/{orderId}/progress` | Match | Frontend sends `{ progress }`. |
| `POST /api/v1/orders/{orderId}/deliverables/{deliverableId}/submit` | `services/orders.service.ts`, `app/creator/orders/page.tsx` | `POST /api/v1/orders/{orderId}/deliverables/{deliverableId}/submit` | Match | Creator order page submits JSON `{ fileUrl, note }` against persisted deliverable IDs. Live verified status `review`, `file_url`, and read-back. |
| `PATCH /api/v1/orders/{orderId}/deliverables/{deliverableId}/status` | `services/orders.service.ts`, `app/brand/orders/page.tsx` | `PATCH /api/v1/orders/{orderId}/deliverables/{deliverableId}/status` | Match | Brand order page can approve review deliverables to `completed` or request `revision` by persisted deliverable ID. Live verified `review -> completed` read-back. |
| `POST /api/v1/orders` | `services/orders.service.ts`, `components/package-order-modal.tsx`, `app/creator/[id]/page.tsx` | `POST /api/v1/orders` | Match | Wired package `Order Now` for brand users. Live verified hybrid order create/read-back from brand and creator order lists. |

### Reviews

| Frontend Call | Source | Backend Route | Status | Notes |
| --- | --- | --- | --- | --- |
| `GET /api/v1/creators/{creatorId}/reviews` | `services/reviews.service.ts` | `GET /api/v1/creators/{creatorId}/reviews` | Match | Creator reviews read back after completed-order review creation. |
| `GET /api/v1/reviews` | `services/reviews.service.ts` fallback | None found | Missing | Remove fallback or add route if product needs global review query. |
| `POST /api/v1/reviews` | `services/reviews.service.ts`, `app/brand/orders/page.tsx` | `POST /api/v1/reviews` | Match | Brand completed-order review dialog submits `{ orderId, rating, comment }`; backend fills legacy review columns from the order and updates creator aggregate rating/count. Live verified. |

### Ambassador

| Frontend Call | Source | Backend Route | Status | Notes |
| --- | --- | --- | --- | --- |
| `GET /api/v1/ambassador/application` | `services/ambassador.service.ts` | `GET /api/v1/ambassador/application` | Match | Authenticated creator route. |
| `POST /api/v1/ambassador/application` | `services/ambassador.service.ts` | `POST /api/v1/ambassador/application` | Match | Verify duplicate application behavior. |
| `GET /api/v1/ambassador/score` | `services/ambassador.service.ts` | `GET /api/v1/ambassador/score` | Match | Frontend expects `CreatorAmbassadorMetrics`. Verify field names. |
| `GET /api/v1/ambassador/ambassadors` | `services/ambassador.service.ts` | `GET /api/v1/ambassador/ambassadors` | Partial | Frontend accepts array or `{ ambassadors }`. Verify backend response shape. |
| `GET /api/v1/ambassador/benefits` | `services/ambassador.service.ts` | `GET /api/v1/ambassador/benefits` | Match | Public benefits endpoint returns `{ benefits }`. Live verified unauthenticated. |
| `GET /api/v1/ambassador/eligibility` | `services/ambassador.service.ts` | `GET /api/v1/ambassador/eligibility` | Match | Public eligibility endpoint returns minimum follower, engagement, rating, completed deal, and verification-step requirements. Live verified unauthenticated. |
| `GET /api/v1/ambassador/requirements` | `services/ambassador.service.ts` | `GET /api/v1/ambassador/requirements` | Match | Alias for ambassador eligibility requirements. Live verified unauthenticated. |
| `GET /api/v1/ambassador/applications` | Not found in frontend service | `GET /api/v1/ambassador/applications` | Backend-only | Admin route; no admin frontend found. |
| `GET /api/v1/ambassador/applications/{id}` | Not found in frontend service | `GET /api/v1/ambassador/applications/{id}` | Backend-only | Admin route. |
| `PATCH /api/v1/ambassador/applications/{id}` | Not found in frontend service | `PATCH /api/v1/ambassador/applications/{id}` | Backend-only | Admin route. |

### Analytics

| Frontend Call | Source | Backend Route | Status | Notes |
| --- | --- | --- | --- | --- |
| `GET /api/v1/analytics/brand/dashboard` | `services/analytics.service.ts`, `app/brand/dashboard/page.tsx` | `GET /api/v1/analytics/brand/dashboard` | Match | Brand dashboard now uses live order counts, completed counts, saved creator count, total spend, distinct creators worked with, and average rating given. |
| `GET /api/v1/analytics/creator/dashboard` | `services/analytics.service.ts`, `app/creator/dashboard/page.tsx` | `GET /api/v1/analytics/creator/dashboard` | Match | Creator dashboard now uses live order counts, completed counts, total earnings, rating, reviews, and repeat brand metrics. |
| `GET /api/v1/analytics/creator/insights` | `services/analytics.service.ts`, `app/creator/insights/page.tsx` | `GET /api/v1/analytics/creator/insights` | Match | Creator insights now renders live totals, top package rows, and platform contribution from backend analytics. Monthly inquiry trend remains an explicit empty state until time-series data exists. |
| `GET /api/v1/analytics/creator/performance` | `services/analytics.service.ts`, `app/creator/performance/page.tsx` | `GET /api/v1/analytics/creator/performance` | Match | Creator performance now renders live package analytics rows and efficiency scores from backend analytics. |
| `GET /api/v1/analytics/brand/campaigns` | `services/analytics.service.ts`, `app/brand/analytics/page.tsx` | `GET /api/v1/analytics/brand/campaigns` | Match | Brand analytics now renders live spend, active creators, total/completed orders, top creator cities, and deal mix. Reach and engagement remain zero until social/impression metrics exist. |

### Earnings, Payouts, Withdrawals

| Frontend Call | Source | Backend Route | Status | Notes |
| --- | --- | --- | --- | --- |
| `GET /api/v1/earnings/summary` | `services/earnings.service.ts`, `app/creator/earnings/page.tsx` | `GET /api/v1/earnings/summary` | Match | Creator earnings page now uses live wallet totals. Completing a paid/hybrid order credits creator wallet and writes an earning transaction. |
| `GET /api/v1/earnings/transactions` | `services/earnings.service.ts`, `app/creator/earnings/page.tsx` | `GET /api/v1/earnings/transactions` | Match | Creator earnings page renders live transaction history. |
| `GET /api/v1/payout-methods` | `services/earnings.service.ts`, `app/creator/earnings/page.tsx` | `GET /api/v1/payout-methods` | Match | Creator earnings page renders live payout methods. |
| `POST /api/v1/payout-methods` | `services/earnings.service.ts`, `app/creator/earnings/page.tsx` | `POST /api/v1/payout-methods` | Match | Creator earnings page can add payout methods. Backend returns masked account details. |
| None found in service inventory | N/A | `PATCH /api/v1/payout-methods/{id}` | Backend-only | Same. |
| None found in service inventory | N/A | `DELETE /api/v1/payout-methods/{id}` | Backend-only | Same. |
| `POST /api/v1/withdrawals` | `services/earnings.service.ts`, `app/creator/earnings/page.tsx` | `POST /api/v1/withdrawals` | Match | Creator earnings page can request withdrawals against a selected payout method. |
| `GET /api/v1/withdrawals` | `services/earnings.service.ts`, `app/creator/earnings/page.tsx` | `GET /api/v1/withdrawals` | Match | Creator earnings page merges withdrawal requests into activity history. |

### Uploads

| Frontend Call | Source | Backend Route | Status | Notes |
| --- | --- | --- | --- | --- |
| `POST /api/v1/uploads/avatar` | `services/uploads.service.ts`, `app/creator/settings/page.tsx` | `POST /api/v1/uploads/avatar` | Match | Creator settings avatar upload fills `avatar_url`; live verified upload, profile PATCH, and profile read-back. |
| `POST /api/v1/uploads/cover-image` | `services/uploads.service.ts`, `app/creator/settings/page.tsx` | `POST /api/v1/uploads/cover-image` | Match | Creator settings cover upload fills `cover_image_url`; live verified upload, profile PATCH, and profile read-back. |
| `POST /api/v1/uploads/content-preview` | `services/uploads.service.ts`, `components/creator-package-wizard.tsx` | `POST /api/v1/uploads/content-preview` | Match | Package wizard preview gallery upload fills `media_urls`. Live verified upload, package create, and `/packages/mine` read-back. |
| `POST /api/v1/uploads/package-thumbnail` | `services/uploads.service.ts`, `components/creator-package-wizard.tsx` | `POST /api/v1/uploads/package-thumbnail` | Match | Package wizard thumbnail upload fills `cover_image`. Live verified upload, package create, and `/packages/mine` read-back. |
| `POST /api/v1/uploads/deliverable` | `services/uploads.service.ts`, `app/creator/orders/page.tsx` | `POST /api/v1/uploads/deliverable` | Match | Creator submit dialog uploads selected file as multipart before calling deliverable submit. Live verified upload URL and order read-back. |
| `POST /api/v1/uploads/brand-logo` | `services/uploads.service.ts`, `app/brand/settings/page.tsx` | `POST /api/v1/uploads/brand-logo` | Match | Brand settings logo upload fills `logo_url`; live verified upload, brand profile PATCH, and profile read-back. |

## Backend Route Inventory

The backend currently exposes these route groups:

| Group | Routes |
| --- | --- |
| Auth | `POST /api/v1/auth/register`, `login`, `send-otp`, `verify-otp`, `refresh`, `forgot-password`, `reset-password`, `logout` |
| Users | `GET /api/v1/users/me`, `PATCH /me/password`, `DELETE /me`, notification preference get/put |
| Creators | create/list/trending/barter-friendly/fast-responders/by-city/get by id/reviews/packages/user/self profile/update/social accounts/preferences/payment settings |
| Brands | create/list/get by id/get by user/self profile/update |
| Packages | create/update/status/duplicate/analytics/delete/get by id/list/featured/authenticated mine |
| Conversations/Messages | list/create/single, message list/send/offer/attachment/read |
| Quick Deals | create/respond |
| Orders | list/create/get/status/progress/deliverable submit/deliverable status |
| Reviews | create |
| Saved Creators | list/save/delete |
| Ambassador | application submit/read, score, public ambassadors, admin applications |
| Admin | dashboard, user list/status, order list/status, creator verification, brand verification, ambassador applications/review |
| Metadata | creator filter metadata aliases |
| Analytics | creator dashboard, brand dashboard, creator insights/performance, brand campaigns |
| Earnings/Payouts/Withdrawals | summary, transactions, payout method CRUD, withdrawal create/list |
| Uploads | avatar, cover image, content preview, package thumbnail, deliverable, brand logo |

## Recommended Fix Order

1. Create typed frontend request contracts for packages, orders, reviews, earnings, payout methods, withdrawals, and uploads.
2. Verify response naming with mapper-focused tests for creator, brand, package, order, message, conversation, ambassador, and analytics DTOs.
3. Add frontend service wrappers for backend-only production routes currently used by pages through fixtures or not used at all.
4. Add mapper-focused contract tests for message offer IDs, quick deal `orderId`, and order deliverables.
5. Build the admin frontend shell/pages against the verified admin MVP backend routes.

## Verification Checklist

- Backend build passes.
- Frontend typecheck/build passes.
- Auth token refresh works against backend.
- Route inventory has no unintentional Missing rows.
- Every Partial row has either a test, a code fix, or an explicit product decision.
- Contract examples exist for the first production slice: creator signup/login/onboarding/profile.

## Verification Log

| Date | Check | Result | Notes |
| --- | --- | --- | --- |
| 2026-06-03 | Frontend `creatorsService.getMe()` route | Passed | Updated to call `/api/v1/creators/me/profile`. |
| 2026-06-03 | Frontend `npm run lint` | Passed with warnings | Added ESLint flat config and required dev dependencies; remaining warnings are existing unused imports/hook dependency warnings. |
| 2026-06-03 | Frontend `npm run build` | Passed | Requires network access for Google Fonts. |
| 2026-06-03 | Browser smoke: `/login`, `/signup`, `/creator/dashboard` | Passed | Login and signup render without runtime errors; unauthenticated creator dashboard redirects to login. |
| 2026-06-03 | Live backend health | Passed | `GET /actuator/health` returned `{"status":"UP"}` on `127.0.0.1:8080`. |
| 2026-06-03 | Live creator auth/profile API smoke | Passed | Registered and logged in `codex-creator-20260603-1627@example.com`; `GET /api/v1/users/me` and `GET /api/v1/creators/me/profile` returned 200. |
| 2026-06-03 | Frontend creator settings profile/social wiring | Passed | Added `creatorsService.updateMe()` and `updateSocialAccounts()`; settings page loads live creator profile and saves supported profile/social fields. |
| 2026-06-03 | Frontend `npm run lint` after profile/social wiring | Passed with warnings | Warnings are existing unused imports/hook dependency warnings; no errors. |
| 2026-06-03 | Frontend `npm run build` after profile/social wiring | Passed | Requires network access for Google Fonts. |
| 2026-06-03 | Live creator profile/social PATCH/PUT smoke | Blocked | `localhost:8080` was no longer listening when verification was attempted. |
| 2026-06-03 | Expanded profile/social persistence contract | Source updated | Backend DTO/mapper/service now include full profile fields and social account read-back; frontend mapper/settings page updated. Requires backend restart to verify live. |
| 2026-06-03 | Frontend `npx tsc --noEmit` after persistence fix | Passed | TypeScript validation completed with no errors. |
| 2026-06-03 | Backend `./gradlew build` | Passed | Gradle wrapper jar is present; build completed successfully. |
| 2026-06-03 | Live creator profile PATCH/read-back | Passed | Verified persisted name, username, email, phone, city, avatar URL, bio, category, cover image, website, niche, availability, response time, min/max price, barter flags, minimum budget, preferred industries, languages, categories, and social URLs. |
| 2026-06-03 | Live creator social PUT/read-back | Passed | Verified Instagram and YouTube rows persisted with username, profile URL, followers, average views, engagement rate, and verification flag. |
| 2026-06-03 | Creator package API create/edit/status/read-back | Passed | Registered `codex-package-1780508522@example.com`; verified `POST /packages`, `GET /packages/mine`, `PATCH /packages/{id}`, `PATCH /packages/{id}/status` through `PAUSED`, `ACTIVE`, `ARCHIVED`, and archived read-back from `/mine`. |
| 2026-06-03 | Creator package stale pricing cleanup | Passed | Verified changing a package from `HYBRID` to `PAID` clears old barter/hybrid metadata in the read-back response. |
| 2026-06-03 | Creator package media URL create/edit read-back | Passed | Wired wizard gallery URLs to `media_urls`; verified create response returned two media URLs and edit response returned the updated single media URL. |
| 2026-06-03 | Creator package browser smoke | Blocked | In-app browser was unauthenticated for `127.0.0.1`; protected page rendered its auth gate, and the browser runtime could not fill login fields because its virtual clipboard was unavailable. API verification passed. |
| 2026-06-04 | Package purchase/order creation flow | Passed | Added frontend `ordersService.create()` and package order modal. Live verified brand-created hybrid order appears in both brand and creator `GET /api/v1/orders` lists. |
| 2026-06-04 | Backend order list lazy-loading fix | Passed | `GET /api/v1/orders` initially failed with `LazyInitializationException`; fixed order repository fetch queries and transactional read methods, then live read-back passed. |
| 2026-06-04 | Creator order list/status workflow | Passed | Replaced fixture-based creator orders page with live `ordersService.getAll()` data and creator status actions. Live verified `pending -> accepted -> in_progress -> delivered` and creator list read-back. |
| 2026-06-04 | Brand order list/status workflow | Passed | Replaced fixture-based brand orders page with live `ordersService.getAll()` data and brand approval/revision/cancel actions. Live verified `pending -> accepted -> in_progress -> delivered -> completed` and brand list read-back. |
| 2026-06-04 | Order deliverable persistence workflow | Passed | Backend now creates order deliverables from package deliverables and includes them in `OrderResponse`; frontend maps `Order.deliverables` and uses real IDs on creator submit and brand review. Live verified order `395b6303-52d2-4115-9bd0-fbc6903dfbb2`: two pending deliverables created, first submitted to `review`, approved to `completed`, and read back with `file_url`. |
| 2026-06-04 | Backend `./gradlew build` after deliverables | Passed | Build completed successfully after adding deliverables to order create/response mapping. |
| 2026-06-04 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after deliverables | Passed with warnings | Build and typecheck passed. Lint has existing unused import/hook dependency warnings; no errors. |
| 2026-06-05 | Deliverable upload service and submit workflow | Passed | Added `services/uploads.service.ts` and wired creator deliverable modal to upload multipart files before submit. Live verified order `16fd5fe9-dab3-4a0e-b66f-15e99967c4fd`: upload returned `/uploads/deliverables/...txt`, submit moved deliverable to `review`, and creator order read-back preserved `file_url`. |
| 2026-06-05 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after upload wiring | Passed with warnings | Build and typecheck passed. Lint has existing unused import/hook dependency warnings; no errors. |
| 2026-06-05 | Admin MVP backend contracts | Passed | Added admin dashboard, user moderation, creator/brand verification, order oversight, and ambassador review routes. Live verified admin guard, dashboard, users, disable/re-enable login behavior, creator/brand verification, orders, order status update, and ambassador application list. |
| 2026-06-05 | Admin MVP frontend shell | Passed | Added admin auth routing, admin dashboard/users/orders/verification pages, and typed admin service. Live browser verified `/admin/dashboard`, `/admin/users`, `/admin/orders`, and `/admin/verification`; API verified creator/brand verification state read-back through `/admin/users`. |
| 2026-06-05 | Admin list search/filter/pagination | Passed | Added admin user filters for search, role, active status, page, and limit; added admin order filters for search, status, page, and limit; wired users/orders UI controls and pagination. Live verified filtered and empty-search initial loads. |
| 2026-06-06 | Admin verification queue search/filter/pagination | Passed | Added dedicated paged creator and brand verification queue contracts, searchable/status-filtered ambassador applications with creator identity, and independent frontend queue controls per verification tab. Backend build, frontend typecheck/build, live API checks, and browser smoke passed. |
| 2026-06-06 | Admin disputes and immutable moderation audit history | Passed | Added dispute create/list/filter/triage/assign/resolve contracts and a read-only paged audit-log contract; instrumented admin moderation mutations. Live verified persistence, filtered read-back, audit entries, non-admin denial, frontend build, and `/admin/disputes` browser rendering. |
| 2026-06-06 | Controlled dispute refund and cancellation execution | Passed | Added idempotent admin-only dispute refund execution, immutable refund records, order cancellation, completed-order creator wallet clawback, negative refund transactions, duplicate protection, and audited execution. Live verified pending and completed-order paths, wallet and transaction read-back, non-admin denial, duplicate rejection, and rollback when withdrawn earnings make clawback unsafe; frontend build and refund UI rendering passed. |
| 2026-06-06 | Provider-agnostic mock refund lifecycle | Passed | Refactored refunds behind a provider interface and mock adapter. Refund submission now persists pending provider references; delayed webhook-style confirmations apply cancellation/clawback, while declines and unsafe reconciliation become failed refunds without order mutation. Added normalized signed webhook contract, pending/confirmed/failed UI states, and lifecycle audit actions. Live verified timing guarantees, success and failure flows, and audit read-back. |
| 2026-06-06 | Verified creator badge-level management | Passed | Added persisted creator badge levels (`none`, `verified`, `rising_star`, `pro`, `elite`), admin-only assignment, verification eligibility guards, automatic baseline/reset behavior, creator API exposure, and audit actions. Backend build, frontend typecheck, V8 migration, browser assignment/read-back, disabled unverified controls, and audit integration passed. JWT authentication now also validates the current active user record, and audited admin mutations are transactional to prevent partial success. |
| 2026-06-06 | Brand-facing creator trust badges and profile navigation | Passed | Creator trust levels now render on shared discovery cards and public profiles. Username profile routes resolve through creator search, and backend discovery search now includes usernames. Frontend/backend builds and desktop/mobile browser verification passed. |
| 2026-06-06 | Creator public-profile portfolio | Passed | Creator responses now include persisted content previews. Public profiles merge those previews with package cover/media uploads, deduplicate them, show platform/view context, and open each sample directly. Frontend/backend builds and desktop/mobile live verification passed. |
| 2026-06-06 | Brand creator discovery trust, availability, and budget filters | Passed | Added live backend trust-level and availability filters, corrected Trending from a hidden filter into a sort, added visible removable active-filter chips, and replaced unrealistic budget ranges with useful PKR bands. Live verified Verified narrows to 6 creators and Verified + Available narrows to 3. |
| 2026-06-05 | Package thumbnail and preview upload workflow | Passed | Wired creator package wizard media step to `uploadsService.packageThumbnail()` and `uploadsService.contentPreview()`. Live verified package `f4fa52c6-1ae8-41b6-942d-9282ea5cb80e`: uploaded thumbnail persisted as `cover_image`, preview persisted in `media_urls`, and `/packages/mine` read-back matched both URLs. |
| 2026-06-05 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after package media upload wiring | Passed with warnings | Build and typecheck passed. Lint has existing unused import/hook dependency warnings; no errors. |
| 2026-06-05 | Creator avatar and cover image upload workflow | Passed | Wired creator settings profile tab to `uploadsService.avatar()` and `uploadsService.coverImage()`. Live verified creator `c601544d-c628-4ddc-80dc-5f731f3ab6ae`: uploaded avatar and cover URLs persisted through profile PATCH and `/creators/me/profile` read-back. |
| 2026-06-05 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after creator settings upload wiring | Passed with warnings | Build and typecheck passed. Lint has existing unused import/hook dependency warnings; no errors. |
| 2026-06-05 | Brand logo upload workflow | Passed | Added `brands.service.ts` and wired brand settings company tab to `uploadsService.brandLogo()`. Live verified brand `8bebccf6-9fe4-4855-a3de-1f8aeb9fcea7`: uploaded logo URL persisted through brand profile PATCH and `/brands/me/profile` read-back. |
| 2026-06-05 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after brand logo upload wiring | Passed with warnings | Build and typecheck passed. Lint has existing unused import/hook dependency warnings; no errors. |
| 2026-06-05 | Quick deal acceptance to order workflow | Passed | Backend quick deal accept now creates a private quick-deal package, creates a pending order from offer terms, updates message offer status, and returns `orderId`; frontend message offer buttons call respond endpoint and update local offer state. Live verified offer `1058384a-bc5c-454c-afe5-5ed915e30b68` created order `56f03556-65ca-4a0e-ade3-fa89e2159541`, visible in both creator and brand order lists with pending deliverable. |
| 2026-06-05 | Backend `./gradlew build`; frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after quick deal acceptance wiring | Passed with warnings | Backend build, frontend build, and typecheck passed. Lint has existing unused import/hook dependency warnings; no errors. |
| 2026-06-05 | Completed-order review workflow | Passed | Wired brand order review dialog to `reviewsService.create()` and fixed backend review persistence for legacy non-null columns. Live verified order `9ff1ce2f-1cad-4886-b3ad-10fbf244aa96`: final status `completed`, review `812f6920-2af2-4b69-a3be-a03f4161f185` created with rating `5`, creator review list returned `1`, and creator aggregate rating/count read back as `5`/`1`. |
| 2026-06-05 | Backend `./gradlew build`; frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after review wiring | Passed with warnings | Backend build, frontend build, and typecheck passed. Lint has existing 47 warnings; no errors. |
| 2026-06-05 | Public package review visibility | Passed | Package detail page now loads the package creator plus `GET /api/v1/creators/{creatorId}/reviews` and renders rating/recent reviews. Live verified package `871cea14-46de-437d-a7ad-1d8e32d9dd71` resolves creator `d9aacf39-d133-4d73-b307-59573f3edc86` with rating `5`, total reviews `1`, and review count `1`. |
| 2026-06-05 | Browser smoke for package review visibility | Passed | Opened `/packages/871cea14-46de-437d-a7ad-1d8e32d9dd71` on the local frontend and verified rendered text includes `5.0 (1)`, `Review Creator`, `Creator Reviews`, and `Excellent delivery and communication.` |
| 2026-06-05 | Creator earnings and payout workflow | Passed | Backend now credits creator wallet and writes an earning transaction when a paid/hybrid order becomes `completed`; frontend creator earnings page uses live earnings, transaction, payout method, and withdrawal APIs. Live verified creator `96eaeb16-c434-4fa2-90de-e88592056aa8`: completed order `761ecfa2-1863-44a2-bd4d-3aecb2d157e6` credited `15000`, payout method `6f63f56c-6f93-4ba8-ac96-06578cf03cfd` was saved masked/default, withdrawal `dcdc939e-b225-4933-a73e-bcce38bca8f2` moved `5000` from available to pending, and read-back summary became available `10000` / pending `5000`. |
| 2026-06-05 | Backend `./gradlew build`; frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after earnings wiring | Passed with warnings | Backend build, frontend build, and typecheck passed. Lint has existing 42 warnings; no errors. In-app browser smoke for `/creator/earnings` was blocked by `net::ERR_BLOCKED_BY_CLIENT` on both `localhost` and `127.0.0.1`. |
| 2026-06-05 | Creator dashboard live stats workflow | Passed | Added `services/analytics.service.ts` and wired creator dashboard cards/recent orders/monthly goal to live creator profile, dashboard analytics, earnings summary, and orders. Live verified creator `46f6fb70-2b87-482e-aa55-095bcb17e2ef`: completed order `b11adebf-0088-4861-9db6-6027213a430a` produced analytics `totalOrders=1`, `completedOrders=1`, `activeOrders=0`, `totalEarnings=11000`, earnings `availableBalance=11000`, and creator order read-back count `1`. |
| 2026-06-05 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after creator dashboard live stats | Passed with warnings | Build and typecheck passed. Lint has existing 37 warnings; no errors. |
| 2026-06-05 | Creator dashboard live messages workflow | Passed | Removed dashboard mock message snippets and wired the messages panel to `messagesService.getConversations()`. Live verified creator `dcd6aea2-d0da-42a4-90b0-b7d53922933b` sees conversation `15386ffb-a86e-4756-bd41-a2d8785f7a19` with last message `Live dashboard conversation message`, `readByCreator=false`, and `readByBrand=true`. |
| 2026-06-05 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after creator dashboard messages wiring | Passed with warnings | Build and typecheck passed. Lint has existing 37 warnings; no errors. |
| 2026-06-05 | Creator insights/performance analytics workflow | Passed | Added frontend analytics service contracts and wired `/creator/insights` plus `/creator/performance` to live analytics APIs. Backend creator insights now returns top package and platform contribution rows, including zeroed rows for packages without package analytics records. Live verified creator `566bfb05-da4a-4099-bfd6-473ad12aeffc`: package `dc7d422c-76ed-4819-ae3d-88433cc47d53` appeared in insights `topPackages`, `platformContribution`, and performance `packages`. |
| 2026-06-05 | Backend `./gradlew build`; frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after creator analytics wiring | Passed with warnings | Backend build, frontend build, and typecheck passed. Lint has existing 37 warnings; no errors. |
| 2026-06-05 | Brand campaign analytics workflow | Passed | Wired `/brand/analytics` to `GET /api/v1/analytics/brand/campaigns` and expanded backend brand campaign analytics from real orders. Live verified brand `9796fcf8-48f4-41eb-9e77-a8cabf322e1e`: accepted order `1ac324b4-387f-4a7c-8357-ee4e13c79bd4` returned `creatorsActive=1`, `monthlySpend=22000`, `totalOrders=1`, `dealMix.paid=1`, and one top city row. |
| 2026-06-05 | Backend `./gradlew build`; frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after brand analytics wiring | Passed with warnings | Backend build, frontend build, and typecheck passed. Lint has existing 37 warnings; no errors. |
| 2026-06-05 | Brand dashboard live stats workflow | Passed | Expanded `GET /api/v1/analytics/brand/dashboard` and wired brand dashboard stat cards/active campaign list to live analytics and orders. Live verified brand `b2b76499-64e4-4507-bf97-fe368983408d`: completed order `4b6b8469-07b9-4432-9eb4-a47f2cb394d8` returned `totalOrders=1`, `activeOrders=0`, `completedOrders=1`, `savedCreators=1`, `totalSpent=31000`, `creatorsWorkedWith=1`, and `avgRating=4`. |
| 2026-06-05 | Backend `./gradlew build`; frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after brand dashboard live stats | Passed with warnings | Backend build, frontend build, and typecheck passed. Lint has existing 37 warnings; no errors. |
| 2026-06-05 | Brand saved creators persistence workflow | Passed | Added `savedCreatorsService`, wired `/brand/saved` to load full saved creator profiles from `GET /api/v1/saved-creators`, and fixed backend saved list lazy loading. Live verified brand `d5c3588c-a697-4169-b707-a83c1fa908f0`: initial total `0`, save creator `934682d2-8f8d-484d-904e-ef67fcc2c62d` returned total `1` with creator name `Saved Flow Creator`, and delete returned total `0`. |
| 2026-06-05 | Backend `./gradlew build`; frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after saved creators wiring | Passed with warnings | Backend build, frontend build, and typecheck passed. Lint has existing 36 warnings; no errors. |
| 2026-06-05 | Brand saved creator UI-state workflow | Passed | Centralized auth-store save/remove calls through `savedCreatorsService`, added brand-only save/remove heart controls to creator cards in explore/saved surfaces, and added in-flight guarding to the creator profile save button. Frontend build and typecheck passed; lint remains warning-only with 36 existing warnings. |
| 2026-06-05 | Brand explore creator discovery filters | Passed | Removed unused explore import, verified `GET /api/v1/creators` discovery filters against live creators, and fixed backend `budget_friendly` sort to use ascending `minPrice`. Live verified creators `efac077d-ed3d-4e01-a61b-26f323e9ac6c` and `da705ea7-edcf-4e07-b6d6-4569267decb1`: city/price/barter filter returned only the Karachi food creator, and budget sorting returned prices `5000, 40000`. |
| 2026-06-05 | Backend `./gradlew build`; frontend `npx tsc --noEmit`, `npm run lint` after creator discovery filter wiring | Passed with warnings | Backend build and frontend typecheck passed. Lint has existing 35 warnings; no errors. |
| 2026-06-05 | Brand/creator quick-deal message offer visibility workflow | Passed | Shared messages now shows creator response controls only to creators on brand-sent offers, shows brand users an awaiting-response state, exposes accepted order links for both roles, and includes creator expectation text. Live verified conversation `6f4a1d57-e3a3-4053-b268-c777fb2bc2e9`: offer `7a96807e-cac0-447e-939e-d1082e5932d2` read back as `pending` with creator expectation, brand response attempt returned `403/FORBIDDEN`, creator acceptance created order `788d5406-25d7-4250-96bf-46c8f03eb163`, and brand message read-back returned `offerStatus=accepted` plus matching `offerOrderId`. |
| 2026-06-05 | Backend `./gradlew build`; frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after quick-deal message visibility wiring | Passed with warnings | Backend build, frontend production build, typecheck, and lint passed. Lint remains warning-only with existing unused import/hook dependency warnings. |
| 2026-06-05 | Shared message attachment workflow | Passed | Wired `/messages` attachment buttons to the existing multipart endpoint and rendered attachment messages as file links. Live verified conversation `ee80ce5c-4c62-45e1-baaa-0cc8b17509e8`: attachment message `8365ae76-2d24-47f0-8c7e-82255a32600e` read back for both brand and creator with `type=attachment`, matching `attachmentUrl`, and the returned file URL fetched with HTTP 200. |
| 2026-06-05 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after shared message attachments | Passed with warnings | Build and typecheck passed. Lint remains warning-only with 26 existing warnings; `app/messages/page.tsx` warnings were cleared. |
| 2026-06-05 | Brand quick-deal modal message refresh workflow | Passed | Quick deal modal now accepts an optional creation callback; shared messages uses it to reload conversations and the selected message list after a brand sends an offer. Live verified conversation `600321e1-3037-4a89-ad05-e0651890cf35`: `POST /quick-deals` returned message `defaa106-a0b6-402e-b452-ea5448610c15` and offer `ef6b1905-450e-4a2d-8df8-d9827035f4fc`; immediate conversation reload found `[Offer]`, and message reload found the pending offer with persisted creator expectation. |
| 2026-06-05 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after quick-deal modal refresh wiring | Passed with warnings | Build and typecheck passed. Lint remains warning-only with 26 existing warnings. |
| 2026-06-05 | Role-specific conversation unread counts | Passed | Conversation response now includes `unreadCountCreator` and `unreadCountBrand`, and frontend conversation badges map the current role's counter instead of inferring from read flags. Live verified conversation `25719753-c036-423b-aa5a-51ad02fed1dd`: brand send produced creator unread `1` and brand unread `0`; creator read cleared creator unread; creator reply produced brand unread `1` and creator unread `0`; brand read cleared brand unread. |
| 2026-06-05 | Backend `./gradlew build`; frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after unread count wiring | Passed with warnings | Backend build, frontend build, and typecheck passed. Lint remains warning-only with 26 existing warnings. |
| 2026-06-05 | Role-specific message route redirects | Passed | `/brand/messages` and `/creator/messages` now preserve incoming query parameters while redirecting to shared `/messages`. Verified dev-server redirect payloads for `/brand/messages?creator=abc-123&tab=open -> /messages?creator=abc-123&tab=open` and `/creator/messages?creator=creator-slug&foo=bar -> /messages?creator=creator-slug&foo=bar`. |
| 2026-06-05 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after message route redirect wiring | Passed with warnings | Build and typecheck passed. Lint remains warning-only with 26 existing warnings. |
| 2026-06-05 | `/messages?creator=...` duplicate conversation guard | Passed | Shared messages now processes each brand `creator` query target once, reloads conversations as source of truth, falls back from ID lookup to username lookup safely, and upserts the selected conversation. Live verified repeated `POST /conversations` for creator `8b0d5d04-27e9-4776-9e89-606718169a00` returned the same conversation `7bbc827d-d3bc-432b-b400-16430fd6b0f9`, and brand conversation list contained one match. |
| 2026-06-05 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after creator query guard | Passed with warnings | Build and typecheck passed. Lint remains warning-only with 26 existing warnings. |
| 2026-06-05 | Creator and brand notification preference persistence | Passed | Added frontend user notification preference service and wired creator/brand settings notification tabs to load and save `GET/PUT /api/v1/users/me/notification-preferences`. Live verified creator `eba36cf8-1310-4a72-bfc1-d2645b3620b8` and brand `9c2e9833-c9b5-468e-b7fd-46c23442e221`: defaults loaded, PUT saved all eight flags, and GET read-back matched saved values. |
| 2026-06-05 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after notification preference wiring | Passed with warnings | Build, typecheck, and lint passed. Lint remains warning-only with 26 existing warnings. |
| 2026-06-05 | Creator collaboration preference persistence | Passed | Creator settings preferences tab now loads `acceptsBarter`, `acceptsHybridDeals`, `preferredIndustries`, and `minimumBudget` from the creator profile and saves via `PATCH /api/v1/creators/me/preferences`. Live verified creator `3c5c8ba2-a5f5-45e8-a8a5-6ead4a44e473`: PATCH response and `/creators/me/profile` read-back matched all four saved fields. |
| 2026-06-05 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after creator preference wiring | Passed with warnings | Build, typecheck, and lint passed. Lint remains warning-only with 26 existing warnings. |
| 2026-06-05 | Creator payment settings persistence | Passed | Added owner-only `GET /api/v1/creators/me/payment-settings` and wired creator payment settings tab to load/save exact editable payout details through `GET/PATCH /creators/me/payment-settings`. Live verified creator `a66d8dda-4cc6-416b-a9e0-34e0c6266f5f`: default read was empty, PATCH saved JazzCash/Easypaisa/SadaPay/bank transfer fields, exact GET read-back matched, and `/payout-methods` returned four masked payout methods. |
| 2026-06-05 | Backend `./gradlew build`; frontend `npx tsc --noEmit`, `npm run lint` after creator payment settings wiring | Passed with warnings | Backend build and frontend typecheck passed. Lint remains warning-only with 26 existing warnings. |
| 2026-06-05 | Brand billing monthly budget persistence | Passed | Brand settings billing tab now loads `monthlyBudget` from `/brands/me/profile`, maps `monthly_budget` into the frontend `Brand` type, and saves monthly budget with a dedicated billing save action. Live verified brand `e470054c-1b69-4773-97d1-f9eb20e3a662`: PATCH saved `monthly_budget=678901`, and `/brands/me/profile` read-back matched. Campaign preference and verification-contact fields remain local-only because no backend fields exist yet. |
| 2026-06-05 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after brand billing wiring | Passed with warnings | Build, typecheck, and lint passed. Lint remains warning-only with 26 existing warnings. |
| 2026-06-05 | Brand campaign preference persistence | Passed | Added Flyway `V3__brand_campaign_preferences.sql`, expanded brand entity/DTO/mapper/update contract, and wired brand settings campaign tab to load/save `preferredCreatorCategories`, `targetCities`, `targetPlatforms`, and `campaignBudgetRange` through `/brands/me/profile`. Live verified brand `9468fde0-3f8b-4952-8d8a-756bf350ab77`: PATCH response and `/brands/me/profile` read-back matched all four fields. |
| 2026-06-05 | Backend `./gradlew build`; frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after brand campaign preferences | Passed with warnings | Backend build, frontend build, and typecheck passed. Lint remains warning-only with 26 existing warnings. |
| 2026-06-05 | Brand verification settings persistence | Passed | Added Flyway `V4__brand_verification_settings.sql`, expanded brand entity/DTO/mapper/update contract, and wired brand settings verification tab to load/save `businessVerificationStatus`, `verificationContactEmail`, and `verificationPhoneNumber` through `/brands/me/profile`. Live verified brand `47a2daee-9d8d-4ee6-b94c-784486cbd901`: PATCH response and `/brands/me/profile` read-back matched `business_verification_status`, `verification_contact_email`, and `verification_phone_number`. |
| 2026-06-05 | Public creator metadata and ambassador info endpoints | Passed | Added public creator filter metadata aliases at `/creators/metadata`, `/creators/filters`, and `/metadata/creators`; added public ambassador `/benefits`, `/eligibility`, and `/requirements`; and permitted public ambassador routes in security. Backend build passed. Live verified all endpoints return `200` without auth. |
| 2026-06-05 | Typed frontend request contracts for package/order/review/earnings services | Passed | Replaced loose package/order/review/earnings payload shapes with exported request contracts for package upsert, order create/status/progress/deliverable actions, review create, payout method create, and withdrawal create. Frontend `npx tsc --noEmit` and `npm run build` passed. |
| 2026-06-05 | Mapper response naming verification | Passed | Live verified creator, brand, package, order, nested order deliverable, conversation, and message response key naming against frontend mapper expectations. Verified creator/brand/package snake_case, order/message/conversation camelCase, and nested deliverable snake_case using order `84422795-d52a-44ff-aa4f-08f1c1cd967c` and conversation `998f782f-9fc2-4186-afc2-c642367cd0ad`. |
| 2026-06-05 | Account password change and deletion settings | Passed | Wired creator and brand security tabs to `PATCH /users/me/password` and `DELETE /users/me`. Added active-account guards so soft-deleted users cannot log in, refresh, reset, or use existing tokens. Live verified user `74275b25-5599-4389-b90d-3588e8777bf7`: password change accepted new password and rejected old password; delete succeeded; post-delete login and token access returned `401`. Backend build, frontend typecheck, and frontend build passed. |
| 2026-06-05 | Forgot/reset password frontend flow | Passed | Added auth service methods and wired `/forgot-password` to request reset links or reset with `?token=...`. Frontend typecheck and build passed. Live verified `/auth/forgot-password` returns `200` and `/auth/reset-password` rejects an invalid token with `401`. |
| 2026-06-06 | Creator profile to brand conversation workflow | Passed | Added reusable open-or-create conversation handling, stable `?conversation=` deep links, login return-path preservation, and a useful empty-thread prompt. Live verified logged-out Message from Ali Rehmani's profile returned through seeded brand login, created/selected conversation `17a36a49-85ef-49a4-b6ce-7fc7b729fff7`, and retained the selected thread after browser refresh. |
| 2026-06-06 | Frontend `npm run build`, `npx tsc --noEmit`, `npm run lint` after creator-message entry wiring | Passed with warnings | Build and typecheck passed. Lint has 29 existing warnings and no errors. |
