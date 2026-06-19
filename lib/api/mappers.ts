import type {
  Brand,
  City,
  Conversation,
  Creator,
  CreatorPackage,
  DealType,
  Message,
  Order,
  OrderDeliverable,
  Package,
  PackageAnalytics,
  Platform,
  QuickDealOffer,
  CreatorBadgeLevel,
  User,
  UserRole,
  VerificationSource,
} from '@/types';

const safeDate = (value?: string | Date | null): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const normalizePlatform = (value?: string | null): Platform => {
  const lowered = (value || '').toLowerCase();
  if (lowered === 'instagram' || lowered === 'tiktok' || lowered === 'youtube' || lowered === 'facebook' || lowered === 'snapchat') {
    return lowered;
  }
  return 'instagram';
};

const normalizeDealType = (value?: string | null): DealType => {
  const lowered = (value || '').toLowerCase();
  if (lowered === 'paid' || lowered === 'barter' || lowered === 'hybrid') return lowered;
  return 'paid';
};

const normalizeRole = (value?: string | null): UserRole => {
  const lowered = (value || '').toLowerCase();
  if (lowered === 'brand') return 'brand';
  if (lowered === 'platform_admin' || lowered === 'admin') return 'platform_admin';
  return 'creator';
};

interface BackendUser {
  id: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  role?: string;
  name?: string;
  avatarUrl?: string;
  creatorProgramStatus?: User['creatorProgramStatus'];
  active?: boolean;
  createdAt?: string;
}

export const mapUser = (input: BackendUser): User => ({
  id: input.id,
  email: input.email || '',
  emailVerified: input.emailVerified,
  phone: input.phone,
  role: normalizeRole(input.role),
  name: input.name || 'User',
  avatar: input.avatarUrl,
  creatorProgramStatus: input.creatorProgramStatus || 'none',
  active: input.active,
  createdAt: safeDate(input.createdAt),
});

interface BackendCreatorResponse {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  city?: string;
  avatar_url?: string;
  bio?: string;
  cover_image_url?: string;
  website?: string;
  availability_status?: string;
  response_time?: string;
  min_price?: number;
  max_price?: number;
  is_verified?: boolean;
  badge_level?: string;
  is_trending?: boolean;
  is_fast_responder?: boolean;
  completed_deals?: number;
  completion_rate?: number;
  repeat_clients?: number;
  accepts_barter?: boolean;
  accepts_hybrid_deals?: boolean;
  is_filer?: boolean;
  active_order_count?: number;
  minimum_budget?: number;
  languages?: string[];
  categories?: string[];
  followers?: number;
  avg_views?: number;
  engagement_rate?: number;
  rating?: number;
  total_reviews?: number;
  social_accounts?: {
    id?: string;
    platform?: string;
    username?: string;
    profile_url?: string;
    followers?: number;
    avg_views?: number;
    engagement_rate?: number;
    is_verified?: boolean;
    verified_by?: string;
  }[];
  content_previews?: {
    id?: string;
    type?: string;
    thumbnail_url?: string;
    media_url?: string;
    platform?: string;
    views?: number;
    likes?: number;
  }[];
  rate_card_reel?: number;
  rate_card_story?: number;
  rate_card_post?: number;
  rate_card_video?: number;
  user?: {
    id?: string;
    name?: string;
    username?: string;
    image?: string;
    city?: string;
    email?: string;
    phone?: string;
  };
  created_at?: string;
}

