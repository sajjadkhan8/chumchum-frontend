"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Heart,
  Share2,
  MessageCircle,
  Star,
  MapPin,
  Users,
  Play,
  ExternalLink,
  Clock,
  Package,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageCard } from "@/components/package-card";
import { PackageDetailsModal, type PackageDetailBadge } from "@/components/package-details-view";
import { ReviewCard } from "@/components/review-card";
import { QuickDealModal } from "@/components/quick-deal-modal";
import { PackageOrderModal } from "@/components/package-order-modal";
import { CreatorTrustBadge, getCreatorTrustLabel } from "@/components/creator-trust-badge";
import { ShareProfileModal } from "@/components/share-profile-modal";
import { cn, formatFollowers, formatPrice, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { creatorsService } from "@/services/creators.service";
import { packagesService } from "@/services/packages.service";
import { reviewsService } from "@/services/reviews.service";
import { ordersService } from "@/services/orders.service";
import { PlatformIconBadge, getPlatformMeta } from "@/components/platform-icons";
import { getCategoryLabel } from "@/lib/categories";
import type { Creator, CreatorPackage, Order, Platform, Review } from "@/types";

const PROFILE_FALLBACK_IMAGE = "/creator-card-fallback.svg";
const CONCLUDED_ORDER_STATUSES = new Set(["completed", "cancelled"]);
const isActivePackageOrder = (order: Order) => !CONCLUDED_ORDER_STATUSES.has(order.status);
const getOrderTime = (order: Order) => order.updatedAt?.getTime?.() || order.createdAt?.getTime?.() || 0;

function platformProfileUrl(platform: string, username: string, profileUrl?: string) {
  if (profileUrl) return profileUrl;

  const handle = username.replace(/^@+/, "").trim();
  const encodedHandle = encodeURIComponent(handle);
  const normalizedPlatform = platform.toLowerCase();

  if (!handle) return "#";

  switch (normalizedPlatform) {
    case "instagram":
      return `https://www.instagram.com/${encodedHandle}`;
    case "tiktok":
      return `https://www.tiktok.com/@${encodedHandle}`;
    case "youtube":
      return `https://www.youtube.com/@${encodedHandle}`;
    case "facebook":
      return `https://www.facebook.com/${encodedHandle}`;
    case "snapchat":
      return `https://www.snapchat.com/add/${encodedHandle}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(`${platform} ${handle}`)}`;
  }
}

function platformVerificationLabel(source?: string) {
  if (source === "PLATFORM_REVIEWED") return "Platform reviewed";
  if (source === "API_CONNECTED") return "API verified";
  return "Self-reported";
}

function ProfileStat({ label, value, icon: Icon, dark = false }: { label: string; value: string; icon: React.ElementType; dark?: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl border p-4 shadow-sm",
      dark
        ? "border-white/10 bg-white/8 text-white"
        : "border-[#e2e7e1] bg-white text-[#1e3d2e]"
    )}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-[10px] font-bold uppercase tracking-widest", dark ? "text-white/40" : "text-[#87938b]")}>{label}</p>
          <p className="mt-1 truncate text-lg font-extrabold tracking-tight">{value}</p>
        </div>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", dark ? "bg-[#e6aa38] text-[#1e3d2e]" : "bg-[#e8f0ec] text-[#2d6b4e]")}>
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}

type PackageMerit = PackageDetailBadge;

function PackageMenuItem({
  pkg,
  badges,
  canOrder,
  activeOrder,
  onOrder,
  onViewActiveOrder,
  onViewDetails,
}: {
  pkg: CreatorPackage;
  badges: PackageMerit[];
  canOrder: boolean;
  activeOrder?: Order | null;
  onOrder: (pkg: CreatorPackage) => void;
  onViewActiveOrder: (order: Order) => void;
  onViewDetails: (pkg: CreatorPackage) => void;
}) {
  return (
    <div className="space-y-2.5">
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map(({ label, className, Icon }) => (
            <span
              key={label}
              className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold", className)}
            >
              <Icon className="size-3" />
              {label}
            </span>
          ))}
        </div>
      )}
      <PackageCard
        pkg={pkg}
        activeOrder={activeOrder ? { id: activeOrder.id, status: activeOrder.status } : null}
        onViewActiveOrder={activeOrder ? () => onViewActiveOrder(activeOrder) : undefined}
        onOrder={canOrder && !activeOrder ? () => onOrder(pkg) : undefined}
        onViewDetails={() => onViewDetails(pkg)}
      />
    </div>
  );
}

