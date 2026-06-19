"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  Coffee,
  CreditCard,
  MessageCircle,
  Package,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Utensils,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsService, type BrandDashboardAnalytics } from "@/services/analytics.service";
import { brandsService } from "@/services/brands.service";
import { creatorsService } from "@/services/creators.service";
import { ordersService } from "@/services/orders.service";
import { formatFollowers, formatPrice, formatRelativeTime, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { Brand, Creator, Order } from "@/types";

const emptyStats: BrandDashboardAnalytics = {
  totalOrders: 0,
  activeOrders: 0,
  completedOrders: 0,
  savedCreators: 0,
  totalSpent: 0,
  creatorsWorkedWith: 0,
  avgRating: 0,
};

const activeOrderStatuses = new Set(["accepted", "in_progress", "delivered", "review", "revision"]);

const statusCopy: Record<string, { label: string; className: string }> = {
  accepted: { label: "Accepted", className: "bg-[#e7f0ea] text-[#185c39]" },
  in_progress: { label: "In progress", className: "bg-[#e7f0ea] text-[#185c39]" },
  delivered: { label: "Delivered", className: "bg-[#fff1cd] text-[#8b5e12]" },
  review: { label: "In review", className: "bg-[#f5e7cf] text-[#8b5e12]" },
  revision: { label: "Revision", className: "bg-[#f5e7cf] text-[#8b5e12]" },
  pending: { label: "Pending", className: "bg-[#fff1cd] text-[#8b5e12]" },
  completed: { label: "Completed", className: "bg-[#e7f0ea] text-[#185c39]" },
};

const progressForStatus = (status: string) => {
  if (status === "completed") return 100;
  if (status === "delivered") return 90;
  if (status === "review") return 78;
  if (status === "revision") return 70;
  if (status === "in_progress") return 58;
  if (status === "accepted") return 32;
  if (status === "pending") return 12;
  return 45;
};

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <div className="rounded-[1.35rem] border border-[#d9e0d8] bg-white p-4 shadow-[0_18px_50px_rgba(38,70,50,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7b867f]">{label}</p>
          {loading
            ? <Skeleton className="mt-3 h-7 w-20 rounded-lg" />
            : <p className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[#173b2a]">{value}</p>
          }
          <p className="mt-1 text-xs font-semibold text-[#718077]">{note}</p>
        </div>
        <span className="grid size-11 place-items-center rounded-2xl bg-[#f4f2e9] text-[#b77a12]">
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

function EmptyPanel({ title, copy, href, action }: { title: string; copy: string; href: string; action: string }) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-[#cdd7ce] bg-[#fbfaf5] p-6 text-center">
      <p className="text-base font-extrabold tracking-[-0.02em] text-[#173b2a]">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#647168]">{copy}</p>
      <Link href={href} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#185c39] px-4 py-2.5 text-sm font-bold text-white">
        {action} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

const HERO_DISMISSED_KEY = 'brand-hero-dismissed';

export default function BrandDashboardPage() {
  const { savedCreators, user } = useAuthStore();
  const [stats, setStats] = useState<BrandDashboardAnalytics>(emptyStats);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [recommendedCreators, setRecommendedCreators] = useState<Creator[]>([]);
  const [savedCreatorsList, setSavedCreatorsList] = useState<Creator[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showHero, setShowHero] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(HERO_DISMISSED_KEY)) setShowHero(false);
  }, []);

  const dismissHero = () => {
    localStorage.setItem(HERO_DISMISSED_KEY, '1');
    setShowHero(false);
  };

  const loadDashboard = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [analytics, orders, recommended, fetchedBrand] = await Promise.all([
        analyticsService.getBrandDashboard().catch(() => emptyStats),
        ordersService.getAll().then((r) => r.orders).catch(() => []),
        creatorsService.getTrending(4).catch(() => []),
        brandsService.getMe().catch(() => null),
      ]);
      setStats(analytics);
      setBrand(fetchedBrand);
      setActiveOrders(orders.filter((order) => activeOrderStatuses.has(order.status)).slice(0, 4));
      setRecommendedCreators(recommended);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadSavedCreators = async () => {
      const results = await Promise.allSettled(savedCreators.slice(0, 4).map((id) => creatorsService.getById(id)));
      const creators = results
        .map((item) => (item.status === "fulfilled" ? item.value : null))
        .filter((item): item is Creator => Boolean(item));
      setSavedCreatorsList(creators);
    };

    void loadSavedCreators();
  }, [savedCreators]);

  const monthlyBudget = brand?.monthlyBudget ?? stats.totalSpent ?? 0;
  const budgetUsed = monthlyBudget > 0 ? Math.min(100, ((stats.totalSpent ?? 0) / monthlyBudget) * 100) : 0;
  const firstName = useMemo(() => user?.name?.split(" ")[0] || "there", [user?.name]);

  if (hasError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-base font-extrabold text-[#173b2a]">Could not load dashboard</p>
        <p className="text-sm text-[#647168]">Check your connection and try again.</p>
        <button
          onClick={() => void loadDashboard()}
          className="rounded-full bg-[#185c39] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#12462b]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf5]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {showHero && (
          <section className="relative overflow-hidden rounded-[2rem] border border-[#d9e0d8] bg-[#173b2a] text-white shadow-[0_28px_90px_rgba(23,59,42,0.16)]">
            <button
              type="button"
              onClick={dismissHero}
              aria-label="Dismiss hero section"
              className="absolute right-4 top-4 z-10 grid size-7 place-items-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
            >
              <X className="size-3.5" />
            </button>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="p-6 sm:p-8 lg:p-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-2 text-xs font-bold text-[#f0c56e]">
                  <span className="size-2 rounded-full bg-[#e6aa38]" />
                  Food business command center
                </div>
                <h1 className="mt-6 max-w-2xl text-[clamp(2.35rem,5vw,4.8rem)] font-extrabold leading-[0.98] tracking-[-0.06em]">
                  Good morning, {firstName}. Let&apos;s fill more tables.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-[#c7d8ce]">
                  Track active tastings, discover local food creators, and launch campaigns for restaurants, cafes, hotels, fast food, and dessert shops.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href="/brand/campaigns/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#e6aa38] px-5 py-3 text-sm font-extrabold text-[#173b2a]">
                    Launch a campaign <ArrowRight className="size-4" />
                  </Link>
                  <Link href="/brand/explore?search=food" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-bold text-white hover:bg-white/12">
                    Find food creators <Search className="size-4" />
                  </Link>
                </div>
              </motion.div>

              <div className="relative min-h-[320px] overflow-hidden lg:min-h-full">
                <Image
                  src="/landing/restaurant-opportunity.png"
                  alt="Restaurant table spread being recorded by a food creator"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#173b2a]/85 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 rounded-[1.35rem] border border-white/15 bg-[#173b2a]/85 p-4 backdrop-blur">
                  <p className="flex items-center gap-2 text-sm font-extrabold">
                    <BadgeCheck className="size-4 text-[#e6aa38]" />
                    Suggested next move
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#d4e0d8]">Invite 3 local food vloggers for a weekend tasting and ask for one reel plus story coverage.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total spent" value={formatPrice(stats.totalSpent)} note="Across all creator work" icon={CreditCard} loading={isLoading} />
          <MetricCard label="Active campaigns" value={String(stats.activeOrders)} note={`${stats.completedOrders} completed`} icon={Package} loading={isLoading} />
          <MetricCard label="Creators worked" value={String(stats.creatorsWorkedWith)} note={`${stats.savedCreators} saved profiles`} icon={Users} loading={isLoading} />
          <MetricCard label="Average rating" value={stats.avgRating.toFixed(1)} note="Creator experience score" icon={Star} loading={isLoading} />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
          <div className="space-y-5">
            <div className="rounded-[1.75rem] border border-[#d9e0d8] bg-white p-5 shadow-[0_18px_60px_rgba(38,70,50,0.07)] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77a12]">Tasting pipeline</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#173b2a]">Active collaborations</h2>
                </div>
                <Link href="/brand/orders" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#185c39]">
                  View orders <ArrowRight className="size-4" />
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {activeOrders.length > 0 ? activeOrders.map((order) => {
                  const status = statusCopy[order.status] || { label: order.status.replace("_", " "), className: "bg-[#eef2eb] text-[#526259]" };
                  const progress = progressForStatus(order.status);

                  return (
                    <Link key={order.id} href="/brand/orders" className="block rounded-[1.35rem] border border-[#e1e6df] bg-[#fbfaf5] p-4 transition hover:border-[#185c39]/40 hover:bg-white">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="size-11 border-2 border-white shadow-sm">
                            <AvatarImage src={order.creator.avatar} alt={order.creator.name} />
                            <AvatarFallback>{getInitials(order.creator.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-[#173b2a]">{order.creator.name}</p>
                            <p className="truncate text-sm text-[#647168]">{order.package.title}</p>
                          </div>
                        </div>
                        <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-extrabold capitalize ${status.className}`}>{status.label}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#718077]">
                        <span>{progress}% complete</span>
                        <span>{formatPrice(order.amount || 0)}</span>
                      </div>
                      <Progress value={progress} className="mt-2 h-2 bg-[#e6eceb]" />
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-[#718077]">
                        <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5" /> Due {formatRelativeTime(order.deliveryDate || order.deadlineDate || order.updatedAt)}</span>
                        <ChevronRight className="size-4" />
                      </div>
                    </Link>
                  );
                }) : (
                  <EmptyPanel
                    title="No active tastings yet"
                    copy="Once a creator accepts your campaign, the timeline and deliverables will show up here."
                    href="/brand/campaigns/new"
                    action="Create first campaign"
                  />
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[#d9e0d8] bg-white p-5 shadow-[0_18px_60px_rgba(38,70,50,0.07)] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77a12]">Recommended creators</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#173b2a]">Food voices to review next</h2>
                </div>
                <Link href="/brand/explore?search=food" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#185c39]">
                  Explore more <ArrowRight className="size-4" />
                </Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {recommendedCreators.length > 0 ? recommendedCreators.map((creator) => (
                  <Link key={creator.id} href={`/creator/${creator.id}`} className="group rounded-[1.35rem] border border-[#e1e6df] bg-[#fbfaf5] p-4 transition hover:border-[#185c39]/40 hover:bg-white">
                    <div className="flex items-start gap-3">
                      <Avatar className="size-12 border-2 border-white shadow-sm">
                        <AvatarImage src={creator.avatar} alt={creator.name} />
                        <AvatarFallback>{getInitials(creator.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-[#173b2a]">{creator.name}</p>
                            <p className="text-xs font-semibold text-[#718077]">{creator.city}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#8b5e12]"><Star className="size-3.5 fill-[#e6aa38] text-[#e6aa38]" /> {creator.rating}</span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#647168]">{creator.bio || creator.categories.join(", ")}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {(creator.categories.length ? creator.categories : ["Food", "Lifestyle"]).slice(0, 3).map((category) => (
                            <span key={category} className="rounded-full border border-[#d8dfd8] bg-white px-2 py-1 text-[11px] font-bold text-[#526259]">{category}</span>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#718077]">
                          <span>{formatFollowers(creator.totalFollowers)} followers</span>
                          <span className="text-[#185c39] group-hover:underline">Open profile</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="sm:col-span-2">
                    <EmptyPanel
                      title="No recommendations loaded"
                      copy="Browse food creators directly while recommendations are being prepared."
                      href="/brand/explore?search=food"
                      action="Browse creators"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[1.75rem] border border-[#d9e0d8] bg-white p-5 shadow-[0_18px_60px_rgba(38,70,50,0.07)] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77a12]">Quick launch</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#173b2a]">Move faster</h2>
              <div className="mt-5 grid gap-2">
                {[
                  { href: "/brand/campaigns/new", label: "Post a tasting campaign", icon: Utensils },
                  { href: "/brand/explore?search=food", label: "Find food vloggers", icon: Search },
                  { href: "/brand/messages", label: "Open conversations", icon: MessageCircle },
                  { href: "/brand/analytics", label: "Review performance", icon: TrendingUp },
                  { href: "/brand/payments", label: "Manage payments", icon: CreditCard },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-2xl border border-[#e1e6df] bg-[#fbfaf5] p-3 transition hover:border-[#185c39]/40 hover:bg-white">
                      <span className="flex items-center gap-3 text-sm font-extrabold text-[#173b2a]">
                        <span className="grid size-9 place-items-center rounded-xl bg-[#f4f2e9] text-[#b77a12]"><Icon className="size-4" /></span>
                        {item.label}
                      </span>
                      <ChevronRight className="size-4 text-[#718077]" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[#d9e0d8] bg-white p-5 shadow-[0_18px_60px_rgba(38,70,50,0.07)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77a12]">Budget pulse</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#173b2a]">Monthly spend</h2>
                </div>
                <Coffee className="size-6 text-[#b77a12]" />
              </div>
              <div className="mt-5 rounded-[1.35rem] bg-[#f4f2e9] p-4">
                <div className="flex items-center justify-between text-sm font-bold text-[#526259]">
                  <span>Used</span>
                  <span>{Math.round(budgetUsed)}%</span>
                </div>
                <Progress value={budgetUsed} className="mt-3 h-2 bg-[#e3ddd0]" />
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-extrabold tracking-[-0.04em] text-[#173b2a]">{formatPrice(stats.totalSpent)}</p>
                    <p className="mt-1 text-xs font-semibold text-[#718077]">spent this month</p>
                  </div>
                  <p className="text-right text-xs font-bold text-[#185c39]">{formatPrice(Math.max(monthlyBudget - stats.totalSpent, 0))}<br />remaining</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[#d9e0d8] bg-white p-5 shadow-[0_18px_60px_rgba(38,70,50,0.07)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77a12]">Saved shortlist</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#173b2a]">Creators</h2>
                </div>
                <Link href="/brand/explore?view=saved" className="text-xs font-extrabold text-[#185c39]">View all</Link>
              </div>
              <div className="mt-5 space-y-2">
                {savedCreatorsList.length > 0 ? savedCreatorsList.map((creator) => (
                  <Link key={creator.id} href={`/creator/${creator.id}`} className="flex items-center gap-3 rounded-2xl border border-[#e1e6df] bg-[#fbfaf5] p-3 transition hover:border-[#185c39]/40 hover:bg-white">
                    <Avatar className="size-10 border-2 border-white shadow-sm">
                      <AvatarImage src={creator.avatar} alt={creator.name} />
                      <AvatarFallback>{getInitials(creator.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-[#173b2a]">{creator.name}</p>
                      <p className="truncate text-xs text-[#718077]">{creator.categories[0] || "Food creator"}</p>
                    </div>
                    <Sparkles className="size-4 text-[#b77a12]" />
                  </Link>
                )) : (
                  <div className="rounded-[1.35rem] border border-dashed border-[#cdd7ce] bg-[#fbfaf5] p-5 text-center">
                    <Star className="mx-auto size-7 text-[#b77a12]" />
                    <p className="mt-2 text-sm font-bold text-[#173b2a]">No saved creators yet</p>
                    <Link href="/brand/explore?search=food" className="mt-2 inline-flex text-xs font-extrabold text-[#185c39]">Start browsing</Link>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
