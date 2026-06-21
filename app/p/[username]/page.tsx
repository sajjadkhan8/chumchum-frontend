"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Share2,
  MessageCircle,
  Star,
  MapPin,
  Clock,
  Package,
  Play,
  ExternalLink,
  TrendingUp,
  Zap,
  ArrowRight,
  Users,
  BadgeCheck,
  Globe,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PackageCard } from "@/components/package-card";
import { ReviewCard } from "@/components/review-card";
import { QuickDealModal } from "@/components/quick-deal-modal";
import { PackageOrderModal } from "@/components/package-order-modal";
import { ShareProfileModal } from "@/components/share-profile-modal";
import { formatFollowers, formatPrice, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { creatorsService } from "@/services/creators.service";
import { packagesService } from "@/services/packages.service";
import { reviewsService } from "@/services/reviews.service";
import { getPlatformMeta } from "@/components/platform-icons";
import type { Creator, CreatorPackage, Review } from "@/types";
import { cn } from "@/lib/utils";

/* ─── helpers ─── */
const tabs = ["packages", "portfolio", "reviews"] as const;
type Tab = typeof tabs[number];

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-[#e0e8e3] bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="border-b border-[#f0f3f0] px-5 py-4">
      {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b77a12]">{eyebrow}</p>}
      <h3 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">{title}</h3>
    </div>
  );
}

