import type {
  BarterType,
  Brand,
  BrandVerificationStatus,
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
import { normalizeBarterTypes, normalizeCategory, normalizeCategories } from '@/lib/categories';

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
  if (lowered === 'support') return 'support';
  if (lowered === 'finance_ops') return 'finance_ops';
  if (lowered === 'platform_admin' || lowered === 'admin') return 'platform_admin';
  return 'creator';
};

export const normalizeBrandVerificationStatus = (value?: string | null): BrandVerificationStatus => {
  const normalized = (value || 'unverified').toLowerCase().replace(/[\s-]+/g, '_');
  if (
    normalized === 'pending'
    || normalized === 'under_review'
    || normalized === 'verified'
    || normalized === 'rejected'
    || normalized === 'unverified'
  ) {
    return normalized;
  }
  return 'unverified';
};

interface BackendUser {
  id: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  role?: string;
  name?: string;
  avatarUrl?: string;
  brand?: {
    companyName?: string;
    category?: string;
    [key: string]: unknown;
  } | null;
  creatorProgramStatus?: User['creatorProgramStatus'];
  active?: boolean;
  mfaEnabled?: boolean;
  createdAt?: string;
}

export const mapUser = (input: BackendUser): User => {
  const role = normalizeRole(input.role);
  const brandCompanyName = input.brand?.companyName?.trim();

  return {
    id: input.id,
    email: input.email || '',
    emailVerified: input.emailVerified,
    phone: input.phone,
    role,
    name: role === 'brand' ? brandCompanyName || input.name || 'Brand' : input.name || 'User',
    avatar: input.avatarUrl,
    creatorProgramStatus: input.creatorProgramStatus || 'none',
    active: input.active,
    mfaEnabled: input.mfaEnabled,
    createdAt: safeDate(input.createdAt),
  };
};

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
  verification_status?: string;
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
    oauth_status?: string;
    last_synced_at?: string;
    sync_error?: string;
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
  collaboration_preferences?: string[];
  barter_types?: string[];
  created_at?: string;
}

export const mapCreator = (input: BackendCreatorResponse): Creator => {
  const username = input.username || input.user?.username || `creator-${input.id.slice(0, 8)}`;
  const displayName = input.name || input.user?.name || input.user?.username || username;
  const avatar = input.avatar_url || input.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  const followers = input.followers || 0;
  const engagementRate = input.engagement_rate || 0;
  const categories = normalizeCategories(input.categories).length ? normalizeCategories(input.categories) : ['GENERAL'];
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
        oauth_status: account.oauth_status,
        last_synced_at: account.last_synced_at,
        sync_error: account.sync_error,
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
    minimumBudget: input.minimum_budget,
    platforms: socialAccounts.length > 0 ? socialAccounts : [{ platform: 'instagram', followers, engagementRate, username }],
    totalFollowers: followers,
    avgEngagementRate: engagementRate,
    collaborationPreferences: (
      input.collaboration_preferences?.length
        ? (input.collaboration_preferences.map((d) => d.toLowerCase()) as DealType[])
        : ['paid']
    ),
    barterTypes: (
      input.barter_types?.length
        ? (normalizeBarterTypes(input.barter_types) as BarterType[])
        : undefined
    ),
    minPrice: input.min_price,
    maxPrice: input.max_price,
    responseTime: input.response_time || 'Within 24 hours',
    isVerified: Boolean(input.is_verified),
    verificationStatus: (input.verification_status as Creator['verificationStatus']) || (input.is_verified ? 'verified' : 'unverified'),
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
  category?: string;
  description?: string;
  logo_url?: string;
  monthly_budget?: number;
  preferred_creator_categories?: string;
  business_verification_status?: string;
  plan_tier?: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  brand_rating?: number;
  brand_total_reviews?: number;
  company_size?: string;
  contact_name?: string;
  user?: {
    id?: string;
    email?: string;
    phone?: string;
    city?: string;
  };
  total_campaigns?: number;
  active_orders?: number;
}

