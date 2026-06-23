# Comprehensive Package Plan (ChumChum/ZingZing)

Date: 2026-06-06
Owner: Product + Frontend + Backend
Status: Draft design proposal (no implementation yet)

---

## 0) How to use this document

- This is the single source of truth for package-system redesign.
- Implement in slices; after each completed slice, update this file with:
  - What shipped
  - What changed vs plan
  - Risks / follow-ups
- Keep old sections; append an "Implementation Log" entry each cycle.

---

## 1) PHASE 1 - Discovery (Current State)

## 1.1 Frontend package-creation flow

Primary flow:
- `chumchum-frontend/app/creator/packages/new/page.tsx` -> `CreatorPackageWizard`
- `chumchum-frontend/components/creator-package-wizard.tsx`
- `chumchum-frontend/store/creator-packages-store.ts`
- `chumchum-frontend/services/packages.service.ts`

Wizard behavior (current):
1. Basic Info: title/category/platform/niche/descriptions/tags/response time
2. Deliverables: free-text list
3. Pricing: paid/barter/hybrid with cash + barter fields
4. Media: thumbnail + sample URLs/upload
5. Publish: visibility + status (active/draft/under_review)

Important constraints from current UI:
- Platform choices in wizard are only: Instagram, YouTube, TikTok.
- Package type is not user-selected; store hardcodes `type: 'ONE_TIME'`.
- Service types are free text in deliverables (no taxonomy).
- Category is free text.
- Pricing is PKR-centric in UI labels and requests.

Consumption surfaces:
- Creator Package Studio list/filter: `chumchum-frontend/app/creator/packages/page.tsx`
- Public package detail: `chumchum-frontend/app/packages/[id]/page.tsx`
- Brand order modal: `chumchum-frontend/components/package-order-modal.tsx`

## 1.2 Backend package model and flow

Core backend pieces:
- Entity: `chumchum-backend/src/main/java/com/chamcham/backend/entity/ServicePackage.java`
- DTO create: `.../dto/servicepackage/ServicePackageCreateRequest.java`
- DTO response: `.../dto/servicepackage/ServicePackageResponse.java`
- Service: `.../service/ServicePackageService.java`
- Controller: `.../controller/PackageController.java`
- Repository: `.../repository/ServicePackageRepository.java`
- Migration schema: `.../db/migration/V1__init_schema.sql`

Current backend supports:
- CRUD (`POST`, `PATCH`, `DELETE`, list, get-by-id)
- Status transitions (`/status`)
- Duplicate package (`/duplicate`)
- Basic analytics endpoint (`/{id}/analytics`)
- Featured listing and creator-owned listing (`/featured`, `/mine`)

## 1.3 Existing package categories (actual behavior)

Current "category" model:
- A plain string (`packages.category`) with no controlled vocabulary.
- Used as a search/filter field but not normalized.

Current observed categories in sample/demo data:
- Technology, Beauty, Fitness, Home Decor, Food
- Plus UI fixture categories like Events, Travel, Fashion (frontend mock sets)

Conclusion:
- There is no canonical category taxonomy today.

## 1.4 Database schema (current)

Primary tables:
- `core.packages`
- `core.package_tiers`
- `core.package_analytics`

Notable package columns:
- Identity and ownership: `id`, `creator_id`, `name`, `title`
- Classification: `platform`, `category`, `type`, `status`, `visibility`
- Pricing: `price`, `deal_type`, barter/hybrid detail fields
- Fulfillment: `deliverables` (jsonb), `delivery_days`, `revisions`
- Presentation: `short_description`, `full_description`, `cover_image`, `media_urls`, `tags`

Schema mismatch risk:
- DB check constraint in `V1__init_schema.sql` allows package platform only:
  - `YOUTUBE`, `INSTAGRAM`, `TIKTOK`, `FACEBOOK`
- Backend enum `PackagePlatform` includes `SNAPCHAT`.
- Frontend types/service also include Snapchat, but wizard does not expose it.

## 1.5 API contracts (current)

