"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Star,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  MessageCircle,
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
import { creatorsService } from "@/services/creators.service";
import type { Creator } from "@/types";

const mockStats = {
  totalEarnings: 485000,
  earningsChange: 12.5,
  activeOrders: 8,
  ordersChange: -2,
  profileViews: 1250,
  viewsChange: 23.1,
  rating: 4.9,
  reviewCount: 47,
};

const ambassadorStats = {
  totalEarnings: 985000,
  earningsChange: 21.2,
  activeOrders: 14,
  ordersChange: 16,
  profileViews: 3680,
  viewsChange: 34.8,
  rating: 4.9,
  reviewCount: 214,
};

const recentOrders = [
  {
    id: "1",
    brandName: "FreshMart",
    brandLogo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100",
    packageName: "Instagram Story Pack",
    amount: 25000,
    status: "in_progress",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    brandName: "TechZone",
    brandLogo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100",
    packageName: "Product Review",
    amount: 45000,
    status: "pending",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    brandName: "StyleHub",
    brandLogo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100",
    packageName: "Full Campaign",
    amount: 120000,
    status: "completed",
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

const ambassadorOrders = [
  {
    id: "a1",
    brandName: "stc Pay KSA",
    brandLogo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100",
    packageName: "Ambassador Growth Sprint",
    amount: 165000,
    status: "in_progress",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "a2",
    brandName: "Saudia Holidays",
    brandLogo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100",
    packageName: "Tourism Story Series",
    amount: 210000,
    status: "pending",
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
  },
  {
    id: "a3",
    brandName: "Jarir Bookstore",
    brandLogo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100",
    packageName: "Back-to-School Campaign",
    amount: 142000,
    status: "completed",
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

const recentMessages = [
  {
    id: "1",
    name: "Sarah from FreshMart",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    message: "Hi! We loved your last post. Can we discuss a new campaign?",
    time: new Date(Date.now() - 30 * 60 * 1000),
    unread: true,
  },
  {
    id: "2",
    name: "Ali from TechZone",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    message: "The product has been shipped. You should receive it tomorrow.",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unread: false,
  },
];

const ambassadorMessages = [
  {
    id: "am1",
    name: "Mariam - Ambassador Success Manager",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    message: "Your Q3 Elite track is unlocked. Review the premium opportunities panel.",
    time: new Date(Date.now() - 20 * 60 * 1000),
    unread: true,
  },
  {
    id: "am2",
    name: "Khaled - stc Pay Marketing",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    message: "Loved your campaign draft. Can we align on launch timing tomorrow?",
    time: new Date(Date.now() - 80 * 60 * 1000),
    unread: false,
  },
];

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
  const isActiveAmbassador = user?.creatorProgramStatus === "active_ambassador" || user?.email === "ambassador@test.com";

  useEffect(() => {
    const loadCreator = async () => {
      const profile = await creatorsService.getMe().catch(() => null);
      setCreatorProfile(profile);
    };

    void loadCreator();
  }, []);

  const primaryCreator = useMemo<Creator>(() => {
    if (creatorProfile) return creatorProfile;

    return {
      id: user?.id || 'unknown-creator',
      userId: user?.id || 'unknown-user',
      username: user?.email?.split('@')[0] || 'creator',
      name: user?.name || 'Creator',
      avatar: user?.avatar || '',
      bio: '',
      city: 'Riyadh',
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

  const activeStats = isActiveAmbassador ? ambassadorStats : mockStats;
  const activeOrders = isActiveAmbassador ? ambassadorOrders : recentOrders;
  const activeMessages = isActiveAmbassador ? ambassadorMessages : recentMessages;

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
            : "Welcome back! Here&apos;s your performance overview."}
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
          value={formatPrice(activeStats.totalEarnings)}
          change={activeStats.earningsChange}
          icon={DollarSign}
          trend="up"
        />
        <StatsCard
          title={isActiveAmbassador ? "Priority Campaigns" : "Active Orders"}
          value={activeStats.activeOrders.toString()}
          change={activeStats.ordersChange}
          icon={Package}
          trend={isActiveAmbassador ? "up" : "down"}
        />
        <StatsCard
          title="Profile Views"
          value={activeStats.profileViews.toLocaleString()}
          change={activeStats.viewsChange}
          icon={Eye}
          trend="up"
        />
        <StatsCard
          title={isActiveAmbassador ? "Quality Score" : "Rating"}
          value={activeStats.rating.toString()}
          subtitle={`${activeStats.reviewCount} reviews`}
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
              {activeOrders.map((order, index) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-start gap-3 rounded-lg border border-border/50 p-4 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={order.brandLogo} alt={order.brandName} />
                      <AvatarFallback>
                        {getInitials(order.brandName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{order.brandName}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.packageName}
                      </p>
                    </div>
                    <div className="w-full text-left sm:w-auto sm:text-right">
                      <p className="font-semibold text-primary">
                        {formatPrice(order.amount)}
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
              })}
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
                <div className="rounded-lg border border-primary/20 bg-background p-3">
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
                {activeMessages.map((msg) => (
                  <Link
                    key={msg.id}
                    href="/creator/messages"
                    className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={msg.avatar} alt={msg.name} />
                      <AvatarFallback>{getInitials(msg.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{msg.name}</p>
                        {msg.unread && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
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
                ))}
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
                      {isActiveAmbassador
                        ? `${formatPrice(985000)} / ${formatPrice(1200000)}`
                        : `${formatPrice(485000)} / ${formatPrice(600000)}`}
                    </span>
                  </div>
                  <Progress value={isActiveAmbassador ? 82 : 80.8} className="h-2" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{isActiveAmbassador ? "Premium Campaigns" : "Orders"}</span>
                    <span className="font-medium">{isActiveAmbassador ? "14 / 16" : "8 / 10"}</span>
                  </div>
                  <Progress value={isActiveAmbassador ? 87.5 : 80} className="h-2" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {isActiveAmbassador ? (
                    <>
                      You&apos;re <span className="font-medium text-primary">87%</span> towards unlocking this month&apos;s Elite bonus.
                    </>
                  ) : (
                    <>
                      You&apos;re <span className="font-medium text-primary">80%</span> towards your monthly goal!
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
