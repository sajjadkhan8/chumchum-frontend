// User & Auth Types
export type UserRole = 'creator' | 'brand' | 'platform_admin' | 'support' | 'finance_ops';

export interface User {
  id: string;
  email: string;
  emailVerified?: boolean;
  phone?: string;
  role: UserRole;
  name: string;
  avatar?: string;
  creatorProgramStatus?: 'none' | 'in_path' | 'active_ambassador';
  active?: boolean;
  mfaEnabled?: boolean;
  createdAt: Date;
}

export type BrandVerificationStatus = 'unverified' | 'pending' | 'under_review' | 'verified' | 'rejected';
export type CreatorVerificationStatus = 'unverified' | 'pending' | 'under_review' | 'verified' | 'rejected';

// Creator Types
export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'snapchat';
export type DealType = 'paid' | 'barter' | 'hybrid';
export type CollaborationPreference = DealType;
export type CreatorBadgeLevel = 'none' | 'verified' | 'rising_star' | 'pro' | 'elite';
export type BarterType =
  | 'FOOD'
  | 'FASHION'
  | 'BEAUTY'
  | 'TECH'
  | 'FITNESS'
  | 'HEALTH'
  | 'TRAVEL'
  | 'LIFESTYLE'
  | 'GAMING'
  | 'EDUCATION'
  | 'ENTERTAINMENT'
  | 'BUSINESS_FINANCE'
  | 'HOME_DECOR'
  | 'PARENTING_FAMILY'
  | 'SPORTS'
  | 'AUTOMOTIVE'
  | 'RELIGIOUS_SPIRITUAL'
  | 'GENERAL';
export type City = string;

export type VerificationSource = 'SELF' | 'PLATFORM_REVIEWED' | 'API_CONNECTED';

export interface SocialStats {
  platform: Platform;
  followers: number;
  engagementRate: number;
  username: string;
  profileUrl?: string;
  avgViews?: number;
  verified_by?: VerificationSource;
  oauth_status?: string;
  last_synced_at?: string;
  sync_error?: string;
}

export type BarterCategory = BarterType;

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
  city: City | null;
  categories: string[];
  languages?: string[];
  website?: string;
  availabilityStatus?: string;
  isFiler?: boolean;
  minimumBudget?: number;
  platforms: SocialStats[];
  totalFollowers: number;
  avgEngagementRate: number;
  collaborationPreferences: CollaborationPreference[];
  barterTypes?: BarterType[];
  minPrice?: number;
  maxPrice?: number;
  responseTime: string;
  isVerified: boolean;
  verificationStatus?: CreatorVerificationStatus;
  badgeLevel?: CreatorBadgeLevel;
  isTrending: boolean;
  isFastResponder: boolean;
  activeOrderCount?: number;
  rating: number;
  totalReviews: number;
  completedDeals: number;
  completionRate?: number;
  repeatClients?: number;
  rateCardReel?: number;
  rateCardStory?: number;
  rateCardPost?: number;
  rateCardVideo?: number;
  contentPreviews: ContentPreview[];
  createdAt: Date;
}

export interface ContentPreview {
  id: string;
  type: 'image' | 'video';
  thumbnail: string;
  url: string;
  platform: Platform;
  title?: string;
  views?: number;
  likes?: number;
}

// Package Types
export interface Package {
  id: string;
  creatorId: string;
  title: string;
  category: string;
  description: string;
  deliverables: string[];
  deliveryDays: number;
  revisions?: number;
  price: number;
  currency?: string;  // V1: Always PKR
  dealType: DealType;
  barterValue?: string;
  barterDescription?: string;
  creatorExpectations?: string;
  hybridCashAmount?: number;
  platform: Platform;
  tags: string[];
  isPopular: boolean;
  isFeatured?: boolean;
  ordersCompleted: number;
}

export type PackageStatus = 'active' | 'draft' | 'paused' | 'archived';

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
  thumbnail: string;
  mediaUrls?: string[];
  visibility: 'public' | 'private';
  tags: string[];
  analytics: PackageAnalytics;
}

// Order Types
export type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'review' | 'revision' | 'completed' | 'cancelled';
export type DeliverableStatus = 'pending' | 'in_progress' | 'completed' | 'revision' | 'review' | 'approved';

export interface OrderDeliverable {
  id: string;
  orderId: string;
  name: string;
  status: DeliverableStatus;
  fileUrl?: string;
  submittedAt?: Date;
  revisionNote?: string;
  createdAt?: Date;
}

export interface Order {
  id: string;
  orderNumber?: string;
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
  cancellationNote?: string;
  status: OrderStatus;
  progress?: number;
  deliverables: OrderDeliverable[];
  createdAt: Date;
  updatedAt: Date;
  deadlineDate?: Date;
  deliveryDate?: Date;
  barterProductReceived?: boolean;
  conversationId?: string;
  hasReviewedByBrand?: boolean;
  hasReviewedByCreator?: boolean;
}