export const mapCreator = (input: BackendCreatorResponse): Creator => {
  const username = input.username || input.user?.username || `creator-${input.id.slice(0, 8)}`;
  const displayName = input.name || input.user?.name || input.user?.username || username;
  const avatar = input.avatar_url || input.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  const followers = input.followers || 0;
  const engagementRate = input.engagement_rate || 0;
  const categories = input.categories?.length ? input.categories : ['General'];
  const badgeLevel = ['verified', 'rising_star', 'pro', 'elite'].includes((input.badge_level || '').toLowerCase())
    ? (input.badge_level?.toLowerCase() as CreatorBadgeLevel)
    : 'none';

  const socialAccounts = input.social_accounts?.length
    ? input.social_accounts.map((account) => ({
        platform: normalizePlatform(account.platform),
        followers: account.followers || 0,
        engagementRate: account.engagement_rate || 0,
        username: account.username || username,
        profileUrl: account.profile_url,
        avgViews: account.avg_views || 0,
        verified_by: account.verified_by as VerificationSource | undefined,
      }))
    : [{ platform: 'instagram' as const, followers, engagementRate, username, avgViews: 0 }];

  return {
    id: input.id,
    userId: input.user?.id || input.id,
    username,
    name: displayName,
    email: input.email || input.user?.email,
    phone: input.phone || input.user?.phone,
    avatar,
    coverImage: input.cover_image_url || avatar,
    bio: input.bio || '',
    city: (input.city as City | null) || (input.user?.city as City | null) || null,
    categories,
    languages: input.languages || [],
    website: input.website,
    availabilityStatus: input.availability_status,
    acceptsBarter: input.accepts_barter,
    acceptsHybridDeals: input.accepts_hybrid_deals,
    minimumBudget: input.minimum_budget,
    platforms: socialAccounts.length > 0 ? socialAccounts : [{ platform: 'instagram', followers, engagementRate, username }],
    totalFollowers: followers,
    avgEngagementRate: engagementRate,
    dealTypes: [
      'paid',
      ...(input.accepts_barter === false ? [] : ['barter' as const]),
      ...(input.accepts_hybrid_deals === false ? [] : ['hybrid' as const]),
    ],
    barterTypes: ['products'],
    minPrice: input.min_price,
    maxPrice: input.max_price,
    responseTime: input.response_time || 'Within 24 hours',
    isVerified: Boolean(input.is_verified) || (input.rating || 0) >= 4,
    badgeLevel,
    isFiler: Boolean(input.is_filer),
    isTrending: Boolean(input.is_trending),
    isFastResponder: Boolean(input.is_fast_responder),
    activeOrderCount: typeof input.active_order_count === 'number' ? input.active_order_count : 0,
    rating: input.rating || 0,
    totalReviews: input.total_reviews || 0,
    completedDeals: input.completed_deals || 0,
    completionRate: input.completion_rate,
    repeatClients: input.repeat_clients,
    rateCardReel: input.rate_card_reel ?? undefined,
    rateCardStory: input.rate_card_story ?? undefined,
    rateCardPost: input.rate_card_post ?? undefined,
    rateCardVideo: input.rate_card_video ?? undefined,
    contentPreviews: (input.content_previews || [])
      .filter((preview) => Boolean(preview.media_url || preview.thumbnail_url))
      .map((preview, index) => ({
        id: preview.id || `${input.id}-preview-${index}`,
        type: (preview.type || '').toLowerCase() === 'image' ? 'image' : 'video',
        thumbnail: preview.thumbnail_url || preview.media_url || avatar,
        url: preview.media_url || preview.thumbnail_url || avatar,
        platform: normalizePlatform(preview.platform),
        views: preview.views,
        likes: preview.likes,
      })),
    createdAt: safeDate(input.created_at),
  };
};

interface BackendBrandResponse {
  id: string;
  name?: string;
  website?: string;
  industry?: string;
  description?: string;
  logo_url?: string;
  monthly_budget?: number;
  preferred_creator_categories?: string;
  target_cities?: string;
  target_platforms?: string;
  campaign_budget_range?: string;
  business_verification_status?: string;
  verification_contact_email?: string;
  verification_phone_number?: string;
  plan_tier?: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  brand_rating?: number;
  brand_total_reviews?: number;
  company_size?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  user?: {
    id?: string;
    city?: string;
  };
}

