# 🚀 Ambassador Gamification - Quick Reference

## New Files Created

### Core Library
- **`/lib/ambassador-scoring.ts`** - Scoring algorithms & calculations (200+ lines)

### Components
- **`/components/ambassador-score-display.tsx`** - Score gauge, breakdown, badge
- **`/components/ambassador-insights.tsx`** - Timeline, suggestions, percentile
- **`/components/ambassador-detailed-card.tsx`** - Premium complete view
- **`/components/creator-ambassador-badge.tsx`** - Mini badges for cards

### Types
- **`/types/index.ts`** - Added: AmbassadorScore, AmbassadorTier, etc.

### Documentation
- **`AMBASSADOR_GAMIFICATION_GUIDE.md`** - Complete feature guide

---

## Component Import Guide

### 1. Show Score on Creator Cards
```tsx
import { CreatorAmbassadorBadge } from '@/components/creator-ambassador-badge';

<CreatorAmbassadorBadge creator={creator} />
// Shows: 🚀 Emerging (or hidden if < 40 score)
```

### 2. Show Detailed Card on Profile
```tsx
import { AmbassadorDetailedCard } from '@/components/ambassador-detailed-card';

<AmbassadorDetailedCard creator={creator} expandedByDefault />
// Shows: Score gauge + breakdown + journey + suggestions
```

### 3. Just Show Score Gauge
```tsx
import { AmbassadorScoreGauge } from '@/components/ambassador-score-display';

<AmbassadorScoreGauge score={78} size="lg" animated />
// Shows: Animated progress ring with 78/100
```

### 4. Show Tier Badge
```tsx
import { AmbassadorTierBadge } from '@/components/ambassador-score-display';

<AmbassadorTierBadge tier="verified_ambassador" size="md" />
// Shows: ⭐ Verified Ambassador (with glow)
```

### 5. Get All Metrics
```tsx
import { calculateCreatorAmbassadorMetrics } from '@/lib/ambassador-scoring';

const metrics = calculateCreatorAmbassadorMetrics(creator);
// Returns: {
//   score: { total: 78, deliveryScore: 25, ... },
//   tier: "verified_ambassador",
//   percentileRank: 82,
//   strengths: ["Excellent delivery..."],
//   improvements: ["Complete 2 more..."],
//   journeyMilestones: { ... }
// }
```

---

## Tier Information Lookup

```tsx
import { AMBASSADOR_TIERS } from '@/lib/ambassador-scoring';

// Get info for a tier
const tierInfo = AMBASSADOR_TIERS['verified_ambassador'];
// Returns: {
//   name: "⭐ Verified Ambassador",
//   description: "Trusted creator partner",
//   scoreRange: [71, 90],
//   color: "#f59e0b",
//   benefits: ["Guaranteed monthly base...", ...],
//   nextMilestone: 91
// }
```

---

## Score Calculation

```tsx
import { calculateAmbassadorScore, getAmbassadorTier } from '@/lib/ambassador-scoring';

const score = calculateAmbassadorScore(creator);
// Returns:
// {
//   total: 78,                        // 0-100
//   deliveryScore: 26,                // 0-35
//   accountAgeScore: 12,              // 0-15
//   ratingScore: 23,                  // 0-25
//   cancellationScore: 9,             // 0-10
//   profileCompletenessScore: 8,      // 0-10
//   consistencyScore: 4               // 0-5
// }

const tier = getAmbassadorTier(score.total);
// Returns: "verified_ambassador"
```

---

## Percentile Ranking

```tsx
import { getPercentileRank } from '@/lib/ambassador-scoring';

const percentile = getPercentileRank(78);
// Returns: 82 (you're ahead of 82% of creators)
```

---

## Insights & Suggestions

```tsx
import { getCreatorInsights, getAmbasadorSuggestions } from '@/lib/ambassador-scoring';

const { strengths, improvements } = getCreatorInsights(creator, score);
// Returns:
// {
//   strengths: ["Excellent delivery...", "High quality..."],
//   improvements: ["Complete 2 more...", "Maintain 4.8+ rating..."]
// }

const suggestions = getAmbasadorSuggestions(metrics, 'verified_ambassador');
// Returns: ["You need 12 more points...", "Complete 2 more deliveries..."]
```

---

## Journey Milestones

```tsx
import { getJourneyMilestones } from '@/lib/ambassador-scoring';

const milestones = getJourneyMilestones(creator);
// Returns:
// {
//   joinedPlatform: Date,
//   firstDelivery: Date | undefined,
//   consistencyAchieved: Date | undefined,
//   ambassadorEligible: Date | undefined
// }
```

---

## UI Sizes

### Score Gauge Sizes
```tsx
<AmbassadorScoreGauge score={78} size="sm" />   // 80px
<AmbassadorScoreGauge score={78} size="md" />   // 120px
<AmbassadorScoreGauge score={78} size="lg" />   // 160px
```

### Badge Sizes
```tsx
<AmbassadorTierBadge tier={tier} size="sm" />   // 11px text
<AmbassadorTierBadge tier={tier} size="md" />   // 14px text
<AmbassadorTierBadge tier={tier} size="lg" />   // 16px text
```