Primary package endpoints:
- `POST /api/v1/packages`
- `PATCH /api/v1/packages/{id}`
- `PATCH /api/v1/packages/{id}/status`
- `POST /api/v1/packages/{id}/duplicate`
- `GET /api/v1/packages`
- `GET /api/v1/packages/mine`
- `GET /api/v1/packages/{id}`
- `GET /api/v1/packages/{id}/analytics`
- `GET /api/v1/packages/featured`
- `DELETE /api/v1/packages/{id}`

Creator profile package endpoint:
- `GET /api/v1/creators/{creatorId}/packages` exists, but currently ignores incoming `platform` and `dealType` query params (controller forwards without using those filters).

Contract shape:
- Package DTOs are snake_case.
- Status update accepts `{ status: "ACTIVE" | ... }` string body.

## 1.6 Validation rules (current)

Request-level validation (`ServicePackageCreateRequest`):
- Required: `name`, `title`, `platform`, `type`, `price`, `deliverables`, `delivery_days`
- Type constraints: positive/min limits on `deliveryDays`, `revisions`, price-related fields
- String length constraints for many text fields

Service-level validation (`ServicePackageService#validatePricing`):
- `BARTER` requires `barterDetails`
- `PAID`/`HYBRID` require `price > 0`

Behavioral validation gaps:
- `tiers` are accepted but no strong cross-validation against base package pricing structure.
- Order creation does not enforce strong package/deal compatibility (in `OrderService#createOrder`, dealType/amount validation is minimal).
- Status enum duplication exists (`ACTIVE` + `active` variants in enum), creating ambiguity risk.

## 1.7 Pricing structures (current)

Supported pricing modes:
- Paid: `price`
- Barter: `barterDetails` + optional valuation fields
- Hybrid: `price` + barter fields

Additional complexity:
- Optional package tiers (`package_tiers`) with per-tier price/delivery/revisions, but frontend wizard does not expose tier authoring.
- Currency defaults differ by context (spec/history references SAR, frontend currently sends PKR).

## 1.8 Platform-specific limitations (current)

- No structured service taxonomy per platform (only free text deliverables).
- Wizard platform list excludes Facebook/Snapchat.
- No explicit content format model (short-form, long-form, live, story).
- No explicit promotion placement model (mention, mid-roll, pin comment, link sticker, etc.).
- No explicit rights/usage/boosting dimensions beyond free-text fields.

---

## 1.9 Current architecture diagram (how packages are defined and consumed)

```mermaid
flowchart TD
  A[Creator UI: Package Wizard\ncreator-package-wizard.tsx] --> B[Zustand Store\ncreator-packages-store.ts]
  B --> C[Frontend API Client\npackages.service.ts]
  C --> D[PackageController\n/api/v1/packages]
  D --> E[ServicePackageService]
  E --> F[(core.packages)]
  E --> G[(core.package_tiers)]
  E --> H[(core.package_analytics)]

  F --> I[ServicePackageMapper]
  G --> I
  H --> E
  I --> D
  D --> C

  C --> J[Creator Package Studio\napp/creator/packages/page.tsx]
  C --> K[Public Package Page\napp/packages/[id]/page.tsx]
  C --> L[Brand Order Flow\npackage-order-modal.tsx -> orders API]

  M[QuickDealService] --> N[Auto-generates private package]
  N --> F
```

---

## 2) PHASE 2 - Gap Analysis vs Modern Creator Marketplace Standards

Benchmark baseline used:
- Modern creator marketplaces generally model packages by:
  - Platform
  - Content format
  - Placement/promotional slot
  - Live/Story/Short/Long-form distinctions
  - Add-ons (usage rights, whitelisting, raw files, boosted post handling)

## 2.1 Cross-platform gaps (all platforms)

Missing today across all platforms:
- Canonical service taxonomy (no normalized options)
- Structured content format metadata
- Structured engagement options (CTA type, link inclusion, pinned comment, polling)
- Structured promotional opportunities (whitelisting, paid amplification permissions)
- Content creation-only services (UGC production without posting)
- Add-on model for usage rights and variations
- Platform-native objective templates (launch, awareness, conversion, event, app install)

