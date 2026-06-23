# ChamCham Production Gap Matrix

Date: 2026-06-03
Source roadmap: `docs/ChamCham Feature Document.docx`
Frontend: `ChumChum-frontend`
Backend: `chumchum-backend`

## Purpose

This document is the working command center for taking ChamCham from prototype to production. It maps the 8 roadmap sprints / 16 weeks of scope against the current frontend and backend, then identifies what still needs to be integrated, verified, hardened, or built.

## Status Legend

| Status | Meaning |
| --- | --- |
| Done | Implemented and likely usable, pending normal QA |
| Partial | Some code exists, but the flow is incomplete, unverified, or missing production behavior |
| Missing | No clear implementation found in the current codebase |
| Unknown | Needs deeper verification with running app, API tests, or product decision |

## Current Architecture Snapshot

| Area | Current Evidence | Status | Notes |
| --- | --- | --- | --- |
| Frontend app | Next.js app with creator, brand, messages, packages, orders, ambassador, auth, settings routes | Partial | Broad UI coverage exists. Needs end-to-end integration and production QA. |
| Backend app | Spring Boot API with controllers for auth, users, creators, brands, packages, orders, conversations/messages, quick deals, earnings, withdrawals, ambassador, analytics, uploads | Partial | Backend is farther along than older backend docs suggest. Need fresh endpoint/DTO verification. |
| API client | Frontend uses `/api/v1/*` via `lib/api/client.ts` with bearer token refresh support | Partial | Good foundation. Need response contract alignment and error-state coverage. |
| Database | Flyway migrations `V1__init_schema.sql`, `V2__seed_pakistan_sample_data.sql` | Partial | Need verify schema matches entities and production PostgreSQL expectations. |
| Auth | JWT auth, refresh, role-based frontend routes | Partial | Creator signup integration exists. Brand signup/login, route guards, reset-password behavior need testing. |
| Admin | Admin dashboard, user moderation, order oversight, creator/brand verification and badge levels, ambassador review queues, dispute cases, mock-provider refund lifecycle, and immutable moderation audit history now exist | Partial | Core admin MVP, creator trust levels, and provider-agnostic mock refund lifecycle are live verified; real provider adapter, pricing config, and deeper analytics remain. |
| Payments | Earnings, withdrawal, payout method entities/services/controllers exist | Partial | Real escrow/payment processor and disbursement workflow are not confirmed. |
| Notifications | User notification preferences exist; roadmap requires in-app/email message and order notifications | Partial | Preferences exist, actual notification delivery not confirmed. |
| File upload | Upload endpoints exist for avatar, cover, content preview, package thumbnail, deliverable, brand logo | Partial | Need storage decision: local vs S3/object storage, limits, validation, public URLs, cleanup. |
| Realtime | Messaging endpoints exist | Partial | Roadmap says real-time chat; no WebSocket/SSE verification yet. |

## Sprint Matrix

### Sprint 1: Foundation & Auth

Goal: Both Brand and Creator can sign up, log in, and reach role-based dashboards.

| Story | Roadmap Requirement | Frontend | Backend | Integration | Production Gap / Next Action |
| --- | --- | --- | --- | --- | --- |
| 1.1 | Sign up as Brand or Creator and receive role-based dashboard | Partial | Partial | Partial | Verify both creator and brand registration create correct role records and redirect correctly. |
| 1.2 | Email/password login with secure session management | Partial | Done | Partial | Test login, refresh, logout, expired token handling, protected route behavior. |
| 1.3 | Reset password via email link | Partial | Partial | Unknown | Backend has forgot/reset endpoints; confirm frontend flow, email provider, token expiry, and abuse protection. |
| 1.4 | Shared design system | Done | N/A | Done | UI library and tokens exist. Need visual QA pass after production flows are wired. |
| 1.5 | CI/CD, staging, database schema v1 | Missing | Partial | Missing | Define deployment target, environment variables, build pipeline, staging DB, smoke tests. |

Sprint 1 launch blockers:
- Confirm complete brand signup flow, not only creator signup.
- Add/verify route guards for role-specific pages.
- Add production environment and deployment checklist.

### Sprint 2: Creator Profile

Goal: Fully browsable creator profile with profile media, stats, social links, packages, portfolio, and reviews.