export default function PublicCreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const router = useRouter();
  const { user, savedCreators, toggleSavedCreator } = useAuthStore();

  const [creator, setCreator]               = useState<Creator | null>(null);
  const [packages, setPackages]             = useState<CreatorPackage[]>([]);
  const [reviews, setReviews]               = useState<Review[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [activeTab, setActiveTab]           = useState<Tab>("packages");
  const [quickDealOpen, setQuickDealOpen]   = useState(false);
  const [selectedPkg, setSelectedPkg]       = useState<CreatorPackage | null>(null);
  const [shareOpen, setShareOpen]           = useState(false);
  const [isSaving, setIsSaving]             = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const found = await creatorsService.getByUsername(username);
        if (!found) { setCreator(null); return; }
        setCreator(found);
        const [pkgs, revs] = await Promise.all([
          packagesService.getByCreatorId(found.id),
          reviewsService.getByCreatorId(found.id),
        ]);
        setPackages(pkgs);
        setReviews(revs);
      } catch {
        setCreator(null);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [username]);

  /* ── loading ── */
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#fbfaf5]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#2d6b4e]/20 border-t-[#2d6b4e]" />
          <p className="text-sm text-[#87938b]">Loading profile…</p>
        </div>
      </div>
    );
  }

  /* ── not found ── */
  if (!creator) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#fbfaf5]">
        <div className="text-center px-4">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-[#e8f0ec]">
            <Users className="size-7 text-[#2d6b4e]" />
          </div>
          <h1 className="text-xl font-extrabold text-[#1e3d2e]">Creator not found</h1>
          <p className="mt-2 text-sm text-[#7a8f82]">This profile doesn&apos;t exist or may have been removed.</p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#2d6b4e] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1f5239]"
          >
            Browse creators <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  /* ── derived values ── */
  const isSaved       = savedCreators.includes(creator.id);
  const canHire       = !user || user.role === "brand";
  const msgPath       = `/brand/messages?creator=${creator.id}`;
  const msgHref       = user ? msgPath : `/login?next=${encodeURIComponent(msgPath)}`;
  const totalFollowers = creator.platforms.reduce((s, p) => s + p.followers, 0);
  const avgEng         = creator.platforms.length
    ? creator.platforms.reduce((s, p) => s + p.engagementRate, 0) / creator.platforms.length
    : 0;
  const completionRate = creator.completionRate
    ?? Math.min(99, Math.round((creator.completedDeals / (creator.completedDeals + 5)) * 100));

  const portfolio = [
    ...creator.contentPreviews,
    ...packages.flatMap((pkg) =>
      [pkg.thumbnail, ...(pkg.mediaUrls ?? [])].filter(Boolean).map((url, i) => ({
        id: `${pkg.id}-${i}`,
        type: /\.(mp4|mov|webm)(\?|$)/i.test(url) ? ("video" as const) : ("image" as const),
        thumbnail: /\.(mp4|mov|webm)(\?|$)/i.test(url) ? pkg.thumbnail : url,
        url,
        platform: pkg.platform,
        title: pkg.title,
        views: pkg.analytics.views,
      }))
    ),
  ].filter((item, i, arr) => arr.findIndex((c) => c.url === item.url) === i);

  const handleBook = (pkg: CreatorPackage) => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "brand") return;
    void packagesService.trackEvent(pkg.id, "CLICK", "public_profile_order").catch(() => undefined);
    setSelectedPkg(pkg);
  };

  const handleSave = async () => {
    if (!user) { router.push("/login"); return; }
    setIsSaving(true);
    try { await toggleSavedCreator(creator.id); } finally { setIsSaving(false); }
  };

  const availabilityDisplay: Record<string, { label: string; cls: string; pulse: boolean }> = {
    AVAILABLE:    { label: "Available Now", cls: "border-emerald-400/30 bg-emerald-500/20 text-emerald-300", pulse: true  },
    BUSY:         { label: "Busy",          cls: "border-amber-400/30 bg-amber-500/20 text-amber-300",       pulse: false },
    ON_VACATION:  { label: "On Vacation",   cls: "border-sky-400/30 bg-sky-500/20 text-sky-300",             pulse: false },
    UNAVAILABLE:  { label: "Unavailable",   cls: "border-white/20 bg-black/30 text-white/70",                pulse: false },
  };
  const avail = availabilityDisplay[creator.availabilityStatus ?? "AVAILABLE"] ?? availabilityDisplay.AVAILABLE;

  const verifiedByLabel: Record<string, { label: string; cls: string }> = {
    SELF:              { label: "Self-reported",    cls: "bg-[#f4f7f5] text-[#87938b]"  },
    PLATFORM_REVIEWED: { label: "Team-verified",    cls: "bg-[#e4f1e8] text-[#1e5c3e]"  },
    API_CONNECTED:     { label: "API-connected",    cls: "bg-sky-50 text-sky-600"        },
  };

  /* ═══════════════════════════════════════ RENDER ══════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#fbfaf5]">

      {/* ── HERO ── */}
      <section className="relative">
        {/* Cover */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#1e3d2e] via-[#2d6b4e] to-[#1a4a32] md:h-64">
          {creator.coverImage && (
            <Image src={creator.coverImage} alt="" fill className="object-cover opacity-70" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d2419]/70 via-[#0d2419]/20 to-[#0d2419]/10" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#fbfaf5] to-transparent" />

          {/* Availability badge — top right of cover */}
          <div className="absolute right-4 top-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold backdrop-blur-sm ${avail.cls}`}>
              {avail.pulse && <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              {avail.label}
            </span>
          </div>
        </div>

        {/* Profile identity dock */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative -mt-9 overflow-visible rounded-[28px] border border-[#dce8e2] bg-white shadow-[0_18px_55px_rgba(30,61,46,0.13)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 rounded-t-[28px] bg-gradient-to-r from-[#2d6b4e] via-[#e6aa38] to-[#fbfaf5]" />
            <div className="flex flex-col gap-4 px-4 pb-4 pt-20 sm:flex-row sm:items-end sm:justify-between sm:px-5 sm:py-5 sm:pl-44">

              {/* Avatar + name */}
              <div className="min-w-0">
                <div className="absolute -top-14 left-5 shrink-0 md:-top-16">
                  <div className="rounded-full border-[6px] border-white bg-white shadow-[0_18px_36px_rgba(30,61,46,0.20)]">
                    <Avatar className="size-28 md:size-36">
                      <AvatarImage src={creator.avatar} alt={creator.name} />
                      <AvatarFallback className="bg-[#1e3d2e] text-2xl font-extrabold text-white">
                        {getInitials(creator.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {creator.isVerified && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-[#fbfaf5] p-0.5">
                      <BadgeCheck className="size-6 fill-[#2d6b4e] text-white" />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="break-words text-3xl font-black tracking-tight text-[#123021] md:text-4xl">
                    {creator.name}
                  </h1>
                  {creator.isTrending && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1cd] px-2.5 py-1 text-[11px] font-extrabold text-[#8b5e12] ring-1 ring-[#efcf83]">
                      <TrendingUp className="size-3" /> Trending
                    </span>
                  )}
                  {creator.isFastResponder && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-extrabold text-sky-600">
                      <Zap className="size-3" /> Fast
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[13px] font-semibold text-[#557063]">
                  <span>@{creator.username}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-[#bdd0c4] sm:inline-block" />
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {creator.city}
                  </span>
                  {creator.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-[#e3a52f] text-[#e3a52f]" />
                      <span className="font-extrabold text-[#1e3d2e]">{creator.rating.toFixed(1)}</span>
                      <span className="text-[#7a8f82]">({creator.totalReviews})</span>
                    </span>
                  )}
                  {creator.website && (
                    <a href={creator.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#2d6b4e] hover:underline">
                      <Globe className="size-3.5" /> Website
                    </a>
                  )}
                </div>
                {/* Deal type chips */}
                {(creator.dealTypes.length > 0 || creator.acceptsBarter || creator.acceptsHybridDeals) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {creator.dealTypes.includes("paid") && (
                      <span className="rounded-full bg-[#e4f1e8] px-3 py-1 text-[11px] font-extrabold text-[#1e5c3e]">Paid</span>
                    )}
                    {(creator.dealTypes.includes("barter") || creator.acceptsBarter) && (
                      <span className="rounded-full bg-[#fdf4e1] px-3 py-1 text-[11px] font-extrabold text-[#9a6b00]">Barter</span>
                    )}
                    {(creator.dealTypes.includes("hybrid") || creator.acceptsHybridDeals) && (
                      <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-extrabold text-sky-600">Hybrid</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 sm:shrink-0">
                {canHire && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full border transition-colors",
                      isSaved
                        ? "border-rose-200 bg-rose-50 text-rose-500"
                        : "border-[#d1ddd6] bg-white text-[#496159] hover:border-[#2d6b4e] hover:text-[#2d6b4e]"
                    )}
                  >
                    <Heart className={cn("size-4", isSaved && "fill-rose-500")} />
                  </button>
                )}
                <button
                  onClick={() => setShareOpen(true)}
                  className="flex size-9 items-center justify-center rounded-full border border-[#d1ddd6] bg-white text-[#496159] transition-colors hover:border-[#2d6b4e] hover:text-[#2d6b4e]"
                >
                  <Share2 className="size-4" />
                </button>
                {canHire && (
                  <>
                    <Link
                      href={msgHref}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#d1ddd6] bg-white px-4 text-sm font-semibold text-[#496159] transition-colors hover:border-[#2d6b4e] hover:text-[#2d6b4e]"
                    >
                      <MessageCircle className="size-4" /> Message
                    </Link>
                    <button
                      onClick={() => setQuickDealOpen(true)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#2d6b4e] px-4 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
                    >
                      Quick Deal
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-[#edf1ed]/65 bg-white/25 px-3 py-1.5 backdrop-blur-md sm:pl-44 sm:pr-4">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/60 bg-[#dce8e2]/45 md:grid-cols-4">
                {[
                  { label: "Followers", value: formatFollowers(totalFollowers), Icon: Users },
                  { label: "Engagement", value: `${avgEng.toFixed(1)}%`, Icon: TrendingUp },
                  { label: "Orders done", value: String(creator.completedDeals), Icon: Package },
                  { label: "Completion", value: `${completionRate}%`, Icon: BadgeCheck },
                ].map(({ label, value, Icon }) => (
                  <div
                    key={label}
                    className="flex min-h-8 items-center justify-center gap-1.5 bg-white/45 px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded-md bg-[#e8f0ec]/55 text-[#2d6b4e]/80">
                      <Icon className="size-3" />
                    </span>
                    <span className="min-w-0 truncate text-[11px] font-bold leading-none text-[#6e8276]/80">
                      <span className="mr-1 text-[13px] font-black text-[#123021]/85">{value}</span>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN GRID ── */}
      <div className="mx-auto mt-6 max-w-5xl px-4 pb-16 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="space-y-4">

            {/* Bio */}
            {creator.bio && (
              <SectionCard>
                <SectionHeader eyebrow="About" title="Bio" />
                <div className="px-5 py-4">
                  <p className="text-[13px] leading-6 text-[#496159]">{creator.bio}</p>
                </div>
              </SectionCard>
            )}

            {/* Categories */}
            {creator.categories.length > 0 && (
              <SectionCard>
                <SectionHeader eyebrow="Specialisation" title="Categories" />
                <div className="flex flex-wrap gap-2 px-5 py-4">
                  {creator.categories.map((c) => (
                    <span key={c} className="rounded-full border border-[#cddad1] bg-[#f0f6f2] px-3 py-1 text-[12px] font-semibold text-[#2d6b4e]">
                      {c}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Platforms */}
            {creator.platforms.length > 0 && (
              <SectionCard>
                <SectionHeader eyebrow="Social" title="Platforms" />
                <div className="divide-y divide-[#f4f6f4]">
                  {creator.platforms.map((p) => {
                    const meta = getPlatformMeta(p.platform);
                    const Icon = meta?.icon ?? Users;
                    const trustInfo = p.verified_by ? verifiedByLabel[p.verified_by] : verifiedByLabel.SELF;
                  return (
                      <div key={p.platform} className="flex items-center gap-3 px-5 py-3.5">
                        <div
                          className="grid size-9 shrink-0 place-items-center rounded-xl"
                          style={{ background: `${meta?.color ?? "#2d6b4e"}18` }}
                        >
                          <Icon className="size-4" style={{ color: meta?.color ?? "#2d6b4e" }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-[#1e3d2e]">{meta?.label ?? p.platform}</p>
                          <p className="truncate text-[11px] text-[#7a8f82]">@{p.username}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[13px] font-extrabold text-[#1e3d2e]">{formatFollowers(p.followers)}</p>
                          <p className="text-[11px] font-semibold text-[#2d6b4e]">{p.engagementRate}% eng</p>
                          {trustInfo && (
                            <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold ${trustInfo.cls}`}>
                              {trustInfo.label}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Rate card */}
            {(creator.rateCardReel || creator.rateCardStory || creator.rateCardPost || creator.rateCardVideo) && (
              <SectionCard>
                <SectionHeader eyebrow="Pricing" title="Starting Rates" />
                <div className="divide-y divide-[#f4f6f4]">
                  {[
                    { label: "Reel / Short",        val: creator.rateCardReel  },
                    { label: "Story / Highlight",   val: creator.rateCardStory },
                    { label: "Static Post",         val: creator.rateCardPost  },
                    { label: "YouTube / Long",      val: creator.rateCardVideo },
                  ].filter((r) => r.val).map((r) => (
                    <div key={r.label} className="flex items-center justify-between px-5 py-3">
                      <span className="text-[13px] text-[#496159]">{r.label}</span>
                      <span className="text-[13px] font-extrabold text-[#1e3d2e]">{formatPrice(r.val!)}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Quick stats */}
            <SectionCard>
              <SectionHeader eyebrow="Track record" title="Stats" />
              <div className="divide-y divide-[#f4f6f4]">
                {[
                  { label: "Response Time",  value: creator.responseTime,                                                         Icon: Clock     },
                  { label: "Deal Types",     value: creator.dealTypes.join(", ") || "—",                                          Icon: Package   },
                  { label: "Languages",      value: (creator.languages ?? []).join(", ") || "—",                                  Icon: Globe     },
                  ...(creator.repeatClients != null
                    ? [{ label: "Repeat Clients", value: `${creator.repeatClients}%`, Icon: Users }]
                    : []),
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e8f0ec]">
                      <Icon className="size-3.5 text-[#2d6b4e]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-[#7a8f82]">{label}</p>
                      <p className="truncate text-[13px] font-bold capitalize text-[#1e3d2e]">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* CTA for brands */}
            {canHire && (
              <div className="relative overflow-hidden rounded-2xl bg-[#1e3d2e] px-5 py-5 text-white">
                <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-[#2d6b4e] opacity-50 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-6 -left-6 size-24 rounded-full bg-[#e3a52f]/20 blur-2xl" />
                <p className="relative text-[11px] font-bold uppercase tracking-widest text-[#e3a52f]">Work together</p>
                <p className="relative mt-2 text-[15px] font-extrabold leading-snug">
                  Ready to start a campaign with {creator.name.split(" ")[0]}?
                </p>
                <div className="relative mt-4 flex flex-col gap-2">
                  <button
                    onClick={() => setQuickDealOpen(true)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#e3a52f] py-2.5 text-sm font-bold text-[#1e3d2e] transition hover:bg-[#f0bd58]"
                  >
                    Send Quick Deal <ArrowRight className="size-3.5" />
                  </button>
                  <Link
                    href={msgHref}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/8 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/12"
                  >
                    <MessageCircle className="size-3.5" /> Message first
                  </Link>
                </div>
              </div>
            )}
          </aside>

          {/* ── RIGHT: TABS ── */}
          <div className="min-w-0">

            {/* Tab bar */}
            <div className="mb-5 flex gap-1 rounded-2xl border border-[#e0e8e3] bg-white p-1.5 shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative flex-1 rounded-xl py-2 text-[13px] font-bold capitalize transition-colors",
                    activeTab === tab
                      ? "bg-[#1e3d2e] text-white shadow-sm"
                      : "text-[#7a8f82] hover:text-[#1e3d2e]"
                  )}
                >
                  {tab}
                  {tab === "reviews" && creator.totalReviews > 0 && (
                    <span className={cn(
                      "ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold",
                      activeTab === tab ? "bg-white/20 text-white" : "bg-[#e8f0ec] text-[#2d6b4e]"
                    )}>
                      {creator.totalReviews}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >

                {/* ── PACKAGES ── */}
                {activeTab === "packages" && (
                  <div className="space-y-3">
                    {packages.length > 0 ? (
                      packages.map((pkg) => (
                        <PackageCard
                          key={pkg.id}
                          pkg={pkg}
                          onOrder={canHire ? () => handleBook(pkg) : undefined}
                        />
                      ))
                    ) : (
                      <SectionCard className="py-14">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="grid size-14 place-items-center rounded-2xl bg-[#e8f0ec]">
                            <Package className="size-6 text-[#2d6b4e]" />
                          </div>
                          <div>
                            <p className="font-extrabold text-[#1e3d2e]">No packages yet</p>
                            <p className="mt-1 text-sm text-[#7a8f82]">
                              This creator hasn&apos;t listed any packages.<br />Send a quick deal to start the conversation.
                            </p>
                          </div>
                          {canHire && (
                            <button
                              onClick={() => setQuickDealOpen(true)}
                              className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#2d6b4e] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1f5239]"
                            >
                              Send Quick Deal
                            </button>
                          )}
                        </div>
                      </SectionCard>
                    )}
                  </div>
                )}

                {/* ── PORTFOLIO ── */}
                {activeTab === "portfolio" && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {portfolio.length > 0 ? portfolio.map((item, index) => (
                      <motion.a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.06 }}
                        className="group block overflow-hidden rounded-2xl border border-[#e0e8e3] bg-white shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-[#e8f0ec]">
                          <Image
                            src={item.thumbnail}
                            alt={item.title ?? "Portfolio"}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {item.type === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                              <div className="grid size-11 place-items-center rounded-full bg-white/90 shadow-md">
                                <Play className="size-5 text-[#1e3d2e]" />
                              </div>
                            </div>
                          )}
                          <div className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                            <ExternalLink className="size-3.5 text-[#1e3d2e]" />
                          </div>
                        </div>
                        <div className="px-3.5 py-3">
                          <p className="line-clamp-1 text-[13px] font-bold text-[#1e3d2e]">
                            {item.title ?? `${creator.name} — ${item.type === "video" ? "Video" : "Post"}`}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[11px] capitalize text-[#7a8f82]">{item.platform}</span>
                            {(item.views ?? 0) > 0 && (
                              <span className="text-[11px] font-semibold text-[#496159]">{(item.views!).toLocaleString()} views</span>
                            )}
                          </div>
                        </div>
                      </motion.a>
                    )) : (
                      <div className="col-span-full">
                        <SectionCard className="py-14">
                          <div className="flex flex-col items-center gap-3 text-center">
                            <div className="grid size-14 place-items-center rounded-2xl bg-[#e8f0ec]">
                              <Play className="size-6 text-[#2d6b4e]" />
                            </div>
                            <div>
                              <p className="font-extrabold text-[#1e3d2e]">No portfolio items</p>
                              <p className="mt-1 text-sm text-[#7a8f82]">This creator hasn&apos;t added any content yet.</p>
                            </div>
                          </div>
                        </SectionCard>
                      </div>
                    )}
                  </div>
                )}

                {/* ── REVIEWS ── */}
                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    {/* Rating summary */}
                    {creator.totalReviews > 0 && (
                      <div className="flex items-center gap-5 rounded-2xl border border-[#e0e8e3] bg-white px-5 py-4 shadow-sm">
                        <div className="text-center">
                          <p className="text-4xl font-extrabold tracking-tight text-[#1e3d2e]">{creator.rating.toFixed(1)}</p>
                          <div className="mt-1 flex justify-center gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className={cn("size-4", s <= Math.round(creator.rating) ? "fill-[#e3a52f] text-[#e3a52f]" : "text-[#dde5df]")} />
                            ))}
                          </div>
                          <p className="mt-1 text-[11px] text-[#7a8f82]">{creator.totalReviews} reviews</p>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {[5,4,3,2,1].map((star) => {
                            const pct = star === Math.round(creator.rating) ? 70 : star > Math.round(creator.rating) ? 10 : 20;
                            return (
                              <div key={star} className="flex items-center gap-2">
                                <span className="w-3 text-right text-[11px] font-bold text-[#496159]">{star}</span>
                                <Star className="size-3 fill-[#e3a52f] text-[#e3a52f]" />
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8f0ec]">
                                  <div className="h-full rounded-full bg-[#e3a52f]" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {reviews.length > 0 ? (
                      reviews.map((r) => <ReviewCard key={r.id} review={r} />)
                    ) : (
                      <SectionCard className="py-14">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="grid size-14 place-items-center rounded-2xl bg-[#e8f0ec]">
                            <Star className="size-6 text-[#2d6b4e]" />
                          </div>
                          <div>
                            <p className="font-extrabold text-[#1e3d2e]">No reviews yet</p>
                            <p className="mt-1 text-sm text-[#7a8f82]">Be the first to collaborate and leave a review.</p>
                          </div>
                        </div>
                      </SectionCard>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      <QuickDealModal isOpen={quickDealOpen} onClose={() => setQuickDealOpen(false)} creator={creator} />
      <PackageOrderModal
        isOpen={Boolean(selectedPkg)}
        pkg={selectedPkg}
        onClose={() => setSelectedPkg(null)}
        onCreated={() => router.push("/brand/orders")}
      />
      <ShareProfileModal isOpen={shareOpen} onClose={() => setShareOpen(false)} creator={creator} />
    </div>
  );
}