## 2.2 Platform-by-platform gaps

### Facebook
Missing package types:
- Feed Post (static/carousel)
- Story Set
- Reel
- Facebook Live mention/segment
- Group/community post activation

Missing creator services:
- UGC creation for brand page ads
- Comment moderation windows
- Event page promotion

Missing engagement options:
- Polls/Q&A in story
- CTA button targeting (Shop Now/Learn More)

Missing promotional opportunities:
- Cross-post to brand page
- Allow boosting/whitelisting rights windows

### Instagram
Missing package types:
- Dedicated Reel, Story sequence, Feed static/carousel, Live segment
- Collab post option
- Broadcast channel mention

Missing creator services:
- UGC-only shoots (not posted on creator profile)
- Product photography bundle

Missing engagement options:
- Story link sticker, poll, Q&A, countdown, quiz
- Pinned comment and first-hour engagement support

Missing promotional opportunities:
- Paid partnership label options
- Usage rights duration packs
- Whitelisting for Spark Ads/Meta ads style amplification

### YouTube
Missing package types:
- Shorts
- Dedicated long-form video
- Product review deep-dive
- Mid-roll mention
- Pre-roll or opening mention
- Community post
- Livestream mention / dedicated live segment

Missing creator services:
- Script + edit package (UGC production)
- Long-form cut-down into shorts package

Missing engagement options:
- Pinned comment + link placement
- End screen and description CTA choices

Missing promotional opportunities:
- Multi-video series package
- Evergreen integration retainer package

### TikTok
Missing package types:
- TikTok short video (native trend format)
- Live shoutout/live segment
- TikTok Shop integration post
- Duet/stitch collaboration

Missing creator services:
- Trend research + concept ideation
- UGC ad creative pack (non-posted)

Missing engagement options:
- Comment reply video
- Hashtag challenge participation

Missing promotional opportunities:
- Spark Ads authorization windows
- TikTok Shop affiliate integration variants

### Snapchat
Missing package types:
- Story sequence
- Spotlight short video
- Public profile post
- Snap Live segment mention

Missing creator services:
- Vertical UGC assets formatted for Snap
- Geo-targeted story sequence

Missing engagement options:
- Swipe-up/attachment CTA packaging
- Lens/filter mention inclusion

Missing promotional opportunities:
- Sponsored lens mention package
- Event/day-in-the-life brand takeover style package

---

## 3) PHASE 3 - Redesign (Simple, Comprehensive, Expandable)

Design principles:
1. Keep package creation simple for creators.
2. Eliminate duplicate package definitions.
3. Normalize platform/service options so search and analytics improve.
4. Preserve flexibility through custom campaigns and optional add-ons.
5. Support both influencer posting and content-production-only services.

## 3.1 Recommended package taxonomy

Canonical hierarchy:
- Platform (YouTube, Instagram, TikTok, Facebook, Snapchat)
- Service Group
  - Content
  - Promotion
  - Live
  - Production (content creation services)
  - Story
  - Custom
- Service Type (platform-specific, canonical key)
- Optional Add-ons

Global service groups (fixed):
- `CONTENT`
- `PROMOTION`
- `LIVE`
- `STORY`
- `PRODUCTION`
- `CUSTOM`

Global add-ons (reusable):
- Extra revision
- Expedited delivery
- Usage rights (30/90/180 days)
- Raw file delivery
- Multi-language subtitle/caption
- Paid amplification authorization (platform-specific)
- Comment moderation window

## 3.2 Platform-specific package options (v1 set)

### YouTube
- Content: Shorts, Dedicated Video, Product Review
- Promotion: Video Mention (opening), Mid-roll Mention, Community Post
- Live: Livestream Mention, Dedicated Live Segment
- Production: UGC Video Production, Script + Edit
- Custom: Custom Campaign

### Instagram
- Content: Reel, Feed Post, Carousel
- Story: Story Frame Pack (3/5/8), Story Link Sticker Pack
- Promotion: Collab Post, Product Tag Mention, Broadcast Channel Mention
- Live: Live Mention, Dedicated Live Segment
- Production: UGC Reel Production, Product Photo/Video Bundle
- Custom: Custom Campaign

