# Admin & Brand System — Improvement Report

## 1. Current State

### 1a. Admin Routes (/admin/*)

| Route | Purpose | API Calls | Data Written |
|-------|---------|-----------|--------------|
| `/admin/dashboard` | Platform overview dashboard | `getDashboard()`, `getOrders(limit:5)` | None (read-only) |
| `/admin/users` | User moderation & account management | `getUsers()`, `updateUserStatus()`, `moderateUser()` | User active status, suspensions, bans |
| `/admin/orders` | Order oversight & status management | `getOrders()`, `updateOrderStatus()` | Order status changes |
| `/admin/verification` | Creator/brand verification & ambassador apps (3 tabs) | `getVerificationCreators()`, `updateCreatorVerification()`, `updateCreatorBadge()`, `getVerificationBrands()`, `updateBrandVerification()`, `getAmbassadorApplications()`, `reviewAmbassadorApplication()` | Creator verification, badge levels, brand verification status, ambassador application decisions |
| `/admin/payments` | Transaction & withdrawal oversight (2 tabs) | `getPaymentsStats()`, `getTransactions()`, `getWithdrawals()`, `processWithdrawal()` | Withdrawal status updates (pending → processing → completed/failed) |
| `/admin/payments-audit` | Immutable payment operation audit log | `getPaymentAuditLogs()` | None (read-only) |
| `/admin/disputes` | Dispute resolution & audit logs (2 tabs) | `getDisputes()`, `createDispute()`, `updateDispute()`, `executeDisputeRefund()`, `getAuditLogs()` | Dispute status, resolution, refund execution; audit log entries |
| `/admin/profile` | Admin user profile (if it exists) | Not fully explored | Unknown |
| `/admin/settings` | Admin settings (if it exists) | Not fully explored | Unknown |
| `/admin/user-moderation` | User flagging/review queue (if separate) | Not fully explored | Unknown |

**Key Capabilities:**
- Full platform overview (user counts, GMV, active orders)
- User moderation (enable/disable, suspend, ban, unban with reasons)
- Creator verification & badge assignment (none, verified, rising_star, pro, elite)
- Brand business verification tracking
- Ambassador application review (4-step verification: identity, engagement, content, background)
- Order status management (all 8 statuses)
- Payment transaction history & filtering by type/status
- Withdrawal processing (pending → processing → completed/failed)
- Dispute creation, resolution tracking, and refund execution
- Immutable audit logs for all admin actions and payment operations

---

### 1b. Brand Routes (/brand/*)