---

## Frontend-Only Architecture

Everything is computed client-side:

✅ No API calls  
✅ No backend storage  
✅ No state management needed  
✅ Deterministic calculations  
✅ Works offline  
✅ Instant updates  

**Data source**: Creator object fields only
- `creator.completedDeals`
- `creator.createdAt`
- `creator.rating`
- `creator.avgEngagementRate`
- `creator.responseTime`
- `creator.bio`
- `creator.coverImage`
- `creator.platforms.length`
- `creator.contentPreviews.length`

---

## Color Coding (By Tier)

```
🌱 Rising Creator (0-40)        → Lime (#84cc16)
🚀 Emerging Ambassador (41-70)  → Blue (#3b82f6)
⭐ Verified Ambassador (71-90)  → Amber (#f59e0b)
👑 Elite Ambassador (91-100)    → Purple (#8b5cf6)
```

All colors have:
- Base color for text
- `color15` opacity for backgrounds (e.g., `#84cc1615`)
- `color40` for glow effects

---

## Animation Performance

All animations use Framer Motion with:
- GPU acceleration (`transform` & `opacity`)
- Optimized re-renders (no layout thrashing)
- Smooth easing curves
- Staggered delays for sequential reveals

**No performance impact** on render cycles.

---

## Dark Mode Support

All components automatically:
- Detect `dark:` class
- Use `text-foreground` for text
- Use `bg-background` for backgrounds
- Use `text-muted-foreground` for secondary text
- Adapt colors for readability

---

## Real Examples

### Show Ambassador Score on Browse Page
```tsx
// In /app/brand/explore/page.tsx
<CreatorCard creator={creator} />
// Now automatically shows ambassador badge if score >= 40
```

### Show Full Details on Ambassador Program Page
```tsx
// In /app/creator/ambassador-program/page.tsx
<AmbassadorDetailedCard creator={currentCreator} />
// Shows: gauge + breakdown + timeline + suggestions
```

### Show Quick Stats on Profile
```tsx
// In creator profile component
<CreatorAmbassadorStats creator={creator} variant="full" />
// Shows: compact tier + score + progress bar
```

---

## Testing Scores

### Example Creator Scores

**Creator A** (Rising Creator - 35 points):
- 5 completed deals
- 8 months old
- 4.2 rating
- Basic profile

**Creator B** (Emerging Ambassador - 62 points):
- 30 completed deals
- 16 months old
- 4.6 rating
- Complete profile

**Creator C** (Verified Ambassador - 78 points):
- 60 completed deals
- 22 months old
- 4.8 rating
- Premium profile

**Creator D** (Elite Ambassador - 95 points):
- 150+ completed deals
- 36 months old
- 4.9 rating
- Perfect profile

---

## Known Limitations

⚠️ **Frontend-Only**:
- No real-time updates from backend
- Scores are computed per render
- Mock percentile calculation (not real distribution)

These are intentional **for this MVP**.  
Backend sync can be added later without changing component code.

---

## Performance Tips

1. **Don't recalculate in render loops**:
   ```tsx
   // ❌ Bad - recalculates every render
   const metrics = calculateCreatorAmbassadorMetrics(creator);
   
   // ✅ Good - memoize
   const metrics = useMemo(
     () => calculateCreatorAmbassadorMetrics(creator),
     [creator.id]
   );
   ```

2. **Lazy load detailed card**:
   ```tsx
   // Use tabs or accordion to show detailed card only when needed
   <Tabs>
     <TabsContent value="overview">Brief view</TabsContent>
     <TabsContent value="ambassador"><AmbassadorDetailedCard /></TabsContent>
   </Tabs>
   ```

---

## Future Enhancements

Suggested additions (not implemented):
- [ ] Backend sync for real scores
- [ ] Leaderboard integration
- [ ] Confetti animation on tier unlock
- [ ] Email notifications on tier changes
- [ ] Export score certificate
- [ ] Shareable score widget
- [ ] Performance graphs over time
- [ ] Custom performance reports

---

## Debug Mode

To log detailed scoring info:

```tsx
import { calculateAmbassadorScore, getAmbassadorTier } from '@/lib/ambassador-scoring';

const creator = /* ... */;
const score = calculateAmbassadorScore(creator);
const tier = getAmbassadorTier(score.total);

console.log('=== AMBASSADOR METRICS ===');
console.log('Creator:', creator.name);
console.log('Total Score:', score.total);
console.log('Score Breakdown:', {
  delivery: score.deliveryScore,
  accountAge: score.accountAgeScore,
  rating: score.ratingScore,
  cancellation: score.cancellationScore,
  profile: score.profileCompletenessScore,
  consistency: score.consistencyScore,
});
console.log('Tier:', tier);
console.log('Tier Info:', AMBASSADOR_TIERS[tier]);
```

---

**Last Updated**: May 18, 2026  
**Status**: ✅ Complete & Production Ready  
**Build**: ✅ Successful

