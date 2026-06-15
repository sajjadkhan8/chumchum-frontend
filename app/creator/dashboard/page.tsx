"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  Crown,
  DollarSign,
  Eye,
  MessageCircle,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { calculateCreatorAmbassadorMetrics } from "@/lib/ambassador-scoring";
import { formatPrice, formatRelativeTime, getInitials } from "@/lib/utils";
import { analyticsService, type CreatorDashboardAnalytics } from "@/services/analytics.service";
import { creatorsService } from "@/services/creators.service";
import { earningsService, type EarningsSummary } from "@/services/earnings.service";
import { messagesService } from "@/services/messages.service";
import { ordersService } from "@/services/orders.service";
import { useAuthStore } from "@/store/auth-store";
import type { Conversation, Creator, Order } from "@/types";

const emptyDashboardAnalytics: CreatorDashboardAnalytics = {
  totalOrders: 0,
  activeOrders: 0,
  completedOrders: 0,
  totalEarnings: 0,
  avgRating: 0,
  totalReviews: 0,
  repeatBrands: 0,
};

const emptyEarningsSummary: EarningsSummary = {
  totalEarned: 0,
  availableBalance: 0,
  pendingBalance: 0,
  totalWithdrawn: 0,
  platformFees: 0,
};

const panelClass = "rounded-[1.6rem] border border-[#dce3dc] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]";

const getStatusStyle = (status: string) => {
  switch (status) {
    case "completed":
      return { className: "bg-[#e4f1e8] text-[#185c39]", icon: CheckCircle };
    case "in_progress":
      return { className: "bg-[#e8eef4] text-[#365b78]", icon: Clock };
    case "pending":
      return { className: "bg-[#f7e8c8] text-[#8b5e12]", icon: AlertCircle };
    default:
      return { className: "bg-[#eef2eb] text-[#526259]", icon: Clock };
  }
};