### TikTok
- Content: TikTok Video, TikTok Series Pack
- Promotion: Duet, Stitch, Hashtag Challenge Participation
- Live: TikTok Live Mention, Dedicated Live Segment
- Production: UGC Short Video Pack, Trend Concept Pack
- Custom: Custom Campaign

### Facebook
- Content: Feed Post, Carousel Post, Facebook Reel
- Story: Story Set
- Promotion: Group Mention/Post, Event Promotion Post
- Live: Facebook Live Mention, Dedicated Live Segment
- Production: UGC Social Asset Pack
- Custom: Custom Campaign

### Snapchat
- Content: Spotlight Video, Public Profile Story
- Story: Story Sequence
- Promotion: Lens/Filter Mention, Swipe-up Story CTA
- Live: Snap Live Mention, Dedicated Live Segment
- Production: Snap-formatted Vertical UGC Pack
- Custom: Custom Campaign

## 3.3 Proposed backend schema changes

Keep existing `core.packages`; add normalized taxonomy fields and package items.

### A) New reference table: `core.package_catalog_option`
- `id` UUID PK
- `platform` varchar(30)
- `service_group` varchar(30)
- `service_key` varchar(80) unique per platform
- `label` varchar(120)
- `description` varchar(500)
- `supports_paid` boolean
- `supports_barter` boolean
- `supports_hybrid` boolean
- `is_active` boolean
- `display_order` int

Purpose:
- Single canonical source of valid package options per platform.

### B) New child table: `core.package_items`
- `id` UUID PK
- `package_id` UUID FK -> packages
- `catalog_option_id` UUID FK -> package_catalog_option
- `quantity` int default 1
- `unit_label` varchar(50) (e.g., post, frame, minute)
- `notes` text nullable
- `created_at`, `updated_at`

Purpose:
- A package can include one or multiple structured service items.

### C) Add columns on `core.packages`
- `primary_service_group` varchar(30)
- `primary_service_key` varchar(80)
- `objective` varchar(60) nullable
- `content_style` varchar(60) nullable
- `usage_rights_days` int nullable
- `amplification_allowed` boolean default false
- `is_content_creation_only` boolean default false

Purpose:
- Keep list/feed queries fast while still enabling rich item detail.

### D) Constraint and enum alignment fixes
- Update `ck_packages_platform` to include `SNAPCHAT`.
- Standardize enum casing (remove duplicate lowercase variants in Java enums over migration window).

## 3.4 API changes

### New endpoints
- `GET /api/v2/package-catalog/options?platform=YOUTUBE`
  - Returns allowed groups and service options.

### Updated create/update contract (v2)
- `POST /api/v2/packages`
- `PATCH /api/v2/packages/{id}`

Request shape (v2 concept):
- Core package fields (title, descriptions, platform, dealType, price, etc.)
- `primary_service_group`, `primary_service_key`
- `items: [{ catalog_option_id, quantity, unit_label, notes }]`
- `addons: [{ key, value }]` (optional)

### Backward compatibility strategy
- Keep `/api/v1/packages` temporarily.
- Map v1 free-text deliverables into v2-compatible fallback item (`CUSTOM` service key).
- Deprecate v1 after frontend migration completion.

## 3.5 Migration strategy (phase-by-phase)

### Slice 1 - Foundation (DB + read-only)
- Add new tables/columns.
- Seed `package_catalog_option` for all 5 platforms.
- Add read endpoint for catalog options.

### Slice 2 - Dual-write backend
- On v1 package create/update, auto-create one `package_items` record using inferred/default service key.
- Keep all current behavior intact.

### Slice 3 - Frontend wizard v2
- Replace free-text package type selection with:
  - Platform -> Service Group -> Service Option
- Keep Deliverables text as optional detail, not primary taxonomy.

### Slice 4 - Search/discovery upgrade
- Add filters for `service_group` and `service_key`.
- Expose these in brand browsing UI.

