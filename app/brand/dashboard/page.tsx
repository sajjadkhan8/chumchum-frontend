"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
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
import { BrandBanner } from "@/components/brand-banner";
import { creators } from "@/data/creators";
import { formatPrice, formatRelativeTime, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const mockStats = {
  totalSpent: 785000,
  spentChange: 18.3,
  activeOrders: 5,
  ordersChange: 2,
  creatorsWorkedWith: 23,
  creatorsChange: 4,
  avgRating: 4.8,
};

const activeOrders = [
  {
    id: "1",
    creatorName: "Ayesha Khan",
    creatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    packageName: "Instagram Story Pack",
    amount: 25000,
    status: "in_progress",
    progress: 65,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    creatorName: "Ahmed Raza",
    creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    packageName: "YouTube Review",
    amount: 45000,
    status: "pending",
    progress: 10,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    creatorName: "Sana Malik",
    creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    packageName: "Full Campaign",
    amount: 120000,
    status: "review",
    progress: 90,
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
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
    case "review":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function BrandDashboardPage() {
  const { user, savedCreators } = useAuthStore();
  const recommendedCreators = creators.slice(0, 4);
  const savedCreatorsList = creators.filter((c) =>
    savedCreators.includes(c.id)
  ).slice(0, 3);

  return (
    <div className="container mx-auto p-4 pb-6 md:p-6">
      <BrandBanner variant="light" className="mb-6 h-24 w-full md:h-28" />
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-gradient md:text-3xl">
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
          value={formatPrice(mockStats.totalSpent)}
          change={mockStats.spentChange}
          icon={DollarSign}
          trend="up"
        />
        <StatsCard
          title="Active Campaigns"
          value={mockStats.activeOrders.toString()}
          change={mockStats.ordersChange}
          icon={Package}
          trend="up"
        />
        <StatsCard
          title="Creators Worked With"
          value={mockStats.creatorsWorkedWith.toString()}
          change={mockStats.creatorsChange}
          icon={Users}
          trend="up"
        />
        <StatsCard
          title="Avg. Rating Given"
          value={mockStats.avgRating.toString()}
          icon={Star}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Orders */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Campaigns</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/brand/orders">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                      className="rounded-2xl border border-primary/10 bg-background/70 p-4"
                  >
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={order.creatorAvatar}
                            alt={order.creatorName}
                          />
                          <AvatarFallback>
                            {getInitials(order.creatorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-medium">{order.creatorName}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.packageName}
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
                      <span className="font-medium">{order.progress}%</span>
                    </div>
                    <Progress value={order.progress} className="h-2" />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        Due: {formatRelativeTime(order.deadline)}
                      </p>
                      <p className="font-semibold text-primary">
                        {formatPrice(order.amount)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Creators */}
          <Card className="overflow-hidden">
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
          <Card className="overflow-hidden">
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
          <Card className="overflow-hidden">
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
                        className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-primary/5"
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
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Monthly Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-medium">
                      {formatPrice(785000)} / {formatPrice(1000000)}
                    </span>
                  </div>
                  <Progress value={78.5} className="h-2" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  <span className="font-medium text-primary">
                    {formatPrice(215000)}
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