export default function CreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, savedCreators, toggleSavedCreator } = useAuthStore();
  const [activeTab, setActiveTab] = useState("packages");
  const [quickDealOpen, setQuickDealOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreatorPackage | null>(null);
  const [selectedPackageDetails, setSelectedPackageDetails] = useState<CreatorPackage | null>(null);
  const [selectedPackagePlatforms, setSelectedPackagePlatforms] = useState<Platform[]>([]);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [creatorPackages, setCreatorPackages] = useState<CreatorPackage[]>([]);
  const [creatorReviews, setCreatorReviews] = useState<Review[]>([]);
  const [activePackageOrders, setActivePackageOrders] = useState<Record<string, Order>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingCreator, setIsSavingCreator] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [heroImageSrc, setHeroImageSrc] = useState(PROFILE_FALLBACK_IMAGE);

  useEffect(() => {
    const loadCreatorProfile = async () => {
      setIsLoading(true);
      try {
        const foundCreator = await creatorsService.getByIdentifier(id);

        if (!foundCreator) {
          setCreator(null);
          setCreatorPackages([]);
          setCreatorReviews([]);
          setActivePackageOrders({});
          return;
        }

        setCreator(foundCreator);

        const [packagesResponse, reviewsResponse, ordersResponse] = await Promise.allSettled([
          packagesService.getByCreatorId(foundCreator.id),
          reviewsService.getByCreatorId(foundCreator.id),
          user?.role === "brand" ? ordersService.getAll({ limit: 200 }) : Promise.resolve({ orders: [], total: 0, hasMore: false }),
        ]);

        const packages = packagesResponse.status === "fulfilled" ? packagesResponse.value : [];
        setCreatorPackages(packages);
        setCreatorReviews(reviewsResponse.status === "fulfilled" ? reviewsResponse.value : []);
        if (ordersResponse.status !== "fulfilled" || user?.role !== "brand") {
          setActivePackageOrders({});
          return;
        }

        const packageIds = new Set(packages.map((pkg) => pkg.id));
        const activeOrders = ordersResponse.value.orders
          .filter((order) => packageIds.has(order.packageId) && isActivePackageOrder(order))
          .sort((a, b) => getOrderTime(b) - getOrderTime(a));

        setActivePackageOrders(
          activeOrders.reduce<Record<string, Order>>((map, order) => {
            if (!map[order.packageId]) {
              map[order.packageId] = order;
            }
            return map;
          }, {})
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadCreatorProfile();
  }, [id, user?.role]);

  useEffect(() => {
    if (!creator) return;
    setHeroImageSrc(creator.coverImage || creator.contentPreviews[0]?.thumbnail || creator.avatar || PROFILE_FALLBACK_IMAGE);
  }, [creator]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading creator profile...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Creator not found</h1>
          <p className="mt-2 text-muted-foreground">
            The creator you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/brand/explore">Browse Creators</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isSaved = savedCreators.includes(creator.id);
  const canHireCreator = !user || user.role === 'brand';
  const creatorMessagePath = `/brand/messages?creator=${creator.id}`;
  const creatorMessageHref = user
    ? creatorMessagePath
    : `/login?next=${encodeURIComponent(creatorMessagePath)}`;
  const totalFollowers = creator.platforms.reduce(
    (sum, p) => sum + p.followers,
    0
  );
  const avgEngagement =
    creator.platforms.length > 0
      ? creator.platforms.reduce((sum, p) => sum + p.engagementRate, 0) / creator.platforms.length
      : 0;
  const creatorLanguages = creator.languages && creator.languages.length > 0 ? creator.languages : [];
  const packagePortfolio = creatorPackages.flatMap((pkg) => {
    const mediaUrls = [pkg.thumbnail, ...(pkg.mediaUrls || [])].filter(Boolean);
    return mediaUrls.map((url, index) => {
      const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(url);
      return {
        id: `${pkg.id}-${index}`,
        type: isVideo ? "video" as const : "image" as const,
        thumbnail: isVideo ? pkg.thumbnail : url,
        url,
        platform: pkg.platform,
        title: pkg.title,
        views: pkg.analytics.views,
      };
    });
  });
  const creatorPortfolio = [...creator.contentPreviews, ...packagePortfolio].filter(
    (item, index, items) => items.findIndex((candidate) => candidate.url === item.url) === index
  );
  const uniqueCreatorPackages = creatorPackages.filter(
    (pkg, index, items) => items.findIndex((candidate) => candidate.id === pkg.id) === index
  );
  const packagesByActivity = [...uniqueCreatorPackages].sort((a, b) => b.ordersCompleted - a.ordersCompleted);
  const packagesByDelivery = [...uniqueCreatorPackages].sort(
    (a, b) => (b.ordersCompleted + (b.isPopular ? 10 : 0)) - (a.ordersCompleted + (a.isPopular ? 10 : 0))
  );
  const topActivePackageIds = new Set(packagesByActivity.filter((pkg) => pkg.ordersCompleted > 0).slice(0, 2).map((pkg) => pkg.id));
  const topDeliveryPackageIds = new Set(packagesByDelivery.filter((pkg) => pkg.ordersCompleted > 0).slice(0, 2).map((pkg) => pkg.id));
  const packageMenu = [...uniqueCreatorPackages].sort((a, b) => {
    const score = (pkg: CreatorPackage) =>
      (pkg.isPopular || pkg.isFeatured ? 100 : 0) +
      (topActivePackageIds.has(pkg.id) ? 40 : 0) +
      (topDeliveryPackageIds.has(pkg.id) ? 30 : 0) +
      pkg.ordersCompleted;
    return score(b) - score(a);
  });
  const packagePlatformOptions = uniqueCreatorPackages.reduce(
    (options, pkg) => {
      const current = options.get(pkg.platform) ?? { platform: pkg.platform, count: 0 };
      options.set(pkg.platform, { ...current, count: current.count + 1 });
      return options;
    },
    new Map<Platform, { platform: Platform; count: number }>()
  );
  const packagePlatforms = Array.from(packagePlatformOptions.values()).sort((a, b) => {
    const labelA = getPlatformMeta(a.platform)?.label ?? a.platform;
    const labelB = getPlatformMeta(b.platform)?.label ?? b.platform;
    return labelA.localeCompare(labelB);
  });
  const filteredPackageMenu = selectedPackagePlatforms.length === 0
    ? packageMenu
    : packageMenu.filter((pkg) => selectedPackagePlatforms.includes(pkg.platform));
  const togglePackagePlatform = (platform: Platform) => {
    setSelectedPackagePlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    );
  };
  const getPackageBadges = (pkg: CreatorPackage): PackageMerit[] => {
    const badges: PackageMerit[] = [];
    if (pkg.isPopular || pkg.isFeatured) {
      badges.push({
        label: "Featured",
        Icon: Sparkles,
        className: "border-[#efcf83] bg-[#fff1cd] text-[#8b5e12]",
      });
    }
    if (topActivePackageIds.has(pkg.id)) {
      badges.push({
        label: "Most active",
        Icon: TrendingUp,
        className: "border-[#d6eadf] bg-[#e8f0ec] text-[#2d6b4e]",
      });
    }
    if (pkg.dealType === "barter" || pkg.dealType === "hybrid") {
      badges.push({
        label: "Barter-friendly",
        Icon: Wallet,
        className: "border-[#efcf83] bg-[#fff9e8] text-[#8b5e12]",
      });
    }
    if (topDeliveryPackageIds.has(pkg.id)) {
      badges.push({
        label: "Proven delivery",
        Icon: BadgeCheck,
        className: "border-sky-100 bg-sky-50 text-sky-700",
      });
    }
    return badges;
  };
  const completionRate = creator.completionRate ?? Math.min(99, Math.round((creator.completedDeals / (creator.completedDeals + 5)) * 100));
  const repeatClients = creator.repeatClients ?? Math.max(3, Math.round(creator.completedDeals * 0.24));
  const selectedPackageActiveOrder = selectedPackageDetails ? activePackageOrders[selectedPackageDetails.id] ?? null : null;

  const handleViewActiveOrder = (order: Order) => {
    router.push(`/brand/orders?orderId=${order.id}`);
  };

  const handleBookPackage = (pkg: CreatorPackage) => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "brand") {
      return;
    }

    const activeOrder = activePackageOrders[pkg.id];
    if (activeOrder) {
      handleViewActiveOrder(activeOrder);
      return;
    }

    void packagesService.trackEvent(pkg.id, "CLICK", "creator_profile_order").catch(() => undefined);
    setSelectedPackage(pkg);
    setSelectedPackageDetails(null);
  };

  const handlePackageOrderCreated = async (orderId: string) => {
    const order = await ordersService.getById(orderId).catch(() => null);
    if (order && isActivePackageOrder(order)) {
      setActivePackageOrders((current) => ({ ...current, [order.packageId]: order }));
    }
    router.push(`/brand/orders?orderId=${orderId}`);
  };

  const handleViewPackageDetails = (pkg: CreatorPackage) => {
    void packagesService.trackEvent(pkg.id, "VIEW", "creator_profile_details").catch(() => undefined);
    setSelectedPackageDetails(pkg);
  };

  const handleSavedCreatorToggle = async () => {
    setIsSavingCreator(true);
    try {
      await toggleSavedCreator(creator.id);
    } finally {
      setIsSavingCreator(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf5] pb-16">
      <div className="mx-auto max-w-[1300px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="h-9 rounded-xl px-2.5 text-[12px] font-extrabold text-[#496159] hover:bg-[#e8f0ec] hover:text-[#1e3d2e]"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Back
          </Button>
          <Link href="/brand/explore" className="hidden items-center gap-1 text-[12px] font-extrabold text-[#2d6b4e] hover:underline sm:inline-flex">
            Explore creators <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-2xl bg-[#1e3d2e] text-white shadow-[0_24px_80px_rgba(23,59,42,0.14)]">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <Image
              src={heroImageSrc}
              alt=""
              fill
              className="object-cover opacity-70"
              priority
              onError={() => setHeroImageSrc(PROFILE_FALLBACK_IMAGE)}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#10291d]/64 via-[#173b2a]/38 to-[#173b2a]/18" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#10291d]/52 via-transparent to-[#10291d]/18" />
            <div className="absolute -right-20 -top-24 size-72 rounded-full bg-[#2d6b4e] opacity-18 blur-3xl" />
            <div className="absolute -bottom-16 left-1/3 size-56 rounded-full bg-[#e6aa38] opacity-8 blur-3xl" />
          </div>

          <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_320px] lg:p-7">
            <div className="min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <Avatar className="size-24 shrink-0 border-4 border-white/12 bg-[#e8f0ec] sm:size-28">
                  <AvatarImage src={creator.avatar} alt={creator.name} />
                  <AvatarFallback className="bg-[#e8f0ec] text-2xl font-black text-[#2d6b4e]">
                    {getInitials(creator.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#f0c56e]">
                      <Sparkles className="size-3" />
                      Creator profile
                    </span>
                    <CreatorTrustBadge level={creator.badgeLevel} isVerified={creator.isVerified} compact className="border-sky-300 bg-white/95 text-sky-800" />
                    {creator.isTrending && (
                      <Badge className="rounded-full border border-[#e6aa38]/50 bg-[#e6aa38] text-[10px] font-black text-[#1e3d2e]">
                        <TrendingUp className="mr-1 size-3" />
                        Trending
                      </Badge>
                    )}
                    {(creator.activeOrderCount ?? 0) >= 3 &&
                      creator.availabilityStatus !== "UNAVAILABLE" &&
                      creator.availabilityStatus !== "ON_VACATION" && (
                        <Badge className="rounded-full bg-white/12 text-[10px] font-black text-white">
                          Limited availability
                        </Badge>
                      )}
                  </div>

                  <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
                    {creator.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-white/58">
                    <span>@{creator.username}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4 text-[#f0c56e]" />
                      {creator.city || "Pakistan"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-4 text-[#f0c56e]" />
                      {creator.responseTime}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-3xl text-sm font-medium leading-6 text-white/62">
                {creator.bio || "Creator profile ready for brand collaborations, campaign packages, and custom quick deals."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {creator.categories.slice(0, 5).map((category) => (
                  <span key={category} className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] font-bold text-white/78">
                    {getCategoryLabel(category)}
                  </span>
                ))}
                {creatorLanguages.slice(0, 3).map((lang) => (
                  <span key={lang} className="rounded-full border border-[#e6aa38]/25 bg-[#e6aa38]/12 px-3 py-1.5 text-[11px] font-bold text-[#f0c56e]">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <div className="grid grid-cols-2 gap-3">
                <ProfileStat dark label="Followers" value={formatFollowers(totalFollowers)} icon={Users} />
                <ProfileStat dark label="Rating" value={creator.rating.toFixed(1)} icon={Star} />
                <ProfileStat dark label="Completion" value={`${completionRate}%`} icon={ShieldCheck} />
                <ProfileStat dark label="Repeat" value={`${repeatClients}`} icon={TrendingUp} />
              </div>

              <div className="grid grid-cols-[auto_auto_1fr] gap-2">
                {canHireCreator && (
                  <Button
                    size="icon"
                    disabled={isSavingCreator}
                    className="rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15"
                    onClick={handleSavedCreatorToggle}
                    aria-label={isSaved ? "Remove saved creator" : "Save creator"}
                  >
                    <Heart className={cn("size-4", isSaved && "fill-[#e6aa38] text-[#e6aa38]")} />
                  </Button>
                )}
                <Button size="icon" className="rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15" onClick={() => setShareOpen(true)} aria-label="Share profile">
                  <Share2 className="size-4" />
                </Button>
                {canHireCreator && (
                  <Button className="rounded-xl bg-[#e6aa38] font-extrabold text-[#1e3d2e] hover:bg-[#f0bd58]" onClick={() => setQuickDealOpen(true)}>
                    Quick Deal
                  </Button>
                )}
              </div>
              {canHireCreator && (
                <Button asChild variant="outline" className="rounded-xl border-white/15 bg-white/8 font-extrabold text-white hover:bg-white/12 hover:text-white">
                  <Link href={creatorMessageHref}>
                    <MessageCircle className="mr-2 size-4" />
                    Message first
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Creator metrics">
          <ProfileStat label="Response Time" value={creator.responseTime} icon={Clock} />
          <ProfileStat label="Engagement" value={`${avgEngagement.toFixed(1)}%`} icon={TrendingUp} />
          <ProfileStat label="Completed Deals" value={String(creator.completedDeals)} icon={Package} />
          <ProfileStat label="Verification" value={getCreatorTrustLabel(creator.badgeLevel, creator.isVerified)} icon={ShieldCheck} />
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="rounded-2xl border border-[#e2e7e1] bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Creator fit</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Profile Snapshot</h2>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Total followers", value: formatFollowers(totalFollowers), Icon: Users },
                  { label: "Avg engagement", value: `${avgEngagement.toFixed(1)}%`, Icon: TrendingUp },
                  { label: "Reviews", value: `${creator.totalReviews}`, Icon: Star },
                  { label: "Response time", value: creator.responseTime, Icon: Clock },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e8f0ec] text-[#2d6b4e]">
                        <Icon className="size-4" />
                      </span>
                      <span className="text-[12px] font-semibold text-[#496159]">{label}</span>
                    </div>
                    <span className="truncate text-[13px] font-extrabold text-[#1e3d2e]">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {(creator.rateCardReel || creator.rateCardStory || creator.rateCardPost || creator.rateCardVideo) && (
              <section className="rounded-2xl border border-[#e2e7e1] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Rates</p>
                    <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Starting Rates</h2>
                  </div>
                  <Wallet className="size-4 text-[#b77a12]" />
                </div>
                <div className="space-y-2">
                  {[
                    ["Reel / Short Video", creator.rateCardReel],
                    ["Story / Highlight", creator.rateCardStory],
                    ["Static Post", creator.rateCardPost],
                    ["YouTube / Long Video", creator.rateCardVideo],
                  ].filter(([, value]) => Boolean(value)).map(([label, value]) => (
                    <div key={String(label)} className="flex items-center justify-between gap-3 rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-3 py-2">
                      <span className="text-[12px] font-semibold text-[#496159]">{label}</span>
                      <span className="text-[13px] font-extrabold text-[#1e3d2e]">{formatPrice(Number(value))}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-[#e2e7e1] bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Channels</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Platforms</h2>
              <div className="mt-4 space-y-2.5">
                {creator.platforms.map((platform) => {
                  const href = platformProfileUrl(platform.platform, platform.username, platform.profileUrl);
                  return (
                    <a
                      key={platform.platform}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-[#edf1ed] bg-[#fbfaf5] p-3 transition hover:border-[#cbd9d0] hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#185c39]/25 focus-visible:ring-offset-2"
                      aria-label={`Open ${creator.name}'s ${platform.platform} profile`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <PlatformIconBadge platform={platform.platform} />
                          <div className="min-w-0">
                            <p className="text-[13px] font-extrabold capitalize text-[#1e3d2e]">{platform.platform}</p>
                            <p className="truncate text-[11px] font-medium text-[#87938b] transition hover:text-[#185c39]">@{platform.username}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[13px] font-extrabold text-[#1e3d2e]">{formatFollowers(platform.followers)}</p>
                          <p className="text-[11px] font-bold text-[#2d6b4e]">{platform.engagementRate}% eng.</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-[10px] font-bold text-[#87938b]">
                          {platformVerificationLabel(platform.verified_by)}
                        </p>
                        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-extrabold text-[#b77a12]">
                          Open
                          <ExternalLink className="size-3" />
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          </aside>

          <main className="min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 h-auto w-full justify-start rounded-2xl border border-[#e2e7e1] bg-white p-1 shadow-sm">
                <TabsTrigger value="packages" className="flex-1 rounded-xl data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white md:flex-none">
                  <Package className="mr-2 size-4" />
                  Packages
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="flex-1 rounded-xl data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white md:flex-none">
                  <Play className="mr-2 size-4" />
                  Portfolio
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1 rounded-xl data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white md:flex-none">
                  <Star className="mr-2 size-4" />
                  Reviews
                </TabsTrigger>
              </TabsList>

              {/* Packages Tab */}
              <TabsContent value="packages" className="space-y-4">
                {packageMenu.length > 0 ? (
                  <section className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
                    <div className="border-b border-[#edf1ed] bg-[#fbfaf5] px-4 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Package menu</p>
                          <h3 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Available Packages</h3>
                          <p className="mt-1 text-[12px] font-medium leading-5 text-[#647168]">
                            {filteredPackageMenu.length} of {packageMenu.length} packages
                          </p>
                        </div>
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e]">
                          <Package className="size-4" />
                        </span>
                      </div>

                      {packagePlatforms.length > 1 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPackagePlatforms([])}
                            className={cn(
                              "inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 text-[12px] font-extrabold transition-colors",
                              selectedPackagePlatforms.length === 0
                                ? "border-[#2d6b4e] bg-[#2d6b4e] text-white shadow-sm"
                                : "border-[#d1ddd6] bg-white text-[#496159] hover:border-[#2d6b4e] hover:text-[#1e3d2e]"
                            )}
                          >
                            All
                            <span className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px]",
                              selectedPackagePlatforms.length === 0 ? "bg-white/18 text-white" : "bg-[#e8f0ec] text-[#2d6b4e]"
                            )}>
                              {packageMenu.length}
                            </span>
                          </button>

                          {packagePlatforms.map(({ platform, count }) => {
                            const selected = selectedPackagePlatforms.includes(platform);
                            const meta = getPlatformMeta(platform);
                            return (
                              <button
                                key={platform}
                                type="button"
                                onClick={() => togglePackagePlatform(platform)}
                                className={cn(
                                  "inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 text-[12px] font-extrabold transition-colors",
                                  selected
                                    ? "border-[#2d6b4e] bg-[#e8f0ec] text-[#1e3d2e] shadow-sm"
                                    : "border-[#d1ddd6] bg-white text-[#496159] hover:border-[#2d6b4e] hover:text-[#1e3d2e]"
                                )}
                                aria-pressed={selected}
                              >
                                <PlatformIconBadge platform={platform} size="xs" />
                                {meta?.label ?? platform}
                                <span className={cn(
                                  "rounded-full px-1.5 py-0.5 text-[10px]",
                                  selected ? "bg-white text-[#2d6b4e]" : "bg-[#e8f0ec] text-[#2d6b4e]"
                                )}>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="space-y-4 p-4">
                      {filteredPackageMenu.length > 0 ? (
                        filteredPackageMenu.map((pkg) => (
                          <PackageMenuItem
                            key={pkg.id}
                            pkg={pkg}
                            badges={getPackageBadges(pkg)}
                            canOrder={canHireCreator}
                            activeOrder={activePackageOrders[pkg.id] ?? null}
                            onOrder={handleBookPackage}
                            onViewActiveOrder={handleViewActiveOrder}
                            onViewDetails={handleViewPackageDetails}
                          />
                        ))
                      ) : (
                        <div className="rounded-2xl border border-[#edf1ed] bg-[#fbfaf5] px-5 py-8 text-center">
                          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e8f0ec] text-[#2d6b4e]">
                            <Package className="size-5" />
                          </span>
                          <p className="mt-3 text-sm font-extrabold text-[#1e3d2e]">No packages for this platform mix</p>
                          <button
                            type="button"
                            onClick={() => setSelectedPackagePlatforms([])}
                            className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl bg-[#2d6b4e] px-4 text-[12px] font-extrabold text-white hover:bg-[#1f5239]"
                          >
                            Show all packages
                          </button>
                        </div>
                      )}
                    </div>
                  </section>
                ) : (
                  <Card className="rounded-2xl border-[#e2e7e1] bg-white shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-[#e8f0ec]">
                        <Package className="size-5 text-[#2d6b4e]" />
                      </span>
                      <h3 className="mb-2 text-lg font-extrabold text-[#1e3d2e]">
                        No packages available
                      </h3>
                      <p className="text-center text-sm font-medium text-[#647168]">
                        This creator hasn&apos;t set up any packages yet.
                        <br />
                        Use Quick Deal to send a custom offer.
                      </p>
                      <Button
                        className="mt-4 rounded-xl bg-[#2d6b4e] font-extrabold text-white hover:bg-[#1f5239]"
                        onClick={() => setQuickDealOpen(true)}
                      >
                        Send Quick Deal
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {creatorPortfolio.length > 0 ? creatorPortfolio.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <a href={item.url} target="_blank" rel="noreferrer" className="block">
                        <Card className="group overflow-hidden rounded-2xl border-[#e2e7e1] bg-white shadow-sm transition-shadow hover:shadow-md">
                          <div className="relative aspect-[4/3]">
                            <Image
                              src={item.thumbnail}
                              alt={item.title || `${creator.name} portfolio item ${index + 1}`}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            {item.type === "video" && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                                  <Play className="h-5 w-5 text-foreground" />
                                </div>
                              </div>
                            )}
                            <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              <ExternalLink className="h-4 w-4" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent p-3 pt-10">
                              <p className="line-clamp-2 text-sm font-medium text-white">
                                {item.title || `${creator.name} ${item.type === "video" ? "Video" : "Post"}`}
                              </p>
                              <p className="mt-1 text-xs capitalize text-white/75">
                                {item.platform}{item.views ? ` • ${item.views.toLocaleString()} views` : ""}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </a>
                    </motion.div>
                  )) : (
                    <div className="col-span-full">
                      <Card className="rounded-2xl border-[#e2e7e1] bg-white shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-[#e8f0ec]">
                            <Play className="size-5 text-[#2d6b4e]" />
                          </span>
                          <h3 className="mb-2 text-lg font-extrabold text-[#1e3d2e]">
                            No portfolio items
                          </h3>
                          <p className="text-center text-sm font-medium text-[#647168]">
                            This creator hasn&apos;t added any portfolio items
                            yet.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-4">
                {/* Rating Summary */}
                <Card className="rounded-2xl border-[#e2e7e1] bg-white shadow-sm">
                  <CardContent className="flex flex-col items-center gap-6 py-6 md:flex-row md:justify-between">
                    <div className="text-center md:text-left">
                      <div className="flex items-center justify-center gap-2 md:justify-start">
                        <span className="text-4xl font-black text-[#1e3d2e]">
                          {creator.rating.toFixed(1)}
                        </span>
                        <Star className="h-8 w-8 fill-[#e6aa38] text-[#e6aa38]" />
                      </div>
                      <p className="text-sm font-medium text-[#647168]">
                        Based on {creator.totalReviews} reviews
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <Star
                          key={star}
                          className={`h-6 w-6 ${star <= Math.round(creator.rating) ? "fill-[#e6aa38] text-[#e6aa38]" : "text-[#d7ded8]"}`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews List */}
                {creatorReviews.length > 0 ? (
                  creatorReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                ) : (
                  <Card className="rounded-2xl border-[#e2e7e1] bg-white shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-[#fff1cd]">
                        <Star className="size-5 text-[#b77a12]" />
                      </span>
                      <h3 className="mb-2 text-lg font-extrabold text-[#1e3d2e]">
                        No reviews yet
                      </h3>
                      <p className="text-center text-sm font-medium text-[#647168]">
                        Be the first to work with this creator and leave a
                        review.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>


      {/* Quick Deal Modal */}
      <QuickDealModal
        isOpen={quickDealOpen}
        onClose={() => setQuickDealOpen(false)}
        creator={creator}
      />
      <PackageOrderModal
        isOpen={Boolean(selectedPackage)}
        pkg={selectedPackage}
        onClose={() => setSelectedPackage(null)}
        onCreated={handlePackageOrderCreated}
      />
      <PackageDetailsModal
        isOpen={Boolean(selectedPackageDetails)}
        pkg={selectedPackageDetails}
        badges={selectedPackageDetails ? getPackageBadges(selectedPackageDetails) : []}
        creator={creator}
        creatorProfileHref={`/creator/${creator.username || creator.id}`}
        shareUrl={selectedPackageDetails ? `/packages/${selectedPackageDetails.id}` : undefined}
        canOrder={canHireCreator}
        activeOrder={selectedPackageActiveOrder}
        onClose={() => setSelectedPackageDetails(null)}
        onOrder={handleBookPackage}
        onViewActiveOrder={handleViewActiveOrder}
      />
      <ShareProfileModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        creator={creator}
      />
    </div>
  );
}
