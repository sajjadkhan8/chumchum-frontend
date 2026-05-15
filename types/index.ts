// User & Auth Types
export type UserRole = 'creator' | 'brand';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  name: string;
  avatar?: string;
  createdAt: Date;
}

// Creator Types
export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'snapchat';
export type DealType = 'paid' | 'barter' | 'hybrid';
export type BarterType = 'food' | 'hotel' | 'salon' | 'events' | 'products';
export type City = 'Lahore' | 'Karachi' | 'Islamabad' | 'Rawalpindi' | 'Faisalabad';

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
  avatar: string;
  coverImage?: string;
  bio: string;
  city: City;
  categories: string[];
  platforms: SocialStats[];
  totalFollowers: number;
  avgEngagementRate: number;
  dealTypes: DealType[];
  barterTypes?: BarterType[];
  minPrice?: number;
  maxPrice?: number;
  responseTime: string;
  isVerified: boolean;
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
  ordersCompleted: number;
}

// Order Types
export type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'completed' | 'cancelled';

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
  createdAt: Date;
  updatedAt: Date;
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
  type: 'text' | 'offer' | 'system';
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
  dealType: DealType;
  amount?: number;
  barterDetails?: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
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
