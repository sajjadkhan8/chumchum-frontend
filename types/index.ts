// User & Auth Types
export type UserRole = 'creator' | 'brand' | 'platform_admin';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  name: string;
  avatar?: string;
  creatorProgramStatus?: 'none' | 'in_path' | 'active_ambassador';
  active?: boolean;
  createdAt: Date;
}

// Creator Types
export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'snapchat';
export type DealType = 'paid' | 'barter' | 'hybrid';
export type CreatorBadgeLevel = 'none' | 'verified' | 'rising_star' | 'pro' | 'elite';
export type BarterType = 'food' | 'hotel' | 'salon' | 'events' | 'products';
export type City = 'Karachi' | 'Lahore' | 'Islamabad' | 'Rawalpindi' | 'Faisalabad' | 'Multan' | 'Peshawar';

export interface SocialStats {
  platform: Platform;
  followers: number;
  engagementRate: number;
  username: string;
  profileUrl?: string;
  avgViews?: number;
}

export type BarterCategory = BarterType | 'services' | 'travel' | 'education';

export interface Creator {
  id: string;
  userId: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  city: City;
  categories: string[];
  languages?: string[];
  website?: string;
  niche?: string;
  availabilityStatus?: string;
  acceptsBarter?: boolean;
  acceptsHybridDeals?: boolean;
  preferredIndustries?: string;
  minimumBudget?: number;
  platforms: SocialStats[];
  totalFollowers: number;
  avgEngagementRate: number;
  dealTypes: DealType[];
  barterTypes?: BarterType[];
  minPrice?: number;
  maxPrice?: number;
  responseTime: string;
  isVerified: boolean;
  badgeLevel?: CreatorBadgeLevel;
  isTrending: boolean;
  isFastResponder: boolean;
  rating: number;
  totalReviews: number;
  completedDeals: number;
  contentPreviews: ContentPreview[];
  createdAt: Date;
}

export interface ContentPreview {
  id: string;
  type: 'image' | 'video';
  thumbnail: string;
  url: string;
  platform: Platform;
  views?: number;
  likes?: number;
}

// Package Types
export interface Package {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  deliverables: string[];
  deliveryDays: number;
  revisions?: number;
  price: number;
  dealType: DealType;
  barterValue?: string;
  barterDescription?: string;
  barterCategory?: BarterCategory;
  estimatedBarterValue?: number;
  creatorExpectations?: string;
  hybridCashAmount?: number;
  hybridBarterValue?: number;
  platform: Platform;
  tags: string[];
  isPopular: boolean;
  isFeatured?: boolean;
  currency?: string;
  ordersCompleted: number;
}

export type PackageStatus = 'active' | 'draft' | 'paused' | 'archived' | 'under_review';

export interface PackageAnalytics {
  views: number;
  clicks: number;
  inquiries: number;
  conversionRate: number;
  completionRate: number;
  repeatBrands: number;
  engagementPerformance: number;
}

export interface CreatorPackage extends Package {
  shortDescription: string;
  fullDescription: string;
  category: string;
  status: PackageStatus;
  responseTime: string;
  thumbnail: string;
  mediaUrls?: string[];
  visibility: 'public' | 'private';
  tags: string[];
  analytics: PackageAnalytics;
}

// Order Types
export type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'review' | 'revision' | 'completed' | 'cancelled';
export type DeliverableStatus = 'pending' | 'in_progress' | 'completed' | 'revision' | 'review';

export interface OrderDeliverable {
  id: string;
  orderId: string;
  name: string;
  status: DeliverableStatus;
  fileUrl?: string;
  submittedAt?: Date;
  createdAt?: Date;
}

export interface Order {
  id: string;
  packageId: string;
  package: Package;
  creatorId: string;
  creator: Creator;
  brandId: string;
  brand: Brand;
  dealType: DealType;
  amount?: number;
  barterDetails?: string;
  message: string;
  status: OrderStatus;
  progress?: number;
  deliverables: OrderDeliverable[];
  createdAt: Date;
  updatedAt: Date;
  deadlineDate?: Date;
  deliveryDate?: Date;
}

