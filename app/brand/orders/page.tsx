"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle,
  Clock,
  Download,
  Eye,
  MessageCircle,
  MoreVertical,
  Package,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { disputesService } from '@/services/disputes.service';
import type { Order, OrderDeliverable, OrderStatus } from "@/types";
import { downloadFile, isProtectedFileUrl } from "@/lib/download-file";
import { cn } from "@/lib/utils";

const statusTabs = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "Working" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Done" },
  { value: "revision", label: "Revision" },
  { value: "cancelled", label: "Cancelled" },
];

const statusTone: Record<string, string> = {
  approved: "bg-[#e7f0ea] text-[#185c39] ring-[#bcd3c5]",
  completed: "bg-[#e7f0ea] text-[#185c39] ring-[#bcd3c5]",
  in_progress: "bg-[#e7f0ea] text-[#185c39] ring-[#bcd3c5]",
  accepted: "bg-[#e7f0ea] text-[#185c39] ring-[#bcd3c5]",
  pending: "bg-[#fff1cd] text-[#8b5e12] ring-[#efcf83]",
  delivered: "bg-[#f5e7cf] text-[#8b5e12] ring-[#e6c792]",
  review: "bg-[#f5e7cf] text-[#8b5e12] ring-[#e6c792]",
  revision: "bg-[#fff1cd] text-[#8b5e12] ring-[#efcf83]",
  cancelled: "bg-[#f9ebe8] text-[#9d3c36] ring-[#e8c8c2]",
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
      return RefreshCw;
    case "cancelled":
      return XCircle;
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

const areAllDeliverablesApproved = (order: Order) => {
  const deliverables = getOrderDeliverables(order);
  return deliverables.length > 0 && deliverables.every((deliverable) => deliverable.status === "completed" || deliverable.status === "approved");
};

function HeroStat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-[1.15rem] border border-white/12 bg-white/8 px-2.5 py-2.5 backdrop-blur sm:px-4 sm:py-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden size-9 shrink-0 place-items-center rounded-2xl bg-[#e6aa38] text-[#173b2a] sm:grid">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#d4e0d8] sm:text-[10px] sm:tracking-[0.15em]">{label}</p>
          <p className="mt-0.5 truncate text-base font-black tracking-[-0.04em] text-white sm:text-lg">{value}</p>
        </div>
      </div>
    </div>
  );
}

function BrandOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const deepLinkOrderId = searchParams.get("orderId");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(deepLinkOrderId);
  const deepLinkScrolledRef = useRef(false);
  const [reviewTarget, setReviewTarget] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [revisionTarget, setRevisionTarget] = useState<{ orderId: string; deliverableId: string; deliverableName: string } | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [downloadingReceiptIds, setDownloadingReceiptIds] = useState<Set<string>>(new Set());
  const [disputeTarget, setDisputeTarget] = useState<Order | null>(null);
  const [disputeTitle, setDisputeTitle] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const loadOrders = async (nextPage = 0, append = false, status?: string) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    try {
      const statusParam = (!status || status === 'all') ? undefined : status as import('@/types').OrderStatus;
      const result = await ordersService.getAll({ page: nextPage, limit: 20, status: statusParam });
      setOrders(append ? (prev) => [...prev, ...result.orders] : result.orders);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load orders";
      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadOrders(0, false, statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    if (deepLinkOrderId && orders.length > 0 && !deepLinkScrolledRef.current) {
      const el = document.getElementById(`order-${deepLinkOrderId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        deepLinkScrolledRef.current = true;
      }
    }
  }, [deepLinkOrderId, orders]);

  const filteredOrders = orders.filter((order) => {
    const creatorName = order.creator.name.toLowerCase();
    const packageName = order.package.title.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = creatorName.includes(query) || packageName.includes(query);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter || (statusFilter === "review" && order.status === "delivered");
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

  const totalSpend = useMemo(() => orders.reduce((sum, order) => sum + (order.amount ?? order.package.price ?? 0), 0), [orders]);
  const activeOrders = orderCounts.accepted + orderCounts.in_progress + orderCounts.review + orderCounts.revision;
  const nextDueOrder = useMemo(() => {
    return [...orders]
      .filter((order) => !["completed", "cancelled"].includes(order.status))
      .sort((a, b) => getFallbackDeadline(a).getTime() - getFallbackDeadline(b).getTime())[0];
  }, [orders]);

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

  const updateDeliverableStatus = async (orderId: string, deliverableId: string, status: OrderDeliverable["status"], comment?: string) => {
    try {
      await ordersService.updateDeliverableStatus(orderId, deliverableId, status, comment);
      await loadOrders(0, false, statusFilter);
      toast.success(`Deliverable marked ${status.replace("_", " ")}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update deliverable";
      toast.error(message);
    }
  };

  const confirmBarterReceipt = async (orderId: string) => {
    try {
      const updated = await ordersService.confirmBarterReceipt(orderId);
      if (updated) {
        setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
      }
      toast.success("Barter product receipt confirmed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to confirm receipt");
    }
  };

  const submitRevision = async () => {
    if (!revisionTarget) return;
    setIsSubmittingRevision(true);
    try {
      await ordersService.updateDeliverableStatus(revisionTarget.orderId, revisionTarget.deliverableId, "revision", revisionNote.trim() || undefined);
      await loadOrders(0, false, statusFilter);
      setRevisionTarget(null);
      setRevisionNote("");
      toast.success("Revision requested");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to request revision";
      toast.error(message);
    } finally {
      setIsSubmittingRevision(false);
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
      setOrders((prev) => prev.map((o) => o.id === reviewTarget.id ? { ...o, hasReviewedByBrand: true } : o));
      setReviewTarget(null);
      toast.success("Review submitted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit review";
      toast.error(message);
    } finally {
      setIsSubmittingReview(false);
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
    <div className="min-h-screen bg-[#fbfaf5]">
      <div className="mx-auto max-w-7xl px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-8">
        <section className="overflow-hidden rounded-[2rem] border border-[#d9e0d8] bg-[#173b2a] text-white shadow-[0_24px_80px_rgba(23,59,42,0.14)]">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-5 sm:p-6 lg:p-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#f0c56e]">
                <Sparkles className="size-3.5" />
                Collaboration pipeline
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                <HeroStat label="Active" value={String(activeOrders)} icon={TrendingUp} />
                <HeroStat label="Review" value={String(orderCounts.review)} icon={Eye} />
                <HeroStat label="Spend" value={totalSpend ? formatPrice(totalSpend) : "Rs 0"} icon={Wallet} />
              </div>
            </div>
            <aside className="hidden border-t border-white/10 bg-white/[0.06] p-5 sm:block sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
              <div className="rounded-[1.35rem] border border-white/12 bg-[#102d20]/60 p-4">
                <p className="text-lg font-black tracking-[-0.04em] text-white">
                  {nextDueOrder ? nextDueOrder.package.title : "No urgent delivery"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#c7d8ce]">
                  {nextDueOrder
                    ? `${nextDueOrder.creator.name} is due by ${formatDate(getFallbackDeadline(nextDueOrder))}.`
                    : "New campaign orders will surface here when creators start work."}
                </p>
              </div>
              <Button asChild className="mt-4 w-full rounded-full bg-[#e6aa38] font-black text-[#173b2a] hover:bg-[#f0bb55]">
                <Link href="/brand/explore">
                  Find more creators <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </aside>
          </div>
        </section>

        <section className="mt-4 rounded-[1.5rem] border border-[#d9e0d8] bg-white p-3 shadow-[0_16px_54px_rgba(38,70,50,0.06)] sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#b77a12]">Search orders</p>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b867f]" />
                <Input
                  type="text"
                  placeholder="Search creator, tasting package, reel, cafe launch..."
                  className="h-12 rounded-full border-[#d9e0d8] bg-[#f4f2e9] pl-12 text-base font-bold text-[#173b2a] placeholder:text-[#7c8a82] focus-visible:ring-[#185c39]/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 rounded-full border-[#d9e0d8] bg-[#fbfaf5] font-black text-[#185c39] lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusTabs.map((tab) => (
                  <SelectItem key={tab.value} value={tab.value}>
                    {tab.label} ({orderCounts[tab.value as keyof typeof orderCounts] ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </section>

        <section className="mt-4 space-y-3">
          {isLoading && (
            <div className="rounded-[1.5rem] border border-[#d9e0d8] bg-white p-6 text-center text-sm font-bold text-[#647168] shadow-[0_14px_45px_rgba(38,70,50,0.055)]">
              Loading orders...
            </div>
          )}

          {!isLoading && filteredOrders.map((order, index) => {
            const StatusIcon = getStatusIcon(order.status);
            const isExpanded = selectedOrder === order.id;
            const deadline = getFallbackDeadline(order);
            const progress = order.progress ?? (order.status === "completed" ? 100 : order.status === "pending" ? 0 : 50);
            const isCancelled = order.status === "cancelled";
            const deliverables = getOrderDeliverables(order);

            return (
              <motion.article
                id={`order-${order.id}`}
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "rounded-[1.45rem] border bg-white shadow-[0_14px_45px_rgba(38,70,50,0.055)] transition hover:-translate-y-0.5 hover:border-[#b7c8bd] hover:shadow-[0_22px_70px_rgba(38,70,50,0.10)]",
                  isExpanded ? "border-[#185c39] ring-4 ring-[#185c39]/10" : "border-[#d9e0d8]",
                  deepLinkOrderId === order.id ? "ring-4 ring-[#e6aa38]/40" : "",
                )}
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="block w-full cursor-pointer p-4 text-left sm:p-5"
                  onClick={() => setSelectedOrder(isExpanded ? null : order.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedOrder(isExpanded ? null : order.id); } }}
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-12 border border-[#d9e0d8]">
                          <AvatarImage src={order.creator.avatar} alt={order.creator.name} />
                          <AvatarFallback className="bg-[#185c39] font-black text-white">{getInitials(order.creator.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/creator/${order.creatorId}`}
                              className="line-clamp-1 text-lg font-black tracking-[-0.04em] text-[#173b2a] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.creator.name}
                            </Link>
                            <Badge className={cn("rounded-full px-2.5 py-1 text-[11px] font-black capitalize ring-1", statusTone[order.status] || "bg-[#eef2eb] text-[#526259]")}>
                              <StatusIcon className="mr-1 size-3" />
                              {order.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="mt-1 line-clamp-1 text-sm font-bold text-[#647168]">{order.package.title}</p>
                          <p className="mt-1 text-xs font-bold text-[#8a958d]">
                            Order {order.orderNumber || order.id} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold text-[#607168] sm:grid-cols-3">
                        <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
                          <Wallet className="size-4 text-[#185c39]" />
                          {formatPrice(order.amount ?? order.package.price ?? 0)}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
                          <CalendarClock className="size-4 text-[#185c39]" />
                          Due {formatDate(deadline)}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
                          <Package className="size-4 text-[#185c39]" />
                          {deliverables.length} deliverables
                        </span>
                      </div>
                    </div>

                    <div className={cn("space-y-3 rounded-[1.2rem] p-3", isCancelled ? "border border-[#e8c8c2] bg-[#fdf5f3]" : "bg-[#fbfaf5]")}>
                      <div className="flex items-center justify-between gap-3">
                        {isCancelled ? (
                          <div className="flex items-center gap-2 text-sm font-black text-[#7f2f2a]">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f9ebe8] text-[#9d3c36]">
                              <XCircle className="size-4" />
                            </span>
                            Progress unavailable
                          </div>
                        ) : (
                          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#7b867f]">Progress</p>
                        )}
                        <div className="flex items-center gap-2">
                          {!isCancelled && <span className="text-sm font-black text-[#173b2a]">{progress}%</span>}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "size-8 rounded-full",
                                  isCancelled ? "text-[#9d3c36] hover:bg-[#f9ebe8] hover:text-[#7f2f2a]" : "text-[#607168] hover:bg-[#e7f0ea] hover:text-[#185c39]",
                                )}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => router.push(`/brand/messages?order=${order.id}`)}>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Message Creator
                              </DropdownMenuItem>
                              {order.status === "pending" && (
                                <DropdownMenuItem onSelect={() => updateOrderStatus(order.id, "cancelled")}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel Order
                                </DropdownMenuItem>
                              )}
                              {(order.status === "delivered" || order.status === "review") && areAllDeliverablesApproved(order) && (
                                <DropdownMenuItem onSelect={() => updateOrderStatus(order.id, "completed")}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve & release payment
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {!isCancelled && (
                        <>
                          <Progress value={progress} className="h-2 bg-[#e6ece6]" />
                          <p className="text-xs font-bold text-[#718077]">Tap row for delivery details</p>
                        </>
                      )}
                      {isCancelled && order.cancellationNote && (
                        <p className="line-clamp-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-bold leading-5 text-[#7f2f2a]">
                          <span className="font-black">Note:</span> {order.cancellationNote}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-[#edf0eb] px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                    <p className="rounded-[1.15rem] bg-[#fbfaf5] p-3 text-sm leading-6 text-[#647168]">
                      {order.message || order.package.description}
                    </p>

                    <div className="mt-4">
                      <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#b77a12]">Deliverables</p>
                      <div className="grid gap-2">
                        {deliverables.map((deliverable) => {
                          const deliverableStatus = deliverable.status;
                          const DeliverableIcon = isCancelled ? XCircle : getStatusIcon(deliverableStatus);
                          return (
                            <div
                              key={deliverable.id}
                              className={cn(
                                "flex flex-col gap-3 rounded-[1rem] p-3 sm:flex-row sm:items-center sm:justify-between",
                                isCancelled ? "bg-[#fdf5f3]" : "bg-[#fbfaf5]",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <DeliverableIcon className={cn("size-4", isCancelled ? "text-[#9d3c36]" : "text-[#185c39]")} />
                                <span className="text-sm font-bold text-[#173b2a]">{deliverable.name}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {deliverable.fileUrl && (
                                  <Button variant="outline" size="sm" className="rounded-full border-[#d9e0d8] bg-white font-black text-[#185c39] hover:bg-[#e7f0ea]" onClick={(e) => {
                                    e.stopPropagation();
                                    void downloadFile(deliverable.fileUrl!, deliverable.name).catch((error) =>
                                      toast.error(error instanceof Error ? error.message : "Could not download file"),
                                    );
                                  }}>
                                    {isProtectedFileUrl(deliverable.fileUrl) ? "View file" : "View post"}
                                  </Button>
                                )}
                                {deliverableStatus === "review" && !deliverable.id.startsWith("fallback-") && (
                                  <>
                                    <Button size="sm" className="rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b]" onClick={(e) => {
                                      e.stopPropagation();
                                      void updateDeliverableStatus(order.id, deliverable.id, "completed");
                                    }}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve
                                    </Button>
                                    <Button variant="outline" size="sm" className="rounded-full border-[#d9e0d8] bg-white font-black text-[#185c39] hover:bg-[#e7f0ea]" onClick={(e) => {
                                      e.stopPropagation();
                                      setRevisionTarget({ orderId: order.id, deliverableId: deliverable.id, deliverableName: deliverable.name });
                                      setRevisionNote("");
                                    }}>
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Revision
                                    </Button>
                                  </>
                                )}
                                <Badge
                                  className={cn(
                                    "rounded-full px-2.5 py-1 text-[11px] font-black capitalize ring-1",
                                    isCancelled ? "bg-[#f9ebe8] text-[#9d3c36] ring-[#e8c8c2]" : statusTone[deliverableStatus] || "bg-[#eef2eb] text-[#526259]",
                                  )}
                                >
                                  {isCancelled ? "Unavailable" : deliverableStatus.replace("_", " ")}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {order.status === "completed" && !order.hasReviewedByBrand && (
                      <div className="mt-4 rounded-[1.15rem] bg-[#e7f0ea] p-4">
                        <div className="mb-2 flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-[#e6aa38] text-[#e6aa38]" />
                          ))}
                        </div>
                        <p className="text-sm font-bold text-[#185c39]">Delivery approved. Share a review to update this creator&apos;s rating.</p>
                        <Button className="mt-3 rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b]" size="sm" onClick={() => openReviewDialog(order)}>
                          <Star className="mr-2 h-4 w-4" />
                          Leave Review
                        </Button>
                      </div>
                    )}

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Button variant="outline" className="rounded-full border-[#d9e0d8] bg-white font-black text-[#185c39] hover:bg-[#e7f0ea]" asChild>
                        <Link href={`/brand/messages?order=${order.id}`}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message
                        </Link>
                      </Button>
                      {order.status !== 'pending' && order.status !== 'completed' && order.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 rounded-xl border border-red-200 px-3 text-[11px] font-semibold text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setDisputeTarget(order)}
                        >
                          <AlertTriangle className="size-3" />
                          Dispute
                        </Button>
                      )}
                      {order.status === "completed" && (
                        <Button
                          variant="outline"
                          className="rounded-full border-[#d9e0d8] bg-white font-black text-[#185c39] hover:bg-[#e7f0ea]"
                          disabled={downloadingReceiptIds.has(order.id)}
                          onClick={() => void handleDownloadReceipt(order)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {downloadingReceiptIds.has(order.id) ? "Downloading…" : "Download Receipt"}
                        </Button>
                      )}
                      {(order.status === "delivered" || order.status === "review") && areAllDeliverablesApproved(order) && (
                        <Button className="rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b]" onClick={() => updateOrderStatus(order.id, "completed")}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve & release payment
                        </Button>
                      )}
                      {(order.dealType === "barter" || order.dealType === "hybrid") && !order.barterProductReceived && order.status !== "cancelled" && (
                        <Button variant="outline" className="rounded-full border-[#e3a52f] bg-[#fdf3dc] font-black text-[#9b6712] hover:bg-[#f7e8c8]" onClick={() => confirmBarterReceipt(order.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirm Product Received
                        </Button>
                      )}
                      {(order.dealType === "barter" || order.dealType === "hybrid") && order.barterProductReceived && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f1e8] px-4 py-2 text-sm font-black text-[#185c39]">
                          <CheckCircle className="size-4" /> Product Received
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.article>
            );
          })}

          {!isLoading && filteredOrders.length === 0 && (
            <div className="rounded-[1.5rem] border border-dashed border-[#cdd7ce] bg-white p-6 text-center shadow-[0_14px_45px_rgba(38,70,50,0.055)]">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f4f2e9] text-[#b77a12]">
                <Package className="size-5" />
              </div>
              <h3 className="mt-4 text-xl font-black tracking-[-0.04em] text-[#173b2a]">No orders found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-[#647168]">
                No orders match your current filters. Start with a food creator and launch your next tasting brief.
              </p>
              <Button asChild className="mt-5 rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b]">
                <Link href="/brand/explore">Find Creators</Link>
              </Button>
            </div>
          )}

          {hasMore && !isLoading && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => void loadOrders(page + 1, true, statusFilter)}
                disabled={isLoadingMore}
                className="rounded-full border-[#d9e0d8] bg-white px-6 font-black text-[#185c39] hover:bg-[#e7f0ea]"
              >
                {isLoadingMore ? "Loading…" : "Load more orders"}
              </Button>
            </div>
          )}
        </section>

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
                <Label htmlFor="brand-dispute-title" className="text-sm font-semibold text-[#173b2a]">
                  Issue Title
                </Label>
                <Input
                  id="brand-dispute-title"
                  className="mt-1.5"
                  placeholder="e.g. Deliverable not submitted after deadline"
                  value={disputeTitle}
                  onChange={(e) => setDisputeTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="brand-dispute-desc" className="text-sm font-semibold text-[#173b2a]">
                  Description
                </Label>
                <Textarea
                  id="brand-dispute-desc"
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

        <Dialog open={Boolean(reviewTarget)} onOpenChange={(open) => !open && setReviewTarget(null)}>
          <DialogContent className="max-w-[calc(100%-1rem)] rounded-[1.5rem] border-[#d9e0d8] bg-[#fbfaf5] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-[-0.04em] text-[#173b2a]">Leave a review</DialogTitle>
              <DialogDescription className="font-bold text-[#647168]">
                Rate {reviewTarget?.creator.name || "this creator"} for the completed order.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-black text-[#173b2a]">Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button key={rating} type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => setReviewRating(rating)} aria-label={`${rating} star rating`}>
                      <Star className={cn("h-5 w-5", rating <= reviewRating ? "fill-[#e6aa38] text-[#e6aa38]" : "text-[#9aa49d]")} />
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-comment" className="font-black text-[#173b2a]">Comment</Label>
                <Textarea
                  id="review-comment"
                  rows={4}
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Share what went well"
                  className="rounded-2xl border-[#d9e0d8] bg-white focus-visible:ring-[#185c39]/20"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="rounded-full border-[#d9e0d8] bg-white font-black text-[#185c39] hover:bg-[#e7f0ea]" onClick={() => setReviewTarget(null)} disabled={isSubmittingReview}>
                  Cancel
                </Button>
                <Button className="rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b]" onClick={submitReview} disabled={isSubmittingReview}>
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(revisionTarget)} onOpenChange={(open) => !open && setRevisionTarget(null)}>
          <DialogContent className="max-w-[calc(100%-1rem)] rounded-[1.5rem] border-[#d9e0d8] bg-[#fbfaf5] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-[-0.04em] text-[#173b2a]">Request revision</DialogTitle>
              <DialogDescription className="font-bold text-[#647168]">
                {revisionTarget?.deliverableName ? `Describe what needs to change for "${revisionTarget.deliverableName}".` : "Describe what needs to change."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="revision-note" className="font-black text-[#173b2a]">Revision notes</Label>
                <Textarea
                  id="revision-note"
                  rows={4}
                  value={revisionNote}
                  onChange={(event) => setRevisionNote(event.target.value)}
                  placeholder="Explain what needs to be changed…"
                  className="rounded-2xl border-[#d9e0d8] bg-white focus-visible:ring-[#185c39]/20"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="rounded-full border-[#d9e0d8] bg-white font-black text-[#185c39] hover:bg-[#e7f0ea]" onClick={() => setRevisionTarget(null)} disabled={isSubmittingRevision}>
                  Cancel
                </Button>
                <Button className="rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b]" onClick={submitRevision} disabled={isSubmittingRevision || !revisionNote.trim()}>
                  {isSubmittingRevision ? "Sending…" : "Request Revision"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function BrandOrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfaf5]" />}>
      <BrandOrdersContent />
    </Suspense>
  );
}
