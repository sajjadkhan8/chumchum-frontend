# ChamCham V1 Package System Implementation

## Overview

This document outlines the complete V1 implementation of the creator package system with support for:
- **PKR-only currency** (mono-currency for simplified v1)
- **One primary option + add-ons approach** (simplified tiering)
- **Package tiers in the wizard** (full UI/UX for creating pricing variants)

---

## Design Decisions Implemented

### 1. PKR-Only Currency (v1)
- **Default Currency**: All packages default to "PKR"
- **Database**: Changed default currency from "SAR" to "PKR" in `ServicePackage` entity
- **Frontend**: Currency is always displayed as "PKR" in all pricing fields
- **Migration Path**: When multi-currency support is added (v2+), the code is structured to allow easy extension

**Files Changed:**
- `ServicePackage.java` (backend entity)
- All related frontend types and components

### 2. One Primary Option + Add-ons Design (v1)
- **Primary Package**: The base package with core deliverables and pricing
- **Add-on Tiers**: Optional variants (Lite/Standard/Premium) for different price points
- **isPrimary Flag**: PackageTier has a boolean `isPrimary` field to mark the base tier
- **Position Ordering**: Tiers have a `position` field for display ordering

**Database Support:**
```sql
-- New PackageTier columns
- description: Optional description for the tier
- position: Order of display (0 = primary, 1+ = add-ons)
- isPrimary: Boolean flag for primary tier
- deliverables: JSONB array (one or more items specific to tier)
- updated_at: Timestamp for tracking changes
```

### 3. Package Tiers in Wizard
- **Location**: Step 3 (Pricing) of the 5-step wizard
- **UI Pattern**: 
  - Main pricing fields for the base package
  - Optional "Add Tier" button to create variants
  - Expandable tier cards for viewing/managing tiers
  - Tier-specific deliverables support

---

## Implementation Details

### Backend (Java/Spring Boot)

#### 1. Database Schema (`V9__package_tiers_v1_enhancements.sql`)
- Adds `description`, `position`, `is_primary`, `updated_at` columns to `package_tiers` table
- Converts `deliverables` from string to JSONB array
- Changes `price` from BigDecimal to INTEGER (supports 0-2 billion PKR)
- Ensures all packages have `currency = 'PKR'`
- Creates index on `(package_id, position)` for efficient queries

#### 2. Entity Layer
**`ServicePackage.java`**
- Currency defaults to "PKR" (v1 requirement)
- One-to-many relationship with `PackageTier`
- Tiers are ordered by position

**`PackageTier.java`** (Enhanced)
```java
@Entity
public class PackageTier {
  UUID id;
  ServicePackage servicePackage;  // FK to parent package
  String name;                     // "Lite", "Standard", "Premium"
  Integer price;                   // PKR amount
  List<String> deliverables;      // JSONB array: ["Reel", "Stories"]
  String description;              // "Best for small brands"
  Integer position;                // Display order
  Boolean isPrimary;               // v1: One primary per package
  Instant createdAt;
  Instant updatedAt;
}
```

#### 3. DTO Layer
**`ServicePackageTierRequest.java`** (Input)
```java
{
  name: "Standard",
  price: 25000,              // PKR
  description: "Most popular option",
  deliverables: ["1 Reel", "3 Stories"],
  deliveryDays: 5,
  revisions: 2,
  position: 0,               // 0 = primary, 1+ = add-ons
  isPrimary: true            // v1: Mark primary
}
```

**`ServicePackageTierResponse.java`** (Output)
```java
{
  id: UUID,
  name: "Standard",
  price: 25000,
  description: "Most popular option",
  deliverables: ["1 Reel", "3 Stories"],
  deliveryDays: 5,
  revisions: 2,
  position: 0,
  isPrimary: true,
  createdAt: Instant,
  updatedAt: Instant
}
```

#### 4. Service Layer
**`ServicePackageService.createPackage()`**
- Validates tier data
- Ensures currency is always PKR
- Creates tiers with proper position/primary flags
- Handles tier creation errors gracefully

**Key Logic:**
```java
// Enforce PKR currency
servicePackage.setCurrency("PKR");

// Process tiers
if (request.tiers() != null && !request.tiers().isEmpty()) {
  List<PackageTier> tiers = new ArrayList<>();
  for (int i = 0; i < request.tiers().size(); i++) {
    var tier = request.tiers().get(i);
    tiers.add(PackageTier.builder()
      .servicePackage(servicePackage)
      .name(tier.name())
      .price(tier.price())
      .deliverables(tier.deliverables())
      .description(tier.description())
      .position(tier.position() != null ? tier.position() : i)
      .isPrimary(tier.isPrimary() != null && tier.isPrimary())
      .build());
  }
  servicePackage.setTiers(tiers);
}
```

#### 5. Mapper
**`ServicePackageMapper.toResponse()`**
- Maps all tier fields to response DTOs
- Includes new fields: `description`, `position`, `isPrimary`, `updatedAt`