| Route | Purpose | API Calls | Data Read | Data Written |
|-------|---------|-----------|-----------|--------------|
| `/brand/dashboard` | Brand KPI overview | `getBrandDashboard()`, `getMe()`, `getTrending(4)`, `getAll()` (orders) | Active/completed orders, total spent, creators hired, saved creators | None (read-only) |
| `/brand/profile` | Company profile & contact info | `getMe()`, `getByBrandId()` (reviews), `brandLogo()` (upload) | Brand name, industry, city, description, website, company size, contact details | Company profile fields, logo upload |
| `/brand/campaigns` | Campaign CRUD & management | `getBrandCampaigns()`, `getBrandCampaign()`, `updateCampaignStatus()`, `createCampaign()`, `updateCampaign()` | Campaign list with status filtering | Campaign creation, editing, status changes (draft → published → paused → closed → archived) |
| `/brand/campaigns/[id]/edit` | Campaign detail editor | `getBrandCampaign()`, `updateCampaign()` | Full campaign details (30+ fields) | Campaign field updates |
| `/brand/campaigns/[id]` | Campaign detail view + reactions | `getBrandCampaign()`, `getCampaignReactions()`, `actionReaction()` | Campaign details, creator reactions (status: submitted/shortlisted/in_review/accepted/rejected) | Reaction actions (shortlist, review, accept, reject) |
| `/brand/campaigns/new` | Campaign creation form | `createCampaign()` | None (form only) | New campaign creation |
| `/brand/offers` | Redirects to `/brand/campaigns` | N/A | N/A | N/A |
| `/brand/orders` | Brand order management | `getAll()` (orders filtered by brandId), `downloadReceipt()`, `updateOrderStatus()`, `submitDeliverable()` (view only) | Orders, deliverable status, order receipts | None directly; deliverable submission & review via modal |
| `/brand/payments` | Payment methods, invoices, disbursements, wallet | `getBrandPaymentsHub()`, `initiateSafepayTopup()`, `getSafepaySessionStatus()`, `addBrandPaymentMethod()`, `setBrandDefaultMethod()`, `removeBrandMethod()`, `updateBrandPayoutControls()` | Summary (wallet, spend, escrow), methods, invoices, disbursements, controls | Payment method CRUD, payout control settings, wallet top-up via Safepay |
| `/brand/analytics` | Campaign performance analytics | `getBrandCampaigns()` (analytics) | Deal mix, top cities, creator count, engagement, monthly spend | None (read-only) |
| `/brand/settings` | Brand account settings (6 tabs: billing, subscriptions, campaigns, verification, notifications, security) | `getMe()`, `selectPlan()`, `updateMe()`, `usersService` methods | Brand profile, plan tier | Plan selection, profile updates, notifications/security prefs |
| `/brand/explore` | Creator search & discovery | `getCreators()` (with filters), `savedCreatorsService.save()` | Creator catalog with filters | Save/unsave creator to list |
| `/brand/saved` | Saved creator list | `getSavedCreators()` | Saved creator list | Remove from saved list |
| `/brand/messages` | Conversation with creators | `getConversations()`, `getMessages()`, `sendMessage()` | Conversations, message history | Send messages, offer creation |
| `/brand/notifications` | Notification inbox | `getNotifications()` | Notification list | Mark as read |
| `/brand/affiliate` | Affiliate program (if applicable) | Not explored | Unknown | Unknown |
| `/brand/ambassadors` | Ambassador application (if different from verification) | Not explored | Unknown | Unknown |
| `/brand/checkout/success` | Safepay checkout success redirect | N/A (post-checkout landing) | Session confirmation | None |
| `/brand/checkout/cancel` | Safepay checkout cancel redirect | N/A (post-checkout landing) | Session cancellation | None |