| Story | Roadmap Requirement | Frontend | Backend | Integration | Production Gap / Next Action |
| --- | --- | --- | --- | --- | --- |
| 2.1 | Creator onboarding profile with bio, niche, location, social handles | Partial | Partial | Partial | Align frontend payloads with `CreatorController` profile/social account endpoints. |
| 2.2 | Upload profile photo and cover image | Partial | Partial | Unknown | Upload endpoints exist; verify frontend uses them and files render from stable public URLs. |
| 2.3 | Brand can view public creator profile with stats and platform breakdown | Done | Done | Done | Public profile fields, trust badges, packages, reviews, and username navigation are live verified. |
| 2.4 | Portfolio items | Done | Done | Done | Public profiles merge persisted creator previews with package cover/media uploads into directly openable Brand-facing work samples. Dedicated standalone portfolio management remains optional for MVP. |
| 2.5 | Response time, completion rate, repeat client count | Partial | Partial | Unknown | Confirm fields are stored, calculated, mapped, and visible. |

Sprint 2 launch blockers:
- Creator profile DTO and frontend type alignment.
- File upload storage and URL strategy.
- Public profile regression test with seeded creator.

### Sprint 3: Creator Discovery & Explore

Goal: Brands can browse, search, and filter creators.

| Story | Roadmap Requirement | Frontend | Backend | Integration | Production Gap / Next Action |
| --- | --- | --- | --- | --- | --- |
| 3.1 | Explore page with creator cards | Done | Done | Done | Brand discovery uses live creator data, creator trust badges, portfolio/profile links, and useful sorting. |
| 3.2 | Category filter | Done | Partial | Partial | Backend has creators list and metadata attempts; verify filter query behavior. |
| 3.3 | Keyword search | Done | Partial | Unknown | Test search by name, bio, tags; add backend query support if missing. |
| 3.4 | Advanced filters: followers, engagement, price, location, response time, barter | Done | Done | Done | Live discovery supports trust level, availability, Pakistan-market budget ranges, followers, rating, city, barter, categories, and platforms; active filters are visible and removable. |
| 3.5 | Creator cards show badge, rating, followers, engagement, starting price | Done | Partial | Partial | Verify backend supplies all fields consistently. |
| 3.6 | Trending, Rising Stars, Verified sections | Partial | Partial | Partial | Backend has trending/barter/fast responder endpoints; rising/verified need verification. |

Sprint 3 launch blockers:
- Contract test for `/api/v1/creators` query params and response shape.
- Remove or clearly control fixture fallbacks.
- Ensure filters work with realistic seeded data.

### Sprint 4: Packages & Quick Deal

Goal: Creators create packages; brands order or initiate quick deals.

| Story | Roadmap Requirement | Frontend | Backend | Integration | Production Gap / Next Action |
| --- | --- | --- | --- | --- | --- |
| 4.1 | Create cash packages | Done | Done | Partial | Verify package wizard payload and backend validation. |
| 4.2 | Create barter packages | Done | Done | Partial | Confirm barter category/value/conditions persist and render. |
| 4.3 | Brand views packages and clicks Order Now | Partial | Partial | Unknown | Verify order creation path from package detail/profile. |
| 4.4 | Quick Deal from creator card | Done | Done | Partial | Verify quick deal creates conversation/offer and creator can respond. |
| 4.5 | Subscription/recurring packages | Partial | Partial | Unknown | Package type exists in codebase; need verify product behavior and billing relation. |
| 4.6 | Featured, Trending, Barter-Friendly, Best Performing sections | Partial | Partial | Unknown | Backend has featured and analytics endpoints; verify grouping logic. |

Sprint 4 launch blockers:
- End-to-end creator package creation to brand order.
- Quick Deal acceptance should create or link to an order based on product decision.
- Package status transitions and permissions.

### Sprint 5: Messaging

Goal: Brand-creator chat with notifications and file sharing.

| Story | Roadmap Requirement | Frontend | Backend | Integration | Production Gap / Next Action |
| --- | --- | --- | --- | --- | --- |
| 5.1 | Brand sends message from profile or Quick Deal | Done | Done | Done | Profile Message preserves logged-out intent through login, opens or creates the creator conversation, and keeps the selected thread on refresh. |
| 5.2 | Inbox for both roles | Done | Done | Partial | Test brand and creator inboxes with live data. |
| 5.3 | In-app and email notifications | Partial | Partial | Unknown | Notification preferences exist; delivery system not confirmed. |
| 5.4 | File/image sharing in conversation | Done | Partial | Unknown | Attachment endpoint exists; verify upload handling and rendering. |
| 5.5 | Thread linked to relevant order once deal initiated | Partial | Partial | Unknown | Verify quick deal/order/conversation relationships in DB and UI. |

Sprint 5 launch blockers:
- Real-time requirement decision: polling for MVP or WebSocket/SSE for launch.
- Notification delivery provider and templates.
- Message permissions and unread count correctness.

### Sprint 6: Orders & Campaign Tracking

Goal: Full lifecycle from accepted deal to deliverable approval/completion.