#### 6. API Endpoints
**POST `/api/v1/packages`** - Create package with tiers
```json
{
  "title": "Instagram Reel Package",
  "platform": "INSTAGRAM",
  "dealType": "PAID",
  "price": 15000,
  "deliverables": ["Main reel"],
  "tiers": [
    {
      "name": "Lite",
      "price": 15000,
      "deliverables": ["1 Reel"],
      "isPrimary": true,
      "position": 0
    },
    {
      "name": "Pro",
      "price": 25000,
      "deliverables": ["1 Reel", "3 Stories"],
      "isPrimary": false,
      "position": 1
    }
  ]
}
```

**PATCH `/api/v1/packages/{id}`** - Update package and tiers
- Same structure as create
- Existing tiers are replaced with new ones

### Frontend (Next.js/TypeScript)

#### 1. Type System (`types/index.ts`)
**New: `PackageTier` type**
```typescript
export interface PackageTier {
  id?: string;
  name: string;
  price: number;              // PKR amount
  currency?: string;          // Always "PKR" in v1
  description?: string;
  deliverables: string[];
  deliveryDays?: number;
  revisions?: number;
  position?: number;
  isPrimary?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
```

**Updated: `Package` interface**
```typescript
export interface Package {
  // ...existing fields...
  currency?: string;          // Now defaults to "PKR"
  tiers?: PackageTier[];      // New: v1 tier support
}
```

#### 2. Wizard Component (`creator-package-wizard.tsx`)

**State Management:**
```typescript
const [tiers, setTiers] = useState<PackageTier[]>([]);
const [showTierForm, setShowTierForm] = useState(false);
const [expandedTiers, setExpandedTiers] = useState<Set<number>>(new Set());
const [tierForm, setTierForm] = useState<Partial<PackageTier>>({
  name: "",
  price: undefined,
  deliverables: [""],
  position: 0,
  isPrimary: tiers.length === 0,
});
```

**Tier Management Functions:**
- `addTier()` - Validates and adds a new tier
- `removeTier(index)` - Removes tier by index
- `toggleTierExpand(index)` - Expands/collapses tier details
- Uses inline forms for managing tier deliverables

**Tier UI (Step 3 - Pricing):**
1. **Tier Form** (shown when "Add Tier" clicked)
   - Tier name input
   - Price input (PKR)
   - Position/order input
   - Description textarea
   - Dynamic deliverables list with add/remove

2. **Tier List** (shows all created tiers)
   - Collapsible cards with tier info
   - Primary badge for primary tier
   - Expansion to show full deliverables
   - Remove button for each tier

**Draft Persistence:**
- Tiers are saved to localStorage draft
- Draft restoration includes tier state
- Clear draft also clears tiers

**Package Submission:**
- Tiers included in final package payload
- Only sent if tiers list is not empty
- Backend handles tier creation/updates

#### 3. Data Flow

```
User Input (Wizard Step 3)
    ↓
tierForm state
    ↓
addTier() validation
    ↓
Appended to tiers[] state
    ↓
Rendered in tier list UI
    ↓
submitPackage()
    ↓
packagePayload.tiers = tiers
    ↓
POST/PATCH /api/v1/packages
    ↓
Backend creates/updates PackageTier entities
```

---

## Key Features

### For Creators
✅ Create packages with multiple pricing tiers
✅ Mark one tier as "primary" (base offering)
✅ Define tier-specific deliverables
✅ Add descriptions for each tier (e.g., "Best for small brands")
✅ Control tier display order
✅ Save in-progress as draft
✅ Preview all tiers before publishing

### For Brands
✅ See all pricing options at a glance
✅ Order from any tier (primary or add-on)
✅ Understand tier-specific deliverables
✅ Choose based on budget/needs

---

## Currency Implementation Details

### V1: PKR Only
```java
// Always set to PKR
servicePackage.setCurrency("PKR");

// Database enforces with default
ALTER COLUMN currency SET DEFAULT 'PKR';
```

### V2+: Multi-Currency Ready
The structure is designed for easy extension:
1. Add `currency` field to tier (if tier-specific currency needed)
2. Update DTOs to accept currency parameter
3. Add currency validation in service
4. UI currency selector in wizard

---

## Database Migration Strategy

**Migration File:** `V9__package_tiers_v1_enhancements.sql`

**Actions:**
1. Add new columns to `package_tiers`
2. Convert `deliverables` to JSONB
3. Change `price` to INTEGER
4. Update existing data:
   - Set `position` based on `created_at` order
   - Mark first tier as primary
   - Update currency to PKR

**Idempotency:**
- All schema changes use `IF NOT EXISTS`
- Safe to re-run without breaking

---

## API Request/Response Examples

