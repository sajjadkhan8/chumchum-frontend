"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/stats-card";
import { formatPrice, formatRelativeTime, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

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

  return (
    <div className="container mx-auto p-4 pb-6 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your performance overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Earnings"
          value={formatPrice(mockStats.totalEarnings)}
          change={mockStats.earningsChange}
          icon={DollarSign}
          trend="up"
        />
        <StatsCard
          title="Active Orders"
          value={mockStats.activeOrders.toString()}
          change={mockStats.ordersChange}
          icon={Package}
          trend="down"
        />
        <StatsCard
          title="Profile Views"
          value={mockStats.profileViews.toLocaleString()}
          change={mockStats.viewsChange}
          icon={Eye}
          trend="up"
        />
        <StatsCard
          title="Rating"
          value={mockStats.rating.toString()}
          subtitle={`${mockStats.reviewCount} reviews`}
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
              {recentOrders.map((order, index) => {
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
                {recentMessages.map((msg) => (
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
              <CardTitle>Monthly Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Earnings</span>
                    <span className="font-medium">
                      {formatPrice(485000)} / {formatPrice(600000)}
                    </span>
                  </div>
                  <Progress value={80.8} className="h-2" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Orders</span>
                    <span className="font-medium">8 / 10</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  You&apos;re <span className="font-medium text-primary">80%</span> towards your monthly goal!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