| Story | Roadmap Requirement | Frontend | Backend | Integration | Production Gap / Next Action |
| --- | --- | --- | --- | --- | --- |
| 6.1 | Order auto-created when package purchased or Quick Deal accepted | Partial | Partial | Unknown | Verify both order creation triggers. |
| 6.2 | Creator views active orders, submits deliverables | Done | Done | Partial | Test deliverable submit with link/file and status update. |
| 6.3 | Brand orders dashboard with filters | Done | Done | Partial | Verify brand-scoped order list and filter params. |
| 6.4 | Brand approves or requests revision with comments | Partial | Partial | Unknown | Status endpoint exists; structured revision comments need verification. |
| 6.5 | Status pipeline Pending -> In Progress -> Submitted -> Approved -> Completed | Partial | Partial | Unknown | Validate allowed transitions and role permissions. |
| 6.6 | Order status notifications | Partial | Partial | Unknown | Same notification delivery gap as messaging. |
| 6.7 | Barter order confirmation by both parties | Partial | Partial | Unknown | Confirm barter-specific fields and completion rules. |

Sprint 6 launch blockers:
- Order lifecycle state machine with tests.
- Deliverable upload and review loop.
- Role-scoped authorization on all order operations.

### Sprint 7: Payments, Reviews & Admin Panel

Goal: Escrow, creator payouts, review system, and core admin operations.

| Story | Roadmap Requirement | Frontend | Backend | Integration | Production Gap / Next Action |
| --- | --- | --- | --- | --- | --- |
| 7.1 | Brand pays via escrow; funds held until completion | Partial | Partial | Missing | Payment intent DTOs exist, but real escrow/provider integration is not confirmed. |
| 7.2 | Creator withdraws earnings to bank/mobile wallet | Done | Partial | Partial | Payout and withdrawal APIs exist; verify UI integration and real payout handling. |
| 7.3 | Service fee deducted and payment disbursed on approval | Partial | Partial | Unknown | Confirm configurable fee, transaction ledger, and release logic. |
| 7.4 | Brand leaves star rating/review after completion | Partial | Partial | Unknown | Review endpoint exists; verify order-based review constraints. |
| 7.5 | Reviews displayed on creator public profile | Done | Partial | Partial | Creator reviews endpoint exists; verify frontend consumes it. |
| 7.6 | Admin verifies creators and assigns badge levels | Done | Done | Done | Persisted creator trust levels now appear on Brand-facing discovery cards and public creator profiles; username profile links and discovery username search are live verified. |
| 7.7 | Admin views/suspends/bans accounts | Done | Done | Partial | User search/filter/pagination, active status moderation, and immutable admin action history are live verified; structured ban reasons remain. |
| 7.8 | Admin accesses orders and intervenes in disputes | Done | Done | Partial | Order oversight plus dispute handling and a provider-agnostic mock refund lifecycle are live verified, including pending submission, webhook confirmation/failure, cancellation, creator earnings clawback, duplicate protection, signature validation, and audit persistence; real provider adapter remains. |

Sprint 7 launch blockers:
- Payment provider/product decision for Pakistan market.
- Real payment-provider adapter and pricing configuration remain.
- Financial ledger must be tested before production.

### Sprint 8: Ambassador Program, Pricing & Launch

Goal: Ambassador tier, subscription plans, analytics, help center, launch polish.

| Story | Roadmap Requirement | Frontend | Backend | Integration | Production Gap / Next Action |
| --- | --- | --- | --- | --- | --- |
| 8.1 | Creator applies to Ambassador program | Done | Done | Partial | Verify application state, eligibility, and creator dashboard display. |
| 8.2 | Ambassador creators listed with badge/benefits | Done | Partial | Partial | Backend has ambassador list; benefits endpoint may be frontend fallback only. |
| 8.3 | Brand subscribes to Starter/Growth/Enterprise plans | Partial | Missing | Missing | Pricing page exists; no confirmed subscription backend/payment enforcement. |
| 8.4 | Plan limits enforced | Missing | Missing | Missing | Implement offer limits and feature gates. |
| 8.5 | Admin analytics dashboard | Partial | Partial | Partial | Admin dashboard now shows user/order/revenue totals; deeper trends, exports, and operational analytics remain. |
| 8.6 | Help Center FAQs | Done | N/A | Done | Content exists; review for final copy and legal/support accuracy. |
| 8.7 | QA, performance, accessibility, launch prep | Missing | Missing | Missing | Add production QA checklist, smoke tests, build verification, accessibility pass. |

Sprint 8 launch blockers:
- Subscription and plan enforcement.
- Admin analytics.
- Full production readiness checklist.

## Cross-Cutting Production Gaps

