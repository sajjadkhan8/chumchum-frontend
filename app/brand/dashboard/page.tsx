"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  MessageCircle,
  ArrowRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/stats-card";
import { CreatorCard } from "@/components/creator-card";
import { formatPrice, formatRelativeTime, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { creatorsService } from "@/services/creators.service";
import { ordersService } from "@/services/orders.service";
import { analyticsService, type BrandDashboardAnalytics } from "@/services/analytics.service";
import type { Creator, Order } from "@/types";

const emptyStats: BrandDashboardAnalytics = {
  totalOrders: 0,
  activeOrders: 0,
  completedOrders: 0,
  savedCreators: 0,
  totalSpent: 0,
  creatorsWorkedWith: 0,
  avgRating: 0,
};

const activeOrderStatuses = new Set(["accepted", "in_progress", "delivered", "review", "revision"]);

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "in_progress":
      return "bg-blue-100 text-blue-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "review":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getOrderProgress = (status: string) => {
  if (status === "completed") return 100;
  if (status === "in_progress") return 65;
  if (status === "pending") return 10;
  if (status === "accepted") return 30;
  if (status === "delivered") return 90;
  return 50;
};

export default function BrandDashboardPage() {
  const { savedCreators } = useAuthStore();
  const [stats, setStats] = useState<BrandDashboardAnalytics>(emptyStats);
  const [recommendedCreators, setRecommendedCreators] = useState<Creator[]>([]);
  const [savedCreatorsList, setSavedCreatorsList] = useState<Creator[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      const [analytics, orders, recommended] = await Promise.all([
        analyticsService.getBrandDashboard().catch(() => emptyStats),
        ordersService.getAll().catch(() => []),
        creatorsService.getTrending(4).catch(() => []),
      ]);

      setStats(analytics);
      setActiveOrders(orders.filter((order) => activeOrderStatuses.has(order.status)).slice(0, 3));
      setRecommendedCreators(recommended);
      setIsLoading(false);
    };

    void loadDashboard();
  }, []);

  useEffect(() => {
    const loadSavedCreators = async () => {
      const results = await Promise.allSettled(savedCreators.slice(0, 3).map((id) => creatorsService.getById(id)));
      const creators = results
        .map((item) => (item.status === "fulfilled" ? item.value : null))
        .filter((item): item is Creator => Boolean(item));
      setSavedCreatorsList(creators);
    };

    void loadSavedCreators();
  }, [savedCreators]);

  return (
    <div className="container mx-auto p-4 pb-6 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Brand Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your campaigns and discover creators
          </p>
        </div>
        <Button asChild className="min-h-11 w-full sm:w-auto">
          <Link href="/brand/explore">
            <Search className="mr-2 h-4 w-4" />
            Find Creators
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Spent"
          value={isLoading ? "Loading..." : formatPrice(stats.totalSpent)}
          icon={DollarSign}
          trend="up"
        />
        <StatsCard
          title="Active Campaigns"
          value={isLoading ? "..." : stats.activeOrders.toString()}
          subtitle={`${stats.completedOrders} completed`}
          icon={Package}
          trend="up"
        />
        <StatsCard
          title="Creators Worked With"
          value={isLoading ? "..." : stats.creatorsWorkedWith.toString()}
          subtitle={`${stats.savedCreators} saved`}
          icon={Users}
          trend="up"
        />
        <StatsCard
          title="Avg. Rating Given"
          value={isLoading ? "..." : stats.avgRating.toFixed(1)}
          icon={Star}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Orders */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Campaigns</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/brand/orders">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeOrders.length > 0 ? activeOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-lg border border-border/50 p-4"
                  >
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage
                                src={order.creator.avatar}
                                alt={order.creator.name}
                              />
                          <AvatarFallback>
                            {getInitials(order.creator.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-medium">{order.creator.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.package.title}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                         className={`w-fit ${getStatusColor(order.status)}`}
                      >
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{getOrderProgress(String(order.status))}%</span>
                    </div>
                    <Progress value={getOrderProgress(String(order.status))} className="h-2" />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        Due: {formatRelativeTime(order.deliveryDate || order.updatedAt)}
                      </p>
                      <p className="font-semibold text-primary">
                         {formatPrice(order.amount || 0)}
                      </p>
                    </div>
                  </motion.div>
                )) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No active campaigns yet. Accepted and in-progress creator orders will appear here.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Creators */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recommended For You</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/brand/explore">
                  See More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {recommendedCreators.map((creator, index) => (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CreatorCard creator={creator} variant="compact" />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-auto min-h-20 flex-col py-4"
                asChild
              >
                <Link href="/brand/explore">
                  <Search className="mb-2 h-5 w-5" />
                  <span className="text-xs">Find Creators</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto min-h-20 flex-col py-4"
                asChild
              >
                <Link href="/brand/messages">
                  <MessageCircle className="mb-2 h-5 w-5" />
                  <span className="text-xs">Messages</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto min-h-20 flex-col py-4"
                asChild
              >
                <Link href="/brand/orders">
                  <Package className="mb-2 h-5 w-5" />
                  <span className="text-xs">Orders</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto min-h-20 flex-col py-4"
                asChild
              >
                <Link href="/brand/saved">
                  <Star className="mb-2 h-5 w-5" />
                  <span className="text-xs">Saved</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto min-h-20 flex-col py-4"
                asChild
              >
                <Link href="/brand/analytics">
                  <TrendingUp className="mb-2 h-5 w-5" />
                  <span className="text-xs">Analytics</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Saved Creators */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Saved Creators</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/brand/saved">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {savedCreatorsList.length > 0 ? (
                <div className="space-y-3">
                  {savedCreatorsList.map((creator) => (
                    <Link
                      key={creator.id}
                      href={`/creator/${creator.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={creator.avatar} alt={creator.name} />
                        <AvatarFallback>
                          {getInitials(creator.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {creator.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {creator.categories[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        {creator.rating}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Star className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No saved creators yet
                  </p>
                  <Button variant="link" size="sm" asChild>
                    <Link href="/brand/explore">Browse creators</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-medium">
                      {formatPrice(stats.totalSpent)} / {formatPrice(Math.max(1000000, stats.totalSpent))}
                    </span>
                  </div>
                  <Progress value={stats.totalSpent ? Math.min(100, (stats.totalSpent / Math.max(1000000, stats.totalSpent)) * 100) : 0} className="h-2" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  <span className="font-medium text-primary">
                    {formatPrice(Math.max(Math.max(1000000, stats.totalSpent) - stats.totalSpent, 0))}
                  </span>{" "}
                  remaining this month
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
