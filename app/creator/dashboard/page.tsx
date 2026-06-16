"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
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
  TrendingUp,
  Users,
  Wallet,
  Zap,
  AlertCircle,
  BadgePercent,
  Copy,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { calculateCreatorAmbassadorMetrics } from "@/lib/ambassador-scoring";
import { formatPrice, formatRelativeTime, getInitials } from "@/lib/utils";
import { analyticsService, type CreatorDashboardAnalytics } from "@/services/analytics.service";
import { affiliateService, type AffiliateOverview } from "@/services/affiliate.service";
import { creatorsService } from "@/services/creators.service";
import { earningsService, type EarningsSummary } from "@/services/earnings.service";
import { messagesService } from "@/services/messages.service";
import { ordersService } from "@/services/orders.service";
import { useAuthStore } from "@/store/auth-store";
import type { Conversation, Creator, Order } from "@/types";

/* ─── abbreviate PKR for compact display ─── */
function abbrevPKR(v: number): string {
  if (v >= 1_000_000) return `Rs ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `Rs ${(v / 1_000).toFixed(0)}k`;
  return `Rs ${Math.round(v)}`;
}

/* ─── empty states ─── */
const emptyAnalytics: CreatorDashboardAnalytics = { totalOrders: 0, activeOrders: 0, completedOrders: 0, totalEarnings: 0, avgRating: 0, totalReviews: 0, repeatBrands: 0 };
const emptyEarnings: EarningsSummary = { totalEarned: 0, availableBalance: 0, pendingBalance: 0, totalWithdrawn: 0, platformFees: 0 };
const emptyAffiliate: AffiliateOverview = { code: "", shareUrl: "", rateBasisPoints: 100, totalCommission: 0, referredCreators: 0, commissionCount: 0 };

/* ─── sparkline ─── */
function Sparkline({ data, color = "#e6aa38" }: { data: number[]; color?: string }) {
  const W = 64, H = 24;
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const xs = data.map((_, i) => (i / (data.length - 1)) * W);
  const ys = data.map((v) => H - ((v - min) / rng) * (H - 2) - 1);
  const points = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  const area = `M${xs[0]},${H} ` + xs.map((x, i) => `L${x},${ys[i]}`).join(" ") + ` L${xs[xs.length - 1]},${H} Z`;
  const id = `sg-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-16 overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── ring progress ─── */
function RingProgress({ value, size = 72, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }} aria-hidden>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
      <circle cx={c} cy={c} r={r} fill="none" stroke="#e6aa38" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${filled} ${circ}`} />
    </svg>
  );
}

/* ─── counter hook ─── */
function useCounter(target: number, fmt?: (n: number) => string) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!el.current) return;
    if (target === 0) {
      el.current.textContent = fmt ? fmt(0) : "0";
      return;
    }
    const duration = 1300;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = eased * target;
      if (el.current) el.current.textContent = fmt ? fmt(v) : Math.round(v).toLocaleString();
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, fmt]);
  return el;
}

/* ─── status chip ─── */
function StatusChip({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
    completed:   { label: "Completed",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200",  Icon: CheckCircle2 },
    in_progress: { label: "In Progress", cls: "bg-sky-50    text-sky-700    border-sky-200",       Icon: Clock },
    pending:     { label: "Pending",     cls: "bg-amber-50  text-amber-700  border-amber-200",     Icon: AlertCircle },
  };
  const { label, cls, Icon } = cfg[status] ?? { label: status, cls: "bg-slate-50 text-slate-600 border-slate-200", Icon: Clock };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      <Icon className="size-2.5" />
      {label}
    </span>
  );
}

/* ─── metric card ─── */
interface MetricProps {
  title: string;
  value: number;
  sub: string;
  Icon: React.ElementType;
  spark?: number[];
  fmt?: (n: number) => string;
  trend?: number;
}
function MetricCard({ title, value, sub, Icon, spark, fmt, trend, dark }: MetricProps & { dark?: boolean }) {
  const ref = useCounter(value, fmt);

  if (dark) {
    return (
      <article className="metric-card relative overflow-hidden rounded-2xl border border-[#2d6b4e] bg-[#1e3d2e] p-4 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl sm:p-5">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-2/3 opacity-25"
          style={{ background: "radial-gradient(ellipse at 100% 0%, #2d6b4e, transparent 70%)" }} aria-hidden />
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6fa688]">{title}</p>
            <p className="mt-2 text-2xl font-extrabold leading-none tracking-tight text-[#f0c56e]">
              <span ref={ref} className="block truncate">{fmt ? fmt(0) : "0"}</span>
            </p>
            <p className="mt-1.5 truncate text-[10px] font-medium text-[#5a8a72] sm:text-[11px]">{sub}</p>
            {trend !== undefined && (
              <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <TrendingUp className="size-3" />
                {Math.abs(trend)}% this month
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="grid size-8 place-items-center rounded-xl bg-white/10 text-[#f0c56e] sm:size-9">
              <Icon className="size-3.5 sm:size-4" />
            </span>
            {spark && <div className="hidden opacity-80 sm:block"><Sparkline data={spark} color="#f0c56e" /></div>}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="metric-card group relative overflow-hidden rounded-2xl border-2 border-[#dce8e2] bg-white p-4 transition-all duration-300 hover:scale-[1.015] hover:border-[#2d6b4e]/50 hover:shadow-lg sm:p-5"
      style={{ boxShadow: "0 2px 8px rgba(30,61,46,0.07), 0 1px 2px rgba(30,61,46,0.04)" }}>
      <div className="absolute left-0 top-0 h-[3px] w-full rounded-t-2xl bg-gradient-to-r from-[#2d6b4e]/40 to-transparent" />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a9a87]">{title}</p>
          <p className="mt-2 text-2xl font-extrabold leading-none tracking-tight text-[#1e3d2e]">
            <span ref={ref} className="block truncate">{fmt ? fmt(0) : "0"}</span>
          </p>
          <p className="mt-1.5 truncate text-[10px] font-medium text-[#7a9a87] sm:text-[11px]">{sub}</p>
          {trend !== undefined && (
            <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <TrendingUp className="size-3" />
              {Math.abs(trend)}% this month
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="grid size-8 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e] sm:size-9">
            <Icon className="size-3.5 sm:size-4" />
          </span>
          {spark && <div className="hidden opacity-80 sm:block"><Sparkline data={spark} color="#2d6b4e" /></div>}
        </div>
      </div>
    </article>
  );
}

/* ─── goal bar ─── */
function GoalBar({ label, value, copy, color = "#2d6b4e" }: { label: string; value: number; copy: string; color?: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(100, value)), 100);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold text-[#496159]">{label}</span>
        <span className="font-bold text-[#1e3d2e]">{copy}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e5eae4]">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
      </div>
    </div>
  );
}

/* ─── quick action tile ─── */
function QuickTile({ label, copy, href, Icon }: { label: string; copy: string; href: string; Icon: React.ElementType }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl border border-[#dde5df] bg-[#f9faf8] p-3.5 transition-all duration-200 hover:border-[#2d6b4e] hover:bg-white hover:shadow-md">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e] transition-colors group-hover:bg-[#2d6b4e] group-hover:text-white">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-[13px] font-extrabold text-[#1e3d2e]">{label}</span>
        <span className="block text-[11px] text-[#87938b]">{copy}</span>
      </div>
      <ArrowRight className="size-3.5 shrink-0 text-[#b5c0bc] transition-transform group-hover:translate-x-0.5 group-hover:text-[#2d6b4e]" />
    </Link>
  );
}

/* ─── page ─── */
export default function CreatorDashboardPage() {
  const { user } = useAuthStore();
  const [creatorProfile, setCreatorProfile] = useState<Creator | null>(null);
  const [analytics, setAnalytics] = useState<CreatorDashboardAnalytics>(emptyAnalytics);
  const [earnings, setEarnings] = useState<EarningsSummary>(emptyEarnings);
  const [orders, setOrders] = useState<Order[]>([]);
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [affiliate, setAffiliate] = useState<AffiliateOverview>(emptyAffiliate);
  const [affiliateCopied, setAffiliateCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAmbassador = user?.creatorProgramStatus === "active_ambassador" || user?.email === "ambassador@test.com";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [profile, anal, earn, ords, msgs, aff] = await Promise.all([
        creatorsService.getMe().catch(() => null),
        analyticsService.getCreatorDashboard().catch(() => emptyAnalytics),
        earningsService.getSummary().catch(() => emptyEarnings),
        ordersService.getAll().catch(() => []),
        messagesService.getConversations(user?.id || "", "creator").catch(() => []),
        affiliateService.getOverview().catch(() => emptyAffiliate),
      ]);
      setCreatorProfile(profile);
      setAnalytics(anal);
      setEarnings(earn);
      setOrders(ords);
      setConvos(msgs);
      setAffiliate(aff);
      setLoading(false);
    };
    void load();
  }, [user?.id]);


  const creator = useMemo<Creator>(() => creatorProfile ?? {
    id: user?.id ?? "x", userId: user?.id ?? "x",
    username: user?.email?.split("@")[0] ?? "creator",
    name: user?.name ?? "Creator", avatar: user?.avatar ?? "",
    bio: "", city: "Karachi", categories: [],
    platforms: [{ platform: "instagram", followers: 0, engagementRate: 0, username: "creator" }],
    totalFollowers: 0, avgEngagementRate: 0, dealTypes: ["paid"],
    responseTime: "Within 24 hours", isVerified: false, isTrending: false,
    isFastResponder: false, rating: 0, totalReviews: 0, completedDeals: 0,
    contentPreviews: [], createdAt: new Date(),
  }, [creatorProfile, user]);

  const amb = calculateCreatorAmbassadorMetrics(creator);
  const totalEarned = earnings.totalEarned || analytics.totalEarnings;
  const earningsTarget = Math.max(600000, totalEarned || 1);
  const ordersTarget = Math.max(10, analytics.totalOrders || 1);
  const earningsPct = Math.min(100, Math.round((totalEarned / earningsTarget) * 100));
  const ordersPct = Math.min(100, Math.round((analytics.totalOrders / ordersTarget) * 100));
  const views = Math.max(0, creator.totalFollowers ? Math.round(creator.totalFollowers * 0.02) : 0);
  const rating = analytics.avgRating || creator.rating;
  const recentOrders = orders.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
  const recentMsgs = convos.slice().sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 4).map((c) => ({
    id: c.id, name: c.brand.name, avatar: c.brand.logo,
    text: c.lastMessage?.content || "No messages yet",
    time: c.lastMessage?.createdAt ?? c.updatedAt, unread: c.unreadCount > 0,
  }));
  const sparkE = [40, 55, 45, 70, 60, 85, 75, 90, 80, 95, 88, 100];
  const sparkO = [2, 5, 3, 7, 6, 9, 8, 10, 9, 12, 11, 13];
  const sparkV = [100, 120, 110, 140, 130, 160, 150, 180, 170, 200, 190, 210];
  const sparkR = [4.2, 4.3, 4.1, 4.5, 4.4, 4.6, 4.5, 4.7, 4.6, 4.8, 4.7, 4.9];

  const actions = [
    { label: "New Package",    copy: "Create a service",      href: "/creator/packages/new",        Icon: Plus },
    { label: "Withdraw",       copy: "Access your earnings",  href: "/creator/payments",            Icon: Wallet },
    { label: "Affiliate",      copy: "Share your link",       href: "/creator/affiliate",           Icon: BadgePercent },
    { label: "Edit Profile",   copy: "Keep it fresh",         href: "/creator/profile/public",      Icon: Users },
    { label: "View Insights",  copy: "Know your audience",    href: "/creator/insights",            Icon: BarChart3 },
  ];

  const copyAffiliateLink = async () => {
    if (!affiliate.shareUrl) return;
    try {
      await navigator.clipboard.writeText(affiliate.shareUrl);
      setAffiliateCopied(true);
      window.setTimeout(() => setAffiliateCopied(false), 1600);
    } catch {
      setAffiliateCopied(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#2d6b4e]/20 border-t-[#2d6b4e]" />
          <p className="text-sm text-[#87938b]">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#fbfaf5] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1300px] space-y-5">

        {/* ── metric cards ── */}
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Key metrics">
          <MetricCard dark  title="Total Earnings" value={totalEarned}            fmt={abbrevPKR}             sub={`${formatPrice(earnings.availableBalance)} available`}         Icon={DollarSign} spark={sparkE} trend={12} />
          <MetricCard       title="Active Orders"  value={analytics.activeOrders}                            sub={`${analytics.completedOrders} completed`}                      Icon={Package}    spark={sparkO} trend={8}  />
          <MetricCard       title="Profile Views"  value={views}                                             sub={`${analytics.repeatBrands} repeat brands`}                     Icon={Eye}        spark={sparkV} trend={5}  />
          <MetricCard       title="Avg Rating"     value={rating}                 fmt={(v) => v.toFixed(1)} sub={`${analytics.totalReviews || creator.totalReviews} reviews`}    Icon={Star}       spark={sparkR} trend={3}  />
        </section>

        {/* ── main layout ── */}
        <div className="grid gap-5 xl:grid-cols-[1fr_300px]">

          {/* left col */}
          <div className="space-y-4">

            {/* ── hero ambassador card ── */}
            <section className="dash-panel relative overflow-hidden rounded-2xl bg-[#1e3d2e] p-5 text-white sm:p-6">
              {/* ambient glow */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
                <div className="absolute -right-16 -top-16 size-56 rounded-full bg-[#2d6b4e] opacity-40 blur-3xl" />
                <div className="absolute -bottom-12 -left-12 size-48 rounded-full bg-[#e6aa38] opacity-10 blur-3xl" />
              </div>

              <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#f0c56e]">
                      {isAmbassador ? <Crown className="size-3" /> : <Sparkles className="size-3" />}
                      {isAmbassador ? "Active Ambassador" : "Ambassador Path"}
                    </span>
                    <span className="rounded-full border border-white/12 px-2.5 py-1 text-[10px] font-bold capitalize text-white/50">
                      {amb.tier.replace(/_/g, " ")}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
                    {isAmbassador ? "You're in the top tier." : "Keep the momentum going."}
                  </h2>
                  <p className="mt-2 text-[13px] leading-6 text-white/50 max-w-md">
                    {isAmbassador
                      ? `Ahead of ${amb.percentileRank}% of creators. Priority campaigns stay warm when you stay responsive.`
                      : "Consistent delivery and quality content builds your ambassador profile faster than anything else."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href="/creator/offers" className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#e6aa38] px-4 text-[12px] font-extrabold text-[#1e3d2e] transition hover:bg-[#f0bd58]">
                      Discover Offers <ArrowUpRight className="size-3.5" />
                    </Link>
                    <Link href="/creator/ambassador-program" className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-4 text-[12px] font-semibold text-white/80 transition hover:bg-white/12">
                      Track Progress
                    </Link>
                  </div>
                </div>

                {/* readiness ring */}
                <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-2">
                  <div className="relative">
                    <RingProgress value={amb.score.total} size={72} stroke={6} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-extrabold text-white leading-none">{amb.score.total}</span>
                      <span className="text-[9px] text-white/40 font-semibold">/100</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Readiness</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-[#f0c56e]">
                      <ShieldCheck className="size-3" /> Score
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── recent orders ── */}
            <section className="dash-panel overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#f0f3f0] px-5 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Work in motion</p>
                  <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Recent Orders</h2>
                </div>
                <Link href="/creator/orders" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2d6b4e] transition hover:underline">
                  View all <ArrowRight className="size-3" />
                </Link>
              </div>
              {recentOrders.length > 0 ? (
                <div className="divide-y divide-[#f4f6f4]">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-[#fafcfa]">
                      <Avatar className="size-9 shrink-0 border border-[#e2e7e1]">
                        <AvatarImage src={order.brand.logo} alt={order.brand.name} />
                        <AvatarFallback className="bg-[#e8f0ec] text-[11px] font-bold text-[#2d6b4e]">{getInitials(order.brand.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-extrabold text-[#1e3d2e]">{order.brand.name}</p>
                        <p className="truncate text-[11px] text-[#87938b]">{order.package.title}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <p className="text-[13px] font-extrabold text-[#1e3d2e]">{formatPrice(order.amount || 0)}</p>
                        <StatusChip status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#e8f0ec]">
                    <Package className="size-5 text-[#2d6b4e]" />
                  </span>
                  <p className="text-sm font-extrabold text-[#1e3d2e]">No orders yet</p>
                  <p className="text-[11px] text-[#87938b] max-w-xs">Your brand collaborations will appear here once you start getting campaigns.</p>
                  <Link href="/creator/offers" className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#2d6b4e] px-4 py-2 text-[12px] font-extrabold text-white transition hover:bg-[#1f5239]">
                    Browse Offers <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </section>

            {/* ── quick actions ── */}
            <section className="dash-panel rounded-2xl border border-[#e2e7e1] bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Make the next move</p>
                <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Quick Actions</h2>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {actions.map((a) => <QuickTile key={a.href} {...a} />)}
              </div>
            </section>
          </div>

          {/* right sidebar */}
          <aside className="space-y-4">

            {/* ── goal tracker ── */}
            <section className="dash-panel rounded-2xl border border-[#e2e7e1] bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">This month</p>
                  <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Goals</h2>
                </div>
                <Target className="size-4 text-[#b77a12]" />
              </div>
              <div className="space-y-4">
                <GoalBar label="Earnings"     value={earningsPct} copy={`${earningsPct}%`} />
                <GoalBar label={isAmbassador ? "Premium Campaigns" : "Orders"}
                         value={ordersPct} copy={`${analytics.totalOrders} / ${ordersTarget}`}
                         color="#e6aa38" />
                <GoalBar label="Profile Score" value={amb.score.total} copy={`${amb.score.total}%`} color="#4a9d72" />
              </div>
              <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#fdf4e1] border border-[#f3dfa3] p-3">
                <Zap className="mt-0.5 size-3.5 shrink-0 text-[#9a6b00]" />
                <p className="text-[11px] leading-5 text-[#9a6b00] font-medium">
                  {Math.max(earningsPct, ordersPct)}% toward this month&apos;s milestone.
                </p>
              </div>
            </section>

            {/* ── affiliate snapshot ── */}
            <section className="dash-panel rounded-2xl border border-[#e2e7e1] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Affiliate</p>
                  <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Referral Earnings</h2>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e]">
                  <BadgePercent className="size-4" />
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#edf1ed] bg-[#fbfaf5] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a9a87]">Commission</p>
                    <p className="mt-1 text-lg font-extrabold text-[#1e3d2e]">{formatPrice(affiliate.totalCommission)}</p>
                  </div>
                  <div className="rounded-xl border border-[#edf1ed] bg-[#fbfaf5] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a9a87]">Creators</p>
                    <p className="mt-1 text-lg font-extrabold text-[#1e3d2e]">{affiliate.referredCreators}</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <button
                    type="button"
                    onClick={copyAffiliateLink}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2d6b4e] px-4 text-[12px] font-extrabold text-white transition hover:bg-[#1f5239]"
                  >
                    {affiliateCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {affiliateCopied ? "Copied" : "Copy"}
                  </button>
                  <Link href="/creator/affiliate" className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#d1ddd6] bg-white px-4 text-[12px] font-extrabold text-[#2d6b4e] transition hover:bg-[#e6eceb]">
                    Details <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
              <p className="mt-3 truncate rounded-xl bg-[#fdf4e1] px-3 py-2 text-[11px] font-semibold text-[#9a6b00]">
                {affiliate.shareUrl || "Your affiliate link is being prepared."}
              </p>
            </section>

            {/* ── messages ── */}
            <section className="dash-panel overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#f0f3f0] px-5 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Stay connected</p>
                  <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Messages</h2>
                </div>
                <Link href="/creator/messages" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2d6b4e] transition hover:underline">
                  View all <ArrowRight className="size-3" />
                </Link>
              </div>
              {recentMsgs.length > 0 ? (
                <div className="divide-y divide-[#f4f6f4]">
                  {recentMsgs.map((m) => (
                    <Link key={m.id} href="/creator/messages" className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[#fafcfa]">
                      <div className="relative shrink-0">
                        <Avatar className="size-8">
                          <AvatarImage src={m.avatar} alt={m.name} />
                          <AvatarFallback className="bg-[#e8f0ec] text-[10px] font-bold text-[#2d6b4e]">{getInitials(m.name)}</AvatarFallback>
                        </Avatar>
                        {m.unread && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-[#e6aa38]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-extrabold text-[#1e3d2e]">{m.name}</p>
                        <p className="truncate text-[10px] text-[#87938b]">{m.text}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold text-[#b5c0bc]">{formatRelativeTime(m.time)}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  <MessageCircle className="size-5 text-[#cdd7cd]" />
                  <p className="text-[12px] font-bold text-[#87938b]">No messages yet</p>
                </div>
              )}
            </section>

            {/* ── ambassador badge ── (when active) */}
            {isAmbassador && (
              <section className="dash-panel relative overflow-hidden rounded-2xl bg-[#1e3d2e] p-5 text-white">
                <div className="pointer-events-none absolute right-0 top-0 h-full w-2/3 opacity-25" aria-hidden
                  style={{ background: "radial-gradient(ellipse at 100% 0%, #e6aa38, transparent 65%)" }} />
                <div className="relative">
                  <Crown className="size-7 text-[#f0c56e]" />
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#94b8a6]">Ambassador Edge</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">
                    Top {Math.max(1, 100 - amb.percentileRank)}
                    <span className="text-base text-white/40">%</span>
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-white/50">
                    Keep your response time low and close active campaigns to hold your premium rank.
                  </p>
                  <Link href="/creator/ambassador-program" className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-[#f0c56e] transition hover:text-[#f5d08a]">
                    Program details <ArrowRight className="size-3" />
                  </Link>
                </div>
              </section>
            )}

            {/* ── performance snapshot ── */}
            <section className="dash-panel rounded-2xl border border-[#e2e7e1] bg-white p-5 shadow-sm">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Performance</p>
              <div className="space-y-3">
                {[
                  { label: "Repeat Brands",     val: `${analytics.repeatBrands}x`,                                         Icon: TrendingUp  },
                  { label: "Completed Orders",   val: analytics.completedOrders.toString(),                                 Icon: CheckCircle2 },
                  { label: "Response Time",      val: (creator.responseTime || "24h").replace(/_/g, " "),                Icon: Clock       },
                  { label: "Total Reviews",      val: (analytics.totalReviews || creator.totalReviews).toString(),          Icon: Star        },
                ].map(({ label, val, Icon }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#e8f0ec] text-[#2d6b4e]">
                        <Icon className="size-3.5" />
                      </span>
                      <span className="text-[12px] text-[#496159]">{label}</span>
                    </div>
                    <span className="text-[13px] font-extrabold text-[#1e3d2e]">{val}</span>
                  </div>
                ))}
              </div>
            </section>

          </aside>
        </div>
      </div>
    </div>
  );
}