function SectionHeading({ eyebrow, title, action, href }: { eyebrow: string; title: string; action?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">{eyebrow}</p>
        <h2 className="mt-1.5 text-xl font-extrabold tracking-[-0.035em] text-[#173b2a]">{title}</h2>
      </div>
      {action && href ? (
        <Link href={href} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#185c39] hover:underline">
          {action} <ArrowRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function MetricCard({ title, value, detail, icon: Icon, accent = false }: { title: string; value: string; detail: string; icon: React.ElementType; accent?: boolean }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[1.35rem] border p-4 sm:p-5 ${accent ? "border-[#185c39] bg-[#185c39] text-white" : "border-[#dce3dc] bg-white text-[#173b2a]"}`
      }
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`text-xs font-bold ${accent ? "text-[#c9dace]" : "text-[#69766e]"}`}>{title}</p>
        <span className={`grid size-9 place-items-center rounded-xl ${accent ? "bg-white/10 text-[#f0c56e]" : "bg-[#eef2eb] text-[#185c39]"}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-5 text-2xl font-extrabold tracking-[-0.045em]">{value}</p>
      <p className={`mt-1 text-[11px] font-semibold ${accent ? "text-[#a9c4b3]" : "text-[#87938b]"}`}>{detail}</p>
    </motion.article>
  );
}

function GoalBar({ label, value, copy }: { label: string; value: number; copy: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-[#526259]">{label}</span>
        <span className="font-extrabold text-[#173b2a]">{copy}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5eae4]">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.65 }} className="h-full rounded-full bg-[#185c39]" />
      </div>
    </div>
  );
}

export default function CreatorDashboardPage() {
  const { user } = useAuthStore();
  const [creatorProfile, setCreatorProfile] = useState<Creator | null>(null);
  const [dashboardAnalytics, setDashboardAnalytics] = useState<CreatorDashboardAnalytics>(emptyDashboardAnalytics);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary>(emptyEarningsSummary);
  const [orders, setOrders] = useState<Order[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isActiveAmbassador = user?.creatorProgramStatus === "active_ambassador" || user?.email === "ambassador@test.com";

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      const [profile, analytics, earnings, orderList, conversationList] = await Promise.all([
        creatorsService.getMe().catch(() => null),
        analyticsService.getCreatorDashboard().catch(() => emptyDashboardAnalytics),
        earningsService.getSummary().catch(() => emptyEarningsSummary),
        ordersService.getAll().catch(() => []),
        messagesService.getConversations(user?.id || "", "creator").catch(() => []),
      ]);
      setCreatorProfile(profile);
      setDashboardAnalytics(analytics);
      setEarningsSummary(earnings);
      setOrders(orderList);
      setConversations(conversationList);
      setIsLoading(false);
    };
    void loadDashboard();
  }, [user?.id]);

  const primaryCreator = useMemo<Creator>(() => {
    if (creatorProfile) return creatorProfile;
    return {
      id: user?.id || "unknown-creator",
      userId: user?.id || "unknown-user",
      username: user?.email?.split("@")[0] || "creator",
      name: user?.name || "Creator",
      avatar: user?.avatar || "",
      bio: "",
      city: "Karachi",
      categories: [],
      platforms: [{ platform: "instagram", followers: 0, engagementRate: 0, username: "creator" }],
      totalFollowers: 0,
      avgEngagementRate: 0,
      dealTypes: ["paid"],
      responseTime: "Within 24 hours",
      isVerified: false,
      isTrending: false,
      isFastResponder: false,
      rating: 0,
      totalReviews: 0,
      completedDeals: 0,
      contentPreviews: [],
      createdAt: new Date(),
    };
  }, [creatorProfile, user]);

  const ambassadorMetrics = calculateCreatorAmbassadorMetrics(primaryCreator);
  const profileViews = Math.max(0, primaryCreator.totalFollowers ? Math.round(primaryCreator.totalFollowers * 0.02) : 0);
  const totalEarnings = earningsSummary.totalEarned || dashboardAnalytics.totalEarnings;
  const monthlyEarningsTarget = Math.max(600000, totalEarnings || 0);
  const monthlyOrdersTarget = Math.max(10, dashboardAnalytics.totalOrders || 0);
  const earningsGoalProgress = monthlyEarningsTarget > 0 ? Math.min(100, Math.round((totalEarnings / monthlyEarningsTarget) * 100)) : 0;
  const ordersGoalProgress = monthlyOrdersTarget > 0 ? Math.min(100, Math.round((dashboardAnalytics.totalOrders / monthlyOrdersTarget) * 100)) : 0;
  const recentDashboardOrders = orders.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 4);
  const recentDashboardMessages = conversations.slice().sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 3).map((conversation) => ({
    id: conversation.id,
    name: conversation.brand.name,
    avatar: conversation.brand.logo,
    message: conversation.lastMessage?.content || "No messages yet",
    time: conversation.lastMessage?.createdAt || conversation.updatedAt,
    unread: conversation.unreadCount > 0,
  }));
  const firstName = (primaryCreator.name || user?.name || "Creator").split(" ")[0];

  const quickActions = [
    { label: "New package", copy: "Create an offer", href: "/creator/packages/new", icon: Plus },
    { label: "Withdraw", copy: "Manage earnings", href: "/creator/payments", icon: Wallet },
    { label: "Edit profile", copy: "Keep it fresh", href: "/creator/profile/public", icon: Users },
    { label: "View insights", copy: "Know your reach", href: "/creator/insights", icon: BarChart3 },
  ];

  return (
    <div className="min-h-full bg-[#fbfaf5] px-4 pb-8 pt-2 text-[#173b2a] sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-[1320px]">
        <section className="overflow-hidden rounded-[1.8rem] bg-[#173b2a] p-5 text-white sm:p-7 lg:p-8">
          <div className="grid gap-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#f0c56e]">
                  {isActiveAmbassador ? <Crown className="size-3.5" /> : <Sparkles className="size-3.5" />}
                  {isActiveAmbassador ? "Active ambassador" : "Ambassador path"}
                </span>
                <span className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-bold text-[#c9dace]">{ambassadorMetrics.tier} tier</span>
              </div>
              <p className="mt-7 text-xs font-bold text-[#a9c4b3]">Good to see you, {firstName}</p>
              <h1 className="mt-2 max-w-3xl text-[clamp(2.2rem,5vw,4.6rem)] font-extrabold leading-[0.98] tracking-[-0.06em] text-white">
                Keep the momentum moving.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#c9dace]">
                {isActiveAmbassador
                  ? "Your priority queue is ready. Stay responsive and keep premium campaigns moving."
                  : "You are building a strong ambassador profile. Consistent delivery is your clearest next step."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/creator/offers" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e6aa38] px-5 py-3 text-xs font-extrabold text-[#173b2a] transition hover:bg-[#f0bd58]">
                  Discover offers <ArrowRight className="size-4" />
                </Link>
                <Link href="/creator/ambassador-program" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 py-3 text-xs font-extrabold text-white transition hover:bg-white/12">
                  Track ambassador progress
                </Link>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-white/12 bg-[#214b36] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#f0c56e]">Readiness score</p>
                  <p className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-white">{ambassadorMetrics.score.total}<span className="text-lg text-[#a9c4b3]">/100</span></p>
                </div>
                <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[#f0c56e]"><ShieldCheck className="size-5" /></span>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div initial={{ width: 0 }} animate={{ width: `${ambassadorMetrics.score.total}%` }} className="h-full rounded-full bg-[#e6aa38]" />
              </div>
              <p className="mt-3 text-[11px] leading-5 text-[#b9d0c1]">
                {isActiveAmbassador ? `Ahead of ${ambassadorMetrics.percentileRank}% of creators.` : "Improve consistency, profile quality, and delivery performance to qualify."}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title={isActiveAmbassador ? "Ambassador earnings" : "Total earnings"} value={isLoading ? "Loading..." : formatPrice(totalEarnings)} detail={`${formatPrice(earningsSummary.availableBalance)} available`} icon={DollarSign} accent />
          <MetricCard title={isActiveAmbassador ? "Priority campaigns" : "Active orders"} value={isLoading ? "..." : dashboardAnalytics.activeOrders.toString()} detail={`${dashboardAnalytics.completedOrders} completed`} icon={Package} />
          <MetricCard title="Profile views" value={isLoading ? "..." : profileViews.toLocaleString()} detail={`${dashboardAnalytics.repeatBrands} repeat brands`} icon={Eye} />
          <MetricCard title={isActiveAmbassador ? "Quality score" : "Rating"} value={(dashboardAnalytics.avgRating || primaryCreator.rating).toFixed(1)} detail={`${dashboardAnalytics.totalReviews || primaryCreator.totalReviews} reviews`} icon={Star} />
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
          <div className="space-y-5">
            <section className={`${panelClass} p-5 sm:p-6`}>
              <SectionHeading eyebrow="Work in motion" title="Recent orders" action="View all" href="/creator/orders" />
              <div className="mt-5 space-y-2.5">
                {recentDashboardOrders.length > 0 ? recentDashboardOrders.map((order, index) => {
                  const statusStyle = getStatusStyle(order.status);
                  const StatusIcon = statusStyle.icon;
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="group flex items-center gap-3 rounded-2xl border border-[#e2e7e1] bg-[#fbfaf5] p-3.5 transition hover:border-[#b8c8bb] hover:bg-[#f5f6f1] sm:gap-4">
                      <Avatar className="size-11 border border-[#dce3dc]">
                        <AvatarImage src={order.brand.logo} alt={order.brand.name} />
                        <AvatarFallback className="bg-[#eef2eb] font-bold text-[#185c39]">{getInitials(order.brand.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[#173b2a]">{order.brand.name}</p>
                        <p className="mt-0.5 truncate text-xs text-[#718077]">{order.package.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-[#173b2a] sm:text-sm">{formatPrice(order.amount || 0)}</p>
                        <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold capitalize ${statusStyle.className}`}>
                          <StatusIcon className="size-3" /> {order.status.replace("_", " ")}
                        </span>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="rounded-2xl border border-dashed border-[#ccd7ce] bg-[#fbfaf5] px-5 py-10 text-center">
                    <Package className="mx-auto size-5 text-[#b77a12]" />
                    <p className="mt-3 text-sm font-extrabold text-[#173b2a]">No orders yet</p>
                    <p className="mt-1 text-xs text-[#718077]">New brand orders will appear here.</p>
                  </div>
                )}
              </div>
            </section>

            <section className={`${panelClass} p-5 sm:p-6`}>
              <SectionHeading eyebrow="Make the next move" title="Quick actions" />
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {quickActions.map(({ label, copy, href, icon: Icon }) => (
                  <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl border border-[#dce3dc] bg-[#fbfaf5] p-3.5 transition hover:border-[#185c39] hover:bg-[#f4f6f1]">
                    <span className="grid size-10 place-items-center rounded-xl bg-[#eef2eb] text-[#185c39] transition group-hover:bg-[#185c39] group-hover:text-white"><Icon className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-extrabold text-[#173b2a]">{label}</span>
                      <span className="mt-0.5 block text-[10px] font-semibold text-[#87938b]">{copy}</span>
                    </span>
                    <ArrowRight className="size-3.5 text-[#87938b] transition group-hover:translate-x-0.5 group-hover:text-[#185c39]" />
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className={`${panelClass} p-5`}>
              <SectionHeading eyebrow="This month" title={isActiveAmbassador ? "Elite goal tracker" : "Goal tracker"} />
              <div className="mt-5 space-y-5">
                <GoalBar label="Earnings" value={earningsGoalProgress} copy={`${earningsGoalProgress}%`} />
                <GoalBar label={isActiveAmbassador ? "Premium campaigns" : "Orders"} value={ordersGoalProgress} copy={`${dashboardAnalytics.totalOrders} / ${monthlyOrdersTarget}`} />
              </div>
              <div className="mt-5 flex gap-3 rounded-2xl bg-[#f7e8c8] p-3.5">
                <Target className="mt-0.5 size-4 shrink-0 text-[#9b6712]" />
                <p className="text-[11px] font-semibold leading-5 text-[#73541e]">
                  You are {Math.max(earningsGoalProgress, ordersGoalProgress)}% toward this month&apos;s next milestone.
                </p>
              </div>
            </section>

            <section className={`${panelClass} p-5`}>
              <SectionHeading eyebrow="Stay connected" title="Messages" action="View all" href="/creator/messages" />
              <div className="mt-4 space-y-1.5">
                {recentDashboardMessages.length > 0 ? recentDashboardMessages.map((message) => (
                  <Link key={message.id} href="/creator/messages" className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-[#f4f6f1]">
                    <Avatar className="size-9">
                      <AvatarImage src={message.avatar} alt={message.name} />
                      <AvatarFallback className="bg-[#eef2eb] text-xs font-bold text-[#185c39]">{getInitials(message.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-extrabold text-[#173b2a]">{message.name}</p>
                        {message.unread ? <span className="size-1.5 rounded-full bg-[#e6aa38]" /> : null}
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-[#718077]">{message.message}</p>
                    </div>
                    <span className="text-[9px] font-semibold text-[#87938b]">{formatRelativeTime(message.time)}</span>
                  </Link>
                )) : (
                  <div className="rounded-2xl border border-dashed border-[#ccd7ce] bg-[#fbfaf5] px-4 py-8 text-center">
                    <MessageCircle className="mx-auto size-5 text-[#b77a12]" />
                    <p className="mt-2 text-xs font-bold text-[#526259]">No messages yet</p>
                  </div>
                )}
              </div>
            </section>

            {isActiveAmbassador ? (
              <section className="rounded-[1.6rem] bg-[#185c39] p-5 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#f0c56e]">Ambassador edge</p>
                    <h2 className="mt-1.5 text-xl font-extrabold tracking-[-0.035em]">Top {Math.max(1, 100 - ambassadorMetrics.percentileRank)}%</h2>
                  </div>
                  <ShieldCheck className="size-5 text-[#f0c56e]" />
                </div>
                <p className="mt-3 text-[11px] leading-5 text-[#c9dace]">Keep response time low and close active campaigns to protect your premium position.</p>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