// Brand Types
export interface Brand {
  id: string;
  userId: string;
  name: string;
  logo: string;
  industry: string;
  website?: string;
  city: City;
  description: string;
  monthlyBudget?: number;
  preferredCreatorCategories?: string;
  targetCities?: string;
  targetPlatforms?: string;
  campaignBudgetRange?: string;
  businessVerificationStatus?: string;
  verificationContactEmail?: string;
  verificationPhoneNumber?: string;
  totalCampaigns: number;
  activeOrders: number;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: UserRole;
  content: string;
  type: 'text' | 'offer' | 'attachment' | 'system';
  attachmentUrl?: string;
  offer?: QuickDealOffer;
  isRead: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  creatorId: string;
  creator: Creator;
  brandId: string;
  brand: Brand;
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
}

export interface QuickDealOffer {
  id?: string;
  dealType: DealType;
  amount?: number;
  barterDetails?: string;
  creatorExpectation?: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  orderId?: string;
}

// Review Types
export interface Review {
  id: string;
  creatorId: string;
  brandId: string;
  brand: Brand;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

// Filter Types
export interface CreatorFilters {
  search?: string;
  categories?: string[];
  platforms?: Platform[];
  cities?: City[];
  dealTypes?: DealType[];
  barterTypes?: BarterType[];
  minFollowers?: number;
  maxFollowers?: number;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'trending' | 'budget_friendly' | 'top_rated' | 'near_you';
}

// Earnings Types
export interface EarningsStats {
  available: number;
  pending: number;
  totalEarned: number;
  thisMonth: number;
  lastMonth: number;
  monthlyData: MonthlyEarning[];
}

export interface MonthlyEarning {
  month: string;
  amount: number;
}

// Dashboard Stats
export interface CreatorDashboardStats {
  totalEarnings: number;
  activeOrders: number;
  completedOrders: number;
  totalViews: number;
  avgRating: number;
  newMessages: number;
}

export interface BrandDashboardStats {
  activeCampaigns: number;
  totalSpent: number;
  creatorsHired: number;
  pendingOrders: number;
  savedCreators: number;
}

// Brand Ambassador Types (Platform-Owned)
export type AmbassadorStatus = 'approved' | 'pending_review' | 'rejected' | 'under_review' | 'suspended';
export type AmbassadorApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'verified' | 'approved' | 'rejected';

export interface AmbassadorEligibilityRequirements {
  minFollowers: number;
  minEngagementRate: number;
  minRating: number;
  verificationSteps: string[];
}

export interface AmbassadorApplication {
  id: string;
  creatorId: string;
  creator: Creator;
  status: AmbassadorApplicationStatus;
  submittedAt: Date;
  updatedAt: Date;
  verificationSteps: {
    identityVerified: boolean;
    engagementVerified: boolean;
    contentReviewPassed: boolean;
    backgroundCheckPassed: boolean;
  };
  notes?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface PlatformAmbassador extends Creator {
  ambassadorStatus: AmbassadorStatus;
  commissionPercentage: number; // Platform takes 15% of ambassador earnings
  monthlyBase?: number; // Optional minimum monthly guarantee
  ambassadorSince: Date;
  performanceScore: number;
  isExclusive: boolean; // Cannot work with competing brands
}

// Platform commission structure
export interface CommissionStructure {
  independentCreatorCommission: number; // 10% for independent creators
  platformAmbassadorCommission: number; // 15% for platform ambassadors
  processedAt: Date;
}

// Enhanced Ambassador Scoring & Tiers
export type AmbassadorTier = 'rising_creator' | 'emerging_ambassador' | 'verified_ambassador' | 'elite_ambassador';

export interface AmbassadorScore {
  total: number; // 0-100
  deliveryScore: number; // 0-35 (weight: high)
  accountAgeScore: number; // 0-15 (stability)
  ratingScore: number; // 0-25 (quality)
  cancellationScore: number; // 0-10 (penalty factor)
  profileCompletenessScore: number; // 0-10 (trust)
  consistencyScore: number; // 0-5 (engagement)
}

export interface AmbassadorTierInfo {
  tier: AmbassadorTier;
  name: string;
  description: string;
  scoreRange: [number, number]; // [min, max]
  icon: string;
  color: string;
  benefits: string[];
  nextMilestone?: number; // Points needed to next tier
}

export interface CreatorAmbassadorMetrics {
  creatorId: string;
  score: AmbassadorScore;
  tier: AmbassadorTier;
  percentileRank: number; // 0-100, where they rank vs other creators
  strengths: string[]; // What they're doing well
  improvements: string[]; // What they could improve
  journeyMilestones: {
    joinedPlatform: Date;
    firstDelivery?: Date;
    consistencyAchieved?: Date; // 30+ days of activity
    ambassadorEligible?: Date; // When they hit 70+ score
  };
}
