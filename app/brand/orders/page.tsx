"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  MessageCircle,
  MoreVertical,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { formatPrice, formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";

const orders = [
  {
    id: "ORD-001",
    creatorName: "Reem Al Otaibi",
    creatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    creatorHandle: "reemwellness",
    packageName: "Instagram Story Pack",
    description: "3 Instagram Stories featuring our new product line",
    amount: 25000,
    status: "in_progress",
    progress: 65,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    deliverables: [
      { name: "Story 1 - Unboxing", status: "completed" },
      { name: "Story 2 - Demo", status: "in_progress" },
      { name: "Story 3 - Review", status: "pending" },
    ],
  },
  {
    id: "ORD-002",
    creatorName: "Faisal Al Harbi",
    creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    creatorHandle: "faisaltech",
    packageName: "YouTube Product Review",
    description: "In-depth review video for our flagship product",
    amount: 45000,
    status: "pending",
    progress: 0,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    deliverables: [
      { name: "Script Approval", status: "pending" },
      { name: "Video Recording", status: "pending" },
      { name: "Final Edit", status: "pending" },
    ],
  },
  {
    id: "ORD-003",
    creatorName: "Nora Al Qahtani",
    creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    creatorHandle: "norafamilylife",
    packageName: "Full Campaign",
    description: "Complete social media campaign with reels, posts, and stories",
    amount: 120000,
    status: "completed",
    progress: 100,
    deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    deliverables: [
      { name: "3 Reels", status: "completed" },
      { name: "5 Posts", status: "completed" },
      { name: "10 Stories", status: "completed" },
    ],
    rating: 5,
    review: "Excellent work! Nora delivered everything on time and exceeded expectations.",
  },
  {
    id: "ORD-004",
    creatorName: "Saad Al Amri",
    creatorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    creatorHandle: "saadauto",
    packageName: "Tech Unboxing",
    description: "Unboxing and first impressions video",
    amount: 35000,
    status: "review",
    progress: 95,
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    deliverables: [
      { name: "Unboxing Video", status: "completed" },
      { name: "Social Posts", status: "review" },
    ],
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
    case "cancelled":
      return "bg-red-100 text-red-700";
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
    case "review":
      return Eye;
    default:
      return Clock;
  }
};

export default function BrandOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const orderCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    in_progress: orders.filter((o) => o.status === "in_progress").length,
    review: orders.filter((o) => o.status === "review").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  return (
      <div className="container mx-auto p-4 pb-24 md:p-6 md:pb-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            My Orders
          </h1>
          <p className="text-muted-foreground">
            Track and manage your campaigns
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search orders..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({orderCounts.all})</SelectItem>
              <SelectItem value="pending">
                Pending ({orderCounts.pending})
              </SelectItem>
              <SelectItem value="in_progress">
                In Progress ({orderCounts.in_progress})
              </SelectItem>
              <SelectItem value="review">
                In Review ({orderCounts.review})
              </SelectItem>
              <SelectItem value="completed">
                Completed ({orderCounts.completed})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order, index) => {
            const StatusIcon = getStatusIcon(order.status);
            const isExpanded = selectedOrder === order.id;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${isExpanded ? "ring-2 ring-primary" : ""}`}
                  onClick={() =>
                    setSelectedOrder(isExpanded ? null : order.id)
                  }
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={order.creatorAvatar}
                            alt={order.creatorName}
                          />
                          <AvatarFallback>
                            {getInitials(order.creatorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/creator/${order.creatorHandle}`}
                              className="font-semibold hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.creatorName}
                            </Link>
                            <Badge
                              variant="secondary"
                              className={getStatusColor(order.status)}
                            >
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {order.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.packageName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Order {order.id} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatPrice(order.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due: {formatDate(order.deadline)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => toast.info(`Order ${order.id} details are shown in this card view.`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => toast.success(`Opening chat with ${order.creatorName} soon.`)}
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Message Creator
                            </DropdownMenuItem>
                            {order.status === "review" && (
                              <DropdownMenuItem onSelect={() => toast.success(`Delivery approved for ${order.id}`)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve Delivery
                              </DropdownMenuItem>
                            )}
                            {order.status !== "completed" && (
                              <DropdownMenuItem onSelect={() => toast.info(`Revision request drafted for ${order.id}`)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Request Revision
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{order.progress}%</span>
                      </div>
                      <Progress value={order.progress} className="h-2" />
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 border-t border-border pt-6"
                      >
                        <p className="mb-4 text-sm text-muted-foreground">
                          {order.description}
                        </p>

                        <div className="mb-4">
                          <p className="mb-3 text-sm font-medium">
                            Deliverables
                          </p>
                          <div className="space-y-2">
                            {order.deliverables.map((d, i) => {
                              const DeliverableIcon = getStatusIcon(d.status);
                              return (
                                <div
                                  key={i}
                                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                                >
                                  <div className="flex items-center gap-2">
                                    <DeliverableIcon
                                      className={`h-4 w-4 ${
                                        d.status === "completed"
                                          ? "text-green-600"
                                          : d.status === "in_progress"
                                            ? "text-blue-600"
                                            : d.status === "review"
                                              ? "text-purple-600"
                                              : "text-muted-foreground"
                                      }`}
                                    />
                                    <span className="text-sm">{d.name}</span>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className={getStatusColor(d.status)}
                                  >
                                    {d.status.replace("_", " ")}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Review Section for Completed Orders */}
                        {order.status === "completed" && order.rating && (
                          <div className="rounded-lg bg-green-50 p-4">
                            <div className="mb-2 flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < order.rating!
                                      ? "fill-accent text-accent"
                                      : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-green-800">
                              {order.review}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" className="flex-1" asChild>
                            <Link href={`/messages?creator=${order.creatorHandle}`}>
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Message
                            </Link>
                          </Button>
                          {order.status === "review" && (
                            <Button className="flex-1" onClick={() => toast.success(`Delivery approved for ${order.id}`)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {filteredOrders.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No orders found</h3>
                <p className="mb-4 text-center text-muted-foreground">
                  No orders match your current filters.
                </p>
                <Button asChild>
                  <Link href="/brand/explore">Find Creators</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
  );
}
