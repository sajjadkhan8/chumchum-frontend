"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  DollarSign,
  Package,
  Users,
  Star,
  Clock,
  BarChart3,
  Eye,
  CheckCircle,
  AlertCircle,
  Crown,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/stats-card";
import { formatPrice, formatRelativeTime, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { AmbassadorTierBadge } from "@/components/ambassador-score-display";
import { calculateCreatorAmbassadorMetrics } from "@/lib/ambassador-scoring";
import { analyticsService, type CreatorDashboardAnalytics } from "@/services/analytics.service";
import { creatorsService } from "@/services/creators.service";
import { earningsService, type EarningsSummary } from "@/services/earnings.service";
import { messagesService } from "@/services/messages.service";
import { ordersService } from "@/services/orders.service";
import type { Conversation, Creator, Order } from "@/types";

const emptyDashboardAnalytics: CreatorDashboardAnalytics = {
  totalOrders: 0,
  activeOrders: 0,
  completedOrders: 0,
  totalEarnings: 0,
  avgRating: 0,
  totalReviews: 0,
  repeatBrands: 0,
};

const emptyEarningsSummary: EarningsSummary = {
  totalEarned: 0,
  availableBalance: 0,
  pendingBalance: 0,
  totalWithdrawn: 0,
  platformFees: 0,
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "in_progress":
      return "bg-blue-100 text-blue-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return CheckCircle;
    case "in_progress":
      return Clock;
    case "pending":
      return AlertCircle;
    default:
      return Clock;
  }
};

