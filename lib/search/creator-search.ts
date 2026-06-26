'use client';

import { getInitials } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/categories';
import { campaignsService } from '@/services/campaigns.service';
import { brandsService } from '@/services/brands.service';
import type { Brand, BrandCampaign, Creator } from '@/types';

export interface CreatorSearchBrandResult {
  id: string;
  name: string;
  initials: string;
  industry: string;
  city: string | null;
  description: string;
  isVerified: boolean;
  /** Real platform rating. Null when the brand has no reviews yet — never inferred. */
  rating: number | null;
  /** Number of reviews backing `rating`. */
  reviewCount: number;
  avgBudget: number;
  /** Number of distinct open campaigns surfaced for this brand in the current search. */
  activeCampaignCount: number;
  campaignCount: number;
  tags: string[];
  activeOffers: BrandCampaign[];
  website?: string;
  matchScore: number;
}

export interface CreatorGlobalSearchResults {
  brands: CreatorSearchBrandResult[];
  campaigns: BrandCampaign[];
}

const normalize = (value?: string | null) => value?.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() ?? '';

const splitValues = (value?: string | null) =>
  (value ?? '')
    .split(/[|,•]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const average = (values: number[]) => (values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

const calculateMatchScore = (searchTerm: string, values: Array<string | undefined>) => {
  const normalizedTerm = normalize(searchTerm);
  if (!normalizedTerm) return 0;

  const words = normalizedTerm.split(' ').filter(Boolean);
  let score = 0;

  for (const rawValue of values) {
    const value = normalize(rawValue);
    if (!value) continue;

    if (value === normalizedTerm) score += 160;
    else if (value.startsWith(normalizedTerm)) score += 120;
    else if (value.includes(normalizedTerm)) score += 80;

    for (const [index, word] of words.entries()) {
      if (!word) continue;
      if (value === word) score += 60;
      else if (value.startsWith(word)) score += 34 - index * 2;
      else if (value.includes(word)) score += 18 - index;
    }
  }

  return score;
};

const rankOffers = (offers: BrandCampaign[], searchTerm: string) =>
  [...offers].sort((left, right) => {
    const rightScore = calculateMatchScore(searchTerm, [
      right.title,
      right.brandName,
      right.brief,
      right.campaignGoal,
      right.categories,
      right.niches,
      right.contentFormats,
      right.targetPlatforms,
      right.targetLanguage,
    ]);
    const leftScore = calculateMatchScore(searchTerm, [
      left.title,
      left.brandName,
      left.brief,
      left.campaignGoal,
      left.categories,
      left.niches,
      left.contentFormats,
      left.targetPlatforms,
      left.targetLanguage,
    ]);

    if (rightScore !== leftScore) return rightScore - leftScore;
    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });

export const rankCreators = (creators: Creator[], searchTerm: string) =>
  [...creators].sort((left, right) => {
    const rightScore = calculateMatchScore(searchTerm, [
      right.name,
      right.username,
      right.bio,
      right.city ?? undefined,
      right.categories.map(getCategoryLabel).join(' '),
      right.platforms.map((platform) => platform.username).join(' '),
    ]);
    const leftScore = calculateMatchScore(searchTerm, [
      left.name,
      left.username,
      left.bio,
      left.city ?? undefined,
      left.categories.map(getCategoryLabel).join(' '),
      left.platforms.map((platform) => platform.username).join(' '),
    ]);

    if (rightScore !== leftScore) return rightScore - leftScore;
    if (right.rating !== left.rating) return right.rating - left.rating;
    return right.totalFollowers - left.totalFollowers;
  });

const deriveBrandTags = (offers: BrandCampaign[]) => {
  const values = new Set<string>();

  for (const offer of offers) {
    for (const token of [
      ...splitValues(offer.contentFormats),
      ...splitValues(offer.categories),
      ...splitValues(offer.niches),
      ...splitValues(offer.targetPlatforms),
    ]) {
      if (token.length > 1) values.add(token);
    }
  }

  return Array.from(values).slice(0, 4);
};

const inferBrandDescription = (brand: Brand | undefined, offers: BrandCampaign[]) => {
  if (brand?.description) return brand.description;
  const topOffer = offers[0];
  if (!topOffer) return 'Active brand looking for creator partnerships.';
  return topOffer.brief.length > 120 ? `${topOffer.brief.slice(0, 117)}...` : topOffer.brief;
};

const inferBrandIndustry = (brand: Brand | undefined, offers: BrandCampaign[]) => {
  if (brand?.industry) return brand.industry;

  const counts = new Map<string, number>();
  for (const offer of offers) {
    for (const token of [...splitValues(offer.categories), ...splitValues(offer.niches)]) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Brand collaborations';
};

const inferBrandCity = (brand: Brand | undefined, offers: BrandCampaign[]) => {
  if (brand?.city) return brand.city;
  return offers.find((offer) => offer.targetCity)?.targetCity
    ?? offers.find((offer) => offer.targetRegion)?.targetRegion
    ?? offers.find((offer) => offer.targetCities)?.targetCities?.split(',')[0]?.trim()
    ?? 'Pakistan';
};

const inferBrandVerification = (brand: Brand | undefined, offers: BrandCampaign[]) => {
  if (brand?.businessVerificationStatus) {
    return brand.businessVerificationStatus.toLowerCase() === 'verified';
  }

  return Boolean(brand ?? offers.find((offer) => (offer.reactionCount ?? 0) > 0));
};

// Real rating, only when the brand actually has reviews. We never infer a rating
// from activity/reactions — an unrated brand returns null so the UI can omit the badge.
const realBrandRating = (brand: Brand | undefined): { rating: number | null; reviewCount: number } => {
  const reviewCount = brand?.brandTotalReviews ?? 0;
  if (brand && reviewCount > 0 && brand.brandRating > 0) {
    return { rating: brand.brandRating, reviewCount };
  }
  return { rating: null, reviewCount };
};

const mergeBrandCampaigns = (offers: BrandCampaign[], brand: Brand | undefined, searchTerm: string): CreatorSearchBrandResult | null => {
  const primaryOffer = offers[0];
  const name = brand?.name ?? primaryOffer?.brandName;
  if (!name) return null;

  const avgBudget = Math.round(average(offers.map((offer) => (offer.budgetMin + offer.budgetMax) / 2)));
  const { rating, reviewCount } = realBrandRating(brand);
  const matchScore = calculateMatchScore(searchTerm, [
    brand?.name,
    brand?.industry,
    brand?.description,
    brand?.city ?? undefined,
    name,
    primaryOffer?.title,
    primaryOffer?.brief,
    primaryOffer?.categories,
    primaryOffer?.niches,
  ]);

  return {
    id: brand?.id ?? primaryOffer?.brandId ?? normalize(name),
    name,
    initials: getInitials(name),
    industry: inferBrandIndustry(brand, offers),
    city: inferBrandCity(brand, offers),
    description: inferBrandDescription(brand, offers),
    isVerified: inferBrandVerification(brand, offers),
    rating,
    reviewCount,
    avgBudget,
    activeCampaignCount: offers.length,
    campaignCount: brand?.totalCampaigns ?? offers.length,
    tags: deriveBrandTags(offers),
    activeOffers: offers.slice(0, 3),
    website: brand?.website,
    matchScore,
  };
};

export async function getCreatorGlobalSearchResults(searchTerm: string): Promise<CreatorGlobalSearchResults> {
  const term = searchTerm.trim();
  if (!term) {
    return { brands: [], campaigns: [] };
  }

  const [offersResult] = await Promise.allSettled([
    campaignsService.getCreatorCampaignFeed({ search: term, page: 0, size: 48 }),
  ]);

  const offers = offersResult.status === 'fulfilled' ? rankOffers(offersResult.value.content || [], term) : [];

  const brandsResult = await brandsService.getAll().catch(() => []);
  const matchedBrands = brandsResult.filter((brand) => calculateMatchScore(term, [brand.name, brand.industry, brand.description, brand.city ?? undefined]) > 0);
  const offersByBrand = new Map<string, BrandCampaign[]>();

  for (const offer of offers) {
    const key = offer.brandId || normalize(offer.brandName);
    const existing = offersByBrand.get(key) ?? [];
    existing.push(offer);
    offersByBrand.set(key, existing);
  }

  const brandResults = new Map<string, CreatorSearchBrandResult>();

  for (const brand of matchedBrands) {
    const relatedOffers = offers.filter(
      (offer) => offer.brandId === brand.id || normalize(offer.brandName) === normalize(brand.name),
    );
    const merged = mergeBrandCampaigns(relatedOffers, brand, term);
    if (merged) {
      brandResults.set(merged.id, merged);
    } else {
      const matchScore = calculateMatchScore(term, [brand.name, brand.industry, brand.description, brand.city ?? undefined]);
      brandResults.set(brand.id, {
        id: brand.id,
        name: brand.name,
        initials: getInitials(brand.name),
        industry: brand.industry,
        city: brand.city,
        description: brand.description,
        isVerified: inferBrandVerification(brand, []),
        ...realBrandRating(brand),
        avgBudget: brand.monthlyBudget ?? 0,
        activeCampaignCount: 0,
        campaignCount: brand.totalCampaigns,
        tags: splitValues(brand.targetPlatforms).slice(0, 4),
        activeOffers: [],
        website: brand.website,
        matchScore,
      });
    }
  }

  for (const [key, brandOffers] of offersByBrand.entries()) {
    const firstOffer = brandOffers[0];
    const matchingBrand = brandsResult.find(
      (brand) => brand.id === firstOffer.brandId || normalize(brand.name) === normalize(firstOffer.brandName),
    );
    const merged = mergeBrandCampaigns(brandOffers, matchingBrand, term);
    if (merged) {
      brandResults.set(merged.id, merged);
    } else if (firstOffer.brandName) {
      brandResults.set(key, {
        id: key,
        name: firstOffer.brandName,
        initials: getInitials(firstOffer.brandName),
        industry: inferBrandIndustry(undefined, brandOffers),
        city: inferBrandCity(undefined, brandOffers),
        description: inferBrandDescription(undefined, brandOffers),
        isVerified: inferBrandVerification(undefined, brandOffers),
        rating: null,
        reviewCount: 0,
        avgBudget: Math.round(average(brandOffers.map((offer) => (offer.budgetMin + offer.budgetMax) / 2))),
        activeCampaignCount: brandOffers.length,
        campaignCount: brandOffers.length,
        tags: deriveBrandTags(brandOffers),
        activeOffers: brandOffers.slice(0, 3),
        matchScore: calculateMatchScore(term, [firstOffer.brandName, firstOffer.title, firstOffer.brief, firstOffer.categories, firstOffer.niches]),
      });
    }
  }

  const brands = Array.from(brandResults.values()).sort((left, right) => {
    if (right.matchScore !== left.matchScore) return right.matchScore - left.matchScore;
    if ((right.rating ?? 0) !== (left.rating ?? 0)) return (right.rating ?? 0) - (left.rating ?? 0);
    return right.activeOffers.length - left.activeOffers.length;
  });

  return {
    brands,
    campaigns: offers,
  };
}