### Create Package with Tiers
**Request:**
```bash
POST /api/v1/packages
Content-Type: application/json

{
  "title": "Food Review Bundle",
  "platform": "INSTAGRAM",
  "category": "Food",
  "description": "Professional restaurant reviews",
  "full_description": "Detailed review with multiple formats",
  "short_description": "1 Reel + Stories",
  "deal_type": "PAID",
  "currency": "PKR",
  "deliverables": ["Main Reel"],
  "delivery_days": 5,
  "revisions": 2,
  "visibility": "public",
  "status": "ACTIVE",
  "tiers": [
    {
      "name": "Starter",
      "price": 15000,
      "deliverables": ["1 Reel"],
      "delivery_days": 5,
      "revisions": 1,
      "position": 0,
      "is_primary": true,
      "description": "Basic reel only"
    },
    {
      "name": "Professional",
      "price": 30000,
      "deliverables": ["1 Reel", "3 Stories", "1 Feed Post"],
      "delivery_days": 5,
      "revisions": 2,
      "position": 1,
      "is_primary": false,
      "description": "Most popular"
    },
    {
      "name": "Premium",
      "price": 50000,
      "deliverables": ["1 Reel", "5 Stories", "2 Feed Posts", "Video Highlight"],
      "delivery_days": 7,
      "revisions": 3,
      "position": 2,
      "is_primary": false,
      "description": "Full package"
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid...",
  "creator_id": "uuid...",
  "title": "Food Review Bundle",
  "currency": "PKR",
  "price": 15000,
  "status": "ACTIVE",
  "tiers": [
    {
      "id": "uuid...",
      "name": "Starter",
      "price": 15000,
      "deliverables": ["1 Reel"],
      "position": 0,
      "is_primary": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    // ... other tiers
  ]
}
```

---

## Testing Checklist

### Backend
- [ ] Create package without tiers (backward compatible)
- [ ] Create package with one tier
- [ ] Create package with multiple tiers
- [ ] Verify isPrimary flag enforcement
- [ ] Verify position ordering
- [ ] Update package with new tiers
- [ ] Remove tiers from package
- [ ] Verify currency always PKR
- [ ] Run V9 migration successfully

### Frontend
- [ ] Add tier in wizard Step 3
- [ ] Remove tier from list
- [ ] Expand/collapse tier details
- [ ] Edit tier deliverables inline
- [ ] Draft save includes tiers
- [ ] Draft restore restores tiers
- [ ] Submit package with tiers
- [ ] Verify tiers in API payload
- [ ] Display tiers on package detail page

### Integration
- [ ] End-to-end: Create package → Add tiers → Save draft → Submit
- [ ] End-to-end: Edit package → Modify tiers → Update
- [ ] Brand can view all tiers and order from any

---

## Future Enhancements (v2+)

1. **Multi-Currency Support**
   - Add tier-specific currency if needed
   - Currency converter in UI
   - Update DTOs and validation

2. **Advanced Tier Features**
   - Tier-specific response times
   - Tier-specific revisions policies
   - Tier-specific visibility rules
   - Bulk discount tiers

3. **Tier Analytics**
   - Track which tier is most popular
   - Per-tier conversion rates
   - Per-tier revenue tracking

4. **Amplification Permissions** (Planned for v2)
   - Spark/whitelisting rights per tier
   - Exclusivity rules
   - Add to tier creation form when implemented

5. **Dynamic Tier Pricing**
   - Seasonal pricing adjustments
   - Promo codes by tier
   - Conditional tier pricing rules

---

## Deployment Steps

1. **Database**
   - Run Flyway migration: `V9__package_tiers_v1_enhancements.sql`
   - Verify all packages have `currency = 'PKR'`
   - Check tier position and isPrimary flags

2. **Backend**
   - Deploy updated Java code
   - Test `/api/v1/packages` endpoints
   - Verify tier DTOs serialize correctly

3. **Frontend**
   - Deploy updated Next.js code
   - Test wizard in `/creator/packages/new`
   - Test package edit mode
   - Verify tier display on package cards

4. **Monitoring**
   - Monitor for tier-related errors
   - Track package creation with/without tiers
   - Monitor API response times for tier queries

---

## Code References

### Backend Files
- `ServicePackage.java` - Entity with currency hardcoded to PKR
- `PackageTier.java` - Tier entity with enhanced fields
- `ServicePackageService.java` - Business logic for tier management
- `ServicePackageMapper.java` - DTO mapping
- `ServicePackageTierRequest.java` - Input DTO
- `ServicePackageTierResponse.java` - Output DTO
- `V9__package_tiers_v1_enhancements.sql` - Database migration

### Frontend Files
- `types/index.ts` - TypeScript interfaces including PackageTier
- `components/creator-package-wizard.tsx` - Main wizard with tier support
- `app/creator/packages/new/page.tsx` - Package creation page

---

## Support & Questions

For questions about this implementation:
1. Check the migration file for exact schema changes
2. Review the DTO classes for API contract details
3. Test the wizard locally in development
4. Monitor API responses for tier payload structure

