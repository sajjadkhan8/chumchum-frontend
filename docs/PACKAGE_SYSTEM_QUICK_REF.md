# V1 Package System - Quick Reference

## What Was Built

A complete package tier system for creators to offer multiple pricing variants (Lite/Standard/Premium) for each service package.

### Key Features
- ✅ **PKR-Only Currency** (v1 requirement)
- ✅ **Primary + Add-ons Model** (one base, multiple variants)
- ✅ **Full Wizard Support** (Step 3 - Pricing)
- ✅ **Tier-Specific Deliverables** (each tier can have different items)
- ✅ **Draft & Persistence** (save in-progress work)

---

## For Creators: How to Use

### Step 1: Open Package Wizard
Navigate to `/creator/packages/new` → Click "Step 3 - Pricing"

### Step 2: Set Base Package Pricing
1. Choose deal type: Paid / Barter / Hybrid
2. Enter price, delivery days, revisions
3. This becomes your **primary** package

### Step 3: Add Tiers (Optional)
1. Click "Add Tier" button
2. Fill tier form:
   - **Name**: "Lite", "Standard", "Premium", etc.
   - **Price**: PKR amount (e.g., 15000)
   - **Description**: "Best for small brands" (optional)
   - **Deliverables**: Add items specific to this tier
3. Click "Add Tier"

### Step 4: View Your Tiers
- Cards show tier name, price, item count
- Click card to expand and see full details
- Click "Remove" to delete tier

### Step 5: Publish
Continue to "Step 5 - Publish" and submit package with all tiers

---

## For Developers: Key Changes

### Database
- **New columns in `package_tiers` table:**
  - `description` (TEXT) - Tier description
  - `position` (INTEGER) - Display order
  - `is_primary` (BOOLEAN) - Primary tier flag
  - `updated_at` (TIMESTAMP) - Update tracking
  - `deliverables` changed to JSONB (from TEXT)
  - `price` changed to INTEGER (from DECIMAL)

**Migration:** `V9__package_tiers_v1_enhancements.sql`

### Backend Changes
```java
// ServicePackage.java
private String currency = "PKR";  // Always PKR in v1

// PackageTier.java - New fields
private List<String> deliverables;  // JSONB array
private String description;
private Integer position;
private Boolean isPrimary;
private Instant updatedAt;
```

### API Payloads

**Create/Update Package with Tiers:**
```json
POST /api/v1/packages
{
  "title": "Reel Package",
  "tiers": [
    {
      "name": "Lite",
      "price": 15000,
      "deliverables": ["1 Reel"],
      "is_primary": true,
      "position": 0
    },
    {
      "name": "Pro",
      "price": 30000,
      "deliverables": ["1 Reel", "3 Stories"],
      "is_primary": false,
      "position": 1
    }
  ]
}
```

### Frontend Types
```typescript
// types/index.ts
export interface PackageTier {
  id?: string;
  name: string;
  price: number;           // PKR
  currency?: string;       // Always PKR
  deliverables: string[];
  description?: string;
  position?: number;
  isPrimary?: boolean;
}

export interface Package {
  // ...existing...
  tiers?: PackageTier[];   // NEW
  currency?: string;       // NEW default: PKR
}
```

### Component
**File:** `components/creator-package-wizard.tsx`

**Key Functions:**
- `addTier()` - Validate and add tier
- `removeTier(index)` - Delete tier
- `toggleTierExpand(index)` - Show/hide tier details

**State:**
```typescript
const [tiers, setTiers] = useState<PackageTier[]>([]);
const [showTierForm, setShowTierForm] = useState(false);
const [expandedTiers, setExpandedTiers] = useState<Set<number>>(new Set());
```

---

## Testing Locally

### 1. Backend Test
```bash
curl -X POST http://localhost:8080/api/v1/packages \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Package",
    "platform": "INSTAGRAM",
    "deal_type": "PAID",
    "currency": "PKR",
    "tiers": [
      {
        "name": "Basic",
        "price": 10000,
        "deliverables": ["1 Reel"],
        "is_primary": true
      }
    ]
  }'
```

### 2. Frontend Test
1. Go to `/creator/packages/new`
2. Fill out Steps 1-2
3. In Step 3, add 2-3 tiers
4. Save draft and refresh
5. Verify tiers are restored
6. Submit and check network tab for payload

### 3. Database Check
```sql
-- Verify schema
\d core.package_tiers

-- Verify sample data
SELECT * FROM core.package_tiers 
WHERE package_id = 'your-package-uuid' 
ORDER BY position;
```

---

## Common Tasks

### Add a New Tier Field
1. Update `PackageTier.java` entity
2. Update migration `V9` (or create new `V10`)
3. Update `ServicePackageTierRequest.java`
4. Update `ServicePackageTierResponse.java`
5. Update mapper `ServicePackageMapper.java`
6. Update frontend `PackageTier` interface
7. Update wizard component if UI needed

### Change Tier Display Order
```java
// Backend: Already sorted by position automatically
List<PackageTier> sorted = servicePackage.getTiers().stream()
  .sorted(Comparator.comparingInt(PackageTier::getPosition))
  .toList();
```

### Validate Tier Pricing
```java
// Service layer example:
if (tier.getPrice() < 0) {
  throw new ApiException(HttpStatus.BAD_REQUEST, "Price must be positive");
}
if (tier.getPrice() > 10000000) {
  throw new ApiException(HttpStatus.BAD_REQUEST, "Price exceeds maximum");
}
```

### Query Packages with Tiers
```java
// Named query example (if using JPA)
@Query("SELECT p FROM ServicePackage p LEFT JOIN FETCH p.tiers WHERE p.id = ?1")
Optional<ServicePackage> findByIdWithTiers(UUID id);
```

---

## Troubleshooting

### Tiers Not Saving
- Check browser console for validation errors
- Verify tier form has all required fields: name, price, ≥1 deliverable
- Check network tab for API response

### Tiers Not Displaying
- Verify price and position are numbers
- Check `isPrimary` flag in response
- Ensure deliverables is array, not string

### Migration Fails
- Check if table exists: `\dt core.package_tiers`
- Verify FK constraint: query fails if package_id doesn't exist
- Re-run with `flyway repair` if needed

### Currency Not PKR
- Check `ServicePackage.currency` field - should default to "PKR"
- Database migration should have updated existing records
- Verify UI always displays/sends "PKR"

---

## Links & Files

| File | Purpose |
|------|---------|
| `V9__package_tiers_v1_enhancements.sql` | Database migration |
| `ServicePackage.java` | Main package entity |
| `PackageTier.java` | Tier entity |
| `ServicePackageTierRequest.java` | Tier input DTO |
| `ServicePackageTierResponse.java` | Tier output DTO |
| `ServicePackageService.java` | Business logic |
| `types/index.ts` | Frontend types |
| `creator-package-wizard.tsx` | Wizard component |
| `V1_PACKAGE_SYSTEM_IMPLEMENTATION.md` | Full documentation |

---

## Next Steps (v2+)

- [ ] Multi-currency support
- [ ] Tier-specific response times
- [ ] Amplification permissions per tier
- [ ] Tier analytics dashboard
- [ ] Bulk discount rules
- [ ] Promo codes by tier

---

## Questions?

1. **Schema**: See `V9__package_tiers_v1_enhancements.sql`
2. **API Contract**: See `ServicePackageTierRequest/Response.java`
3. **UI/UX**: See `creator-package-wizard.tsx`
4. **Types**: See `types/index.ts`
5. **Full Docs**: See `V1_PACKAGE_SYSTEM_IMPLEMENTATION.md`