export const mapBrand = (input: BackendBrandResponse): Brand => ({
  id: input.id,
  userId: input.user?.id || input.id,
  name: input.name || 'Brand',
  logo: input.logo_url || '',
  industry: input.industry || 'General',
  website: input.website,
  city: (input.user?.city as City | null) || null,
  description: input.description || '',
  monthlyBudget: input.monthly_budget,
  preferredCreatorCategories: input.preferred_creator_categories,
  targetCities: input.target_cities,
  targetPlatforms: input.target_platforms,
  campaignBudgetRange: input.campaign_budget_range,
  businessVerificationStatus: input.business_verification_status,
  verificationContactEmail: input.verification_contact_email,
  verificationPhoneNumber: input.verification_phone_number,
  planTier: input.plan_tier,
  brandRating: input.brand_rating ?? 0,
  brandTotalReviews: input.brand_total_reviews ?? 0,
  companySize: input.company_size,
  contactName: input.contact_name,
  contactEmail: input.contact_email,
  contactPhone: input.contact_phone,
  totalCampaigns: 0,
  activeOrders: 0,
});

interface BackendPackageResponse {
  id: string;
  creator_id: string;
  title?: string;
  short_description?: string;
  description?: string;
  full_description?: string;
  platform?: string;
  category?: string;
  deal_type?: string;
  barter_details?: string;
  barter_description?: string;
  barter_category?: string;
  estimated_barter_value?: number;
  creator_expectations?: string;
  hybrid_cash_amount?: number;
  hybrid_barter_value?: number;
  price?: number;
  deliverables?: string[];
  delivery_days?: number;
  revisions?: number;
  tags?: string[];
  currency?: string;
  is_featured?: boolean;
  is_popular?: boolean;
  orders_completed?: number;
  status?: string;
  response_time?: string;
  cover_image?: string;
  media_urls?: string[];
  visibility?: 'public' | 'private';
}

export const mapPackage = (input: BackendPackageResponse): CreatorPackage => ({
  id: input.id,
  creatorId: input.creator_id,
  title: input.title || 'Untitled Package',
  shortDescription: input.short_description || input.description || '',
  description: input.description || input.short_description || '',
  fullDescription: input.full_description || input.description || '',
  category: input.category || 'General',
  deliverables: input.deliverables || [],
  deliveryDays: input.delivery_days || 1,
  revisions: input.revisions || 0,
  price: input.price || 0,
  dealType: normalizeDealType(input.deal_type),
  barterValue: input.barter_details,
  barterDescription: input.barter_description,
  barterCategory: (input.barter_category as CreatorPackage['barterCategory']) || undefined,
  estimatedBarterValue: input.estimated_barter_value,
  creatorExpectations: input.creator_expectations,
  hybridCashAmount: input.hybrid_cash_amount,
  hybridBarterValue: input.hybrid_barter_value,
  platform: normalizePlatform(input.platform),
  tags: input.tags || [],
  currency: input.currency || 'PKR',
  isFeatured: Boolean(input.is_featured),
  isPopular: Boolean(input.is_popular),
  ordersCompleted: input.orders_completed || 0,
  status: (input.status || 'draft').toLowerCase() as CreatorPackage['status'],
  responseTime: input.response_time || 'Within 24 hours',
  thumbnail: input.cover_image || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
  mediaUrls: input.media_urls || [],
  visibility: input.visibility || 'public',
  analytics: {
    views: 0,
    clicks: 0,
    inquiries: 0,
    conversionRate: 0,
    completionRate: 0,
    repeatBrands: 0,
    engagementPerformance: 0,
  },
});

export const mergePackageAnalytics = (pkg: CreatorPackage, analytics?: Partial<PackageAnalytics>): CreatorPackage => ({
  ...pkg,
  analytics: {
    ...pkg.analytics,
    ...(analytics || {}),
  },
});