// Brand Types
export interface Brand {
  id: string;
  userId: string;
  name: string;
  logo: string;
  category: string;
  website?: string;
  city: City | null;
  description: string;
  monthlyBudget?: number;
  preferredCreatorCategories?: string;
  businessVerificationStatus?: BrandVerificationStatus;
  planTier?: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  totalCampaigns: number;
  activeOrders: number;
  brandRating: number;
  brandTotalReviews: number;
  companySize?: string;
  contactName?: string;
  user?: Pick<User, 'id' | 'email' | 'phone'> & { city?: City | null };
}

export type BrandCampaignStatus = 'draft' | 'published' | 'paused' | 'closed' | 'archived';
export type BrandCampaignReactionType = 'interested' | 'proposal' | 'question' | 'decline';
export type BrandCampaignReactionStatus = 'submitted' | 'shortlisted' | 'in_review' | 'accepted' | 'rejected' | 'withdrawn';

export interface BrandCampaign {
   id: string;
   brandId: string;
   brandName: string;
   title: string;
   brief: string;
   offerType: string;
   budgetMin: number;
   budgetMax: number;
   currency: string;
   budgetType?: string;
   paymentStructure?: string;
   barterProductDesc?: string;
   barterEstimatedValue?: number;
   travelCostsCovered?: boolean;
   deliverables?: string;
   contentFormats?: string;
   targetPlatforms?: string;
   campaignGoal?: string;
   categories?: string;
   referenceUrls?: string;
   keyMessage?: string;
   dosAndDonts?: string;
   hashtagsMentions?: string;
   usageRights?: string;
   termsAndConditions?: string;
   expectedOutcomes?: string;
   coverImageUrl?: string;
   deadlineDate?: string;
   locationTargetingMode?: 'nationwide' | 'region' | 'cities' | 'remote_only';
   targetCities?: string;
   targetRegion?: string;
   targetCity?: string;
   targetLanguage?: string;
   visibility?: 'public' | 'private';
   // Control tab fields
   creatorType?: string;
   followerRange?: string;
   creatorGenderPreference?: string;
   minAge?: number;
   maxAge?: number;
   applicationType?: string;
   maxApplicants?: number;
   proposalRequired?: boolean;
   portfolioRequired?: boolean;
   customScreeningQuestions?: string;
   contentSubmissionDeadline?: string;
   goLiveDate?: string;
   campaignDuration?: number;
   minProposedPrice?: number;
   status: BrandCampaignStatus;
   publishedAt?: Date;
   closedAt?: Date;
   createdAt: Date;
   updatedAt: Date;
   reactionCount: number;
 }

export interface BrandCampaignReaction {
  id: string;
  campaignId: string;
  campaignTitle?: string;
  brandName?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  reactionType: BrandCampaignReactionType;
  status: BrandCampaignReactionStatus;
  message?: string;
  proposedPrice?: number;
  proposedCurrency?: string;
  proposedDeliveryDays?: number;
  brandNote?: string;
  creatorNote?: string;
  orderId?: string;
  createdAt: Date;
  updatedAt: Date;
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
  attachmentOriginalName?: string;
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
  contextType: 'general' | 'order' | 'dispute' | 'campaign' | 'offer' | 'payment';
  contextId?: string;
  contextLabel?: string;
  contextTitle?: string;
  contextStatus?: string;
  contextAmount?: number;
  contextDeadlineDate?: Date;
  creatorOnline?: boolean;
  creatorLastSeenAt?: Date;
  brandOnline?: boolean;
  brandLastSeenAt?: Date;
  lastMessage?: Message;
  unreadCount: number;
  blockedByMe?: boolean;
  blockedByThem?: boolean;
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
  reviewerType: 'brand' | 'creator';
  rating: number;
  comment: string;
  createdAt: Date;
}

// Filter Types
export interface CreatorFilters {
  search?: string;
  categories?: string[];
  languages?: string[];
  platforms?: Platform[];
  cities?: City[];
  collaborationPreferences?: CollaborationPreference[];
  barterTypes?: BarterType[];
  minFollowers?: number;
  maxFollowers?: number;
  minRating?: number;
  minReviews?: number;
  minPrice?: number;
  maxPrice?: number;
  badgeLevel?: CreatorBadgeLevel;
  availabilityStatus?: 'available' | 'busy';
  ambassadorOnly?: boolean;
  isTrending?: boolean;
  isFastResponder?: boolean;
  minEngagementRate?: number;
  minCompletionRate?: number;
  maxRateCardReel?: number;
  maxRateCardStory?: number;
  maxRateCardPost?: number;
  maxRateCardVideo?: number;
  sortBy?: 'trending' | 'budget_friendly' | 'budget_high' | 'top_rated' | 'by_city';
  page?: number;
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