export const mapBrand = (input: BackendBrandResponse): Brand => ({
  id: input.id,
  userId: input.user?.id || input.id,
  name: input.name || 'Brand',
  logo: input.logo_url || '',
  category: normalizeCategory(input.category) || 'GENERAL',
  website: input.website,
  city: (input.user?.city as City | null) || null,
  description: input.description || '',
  monthlyBudget: input.monthly_budget,
  preferredCreatorCategories: input.preferred_creator_categories,
  businessVerificationStatus: normalizeBrandVerificationStatus(input.business_verification_status),
  planTier: input.plan_tier,
  brandRating: input.brand_rating ?? 0,
  brandTotalReviews: input.brand_total_reviews ?? 0,
  companySize: input.company_size,
  contactName: input.contact_name,
  user: input.user ? {
    id: input.user.id || input.id,
    email: input.user.email || '',
    phone: input.user.phone,
    city: (input.user.city as City | null) || null,
  } : undefined,
  totalCampaigns: input.total_campaigns ?? 0,
  activeOrders: input.active_orders ?? 0,
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
  creator_expectations?: string;
  hybrid_cash_amount?: number;
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
  category: normalizeCategory(input.category) || 'GENERAL',
  deliverables: input.deliverables || [],
  deliveryDays: input.delivery_days || 1,
  revisions: input.revisions || 0,
  price: input.price || 0,
  dealType: normalizeDealType(input.deal_type),
  barterValue: input.barter_details,
  barterDescription: input.barter_description,
  creatorExpectations: input.creator_expectations,
  hybridCashAmount: input.hybrid_cash_amount,
  platform: normalizePlatform(input.platform),
  tags: input.tags || [],
  currency: input.currency || 'PKR',
  isFeatured: Boolean(input.is_featured),
  isPopular: Boolean(input.is_popular),
  ordersCompleted: input.orders_completed || 0,
  status: (input.status || 'draft').toLowerCase() as CreatorPackage['status'],
  thumbnail: input.cover_image || '/creator-card-fallback.svg',
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
  cancellationNote?: string;
  status?: string;
  progress?: number;
  deadlineDate?: string;
  deliveryDate?: string;
  createdAt?: string;
  deliverables?: BackendOrderDeliverableResponse[];
  barterProductReceived?: boolean;
  conversationId?: string;
  updatedAt?: string;
  hasReviewedByBrand?: boolean;
  hasReviewedByCreator?: boolean;
}

export interface BackendOrderDeliverableResponse {
  id: string;
  order_id: string;
  name?: string;
  status?: string;
  file_url?: string;
  submitted_at?: string;
  revision_note?: string;
  created_at?: string;
}

export const normalizeDeliverableStatus = (value?: string | null): OrderDeliverable['status'] => {
  const lowered = (value || '').toLowerCase();
  if (lowered === 'in_progress' || lowered === 'completed' || lowered === 'revision' || lowered === 'review' || lowered === 'approved') {
    return lowered;
  }
  return 'pending';
};

export const mapOrderDeliverable = (input: BackendOrderDeliverableResponse): OrderDeliverable => ({
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
    collaborationPreferences: ['paid'],
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
    category: 'GENERAL',
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
    cancellationNote: input.cancellationNote,
    status: (input.status || 'pending').toLowerCase() as Order['status'],
    progress: input.progress,
    deliverables: input.deliverables?.map(mapOrderDeliverable) || [],
    createdAt: safeDate(input.createdAt),
    updatedAt: safeDate(input.updatedAt || input.createdAt),
    deadlineDate: input.deadlineDate ? safeDate(input.deadlineDate) : undefined,
    deliveryDate: input.deliveryDate ? safeDate(input.deliveryDate) : undefined,
    barterProductReceived: Boolean(input.barterProductReceived),
    conversationId: input.conversationId,
    hasReviewedByBrand: Boolean(input.hasReviewedByBrand),
    hasReviewedByCreator: Boolean(input.hasReviewedByCreator),
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
  attachmentOriginalName?: string;
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
  attachmentOriginalName: input.attachmentOriginalName,
  offer: mapOfferFromMessage(input),
  isRead: Boolean(input.isRead),
  createdAt: safeDate(input.createdAt),
});

interface BackendConversationResponse {
  id: string;
  creatorId: string;
  brandId: string;
  contextType?: string;
  contextId?: string;
  contextLabel?: string;
  contextTitle?: string;
  contextStatus?: string;
  contextAmount?: number;
  contextDeadlineDate?: string;
  unreadCountCreator?: number;
  unreadCountBrand?: number;
  lastMessage?: string;
  updatedAt?: string;
  creatorOnline?: boolean;
  creatorLastSeenAt?: string;
  brandOnline?: boolean;
  brandLastSeenAt?: string;
  blockedByMe?: boolean;
  blockedByThem?: boolean;
}

export const mapConversation = (
  input: BackendConversationResponse,
  creatorMap: Record<string, Creator>,
  brandMap: Record<string, Brand>,
  viewerRole?: 'creator' | 'brand',
): Conversation => {
  const creator = creatorMap[input.creatorId];
  const brand = brandMap[input.brandId];
  const contextType = (input.contextType || 'general').toLowerCase() as Conversation['contextType'];
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
      collaborationPreferences: ['paid'],
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
      category: 'GENERAL',
      city: null,
      description: '',
      totalCampaigns: 0,
      activeOrders: 0,
    },
    contextType,
    contextId: input.contextId,
    contextLabel: input.contextLabel,
    contextTitle: input.contextTitle,
    contextStatus: input.contextStatus,
    contextAmount: input.contextAmount,
    contextDeadlineDate: input.contextDeadlineDate ? safeDate(input.contextDeadlineDate) : undefined,
    creatorOnline: Boolean(input.creatorOnline),
    creatorLastSeenAt: input.creatorLastSeenAt ? safeDate(input.creatorLastSeenAt) : undefined,
    brandOnline: Boolean(input.brandOnline),
    brandLastSeenAt: input.brandLastSeenAt ? safeDate(input.brandLastSeenAt) : undefined,
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
    blockedByMe: Boolean(input.blockedByMe),
    blockedByThem: Boolean(input.blockedByThem),
    updatedAt: safeDate(input.updatedAt),
  };
};