interface BackendOrderResponse {
  id: string;
  orderNumber?: string;
  packageId: string;
  packageTitle?: string;
  creatorId: string;
  creatorName?: string;
  brandId: string;
  brandName?: string;
  dealType?: string;
  amount?: number;
  barterDetails?: string;
  message?: string;
  status?: string;
  progress?: number;
  deadlineDate?: string;
  deliveryDate?: string;
  createdAt?: string;
  deliverables?: BackendOrderDeliverableResponse[];
  barterProductReceived?: boolean;
  conversationId?: string;
  hasReviewedByBrand?: boolean;
}

interface BackendOrderDeliverableResponse {
  id: string;
  order_id: string;
  name?: string;
  status?: string;
  file_url?: string;
  submitted_at?: string;
  revision_note?: string;
  created_at?: string;
}

const normalizeDeliverableStatus = (value?: string | null): OrderDeliverable['status'] => {
  const lowered = (value || '').toLowerCase();
  if (lowered === 'in_progress' || lowered === 'completed' || lowered === 'revision' || lowered === 'review') {
    return lowered;
  }
  return 'pending';
};

const mapOrderDeliverable = (input: BackendOrderDeliverableResponse): OrderDeliverable => ({
  id: input.id,
  orderId: input.order_id,
  name: input.name || 'Deliverable',
  status: normalizeDeliverableStatus(input.status),
  fileUrl: input.file_url,
  submittedAt: input.submitted_at ? safeDate(input.submitted_at) : undefined,
  revisionNote: input.revision_note,
  createdAt: input.created_at ? safeDate(input.created_at) : undefined,
});

export const mapOrder = (input: BackendOrderResponse, packageMap: Record<string, Package>, creatorMap: Record<string, Creator>, brandMap: Record<string, Brand>): Order => {
  const pkg = packageMap[input.packageId] || {
    id: input.packageId,
    creatorId: input.creatorId,
    title: input.packageTitle || 'Package',
    description: '',
    deliverables: [],
    deliveryDays: 1,
    price: input.amount || 0,
    dealType: normalizeDealType(input.dealType),
    platform: 'instagram',
    tags: [],
    isPopular: false,
    ordersCompleted: 0,
  };

  const creator = creatorMap[input.creatorId] || {
    id: input.creatorId,
    userId: input.creatorId,
    username: input.creatorName || `creator-${input.creatorId.slice(0, 6)}`,
    name: input.creatorName || 'Creator',
    avatar: '',
    bio: '',
    city: null,
    categories: [],
    platforms: [{ platform: 'instagram', followers: 0, engagementRate: 0, username: 'creator' }],
    totalFollowers: 0,
    avgEngagementRate: 0,
    dealTypes: ['paid'],
    responseTime: 'Within 24 hours',
    isVerified: false,
    isTrending: false,
    isFastResponder: false,
    rating: 0,
    totalReviews: 0,
    completedDeals: 0,
    contentPreviews: [],
    createdAt: new Date(),
  };

  const brand = brandMap[input.brandId] || {
    id: input.brandId,
    userId: input.brandId,
    name: input.brandName || 'Brand',
    logo: '',
    industry: '',
    city: null,
    description: '',
    totalCampaigns: 0,
    activeOrders: 0,
    brandRating: 0,
    brandTotalReviews: 0,
  };

  return {
    id: input.id,
    orderNumber: input.orderNumber,
    packageId: input.packageId,
    package: pkg,
    creatorId: input.creatorId,
    creator,
    brandId: input.brandId,
    brand,
    dealType: normalizeDealType(input.dealType),
    amount: input.amount,
    barterDetails: input.barterDetails,
    message: input.message || '',
    status: (input.status || 'pending').toLowerCase() as Order['status'],
    progress: input.progress,
    deliverables: input.deliverables?.map(mapOrderDeliverable) || [],
    createdAt: safeDate(input.createdAt),
    updatedAt: safeDate(input.createdAt),
    deadlineDate: input.deadlineDate ? safeDate(input.deadlineDate) : undefined,
    deliveryDate: input.deliveryDate ? safeDate(input.deliveryDate) : undefined,
    barterProductReceived: Boolean(input.barterProductReceived),
    conversationId: input.conversationId,
    hasReviewedByBrand: Boolean(input.hasReviewedByBrand),
  };
};