| Gap | Severity | Why It Matters | First Action |
| --- | --- | --- | --- |
| API contract drift | Critical | Frontend and backend may both have code but disagree on paths, payloads, or response shapes | Generate endpoint inventory and compare to frontend service calls. |
| Admin module | High | Core admin MVP, creator badge management, dispute case management, provider-agnostic mock refund lifecycle, and immutable moderation audit history are live verified; real provider adapter and pricing config remain | Keep the real provider adapter deferred during prototype work; move to pricing configuration next. |
| Payments/escrow | Critical | Production marketplace cannot safely handle paid orders without a tested money flow | Choose payment provider and implement ledger + escrow/release semantics. |
| Auth/authorization | Critical | JWTs are now validated against the current active user record and audited admin mutations are atomic; protected-role regression coverage remains | Add backend authorization tests for protected actions and stale/disabled sessions. |
| File storage | High | Local prototype storage is usually not production-safe | Decide S3-compatible/object storage or managed alternative. |
| Notifications | High | Messaging/order flows rely on user awareness | Decide MVP: in-app only, email, SMS/WhatsApp, or staged rollout. |
| Realtime messaging | High | Roadmap promises real-time chat | Decide whether polling is acceptable for MVP; otherwise add WebSocket/SSE. |
| Database migrations | High | Entities and Flyway migrations may drift | Run schema validation against clean PostgreSQL and fix migrations. |
| Testing | High | Current production confidence is unknown | Add smoke tests for auth, creator discovery, package/order, messaging, payments. |
| CI/CD and deployment | High | Production-ready requires repeatable deployment | Define staging/prod env vars, build commands, health checks, rollback plan. |
| Legal/compliance pages | Medium | Marketplace needs terms/privacy/payment/refund clarity | Review current pages against final business policies. |
| Observability | Medium | Need to debug production incidents | Add structured logs, health checks, metrics, error monitoring. |

## Recommended Build Sequence

1. Fresh API contract audit: compare frontend service calls to backend controllers and DTOs.
2. Sprint 1 vertical slice: brand + creator auth, sessions, role guards, reset-password behavior.
3. Sprint 2 vertical slice: creator onboarding, uploads, public profile.
4. Sprint 3 vertical slice: live creator discovery with filters and realistic seed data.
5. Sprint 4 vertical slice: package creation, package detail, quick deal initiation/response.
6. Sprint 5 vertical slice: inbox, messages, attachments, unread/read state.
7. Sprint 6 vertical slice: order lifecycle, deliverables, approval/revision.
8. Sprint 7 vertical slice: payments ledger, withdrawals, reviews, admin MVP.
9. Sprint 8 vertical slice: ambassador, pricing limits, analytics, help center, final QA.
10. Launch readiness: CI/CD, staging, production env, security, performance, accessibility, smoke tests.

## Immediate Next Tasks

| Priority | Task | Output |
| --- | --- | --- |
| P0 | Create frontend-to-backend API contract inventory | `docs/api-contract-audit.md` |
| P0 | Run backend build/tests and frontend build/lint | Baseline failures list |
| P0 | Verify creator signup/login/onboarding end-to-end | First production slice |
| P1 | Verify brand signup/login/explore end-to-end | Second production slice |
| P1 | Decide file storage and payment provider | Architecture decisions |
| Done | Define and live verify admin MVP | Admin dashboard, moderation, order oversight, verification queues, search/filter/pagination |
| Done | Add dispute case management and immutable moderation audit history | Admin create/triage/assign/resolve workflow, audited mutations, read-only audit ledger |
| Done | Add provider-agnostic mock refund lifecycle | Pending requests, mock provider references, signed webhook contract, confirmation/failure reconciliation, wallet clawback, cancellation, audit history, admin UI |
| Done | Add verified creator badge-level management | Persisted trust levels, verification guardrails, admin controls, creator API exposure, audit history |
| Done | Surface creator trust badges to Brands | Trust badges on discovery cards and public profiles, plus repaired username profile navigation |
| Done | Surface creator portfolio work to Brands | Persisted previews and package media rendered as directly openable public-profile portfolio samples |
| Done | Improve Brand creator discovery filters | Live trust-level, availability, and useful budget filtering with visible removable filter state |

## Notes From First Audit Pass

- The roadmap document defines 8 sprints across 16 weeks.
- Older backend planning docs appear stale: many modules they marked missing now have backend classes.
- Frontend service files already expect a rich `/api/v1` backend surface.
- Backend controllers expose many matching `/api/v1` endpoints, but matching route names does not guarantee matching DTOs, permissions, or business behavior.
- Treat this matrix as a living document. Each completed vertical slice should update the relevant rows from Partial/Unknown to Done.