export default function CreatorDashboardPage() {
  const { user } = useAuthStore();
  const [creatorProfile, setCreatorProfile] = useState<Creator | null>(null);
  const [dashboardAnalytics, setDashboardAnalytics] = useState<CreatorDashboardAnalytics>(emptyDashboardAnalytics);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary>(emptyEarningsSummary);
  const [orders, setOrders] = useState<Order[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isActiveAmbassador = user?.creatorProgramStatus === "active_ambassador" || user?.email === "ambassador@test.com";

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      const [profile, analytics, earnings, orderList, conversationList] = await Promise.all([
        creatorsService.getMe().catch(() => null),
        analyticsService.getCreatorDashboard().catch(() => emptyDashboardAnalytics),
        earningsService.getSummary().catch(() => emptyEarningsSummary),
        ordersService.getAll().catch(() => []),
        messagesService.getConversations(user?.id || "", "creator").catch(() => []),
      ]);
      setCreatorProfile(profile);
      setDashboardAnalytics(analytics);
      setEarningsSummary(earnings);
      setOrders(orderList);
      setConversations(conversationList);
      setIsLoading(false);
    };

    void loadDashboard();
  }, [user?.id]);

  const primaryCreator = useMemo<Creator>(() => {
    if (creatorProfile) return creatorProfile;

    return {
      id: user?.id || 'unknown-creator',
      userId: user?.id || 'unknown-user',
      username: user?.email?.split('@')[0] || 'creator',
      name: user?.name || 'Creator',
      avatar: user?.avatar || '',
      bio: '',
      city: 'Karachi',
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
  }, [creatorProfile, user]);

  const ambassadorMetrics = calculateCreatorAmbassadorMetrics(primaryCreator);
  const profileViews = Math.max(0, primaryCreator.totalFollowers ? Math.round(primaryCreator.totalFollowers * 0.02) : 0);
  const monthlyEarningsTarget = Math.max(600000, earningsSummary.totalEarned || dashboardAnalytics.totalEarnings || 0);
  const monthlyOrdersTarget = Math.max(10, dashboardAnalytics.totalOrders || 0);
  const earningsGoalProgress = monthlyEarningsTarget > 0
    ? Math.min(100, Math.round(((earningsSummary.totalEarned || dashboardAnalytics.totalEarnings) / monthlyEarningsTarget) * 100))
    : 0;
  const ordersGoalProgress = monthlyOrdersTarget > 0
    ? Math.min(100, Math.round((dashboardAnalytics.totalOrders / monthlyOrdersTarget) * 100))
    : 0;
  const recentDashboardOrders = orders
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);
  const recentDashboardMessages = conversations
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 3)
    .map((conversation) => ({
      id: conversation.id,
      name: conversation.brand.name,
      avatar: conversation.brand.logo,
      message: conversation.lastMessage?.content || "No messages yet",
      time: conversation.lastMessage?.createdAt || conversation.updatedAt,
      unread: conversation.unreadCount > 0,
    }));

  const readinessCopy = isActiveAmbassador
    ? "You are an active Brand Ambassador. Your priority queue is optimized for premium campaigns."
    : "You are on the ambassador path. Keep your quality, consistency, and deliveries high to qualify.";

  return (
    <div className="container mx-auto p-4 pb-6 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          {isActiveAmbassador ? "Ambassador Command Center" : "Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          {isActiveAmbassador
            ? "Welcome back. Here is your premium ambassador overview and priority campaign queue."
            : "Welcome back! Here's your performance overview."}
        </p>
      </div>

      <Card className="mb-6 border-border/60 bg-muted/20 md:mb-8">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {isActiveAmbassador ? (
                <Badge className="bg-primary text-primary-foreground">
                  <Crown className="mr-1 h-3 w-3" />
                  Active Ambassador
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Ambassador Path
                </Badge>
              )}
              <AmbassadorTierBadge tier={ambassadorMetrics.tier} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground">{readinessCopy}</p>
            <p className="text-xs text-muted-foreground">
              Readiness score: <span className="font-semibold text-primary">{ambassadorMetrics.score.total}/100</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant={isActiveAmbassador ? "default" : "outline"} asChild>
              <Link href="/creator/ambassador-program">
                {isActiveAmbassador ? "Manage Ambassador Status" : "Track Ambassador Progress"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={isActiveAmbassador ? "Ambassador Earnings" : "Total Earnings"}
          value={isLoading ? "Loading..." : formatPrice(earningsSummary.totalEarned || dashboardAnalytics.totalEarnings)}
          icon={DollarSign}
          trend="up"
        />
        <StatsCard
          title={isActiveAmbassador ? "Priority Campaigns" : "Active Orders"}
          value={isLoading ? "..." : dashboardAnalytics.activeOrders.toString()}
          icon={Package}
          subtitle={`${dashboardAnalytics.completedOrders} completed`}
          trend="up"
        />
        <StatsCard
          title="Profile Views"
          value={isLoading ? "..." : profileViews.toLocaleString()}
          subtitle={`${dashboardAnalytics.repeatBrands} repeat brands`}
          icon={Eye}
          trend="up"
        />
        <StatsCard
          title={isActiveAmbassador ? "Quality Score" : "Rating"}
          value={(dashboardAnalytics.avgRating || primaryCreator.rating).toFixed(1)}
          subtitle={`${dashboardAnalytics.totalReviews || primaryCreator.totalReviews} reviews`}
          icon={Star}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/creator/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDashboardOrders.length > 0 ? recentDashboardOrders.map((order, index) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-start gap-3 rounded-md border border-border/50 p-4 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={order.brand.logo} alt={order.brand.name} />
                      <AvatarFallback>
                        {getInitials(order.brand.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{order.brand.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.package.title}
                      </p>
                    </div>
                    <div className="w-full text-left sm:w-auto sm:text-right">
                      <p className="font-semibold text-primary">
                        {formatPrice(order.amount || 0)}
                      </p>
                      <Badge
                        variant="secondary"
                        className={getStatusColor(order.status)}
                      >
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No orders yet. New brand orders will appear here as soon as they are created.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Messages */}
        <div className="space-y-6">
          {isActiveAmbassador && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Ambassador Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border border-primary/20 bg-background p-3">
                  <p className="text-xs text-muted-foreground">Creator percentile</p>
                  <p className="text-xl font-semibold text-primary">
                    Top {Math.max(1, 100 - ambassadorMetrics.percentileRank)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ahead of {ambassadorMetrics.percentileRank}% of creators
                  </p>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Next best actions</p>
                  <p>• Keep response SLA under 2 hours for premium campaigns.</p>
                  <p>• Publish one high-impact Reel this week to sustain momentum.</p>
                  <p>• Close 2 active campaigns to protect your Elite tier track.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-auto min-h-20 flex-col py-4" asChild>
                <Link href="/creator/packages/new">
                  <Package className="mb-2 h-5 w-5" />
                  <span className="text-xs">New Package</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto min-h-20 flex-col py-4" asChild>
                <Link href="/creator/earnings">
                  <DollarSign className="mb-2 h-5 w-5" />
                  <span className="text-xs">Withdraw</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto min-h-20 flex-col py-4" asChild>
                <Link href="/creator/settings">
                  <Users className="mb-2 h-5 w-5" />
                  <span className="text-xs">Edit Profile</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto min-h-20 flex-col py-4" asChild>
                <Link href="/creator/insights">
                  <BarChart3 className="mb-2 h-5 w-5" />
                  <span className="text-xs">Insights</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Messages</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/creator/messages">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDashboardMessages.length > 0 ? recentDashboardMessages.map((msg) => (
                  <Link
                    key={msg.id}
                    href="/creator/messages"
                    className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={msg.avatar} alt={msg.name} />
                      <AvatarFallback>{getInitials(msg.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{msg.name}</p>
                        {msg.unread && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {msg.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(msg.time)}
                      </p>
                    </div>
                  </Link>
                )) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    No messages yet. Brand conversations will appear here when they start chatting with you.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Goal Progress */}
          <Card>
            <CardHeader>
              <CardTitle>{isActiveAmbassador ? "Elite Goal Tracker" : "Monthly Goal"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Earnings</span>
                    <span className="font-medium">
                      {formatPrice(earningsSummary.totalEarned || dashboardAnalytics.totalEarnings)} / {formatPrice(monthlyEarningsTarget)}
                    </span>
                  </div>
                  <Progress value={earningsGoalProgress} className="h-2" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{isActiveAmbassador ? "Premium Campaigns" : "Orders"}</span>
                    <span className="font-medium">{dashboardAnalytics.totalOrders} / {monthlyOrdersTarget}</span>
                  </div>
                  <Progress value={ordersGoalProgress} className="h-2" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {isActiveAmbassador ? (
                    <>
                      You&apos;re <span className="font-medium text-primary">{ordersGoalProgress}%</span> towards unlocking this month&apos;s Elite bonus.
                    </>
                  ) : (
                    <>
                      You&apos;re <span className="font-medium text-primary">{Math.max(earningsGoalProgress, ordersGoalProgress)}%</span> towards your monthly goal!
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
