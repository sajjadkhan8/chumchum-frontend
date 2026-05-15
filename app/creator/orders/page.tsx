"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  Calendar,
  MessageCircle,
  MoreVertical,
  Eye,
  FileText,
  Upload,
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
    brandName: "FreshMart",
    brandLogo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100",
    packageName: "Instagram Story Pack",
    description: "3 Instagram Stories featuring organic products",
    amount: 25000,
    status: "in_progress",
    progress: 65,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    deliverables: [
      { name: "Story 1 - Product Unboxing", status: "completed" },
      { name: "Story 2 - Usage Demo", status: "in_progress" },
      { name: "Story 3 - Review", status: "pending" },
    ],
  },
  {
    id: "ORD-002",
    brandName: "TechZone",
    brandLogo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100",
    packageName: "Product Review Video",
    description: "Detailed YouTube review of latest smartphone",
    amount: 45000,
    status: "pending",
    progress: 0,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    deliverables: [
      { name: "Script Approval", status: "pending" },
      { name: "Video Recording", status: "pending" },
      { name: "Final Edit & Upload", status: "pending" },
    ],
  },
  {
    id: "ORD-003",
    brandName: "StyleHub",
    brandLogo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100",
    packageName: "Full Fashion Campaign",
    description: "Complete campaign with reels, posts, and stories",
    amount: 120000,
    status: "completed",
    progress: 100,
    deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    deliverables: [
      { name: "3 Instagram Reels", status: "completed" },
      { name: "5 Feed Posts", status: "completed" },
      { name: "10 Stories", status: "completed" },
    ],
  },
  {
    id: "ORD-004",
    brandName: "FoodieDelight",
    brandLogo: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=100",
    packageName: "Restaurant Review",
    description: "Video review and social media coverage",
    amount: 35000,
    status: "revision",
    progress: 80,
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    deliverables: [
      { name: "Restaurant Visit & Content", status: "completed" },
      { name: "Video Edit", status: "revision" },
      { name: "Social Media Posts", status: "pending" },
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
    case "revision":
      return "bg-orange-100 text-orange-700";
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
    case "revision":
      return FileText;
    case "cancelled":
      return XCircle;
    default:
      return Clock;
  }
};

const getDaysRemaining = (deadline: Date) => {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
};

export default function CreatorOrdersPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) return;

    const allowed = new Set(['all', 'pending', 'in_progress', 'revision', 'completed', 'cancelled']);
    if (allowed.has(status)) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const orderCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    in_progress: orders.filter((o) => o.status === "in_progress").length,
    revision: orders.filter((o) => o.status === "revision").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Orders
        </h1>
        <p className="text-muted-foreground">
          Manage your active and completed orders
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
            <SelectItem value="pending">Pending ({orderCounts.pending})</SelectItem>
            <SelectItem value="in_progress">
              In Progress ({orderCounts.in_progress})
            </SelectItem>
            <SelectItem value="revision">Revision ({orderCounts.revision})</SelectItem>
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
          const daysRemaining = getDaysRemaining(order.deadline);
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
                          src={order.brandLogo}
                          alt={order.brandName}
                        />
                        <AvatarFallback>
                          {getInitials(order.brandName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{order.brandName}</h3>
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
                          Order {order.id} • Created {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          {formatPrice(order.amount)}
                        </p>
                        <p
                          className={`text-xs ${
                            daysRemaining <= 1
                              ? "text-destructive"
                              : daysRemaining <= 3
                                ? "text-yellow-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {daysRemaining > 0
                            ? `${daysRemaining} days left`
                            : daysRemaining === 0
                              ? "Due today"
                              : "Overdue"}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => toast.info(`Order ${order.id} details are visible in the expanded card.`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => toast.success(`Message draft created for ${order.brandName}.`)}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Message Brand
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => toast.success(`Submit flow prepared for ${order.id}.`)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Submit Deliverable
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 border-t border-border pt-6"
                    >
                      <div className="mb-4">
                        <p className="mb-2 text-sm font-medium">Description</p>
                        <p className="text-sm text-muted-foreground">
                          {order.description}
                        </p>
                      </div>

                      <div className="mb-4">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium">Progress</span>
                          <span>{order.progress}%</span>
                        </div>
                        <Progress value={order.progress} className="h-2" />
                      </div>

                      <div>
                        <p className="mb-3 text-sm font-medium">Deliverables</p>
                        <div className="space-y-2">
                          {order.deliverables.map((deliverable, i) => {
                            const DeliverableIcon = getStatusIcon(
                              deliverable.status
                            );
                            return (
                              <div
                                key={i}
                                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                              >
                                <div className="flex items-center gap-2">
                                  <DeliverableIcon
                                    className={`h-4 w-4 ${
                                      deliverable.status === "completed"
                                        ? "text-green-600"
                                        : deliverable.status === "in_progress"
                                          ? "text-blue-600"
                                          : deliverable.status === "revision"
                                            ? "text-orange-600"
                                            : "text-muted-foreground"
                                    }`}
                                  />
                                  <span className="text-sm">
                                    {deliverable.name}
                                  </span>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className={getStatusColor(deliverable.status)}
                                >
                                  {deliverable.status.replace("_", " ")}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => toast.success(`Message draft created for ${order.brandName}.`)}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                        <Button className="flex-1" onClick={() => toast.success(`Submit flow prepared for ${order.id}.`)}>
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Work
                        </Button>
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
              <p className="text-center text-muted-foreground">
                No orders match your current filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