**Key Capabilities:**
- Brand profile with logo upload & edit
- Campaign CRUD with 30+ configurable fields (budget, targeting, screening questions, creator preferences)
- Campaign status management (draft through archived)
- Reaction management (accept/reject creators' proposals)
- Order management (view status, download receipts)
- Payment method CRUD, wallet top-up, payout control settings
- Campaign analytics (reach, engagement, deal mix, geographic distribution)
- Creator search & favorites management
- Messaging with creators (quick deal offers)
- Plan tier selection (STARTER, GROWTH, ENTERPRISE)

---

### 1c. Service Layer Coverage

#### Brand-Related Services
- **`brandsService`:** `getAll()`, `getMe()`, `selectPlan()`, `updateMe()` — covers basic brand profile CRUD. Missing: suspend/unsuspend brand, retrieve analytics, brand health check, competitor tracking.
- **`campaignsService`:** Full CRUD + reaction management for campaigns. Missing: campaign cloning, bulk operations, template library.
- **`ordersService`:** Full order lifecycle management with deliverable tracking. Missing: bulk order actions, auto-matching recommendations.
- **`reviewsService`:** Read reviews by creator/brand. Missing: review moderation, response/reply to review.
- **`paymentsService`:** Creator payout prefs + brand payment hub (methods, invoices, disbursements, wallet, controls). Missing: invoice PDF generation, payment dispute tracking, reconciliation reports.
- **`analyticsService`:** Brand dashboard & campaign analytics. Missing: creator performance per campaign, ROI tracking, spend forecasting.

#### Admin-Related Services
- **`adminService`:** Comprehensive admin panel support — dashboard, users, orders, creator/brand/ambassador verification, disputes, transactions, withdrawals, audit logs. Missing: bulk user actions, scheduled suspensions, compliance reports, SLA tracking.

---

## 2. Data Gaps

### Brand Type Fields Not Rendered/Editable in Brand Pages

1. **`Brand.planTier`** — exists in types (STARTER | GROWTH | ENTERPRISE), collected in `brands.service.ts` update payload, but **not shown/editable on brand profile page**. Only accessible via `/brand/settings` plan selector.

2. **`Brand.monthlyBudget`** — exists in update payload but **not rendered anywhere** on brand-facing pages. Not shown on dashboard, profile, or analytics.

3. **`Brand.preferredCreatorCategories`** — collected but **never displayed** on profile or used to influence creator recommendations on `/brand/explore`.

4. **`Brand.targetCities`** — collected but **not shown** on profile; not used to filter creator recommendations.

5. **`Brand.targetPlatforms`** — collected but **never displayed** or used for filtering.

6. **`Brand.campaignBudgetRange`** — exists in types but **never shown** anywhere; doesn't appear on settings/profile.

7. **`Brand.businessVerificationStatus`** — critical field for brand trust, **only visible to admin**, not shown to brand user themselves. Brand has no visibility into verification status.

8. **`Brand.verificationContactEmail`** & **`Brand.verificationPhoneNumber`** — **only editable by admin**, brand user cannot update their own verification contact.

9. **`Brand.brandRating`** & **`Brand.brandTotalReviews`** — shown on profile header **only if > 0 reviews**, but no dedicated reviews tab to read creator feedback.

10. **`Brand.activeOrders`** — exists in type, shown on dashboard, but **not shown on profile or settings** for quick reference.

### BrandCampaign Type Fields Not Rendered

1. **Campaign `customScreeningQuestions`** — collected and sent to API but **never displayed** in campaign detail or on creator's view. Creators cannot see questions at apply time.

2. **Campaign `minProposedPrice`** — accepted in create/update but **not shown** to creators on campaign detail page.

3. **Campaign `contentSubmissionDeadline`** & **`goLiveDate`** — collected but **not displayed** on campaign cards or detail view.

4. **Campaign `campaignDuration`** — stored but **not shown** to creators or on analytics.

5. **Campaign `reactionCount`** — available in response but **rarely surfaced** in UI; no "X creators interested" badge on campaigns.

6. **Campaign `visibility`** — exists (public | private) but **no UI to toggle** on brand side; all campaigns appear to be treated as public/published.

---

## 3. Missing Admin Controls

1. **Brand Suspension/Account Freeze** — admins can moderate users but have **no specific brand account controls** (suspend brand, freeze wallet, reject payouts, flag for review). Only user-level suspend exists.

2. **Order Completion Rate Tracking by Brand** — no view of which brands have poor order completion rates or high cancellation rates.

3. **Creator Suspension by Reason Category** — suspension exists but **no categorization** (spam, quality issues, non-compliance, payment fraud). Makes it hard to spot patterns.

4. **Payment Refund Audit Trail** — dispute refunds are tracked but **no consolidated view** of all refunds issued, by brand or creator, with reasons.

5. **Creator Earnings Reports** — no admin-side view of creator earnings, payouts, pending balances. Admins cannot audit creator financial health.

6. **Campaign Cloning/Template Templates** — no admin-provided campaign templates to help brands launch faster.

7. **Bulk User Status Updates** — can only update users one at a time. No bulk suspend/ban/enable operations.

8. **Compliance & SLA Reporting** — no reports on order SLA breaches, dispute resolution time, or payment processing delays.

9. **Brand Verification Checklist** — brand verification exists but **no visible checklist** of what's required (tax ID, business registration, bank details).

10. **Creator Badge Earning Criteria** — admins can assign badges manually but **no dashboard showing earned vs. assigned badges** or criteria.

---

## 4. Missing Brand Features

1. **Campaign Cloning** — brands must recreate campaign details from scratch. No "duplicate campaign" option.

2. **Order Completion Analytics** — no breakdown of order completion rate by creator, deal type, or campaign. Dashboard shows aggregate stats only.

3. **Creator Spend Tracking** — no view of "how much have I spent with this creator?" or spending trend per creator over time.

4. **Saved Creator Insights** — saved creators list has no metadata (last contacted, number of proposals, deal types preferred).

5. **Review Management** — brand receives reviews from creators but **no way to respond/reply** to reviews.

6. **Bulk Campaign Status Changes** — campaigns must be paused/closed/archived one at a time. No bulk operations.

7. **Spend Forecasting** — no projection of monthly spend based on active orders and campaign budgets.

8. **Creator Recommendations** — dashboard shows 4 trending creators but **no "recommended for you" based on saved/past creators or budget**.

9. **Campaign Performance Alerts** — no notification when campaign reaction count hits a threshold or spending exceeds budget.

10. **Invoice Custom Branding** — invoices from Safepay are generic; no way to customize with brand logo/terms.

---

## 5. Architectural Weaknesses

### N+1 Query Patterns
1. **Orders enrichment** (`ordersService.enrichOrders()`) — fetches all creators, brands, packages in parallel `Promise.all()`, **good**. But called on every order list load without caching. Could add React Query cache layer.

2. **Brand reviews** (`brand/profile`) — calls `reviewsService.getByBrandId()` which tries two endpoints; no caching of results. If rendered in multiple places, hits API multiple times.

### Missing Pagination/Infinite Scroll
1. **Brand campaigns list** — uses page-based pagination (size 20), but UI shows status tabs with no page indicator per tab. Switching tabs resets to page 0. **No infinite scroll option.**

2. **Orders page** — 20 per page hardcoded; brand may have 200+ orders but can't easily scan all.

3. **Creator search on `/brand/explore`** — pagination likely exists (need to check service) but UI not shown in excerpts.

### Hardcoded Limits/Defaults
1. **Pagination default: 20 items** — used everywhere (admin, brand). No configurable page size.

2. **Trending creators limit: 4** — hardcoded on brand dashboard (`getTrending(4)`). No way to show more or configure.

3. **Recent orders limit: 5** — hardcoded on admin dashboard.

4. **Safepay session expiry** — not clear if session lifetime is configurable client-side; may timeout unexpectedly.

### Stale Assumptions
1. **Brand plan tiers (STARTER, GROWTH, ENTERPRISE)** — defined in types but **no features gated by plan**. Settings page has a plan selector but no conditional UI based on selected tier.

2. **Creator badge levels** — admin can assign badges, but **no scoring system** in UI (types define `AmbassadorScore` but it's not used on admin verification page).

3. **Order deliverables as fixed list** — order details assume deliverables are pre-defined (from package); **no dynamic deliverable add/remove on orders** from brand side.

### Data Consistency Issues
1. **Brand reviews shown only if `brandTotalReviews > 0`** — but reviews list may be empty despite count > 0 if API returns inconsistent data.

2. **Campaign reaction count vs. reactions endpoint** — dashboard shows `reactionCount` from campaign object, but `/campaigns/[id]/reactions` fetches the full list. **Not synced on update**.

### Error Handling Gaps
1. **Order enrichment silently fails** — if creator/brand/package fetch fails, `Promise.allSettled()` continues and returns partial data. **No user feedback** if related data is missing.

2. **Admin dispute creation has no validation** — form allows empty Order ID; API likely rejects but UI doesn't prevent submission.

3. **Safepay checkout redirect** — cancel/success pages exist but **no error handling** if session ID is invalid or expired.

### Missing State Management
1. **Brand profile form** — no unsaved changes indicator; user might navigate away and lose edits. (Profile page does call `loadBrandProfile()` on mount, but no warn-on-unsaved.)

2. **Campaign editor** — assumes all 30+ fields are always present; **no validation** that required fields are filled before publish.

3. **Ambassador application review** — no confirmation dialog before approving/rejecting; one click changes status permanently.

---

## 6. Prioritized Suggestions

### (a) High-Impact / Low-Effort

#### 1. Display Brand Verification Status to Brand User
**Files:** `app/brand/profile/page.tsx`, `app/brand/settings/page.tsx`
**What:** Show `businessVerificationStatus` field on brand profile & settings pages (currently only admin sees it). Add badge/banner indicating "Pending Verification", "Verified", "Rejected" with date. Let brand view what documents are needed.
**Why:** Brands are stuck in verification limbo with no visibility. Massive UX improvement.

#### 2. Make Brand Fields Editable on Profile (planTier, monthlyBudget, targetPlatforms, targetCities)
**Files:** `app/brand/profile/page.tsx`, `services/brands.service.ts` (already has payload support)
**What:** Add form inputs for monthlyBudget, targetPlatforms, targetCities, and planTier to the profile card. Call `updateMe()` on save.
**Why:** These are collected on signup but hidden. Brands can't change them later. Simple form additions unlock useful self-service.

#### 3. Add Creator Reviews Tab to Brand Profile
**Files:** `app/brand/profile/page.tsx`
**What:** Expand the review section (already partially implemented) to show all reviews in a dedicated tab, with star ratings, dates, and creator names. Add optional reply/comment field.
**Why:** Brands deserve to see and respond to creator feedback. Currently only shown if reviews exist and in a small section.

#### 4. Show Campaign Reaction Count & "X Interested" Badge on Campaign Cards
**Files:** `app/brand/campaigns/page.tsx`
**What:** Render `reactionCount` on each campaign card as a badge ("12 Interested Creators"). Add link to reactions tab.
**Why:** Brands want quick visibility into campaign traction without clicking into each campaign.

#### 5. Add Campaign Cloning / Duplicate Option
**Files:** `app/brand/campaigns/[id]/page.tsx`, `services/campaigns.service.ts`
**What:** Add "Duplicate Campaign" button in campaign detail dropdown. Submit same payload to `createCampaign()` with "_copy" appended to title.
**Why:** Brands run recurring campaigns; cloning saves 15+ minutes of form-filling.

#### 6. Display Campaign's Screening Questions & Deadlines to Creators
**Files:** `app/creator/campaigns/[id]` (if exists), or campaign detail view
**What:** On campaign detail, show `customScreeningQuestions`, `minProposedPrice`, `contentSubmissionDeadline`, `goLiveDate` so creators see full context before reacting.
**Why:** Currently hidden; creators apply blind, leading to rejected proposals. Screening questions are powerful filtering tool.

#### 7. Add Bulk User Action Dialog to Admin Users Page
**Files:** `app/admin/users/page.tsx`
**What:** Add checkbox column; "Bulk Action" dropdown to suspend/ban/enable multiple users at once. Confirm dialog with count.
**Why:** Moderation campaigns (e.g., fake accounts) require one-click-per-user currently. Bulk saves hours.

#### 8. Add Unsaved Changes Warning to Campaign Editor
**Files:** `app/brand/campaigns/[id]/edit/page.tsx`
**What:** Track form dirty state; warn user if they navigate away with unsaved edits. Use `beforeunload` event.
**Why:** Easy accidental data loss on a 30-field form.

---

### (b) High-Impact / High-Effort

#### 9. Add Brand Compliance Checklist & Self-Verification
**Files:** `app/brand/settings/page.tsx`, `services/brands.service.ts`, `admin/verification/page.tsx`
**What:** Create a "Verification Checklist" section on brand settings: (1) Tax ID uploaded, (2) Business registration verified, (3) Bank details confirmed. Show status and documents uploaded. Allow brand to submit docs for verification. Admin can approve/reject each item.
**Why:** Brands have no way to know what's needed or submit proofs. Speeds up admin verification 10x.

#### 10. Build Brand Analytics Dashboard Expansion
**Files:** `app/brand/analytics/page.tsx`, `services/analytics.service.ts`
**What:** Expand analytics page to include: (a) order completion rate by creator/campaign, (b) creator spend ranking (top 10 creators by spend), (c) deal type breakdown with ROI estimates, (d) order delivery timeline (on-time vs. late %), (e) repeat creator rate.
**Why:** Brands need deeper insight into which creators & campaigns are ROI-positive. Current analytics are surface-level.

#### 11. Implement Order Completion Rate & Quality Metrics for Brands (Admin View)
**Files:** `app/admin/users/page.tsx` (brand tab), `services/admin.service.ts`
**What:** On admin users page, add a "brand_metrics" section: completion rate, average review rating, total orders, repeat creator rate. Flag brands with <70% completion rate or avg rating <3.5 for follow-up.
**Why:** Admins need to spot problematic brands before they tank creator satisfaction.

#### 12. Add Creator Badge Earning Dashboard (Admin)
**Files:** `app/admin/verification/page.tsx` (creators tab), `services/admin.service.ts`
**What:** Show `AmbassadorScore` breakdown for each creator (delivery score, rating score, account age, cancellation penalty, etc.). Display current tier and points to next tier. Show which creators are close to auto-promotion.
**Why:** Currently badges are admin-assigned manually. Transparent scoring system incentivizes creators and reduces admin overhead.

#### 13. Add Campaign Performance Alert Rules
**Files:** `app/brand/campaigns/[id]/page.tsx`, new `campaignAlertsService`
**What:** Allow brands to set alerts: "notify me if (a) reaction count > threshold, (b) spend exceeds budget by 20%, (c) no reactions in 3 days, (d) creator acceptance rate < 30%". Store in DB, trigger email/push.
**Why:** Brands manage campaigns passively now. Alerts enable proactive optimization.

#### 14. Build Multi-Creator Order Matching Engine (Search)
**Files:** New `matchingService`, `app/brand/explore/page.tsx` improvements
**What:** Add filters on creator explore page to match against brand's preferences: `preferredCreatorCategories`, `targetPlatforms`, `targetCities`, budget range. Show relevance score.
**Why:** Brands save many creators but never filter. Smart matching cuts discovery time by 80%.

#### 15. Implement Invoice PDF Generation & Custom Branding
**Files:** `app/brand/payments/page.tsx` (invoices section), new `invoiceService`
**What:** When brand has active invoices, show PDF download button. Template includes brand logo, contact, tax info, invoice items, payment terms.
**Why:** Currently invoices are raw Safepay data. Professional invoices improve brand credibility.

---

### (c) Nice-to-Have

#### 16. Add Plan Feature Gating
**Files:** All brand routes, `app/brand/layout.tsx`
**What:** Lock features by plan: STARTER = up to 2 active campaigns, GROWTH = up to 10, ENTERPRISE = unlimited. Show upgrade prompt when limit reached.
**Why:** Defines clear upsell path; currently plan tiers exist but have no teeth.

#### 17. Creator Recommendation Engine
**Files:** `app/brand/dashboard/page.tsx`, new `recommendationService`
**What:** Show "Recommended Creators" on dashboard based on: (a) creators in same categories/cities as brand preferences, (b) high engagement, (c) not yet contacted. Exclude saved creators.
**Why:** Brands see trending creators (generic) but not tailored recommendations.

#### 18. Campaign Template Library
**Files:** `app/brand/campaigns/new/page.tsx`, `services/campaignsService.ts`
**What:** Add "Use a Template" button offering pre-filled campaigns for common scenarios (product launch, content series, brand awareness). Templates include suggested budget, duration, platforms.
**Why:** First-time brand users spend 2+ hours on campaign setup. Templates reduce friction 50%.

#### 19. Admin Dashboard SLA & Compliance Metrics
**Files:** `app/admin/dashboard/page.tsx`, `services/admin.service.ts`
**What:** Add cards for: average dispute resolution time, % of withdrawals processed within 24h, % of orders completed on-time, pending verification count (creators & brands).
**Why:** Admins need visibility into platform health & SLA adherence.

#### 20. Affiliate Program Dashboard (Brand)
**Files:** `app/brand/affiliate/page.tsx`, `services/affiliate.service.ts`
**What:** If affiliate program exists: show referral link, clicks, signups, commissions earned. Add export earnings report.
**Why:** Unlock brand-as-promoter path; currently feature is a stub.

#### 21. Dispute Conversation Thread View
**Files:** `app/admin/disputes/page.tsx`
**What:** When viewing dispute detail, show message conversation between brand & creator, admin notes, refund timeline. Add ability to post resolution status updates.
**Why:** Disputes are isolated records now; showing context (what went wrong, messages exchanged) aids resolution.

#### 22. Webhook & API Logs for Admins (Future Integrations)
**Files:** `app/admin/settings/page.tsx` (if admin settings exist), new `apiLogsService`
**What:** Show recent API calls, webhook deliveries, integration errors (for future partner/API users). Useful for debugging OAuth, Safepay, etc.
**Why:** When integrations fail silently, admins have no visibility. Logs speed up troubleshooting 10x.

---

## Summary of Effort & ROI

| Tier | Count | High-Impact Wins | Key Blockers |
|------|-------|------------------|--------------|
| **High/Low** | 8 | Brand sees verification status, can edit own profile fields, cloning, bulk moderation | Simple form additions, no backend changes needed |
| **High/High** | 7 | Compliance checklist, expanded analytics, badge scoring, alerts, matching, invoices | Requires new service methods, possibly DB schema updates |
| **Nice** | 7 | Plan gating, recommendations, templates, SLA metrics, affiliate, disputes, API logs | Future-proofing, nice-to-have polish |

**Recommended Quick Win (start here):** #1, #2, #5, #7 (combined ~4–6 hours)
**Follow-up Sprint:** #9, #10, #3 (analytics & compliance setup ~20 hours)
**Backlog:** Remaining items (longer-term roadmap)