interface BackendMessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  type: string;
  content?: string;
  attachmentUrl?: string;
  isRead?: boolean;
  offerDealType?: string;
  offerAmount?: number;
  offerBarterDetails?: string;
  offerCreatorExpectation?: string;
  offerStatus?: string;
  offerId?: string;
  offerOrderId?: string;
  createdAt?: string;
}

const mapOfferFromMessage = (input: BackendMessageResponse): QuickDealOffer | undefined => {
  if (input.type !== 'offer') return undefined;

  return {
    id: input.offerId,
    dealType: normalizeDealType(input.offerDealType),
    amount: input.offerAmount,
    barterDetails: input.offerBarterDetails,
    creatorExpectation: input.offerCreatorExpectation,
    message: input.content || '',
    status: (input.offerStatus || 'pending').toLowerCase() as QuickDealOffer['status'],
    orderId: input.offerOrderId,
  };
};

export const mapMessage = (input: BackendMessageResponse): Message => ({
  id: input.id,
  conversationId: input.conversationId,
  senderId: input.senderId,
  senderType: normalizeRole(input.senderType),
  content: input.content || '',
  type: (input.type || 'text').toLowerCase() as Message['type'],
  attachmentUrl: input.attachmentUrl,
  offer: mapOfferFromMessage(input),
  isRead: Boolean(input.isRead),
  createdAt: safeDate(input.createdAt),
});

interface BackendConversationResponse {
  id: string;
  creatorId: string;
  brandId: string;
  unreadCountCreator?: number;
  unreadCountBrand?: number;
  lastMessage?: string;
  updatedAt?: string;
}

export const mapConversation = (
  input: BackendConversationResponse,
  creatorMap: Record<string, Creator>,
  brandMap: Record<string, Brand>,
  viewerRole?: 'creator' | 'brand',
): Conversation => {
  const creator = creatorMap[input.creatorId];
  const brand = brandMap[input.brandId];
  const unreadCount =
    viewerRole === 'creator'
      ? (input.unreadCountCreator ?? 0)
      : viewerRole === 'brand'
        ? (input.unreadCountBrand ?? 0)
        : (input.unreadCountCreator ?? input.unreadCountBrand ?? 0);

  return {
    id: input.id,
    creatorId: input.creatorId,
    creator: creator || {
      id: input.creatorId,
      userId: input.creatorId,
      username: `creator-${input.creatorId.slice(0, 6)}`,
      name: 'Creator',
      avatar: '',
      bio: '',
      city: null,
      categories: [],
      platforms: [{ platform: 'instagram', followers: 0, engagementRate: 0, username: 'creator' }],
      totalFollowers: 0,
      avgEngagementRate: 0,
      dealTypes: ['paid'],
      responseTime: 'Within 24 hours',
      isVerified: false,
      isTrending: false,
      isFastResponder: false,
      rating: 0,
      totalReviews: 0,
      completedDeals: 0,
      contentPreviews: [],
      createdAt: new Date(),
    },
    brandId: input.brandId,
    brand: brand || {
      id: input.brandId,
      userId: input.brandId,
      name: 'Brand',
      logo: '',
      industry: '',
      city: null,
      description: '',
      totalCampaigns: 0,
      activeOrders: 0,
    },
    lastMessage: input.lastMessage
      ? {
          id: `${input.id}-last`,
          conversationId: input.id,
          senderId: input.creatorId,
          senderType: 'creator' as const,
          type: 'text' as const,
          content: input.lastMessage,
          isRead: unreadCount === 0,
          createdAt: safeDate(input.updatedAt),
        }
      : undefined,
    unreadCount,
    updatedAt: safeDate(input.updatedAt),
  };
};
