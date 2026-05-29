import type {
  Brand,
  City,
  Conversation,
  Creator,
  CreatorPackage,
  DealType,
  Message,
  Order,
  Package,
  PackageAnalytics,
  Platform,
  QuickDealOffer,
  User,
  UserRole,
} from '@/types';

const DEFAULT_CITY: City = 'Riyadh';

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
  return lowered === 'brand' ? 'brand' : 'creator';
};

interface BackendUser {
  id: string;
  email?: string;
  phone?: string;
  role?: string;
  name?: string;
  avatarUrl?: string;
  creatorProgramStatus?: User['creatorProgramStatus'];
  createdAt?: string;
}

export const mapUser = (input: BackendUser): User => ({
  id: input.id,
  email: input.email || '',
  phone: input.phone,
  role: normalizeRole(input.role),
  name: input.name || 'User',
  avatar: input.avatarUrl,
  creatorProgramStatus: input.creatorProgramStatus || 'none',
  createdAt: safeDate(input.createdAt),
});

interface BackendCreatorResponse {
  id: string;
  bio?: string;
  category?: string;
  tiktok_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  facebook_url?: string;
  followers?: number;
  avg_views?: number;
  engagement_rate?: number;
  rating?: number;
  total_reviews?: number;
  user?: {
    id?: string;
    username?: string;
    image?: string;
    city?: string;
    email?: string;
    phone?: string;
  };
  created_at?: string;
}

export const mapCreator = (input: BackendCreatorResponse): Creator => {
  const username = input.user?.username || `creator-${input.id.slice(0, 8)}`;
  const avatar = input.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  const followers = input.followers || 0;
  const engagementRate = input.engagement_rate || 0;
  const category = input.category || 'General';

  const platforms = [
    { key: 'instagram', url: input.instagram_url },
    { key: 'tiktok', url: input.tiktok_url },
    { key: 'youtube', url: input.youtube_url },
    { key: 'facebook', url: input.facebook_url },
  ]
    .filter((entry) => Boolean(entry.url))
    .map((entry) => ({
      platform: normalizePlatform(entry.key),
      followers,
      engagementRate,
      username,
      profileUrl: entry.url,
      avgViews: input.avg_views || 0,
    }));

  return {
    id: input.id,
    userId: input.user?.id || input.id,
    username,
    name: input.user?.username || username,
    avatar,
    coverImage: avatar,
    bio: input.bio || '',
    city: (input.user?.city as City) || DEFAULT_CITY,
    categories: [category],
    platforms: platforms.length > 0 ? platforms : [{ platform: 'instagram', followers, engagementRate, username }],
    totalFollowers: followers,
    avgEngagementRate: engagementRate,
    dealTypes: ['paid', 'barter', 'hybrid'],
    barterTypes: ['products'],
    minPrice: 1000,
    maxPrice: 10000,
    responseTime: 'Within 24 hours',
    isVerified: (input.rating || 0) >= 4,
    isTrending: false,
    isFastResponder: false,
    rating: input.rating || 0,
    totalReviews: input.total_reviews || 0,
    completedDeals: 0,
    contentPreviews: [],
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
  city: (input.user?.city as City) || DEFAULT_CITY,
  description: input.description || '',
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
  is_popular?: boolean;
  orders_completed?: number;
  status?: string;
  response_time?: string;
  cover_image?: string;
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
  isPopular: Boolean(input.is_popular),
  ordersCompleted: input.orders_completed || 0,
  status: (input.status || 'draft').toLowerCase() as CreatorPackage['status'],
  responseTime: input.response_time || 'Within 24 hours',
  thumbnail: input.cover_image || '',
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
  deliveryDate?: string;
  createdAt?: string;
}

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
    city: DEFAULT_CITY,
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
    city: DEFAULT_CITY,
    description: '',
    totalCampaigns: 0,
    activeOrders: 0,
  };

  return {
    id: input.id,
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
    createdAt: safeDate(input.createdAt),
    updatedAt: safeDate(input.createdAt),
    deliveryDate: input.deliveryDate ? safeDate(input.deliveryDate) : undefined,
  };
};

interface BackendMessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  type: string;
  content?: string;
  isRead?: boolean;
  offerDealType?: string;
  offerAmount?: number;
  offerBarterDetails?: string;
  offerStatus?: string;
  createdAt?: string;
}

const mapOfferFromMessage = (input: BackendMessageResponse): QuickDealOffer | undefined => {
  if (input.type !== 'offer') return undefined;

  return {
    dealType: normalizeDealType(input.offerDealType),
    amount: input.offerAmount,
    barterDetails: input.offerBarterDetails,
    message: input.content || '',
    status: (input.offerStatus || 'pending').toLowerCase() as QuickDealOffer['status'],
  };
};

export const mapMessage = (input: BackendMessageResponse): Message => ({
  id: input.id,
  conversationId: input.conversationId,
  senderId: input.senderId,
  senderType: normalizeRole(input.senderType),
  content: input.content || '',
  type: (input.type || 'text').toLowerCase() as Message['type'],
  offer: mapOfferFromMessage(input),
  isRead: Boolean(input.isRead),
  createdAt: safeDate(input.createdAt),
});

interface BackendConversationResponse {
  id: string;
  creatorId: string;
  brandId: string;
  readByCreator?: boolean;
  readByBrand?: boolean;
  lastMessage?: string;
  updatedAt?: string;
}

export const mapConversation = (
  input: BackendConversationResponse,
  creatorMap: Record<string, Creator>,
  brandMap: Record<string, Brand>,
): Conversation => {
  const creator = creatorMap[input.creatorId];
  const brand = brandMap[input.brandId];

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
      city: DEFAULT_CITY,
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
      city: DEFAULT_CITY,
      description: '',
      totalCampaigns: 0,
      activeOrders: 0,
    },
    lastMessage: input.lastMessage
      ? {
          id: `${input.id}-last`,
          conversationId: input.id,
          senderId: input.readByCreator ? input.brandId : input.creatorId,
          senderType: input.readByCreator ? 'brand' : 'creator',
          type: 'text',
          content: input.lastMessage,
          isRead: Boolean(input.readByCreator || input.readByBrand),
          createdAt: safeDate(input.updatedAt),
        }
      : undefined,
    unreadCount: input.readByCreator && input.readByBrand ? 0 : 1,
    updatedAt: safeDate(input.updatedAt),
  };
};

