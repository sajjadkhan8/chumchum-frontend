"use client";

import { Suspense, useState } from "react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageCircle,
  MoreVertical,
  Eye,
  FileText,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { ordersService } from "@/services/orders.service";
import type { Order, OrderStatus } from "@/types";

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "in_progress":
      return "bg-blue-100 text-blue-700";
    case "accepted":
      return "bg-cyan-100 text-cyan-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "delivered":
    case "review":
      return "bg-purple-100 text-purple-700";
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
    case "accepted":
      return CheckCircle;
    case "pending":
      return AlertCircle;
    case "delivered":
    case "review":
      return Eye;
    case "revision":
      return FileText;
    case "cancelled":
      return XCircle;
    default:
      return Clock;
  }
};

const getDaysRemaining = (deadline: Date | undefined) => {
  if (!deadline) return null;
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
};

const getFallbackDeadline = (order: Order) => {
  if (order.deadlineDate || order.deliveryDate) return order.deadlineDate || order.deliveryDate;
  const deadline = new Date(order.createdAt);
  deadline.setDate(deadline.getDate() + (order.package.deliveryDays || 1));
  return deadline;
};

const getDeliverableStatus = (order: Order, index: number) => {
  if (order.status === "completed") return "completed";
  if (order.status === "delivered" || order.status === "review") return "review";
  if (order.status === "revision") return index === 0 ? "revision" : "pending";
  if (order.status === "in_progress") return index === 0 ? "in_progress" : "pending";
  return "pending";
};

function CreatorOrdersPageContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      setOrders(await ordersService.getAll());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load orders";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) return;

    const allowed = new Set(['all', 'pending', 'accepted', 'in_progress', 'delivered', 'review', 'revision', 'completed', 'cancelled']);
    if (allowed.has(status)) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const filteredOrders = orders.filter((order) => {
    const packageName = order.package.title.toLowerCase();
    const brandName = order.brand.name.toLowerCase();
    const matchesSearch =
      brandName.includes(searchQuery.toLowerCase()) ||
      packageName.includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const orderCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    accepted: orders.filter((o) => o.status === "accepted").length,
    in_progress: orders.filter((o) => o.status === "in_progress").length,
    review: orders.filter((o) => o.status === "review" || o.status === "delivered").length,
    revision: orders.filter((o) => o.status === "revision").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await ordersService.updateStatus(orderId, status);
      if (updated) {
        setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
      }
      toast.success(`Order marked ${status.replace("_", " ")}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update order";
      toast.error(message);
    }
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
            <SelectItem value="accepted">Accepted ({orderCounts.accepted})</SelectItem>
            <SelectItem value="in_progress">
              In Progress ({orderCounts.in_progress})
            </SelectItem>
            <SelectItem value="review">Review ({orderCounts.review})</SelectItem>
            <SelectItem value="revision">Revision ({orderCounts.revision})</SelectItem>
            <SelectItem value="completed">
              Completed ({orderCounts.completed})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading orders...</CardContent>
          </Card>
        )}

        {!isLoading && filteredOrders.map((order, index) => {
          const StatusIcon = getStatusIcon(order.status);
          const deadline = getFallbackDeadline(order);
          const daysRemaining = getDaysRemaining(deadline);
          const isExpanded = selectedOrder === order.id;
          const progress = order.progress ?? (order.status === "completed" ? 100 : order.status === "pending" ? 0 : 50);
          const deliverables = order.package.deliverables.length > 0 ? order.package.deliverables : ["Package deliverables"];

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
                          src={order.brand.logo}
                          alt={order.brand.name}
                        />
                        <AvatarFallback>
                          {getInitials(order.brand.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{order.brand.name}</h3>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(order.status)}
                          >
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {order.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.package.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Order {order.id} • Created {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          {formatPrice(order.amount ?? order.package.price ?? 0)}
                        </p>
                        {daysRemaining !== null && (
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
                        )}
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
                          <DropdownMenuItem onSelect={() => toast.success(`Message draft created for ${order.brand.name}.`)}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Message Brand
                          </DropdownMenuItem>
                          {order.status === "pending" && (
                            <DropdownMenuItem onSelect={() => updateOrderStatus(order.id, "accepted")}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Accept Order
                            </DropdownMenuItem>
                          )}
                          {order.status === "accepted" && (
                            <DropdownMenuItem onSelect={() => updateOrderStatus(order.id, "in_progress")}>
                              <Clock className="mr-2 h-4 w-4" />
                              Start Work
                            </DropdownMenuItem>
                          )}
                          {order.status === "in_progress" && (
                            <DropdownMenuItem onSelect={() => updateOrderStatus(order.id, "delivered")}>
                              <Upload className="mr-2 h-4 w-4" />
                              Submit Deliverable
                            </DropdownMenuItem>
                          )}
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
                          {order.message || order.package.description}
                        </p>
                      </div>

                      <div className="mb-4">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium">Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div>
                        <p className="mb-3 text-sm font-medium">Deliverables</p>
                        <div className="space-y-2">
                          {deliverables.map((deliverable, i) => {
                            const deliverableStatus = getDeliverableStatus(order, i);
                            const DeliverableIcon = getStatusIcon(
                              deliverableStatus
                            );
                            return (
                              <div
                                key={i}
                                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                              >
                                <div className="flex items-center gap-2">
                                  <DeliverableIcon
                                    className={`h-4 w-4 ${
                                      deliverableStatus === "completed"
                                        ? "text-green-600"
                                        : deliverableStatus === "in_progress"
                                          ? "text-blue-600"
                                          : deliverableStatus === "revision"
                                            ? "text-orange-600"
                                            : "text-muted-foreground"
                                    }`}
                                  />
                                  <span className="text-sm">
                                    {deliverable}
                                  </span>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className={getStatusColor(deliverableStatus)}
                                >
                                  {deliverableStatus.replace("_", " ")}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => toast.success(`Message draft created for ${order.brand.name}.`)}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                        {order.status === "pending" ? (
                          <Button className="flex-1" onClick={() => updateOrderStatus(order.id, "accepted")}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept
                          </Button>
                        ) : order.status === "accepted" ? (
                          <Button className="flex-1" onClick={() => updateOrderStatus(order.id, "in_progress")}>
                            <Clock className="mr-2 h-4 w-4" />
                            Start Work
                          </Button>
                        ) : order.status === "in_progress" ? (
                          <Button className="flex-1" onClick={() => updateOrderStatus(order.id, "delivered")}>
                            <Upload className="mr-2 h-4 w-4" />
                            Submit Work
                          </Button>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {!isLoading && filteredOrders.length === 0 && (
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

export default function CreatorOrdersPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4 md:p-6" />}>
      <CreatorOrdersPageContent />
    </Suspense>
  );
}
