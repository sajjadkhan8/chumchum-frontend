"use client";

import { Suspense, useState } from "react";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Layers,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageCircle,
  Eye,
  FileText,
  Upload,
  Download,
  Star,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreatorMetricCard } from "@/components/creator-metric-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice, formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { ordersService } from "@/services/orders.service";
import { reviewsService } from "@/services/reviews.service";
import { disputesService } from '@/services/disputes.service';
import { uploadsService } from "@/services/uploads.service";
import { messagesService } from "@/services/messages.service";
import { downloadFile } from "@/lib/download-file";
import { useAuthStore } from "@/store/auth-store";
import type { Order, OrderDeliverable, OrderStatus } from "@/types";

const panelClass =
  "rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]";

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-[#e4f1e8] text-[#1e5c3e]";
    case "in_progress":
      return "bg-[#e0edff] text-[#1e4db7]";
    case "accepted":
      return "bg-[#e0f5f0] text-[#0f7564]";
    case "pending":
      return "bg-[#fdf3dc] text-[#8a6010]";
    case "delivered":
    case "review":
      return "bg-[#ede0f5] text-[#6b2497]";
    case "revision":
      return "bg-[#fde8d5] text-[#8a4a10]";
    case "cancelled":
      return "bg-[#fce8e6] text-[#8b2a22]";
    default:
      return "bg-[#e8eae8] text-[#5a6a62]";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [ordersPage, setOrdersPage] = useState(0);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [submissionTarget, setSubmissionTarget] = useState<{ order: Order; deliverable: OrderDeliverable } | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionNote, setSubmissionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingReceiptIds, setDownloadingReceiptIds] = useState<Set<string>>(new Set());
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());
  const [reviewTarget, setReviewTarget] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState<Order | null>(null);
  const [disputeTitle, setDisputeTitle] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const loadOrders = async (status?: string, append = false, page = 0) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    try {
      const statusFilter = (!status || status === 'all') ? undefined : status as Order['status'];
      const result = await ordersService.getAll({ status: statusFilter, page, limit: 20 });
      setOrders((prev) => append ? [...prev, ...result.orders] : result.orders);
      setReviewedOrderIds((prev) => {
        const next = new Set(prev);
        result.orders.forEach((o) => { if (o.hasReviewedByCreator) next.add(o.id); });
        return next;
      });
      setHasMoreOrders(result.hasMore);
      setOrdersPage(page);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load orders";
      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  useEffect(() => {
    const status = searchParams.get('status');
    const allowed = new Set(['all', 'pending', 'accepted', 'in_progress', 'delivered', 'review', 'revision', 'completed', 'cancelled']);
    const next = status && allowed.has(status) ? status : 'all';
    setStatusFilter(next);
    void loadOrders(next, false, 0);
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
    setSubmissionFile(null);
    setSubmissionNote("");
  };

  const submitDeliverable = async () => {
    if (!submissionTarget) return;
    setIsSubmitting(true);
    try {
      if (!submissionFile) {
        toast.error("Choose a deliverable file.");
        return;
      }
      const uploaded = await uploadsService.deliverable(
        submissionFile,
        submissionTarget.order.id,
        submissionTarget.deliverable.id,
      );
      const fileUrl = uploaded.url;

      if (!fileUrl) {
        toast.error("Upload did not return a file URL.");
        return;
      }

      await ordersService.submitDeliverable(submissionTarget.order.id, submissionTarget.deliverable.id, {
        fileUrl,
        note: submissionNote.trim(),
      });
      await loadOrders();
      setSubmissionTarget(null);
      setSubmissionFile(null);
      setSubmissionNote("");
      toast.success("Deliverable submitted. The order moves to review after all items are submitted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit deliverable";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (order: Order) => {
    setDownloadingReceiptIds((prev) => new Set(prev).add(order.id));
    try {
      const blob = await ordersService.downloadReceipt(order.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${order.orderNumber || order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not download receipt");
    } finally {
      setDownloadingReceiptIds((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
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
      setReviewedOrderIds((prev) => new Set(prev).add(reviewTarget.id));
      setReviewTarget(null);
      toast.success("Review submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const openBrandMessages = async (order: Order) => {
    if (!user || user.role !== "creator") {
      router.push("/creator/messages");
      return;
    }

    try {
      const convResult = await messagesService.getConversations(user.id, "creator");
      const convList = 'items' in convResult ? convResult.items : (convResult as unknown as import("@/types").Conversation[]);
      const conversation = await messagesService.openBrandConversation(order.brandId, convList);
      router.push(`/creator/messages?conversation=${conversation.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open conversation");
      router.push("/creator/messages");
    }
  };

  const handleOpenDispute = async () => {
    if (!disputeTarget || !disputeTitle.trim() || !disputeDesc.trim()) return;
    setIsSubmittingDispute(true);
    try {
      await disputesService.openDispute({
        orderId: disputeTarget.id,
        title: disputeTitle.trim(),
        description: disputeDesc.trim(),
      });
      toast.success('Dispute opened. Our team will review it shortly.');
      setDisputeTarget(null);
      setDisputeTitle('');
      setDisputeDesc('');
    } catch {
      toast.error('Failed to open dispute. Please try again.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  return (
    <div className="min-h-full bg-[#fbfaf5] px-4 pb-8 pt-2 text-[#1e3d2e] sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-[1320px] space-y-4">

        {/* ── Stat strip ── */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <CreatorMetricCard dark title="Active" value={orderCounts.in_progress + orderCounts.accepted} sub="accepted or in progress" Icon={Package} />
          <CreatorMetricCard title="In Review" value={orderCounts.review} sub="awaiting brand feedback" Icon={Clock} />
          <CreatorMetricCard title="Completed" value={orderCounts.completed} sub="finished orders" Icon={CheckCircle} />
          <CreatorMetricCard gold title="Total Orders" value={orderCounts.all} sub="all creator orders" Icon={Layers} />
        </div>

        {/* Filter panel */}
        <div className={`${panelClass} p-4`}>
          {/* Status pill tabs */}
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => updateStatusFilterWithUrl(tab.key)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                  statusFilter === tab.key
                    ? "bg-[#2d6b4e] text-white"
                    : "bg-[#f4f7f5] text-[#6b7870] hover:bg-[#e6eceb]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87938b]" />
            <Input
              type="text"
              placeholder="Search orders..."
              className="h-10 rounded-xl border-[#d1ddd6] bg-[#f4f7f5] pl-9 text-[#1e3d2e] placeholder:text-[#87938b] focus-visible:ring-[#2d6b4e]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`${panelClass} animate-pulse p-4 sm:p-5`}>
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-[#e8eae8]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded-full bg-[#e8eae8]" />
                    <div className="h-3 w-1/2 rounded-full bg-[#e8eae8]" />
                    <div className="h-3 w-1/4 rounded-full bg-[#e8eae8]" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-4 w-16 rounded-full bg-[#e8eae8]" />
                    <div className="h-3 w-12 rounded-full bg-[#e8eae8]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order cards */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="space-y-3">
            {filteredOrders.map((order, index) => {
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
                  className={`${panelClass} cursor-pointer transition-all ${isExpanded ? "ring-2 ring-[#2d6b4e]" : ""}`}
                  onClick={() => setSelectedOrder(isExpanded ? null : order.id)}
                >
                  {/* Card header */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left side */}
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar className="h-11 w-11 shrink-0 rounded-xl">
                          <AvatarImage src={order.brand.logo} alt={order.brand.name} />
                          <AvatarFallback className="rounded-xl bg-[#e0ede6] text-[#2d6b4e] text-xs font-bold">
                            {getInitials(order.brand.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-[#1e3d2e]">{order.brand.name}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${getStatusColor(order.status)}`}>
                              <StatusIcon className="h-3 w-3" />
                              {order.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-[#87938b]">{order.package.title}</p>
                          <p className="mt-0.5 text-xs text-[#b0bcb5]">
                            Order {order.orderNumber || order.id} &bull; {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Right side */}
                      <div className="shrink-0 text-right">
                        <p className="font-extrabold text-[#2d6b4e]">
                          {formatPrice(order.amount ?? order.package.price ?? 0)}
                        </p>
                        {daysRemaining !== null && (
                          <p
                            className={`mt-0.5 text-xs font-medium ${
                              daysRemaining <= 1
                                ? "text-[#c0392b]"
                                : daysRemaining <= 3
                                  ? "text-[#e6aa38]"
                                  : "text-[#87938b]"
                            }`}
                          >
                            {daysRemaining > 0
                              ? `${daysRemaining}d left`
                              : daysRemaining === 0
                                ? "Due today"
                                : "Overdue"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 border-t border-[#e8eeeb] pt-4"
                      >
                        {/* Description */}
                        {(order.message || order.package.description) && (
                          <div className="mb-4">
                            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#87938b]">Description</p>
                            <p className="text-sm text-[#6b7870]">
                              {order.message || order.package.description}
                            </p>
                          </div>
                        )}

                        {/* Progress bar */}
                        <div className="mb-4">
                          <div className="mb-1.5 flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#87938b]">Progress</p>
                            <span className="text-xs font-bold text-[#2d6b4e]">{progress}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#e6eceb] overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-[#2d6b4e]"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                          </div>
                        </div>

                        {/* Deliverables */}
                        <div className="mb-4">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#87938b]">Deliverables</p>
                          <div className="space-y-2">
                            {deliverables.map((deliverable) => {
                              const deliverableStatus = deliverable.status;
                              const DeliverableIcon = getStatusIcon(deliverableStatus);
                              return (
                                <div
                                  key={deliverable.id}
                                  className="flex flex-col gap-3 rounded-xl bg-[#f4f7f5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                      <DeliverableIcon
                                        className={`h-4 w-4 shrink-0 ${
                                          deliverableStatus === "completed" || deliverableStatus === "approved"
                                            ? "text-[#1e5c3e]"
                                            : deliverableStatus === "in_progress"
                                              ? "text-[#1e4db7]"
                                              : deliverableStatus === "revision"
                                                ? "text-[#8a4a10]"
                                                : "text-[#87938b]"
                                        }`}
                                      />
                                      <span className="text-sm text-[#1e3d2e]">{deliverable.name}</span>
                                    </div>
                                    {deliverableStatus === "revision" && deliverable.revisionNote && (
                                      <p className="ml-6 text-xs text-[#8a4a10]">
                                        <span className="font-bold">Feedback:</span> {deliverable.revisionNote}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {deliverable.fileUrl && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full border-[#d1ddd6] text-[#2d6b4e] hover:bg-[#e6eceb]"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          void downloadFile(deliverable.fileUrl!, deliverable.name).catch((error) =>
                                            toast.error(error instanceof Error ? error.message : "Could not download file"),
                                          );
                                        }}
                                      >
                                        View
                                      </Button>
                                    )}
                                    {(order.status === "in_progress" || order.status === "revision") &&
                                      (deliverableStatus === "pending" || deliverableStatus === "in_progress" || deliverableStatus === "revision") &&
                                      !deliverable.id.startsWith("fallback-") && (
                                        <Button
                                          size="sm"
                                          className="rounded-full bg-[#2d6b4e] font-bold text-white hover:bg-[#1f5239]"
                                          onClick={(e) => { e.stopPropagation(); openSubmitDialog(order, deliverable); }}
                                        >
                                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                                          Submit
                                        </Button>
                                      )}
                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${getStatusColor(deliverableStatus)}`}>
                                      {deliverableStatus.replace("_", " ")}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Leave a review prompt for completed orders */}
                        {order.status === "completed" && !reviewedOrderIds.has(order.id) && (
                          <div className="mt-1 rounded-[1.15rem] bg-[#e7f0ea] p-4">
                            <div className="mb-2 flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-[#e6aa38] text-[#e6aa38]" />
                              ))}
                            </div>
                            <p className="text-sm font-bold text-[#185c39]">Order complete — share how working with this brand went.</p>
                            <Button
                              className="mt-3 rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b]"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setReviewTarget(order); setReviewRating(5); setReviewComment(""); }}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Review Brand
                            </Button>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 rounded-full border-[#d1ddd6] font-bold text-[#2d6b4e] hover:bg-[#e6eceb]"
                            onClick={(e) => { e.stopPropagation(); void openBrandMessages(order); }}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Message Brand
                          </Button>
                          {order.status !== 'pending' && order.status !== 'completed' && order.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1.5 rounded-xl border border-red-200 px-3 text-[11px] font-semibold text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                              onClick={(e) => { e.stopPropagation(); setDisputeTarget(order); }}
                            >
                              <AlertTriangle className="size-3" />
                              Dispute
                            </Button>
                          )}
                          {order.status === "completed" && (
                            <Button
                              variant="outline"
                              className="flex-1 rounded-full border-[#d1ddd6] font-bold text-[#2d6b4e] hover:bg-[#e6eceb]"
                              disabled={downloadingReceiptIds.has(order.id)}
                              onClick={(e) => { e.stopPropagation(); void handleDownloadReceipt(order); }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {downloadingReceiptIds.has(order.id) ? "Downloading…" : "Download Receipt"}
                            </Button>
                          )}
                          {order.status === "pending" ? (
                            <Button
                              className="flex-1 rounded-full bg-[#2d6b4e] font-bold text-white hover:bg-[#1f5239]"
                              onClick={(e) => { e.stopPropagation(); void updateOrderStatus(order.id, "accepted"); }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Accept
                            </Button>
                          ) : order.status === "accepted" ? (
                            <Button
                              className="flex-1 rounded-full bg-[#2d6b4e] font-bold text-white hover:bg-[#1f5239]"
                              onClick={(e) => { e.stopPropagation(); void updateOrderStatus(order.id, "in_progress"); }}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Start Work
                            </Button>
                          ) : order.status === "in_progress" ? (
                            <Button
                              className="flex-1 rounded-full bg-[#2d6b4e] font-bold text-white hover:bg-[#1f5239]"
                              onClick={(e) => { e.stopPropagation(); openSubmitDialog(order); }}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Submit Deliverable
                            </Button>
                          ) : null}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredOrders.length === 0 && (
          <div className={`${panelClass} flex flex-col items-center justify-center py-16 text-center`}>
            <Package className="mb-4 h-12 w-12 text-[#87938b]" />
            <h3 className="mb-1 text-lg font-extrabold text-[#1e3d2e]">No orders found</h3>
            <p className="text-sm text-[#87938b]">No orders match your current filters.</p>
          </div>
        )}

        {/* Load more */}
        {hasMoreOrders && !isLoading && (
          <div className="flex justify-center pt-2">
            <button
              disabled={isLoadingMore}
              onClick={() => void loadOrders(statusFilter, true, ordersPage + 1)}
              className="rounded-full border border-[#d1ddd6] bg-white px-6 py-2.5 text-sm font-bold text-[#2d6b4e] transition-colors hover:bg-[#e6eceb] disabled:opacity-50"
            >
              {isLoadingMore ? "Loading…" : "Load more orders"}
            </button>
          </div>
        )}
      </div>

      {/* Submit deliverable dialog */}
      <Dialog open={Boolean(submissionTarget)} onOpenChange={(open) => !open && setSubmissionTarget(null)}>
        <DialogContent className="max-w-lg overflow-hidden rounded-[1.6rem] p-0">
          {/* Dark header strip */}
          <div className="bg-[#1e3d2e] px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-white">Submit Deliverable</DialogTitle>
              <DialogDescription className="text-[#87c4a3]">
                {submissionTarget?.deliverable.name || "Deliverable"} will be sent to the brand for review.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="deliverable-file" className="text-sm font-bold text-[#1e3d2e]">
                Upload file
              </Label>
              <label
                htmlFor="deliverable-file"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#cddad1] bg-[#fbfaf5] p-4 text-center transition-colors hover:bg-[#f0f5f2]"
              >
                <Upload className="h-6 w-6 text-[#87938b]" />
                <span className="text-sm text-[#6b7870]">
                  {submissionFile ? submissionFile.name : "Click to choose a file"}
                </span>
                <input
                  id="deliverable-file"
                  type="file"
                  className="sr-only"
                  onChange={(event) => setSubmissionFile(event.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverable-note" className="text-sm font-bold text-[#1e3d2e]">
                Note
              </Label>
              <Textarea
                id="deliverable-note"
                rows={4}
                value={submissionNote}
                onChange={(event) => setSubmissionNote(event.target.value)}
                placeholder="Add context for the brand"
                className="resize-none rounded-xl border-[#cddad1] bg-[#fbfaf5] text-[#1e3d2e] placeholder:text-[#87938b] focus-visible:ring-[#2d6b4e]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                className="rounded-full border-[#d1ddd6] font-bold text-[#6b7870] hover:bg-[#f4f7f5]"
                onClick={() => setSubmissionTarget(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="rounded-full bg-[#2d6b4e] font-bold text-white hover:bg-[#1f5239]"
                onClick={() => void submitDeliverable()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute dialog */}
      <Dialog open={!!disputeTarget} onOpenChange={(open) => { if (!open) { setDisputeTarget(null); setDisputeTitle(''); setDisputeDesc(''); } }}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#173b2a]">Open a Dispute</DialogTitle>
            <DialogDescription>
              Describe the issue with order{' '}
              <span className="font-semibold">{disputeTarget?.orderNumber ?? disputeTarget?.id?.slice(0, 8)}</span>.
              Our team will review and respond within 48&nbsp;hours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="dispute-title" className="text-sm font-semibold text-[#173b2a]">
                Issue Title
              </Label>
              <Input
                id="dispute-title"
                className="mt-1.5"
                placeholder="e.g. Deliverable not submitted after deadline"
                value={disputeTitle}
                onChange={(e) => setDisputeTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dispute-desc" className="text-sm font-semibold text-[#173b2a]">
                Description
              </Label>
              <Textarea
                id="dispute-desc"
                className="mt-1.5 min-h-[100px] resize-none"
                placeholder="Provide as much detail as possible about the issue..."
                value={disputeDesc}
                onChange={(e) => setDisputeDesc(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => { setDisputeTarget(null); setDisputeTitle(''); setDisputeDesc(''); }}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
              disabled={!disputeTitle.trim() || !disputeDesc.trim() || isSubmittingDispute}
              onClick={() => void handleOpenDispute()}
            >
              {isSubmittingDispute ? 'Submitting…' : 'Submit Dispute'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review brand dialog */}
      <Dialog open={Boolean(reviewTarget)} onOpenChange={(open) => !open && setReviewTarget(null)}>
        <DialogContent className="max-w-[calc(100%-1rem)] rounded-[1.5rem] border-[#d9e0d8] bg-[#fbfaf5] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-[-0.04em] text-[#1e3d2e]">Review brand</DialogTitle>
            <DialogDescription className="font-bold text-[#647168]">
              Rate {reviewTarget?.brand.name || "this brand"} for the completed order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-black text-[#1e3d2e]">Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewRating(rating)}
                    aria-label={`${rating} star rating`}
                    className="rounded-full p-1 hover:bg-[#e6eceb]"
                  >
                    <Star className={`h-5 w-5 ${rating <= reviewRating ? "fill-[#e6aa38] text-[#e6aa38]" : "text-[#9aa49d]"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-review-comment" className="font-black text-[#1e3d2e]">Comment</Label>
              <Textarea
                id="brand-review-comment"
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share how working with this brand went"
                className="rounded-2xl border-[#d9e0d8] bg-white focus-visible:ring-[#2d6b4e]/20"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-full border-[#d9e0d8] bg-white font-black text-[#2d6b4e] hover:bg-[#e6eceb]"
                onClick={() => setReviewTarget(null)}
                disabled={isSubmittingReview}
              >
                Cancel
              </Button>
              <Button
                className="rounded-full bg-[#2d6b4e] font-black text-white hover:bg-[#1f5239]"
                onClick={() => void submitReview()}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? "Submitting…" : "Submit review"}
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
    <Suspense fallback={<div className="min-h-full bg-[#fbfaf5] px-4 pb-8 pt-2 sm:px-6 lg:px-8 lg:pb-12" />}>
      <CreatorOrdersPageContent />
    </Suspense>
  );
}
