"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice, formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { ordersService } from "@/services/orders.service";
import { reviewsService } from "@/services/reviews.service";
import type { Order, OrderDeliverable, OrderStatus } from "@/types";

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
      return RefreshCw;
    default:
      return Clock;
  }
};

const getFallbackDeadline = (order: Order) => {
  if (order.deadlineDate) return order.deadlineDate;
  if (order.deliveryDate) return order.deliveryDate;
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

const getOrderDeliverables = (order: Order): OrderDeliverable[] => {
  if (order.deliverables.length > 0) return order.deliverables;
  const packageDeliverables = order.package.deliverables.length > 0 ? order.package.deliverables : ["Package deliverables"];
  return packageDeliverables.map((name, index) => ({
    id: `fallback-${order.id}-${index}`,
    orderId: order.id,
    name,
    status: getDeliverableStatus(order, index),
  }));
};

export default function BrandOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  const filteredOrders = orders.filter((order) => {
    const creatorName = order.creator.name.toLowerCase();
    const packageName = order.package.title.toLowerCase();
    const matchesSearch =
      creatorName.includes(searchQuery.toLowerCase()) ||
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

  const updateDeliverableStatus = async (
    orderId: string,
    deliverableId: string,
    status: OrderDeliverable["status"],
  ) => {
    try {
      await ordersService.updateDeliverableStatus(orderId, deliverableId, status);
      await loadOrders();
      toast.success(`Deliverable marked ${status.replace("_", " ")}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update deliverable";
      toast.error(message);
    }
  };

  const openReviewDialog = (order: Order) => {
    setReviewTarget(order);
    setReviewRating(5);
    setReviewComment("");
  };

  const submitReview = async () => {
    if (!reviewTarget) return;

    setIsSubmittingReview(true);
    try {
      await reviewsService.create({
        orderId: reviewTarget.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewTarget(null);
      toast.success("Review submitted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit review";
      toast.error(message);
    } finally {
      setIsSubmittingReview(false);
    }
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
              <SelectItem value="accepted">
                Accepted ({orderCounts.accepted})
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
              <SelectItem value="revision">
                Revision ({orderCounts.revision})
              </SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
            const isExpanded = selectedOrder === order.id;
            const deadline = getFallbackDeadline(order);
            const progress = order.progress ?? (order.status === "completed" ? 100 : order.status === "pending" ? 0 : 50);
            const deliverables = getOrderDeliverables(order);

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
                            src={order.creator.avatar}
                            alt={order.creator.name}
                          />
                          <AvatarFallback>
                            {getInitials(order.creator.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/creator/${order.creatorId}`}
                              className="font-semibold hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.creator.name}
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
                            {order.package.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Order {order.id} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatPrice(order.amount ?? order.package.price ?? 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due: {formatDate(deadline)}
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
                              onSelect={() => toast.success(`Opening chat with ${order.creator.name} soon.`)}
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Message Creator
                            </DropdownMenuItem>
                            {order.status === "pending" && (
                              <DropdownMenuItem onSelect={() => updateOrderStatus(order.id, "cancelled")}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Order
                              </DropdownMenuItem>
                            )}
                            {(order.status === "delivered" || order.status === "review") && (
                              <DropdownMenuItem onSelect={() => updateOrderStatus(order.id, "completed")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve Delivery
                              </DropdownMenuItem>
                            )}
                            {(order.status === "delivered" || order.status === "review") && (
                              <DropdownMenuItem onSelect={() => updateOrderStatus(order.id, "revision")}>
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
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
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
                          {order.message || order.package.description}
                        </p>

                        <div className="mb-4">
                          <p className="mb-3 text-sm font-medium">
                            Deliverables
                          </p>
                          <div className="space-y-2">
                            {deliverables.map((deliverable) => {
                              const deliverableStatus = deliverable.status;
                              const DeliverableIcon = getStatusIcon(deliverableStatus);
                              return (
                                <div
                                  key={deliverable.id}
                                  className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <DeliverableIcon
                                      className={`h-4 w-4 ${
                                        deliverableStatus === "completed"
                                          ? "text-green-600"
                                          : deliverableStatus === "in_progress"
                                            ? "text-blue-600"
                                            : deliverableStatus === "review"
                                              ? "text-purple-600"
                                              : "text-muted-foreground"
                                      }`}
                                    />
                                    <span className="text-sm">{deliverable.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {deliverable.fileUrl && (
                                      <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                        <a href={deliverable.fileUrl} target="_blank" rel="noreferrer">View</a>
                                      </Button>
                                    )}
                                    {deliverableStatus === "review" && !deliverable.id.startsWith("fallback-") && (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void updateDeliverableStatus(order.id, deliverable.id, "completed");
                                          }}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Approve
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void updateDeliverableStatus(order.id, deliverable.id, "revision");
                                          }}
                                        >
                                          <RefreshCw className="mr-2 h-4 w-4" />
                                          Revision
                                        </Button>
                                      </>
                                    )}
                                    <Badge
                                      variant="secondary"
                                      className={getStatusColor(deliverableStatus)}
                                    >
                                      {deliverableStatus.replace("_", " ")}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Review Section for Completed Orders */}
                        {order.status === "completed" && (
                          <div className="rounded-lg bg-green-50 p-4">
                            <div className="mb-2 flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-4 w-4 fill-accent text-accent"
                                />
                              ))}
                            </div>
                            <p className="text-sm text-green-800">
                              Delivery approved. Share a review to update this creator&apos;s rating.
                            </p>
                            <Button className="mt-3" size="sm" onClick={() => openReviewDialog(order)}>
                              <Star className="mr-2 h-4 w-4" />
                              Leave Review
                            </Button>
                          </div>
                        )}

                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" className="flex-1" asChild>
                            <Link href={`/messages?creator=${order.creatorId}`}>
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Message
                            </Link>
                          </Button>
                          {(order.status === "delivered" || order.status === "review") && (
                            <Button className="flex-1" onClick={() => updateOrderStatus(order.id, "completed")}>
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

          {!isLoading && filteredOrders.length === 0 && (
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
        <Dialog open={Boolean(reviewTarget)} onOpenChange={(open) => !open && setReviewTarget(null)}>
          <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Leave a review</DialogTitle>
              <DialogDescription>
                Rate {reviewTarget?.creator.name || "this creator"} for the completed order.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setReviewRating(rating)}
                      aria-label={`${rating} star rating`}
                    >
                      <Star
                        className={`h-5 w-5 ${
                          rating <= reviewRating ? "fill-accent text-accent" : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-comment">Comment</Label>
                <Textarea
                  id="review-comment"
                  rows={4}
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Share what went well"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReviewTarget(null)} disabled={isSubmittingReview}>
                  Cancel
                </Button>
                <Button onClick={submitReview} disabled={isSubmittingReview}>
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}