### Slice 5 - Cleanup
- Remove legacy package type dependence in frontend (`ONE_TIME` hardcoding).
- Remove ambiguous enum variants after data cleanup.

Data migration rules:
- Existing packages map to:
  - inferred platform-specific default service key from current `type` and deliverables text
  - if no inference: `CUSTOM_CAMPAIGN`
- No destructive migration in first pass.

## 3.6 UI wireframe (simple)

```text
Create Package

[1] Basic
  Platform: (YouTube v)
  Title
  Short Description

[2] Service Type
  Group Tabs: [Content] [Promotion] [Live] [Story] [Production] [Custom]
  Options (radio cards):
    - Shorts
    - Dedicated Video
    - Product Review

[3] Scope & Pricing
  Quantity / Deliverables notes
  Deal Type: Paid | Barter | Hybrid
  Price / Barter terms
  Delivery days / Revisions

[4] Media
  Thumbnail
  Sample links/files

[5] Publish
  Visibility: Public/Private
  Status: Draft/Active/Under review
```

## 3.7 HTML mockup (for design review only)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>YouTube Package Builder Mockup</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; background: #f7f7f8; color: #222; }
    .card { background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .tabs button { margin-right: 8px; padding: 8px 12px; border: 1px solid #ccc; background: #fff; border-radius: 8px; }
    .tabs .active { background: #222; color: #fff; border-color: #222; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .option { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
    .footer { display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <h1>Create YouTube Package</h1>

  <div class="card">
    <h2>Service Group</h2>
    <div class="tabs">
      <button class="active">Content</button>
      <button>Promotion</button>
      <button>Live</button>
      <button>Production</button>
      <button>Custom</button>
    </div>
  </div>

  <div class="card">
    <h2>Choose Service Option</h2>
    <div class="grid">
      <label class="option"><input type="radio" name="service" checked> Shorts</label>
      <label class="option"><input type="radio" name="service"> Dedicated Video</label>
      <label class="option"><input type="radio" name="service"> Product Review</label>
    </div>
  </div>

  <div class="card">
    <h2>Pricing</h2>
    <p>Deal Type: Paid | Barter | Hybrid</p>
    <p>Base Price: PKR <input type="number" value="150000" /></p>
    <p>Delivery: <input type="number" value="7" /> days | Revisions: <input type="number" value="2" /></p>
  </div>

  <div class="card footer">
    <button>Save Draft</button>
    <button>Publish Package</button>
  </div>
</body>
</html>
```

---

## 4) Implementation checklist (slice-by-slice)

- [ ] Slice 1: Add catalog and package_items schema + seeds (no UI break)
- [ ] Slice 2: Backend read endpoint for catalog options
- [ ] Slice 3: Backend dual-write from v1 payloads to package_items
- [ ] Slice 4: Frontend wizard v2 (platform -> group -> service option)
- [ ] Slice 5: Brand discovery filters by service group/key
- [ ] Slice 6: Analytics by service group/key
- [ ] Slice 7: Deprecate legacy package type flow

---

## 5) Risks and decisions needed

Open decisions:
1. Currency strategy: PKR-only, SAR-only, or multi-currency per tenant/region?
2. Should a package allow multiple service options at launch, or one primary + optional add-ons only?
3. Do we expose paid amplification permissions (whitelisting/spark authorization) in v1 redesign or v1.1?
4. Do we keep `package_tiers` in creator UI immediately, or postpone until core taxonomy launches?

Key risks:
- Enum casing duplication can produce hard-to-debug status/deal transitions.
- Existing platform constraint mismatch (`SNAPCHAT`) can fail writes depending on environment/migration state.
- Free-text legacy data makes automated service-key inference imperfect (needs fallback to `CUSTOM_CAMPAIGN`).

---

## 6) Next best step

Next best step:
- Finalize the canonical `package_catalog_option` seed list (platform x group x service key) with product approval, because all schema/API/UI slices depend on this source-of-truth taxonomy.

---

## 7) Implementation log (update this every cycle)

- 2026-06-06: Initial discovery + redesign proposal created. No code implementation yet.

