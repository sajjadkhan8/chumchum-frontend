"use client";

import { Suspense, useState } from "react";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageCircle,
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
import { uploadsService } from "@/services/uploads.service";
import { messagesService } from "@/services/messages.service";
import { useAuthStore } from "@/store/auth-store";
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

function CreatorOrdersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [submissionTarget, setSubmissionTarget] = useState<{ order: Order; deliverable: OrderDeliverable } | null>(null);
  const [submissionFileUrl, setSubmissionFileUrl] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionNote, setSubmissionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    // Legacy status-specific routes were removed; status state now lives in ?status=... for one canonical Orders page.
    const status = searchParams.get('status');
    if (!status) {
      setStatusFilter('all');
      return;
    }

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
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  const statusTabs: { key: string; label: string }[] = [
    { key: 'all', label: `All (${orderCounts.all})` },
    { key: 'pending', label: `Pending (${orderCounts.pending})` },
    { key: 'accepted', label: `Accepted (${orderCounts.accepted})` },
    { key: 'in_progress', label: `In Progress (${orderCounts.in_progress})` },
    { key: 'review', label: `Review (${orderCounts.review})` },
    { key: 'revision', label: `Revision (${orderCounts.revision})` },
    { key: 'completed', label: `Completed (${orderCounts.completed})` },
    { key: 'cancelled', label: `Cancelled (${orderCounts.cancelled})` },
  ];

  const updateStatusFilterWithUrl = (nextStatus: string) => {
    setStatusFilter(nextStatus);
    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus === 'all') {
      params.delete('status');
    } else {
      params.set('status', nextStatus);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
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

  const openSubmitDialog = (order: Order, deliverable?: OrderDeliverable) => {
    const target = deliverable || getOrderDeliverables(order).find((item) => (
      item.status === "pending" || item.status === "in_progress" || item.status === "revision"
    ));
    if (!target || target.id.startsWith("fallback-")) {
      toast.error("This order does not have a backend deliverable yet.");
      return;
    }
    setSubmissionTarget({ order, deliverable: target });
    setSubmissionFileUrl(target.fileUrl || "");
    setSubmissionFile(null);
    setSubmissionNote("");
  };

  const submitDeliverable = async () => {
    if (!submissionTarget) return;
    setIsSubmitting(true);
    try {
      let fileUrl = submissionFileUrl.trim();
      if (!fileUrl) {
        if (!submissionFile) {
          toast.error("Add a deliverable file or preview URL.");
          return;
        }
        const uploaded = await uploadsService.deliverable(
          submissionFile,
          submissionTarget.order.id,
          submissionTarget.deliverable.id,
        );
        fileUrl = uploaded.url;
      }

      if (!fileUrl) {
        toast.error("Upload did not return a file URL.");
        return;
      }

      await ordersService.submitDeliverable(submissionTarget.order.id, submissionTarget.deliverable.id, {
        fileUrl,
        note: submissionNote.trim(),
      });
      if (submissionTarget.order.status === "in_progress") {
        await ordersService.updateStatus(submissionTarget.order.id, "delivered");
      }
      await loadOrders();
      setSubmissionTarget(null);
      setSubmissionFile(null);
      setSubmissionFileUrl("");
      setSubmissionNote("");
      toast.success("Deliverable submitted for brand review");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit deliverable";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openBrandMessages = async (order: Order) => {
    if (!user || user.role !== "creator") {
      router.push("/creator/messages");
      return;
    }

    try {
      const conversations = await messagesService.getConversations(user.id, "creator");
      const existing = conversations.find((conversation) => conversation.brandId === order.brandId);

      if (existing) {
        router.push(`/creator/messages?conversation=${existing.id}`);
        return;
      }

      router.push("/creator/messages");
      toast.info(`Opened messages. Start a chat with ${order.brand.name}.`);
    } catch {
      router.push("/creator/messages");
    }
  };

   return (
     <div className="container mx-auto p-4 md:p-6">
       {/* Filters */}
       <div className="mb-4 flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant={statusFilter === tab.key ? "default" : "outline"}
            onClick={() => updateStatusFilterWithUrl(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

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
                          Order {order.orderNumber || order.id} • Created {formatDate(order.createdAt)}
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
                          {deliverables.map((deliverable) => {
                            const deliverableStatus = deliverable.status;
                            const DeliverableIcon = getStatusIcon(
                              deliverableStatus
                            );
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
                                          : deliverableStatus === "revision"
                                            ? "text-orange-600"
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
                                  {(order.status === "in_progress" || order.status === "revision") &&
                                    (deliverableStatus === "pending" || deliverableStatus === "in_progress" || deliverableStatus === "revision") &&
                                    !deliverable.id.startsWith("fallback-") && (
                                      <Button size="sm" onClick={(e) => { e.stopPropagation(); openSubmitDialog(order, deliverable); }}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Submit Deliverable
                                      </Button>
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

                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); void openBrandMessages(order); }}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message Brand
                        </Button>
                        {order.status === "pending" ? (
                          <Button className="flex-1" onClick={(e) => { e.stopPropagation(); void updateOrderStatus(order.id, "accepted"); }}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept
                          </Button>
                        ) : order.status === "accepted" ? (
                          <Button className="flex-1" onClick={(e) => { e.stopPropagation(); void updateOrderStatus(order.id, "in_progress"); }}>
                            <Clock className="mr-2 h-4 w-4" />
                            Start Work
                          </Button>
                        ) : order.status === "in_progress" ? (
                          <Button className="flex-1" onClick={(e) => { e.stopPropagation(); openSubmitDialog(order); }}>
                            <Upload className="mr-2 h-4 w-4" />
                            Submit Deliverable
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
      <Dialog open={Boolean(submissionTarget)} onOpenChange={(open) => !open && setSubmissionTarget(null)}>
        <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit deliverable</DialogTitle>
            <DialogDescription>
              {submissionTarget?.deliverable.name || "Deliverable"} will be sent to the brand for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deliverable-file">Upload file</Label>
              <Input
                id="deliverable-file"
                type="file"
                onChange={(event) => setSubmissionFile(event.target.files?.[0] || null)}
              />
              {submissionFile && (
                <p className="text-xs text-muted-foreground">
                  {submissionFile.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliverable-url">Or paste file URL</Label>
              <Input
                id="deliverable-url"
                value={submissionFileUrl}
                onChange={(event) => setSubmissionFileUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliverable-note">Note</Label>
              <Textarea
                id="deliverable-note"
                rows={4}
                value={submissionNote}
                onChange={(event) => setSubmissionNote(event.target.value)}
                placeholder="Add context for the brand"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSubmissionTarget(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={submitDeliverable} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
