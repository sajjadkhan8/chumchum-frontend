"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Archive,
  ChevronDown,
  Copy,
  Eye,
  FilePenLine,
  FileText,
  Filter,
  MoreVertical,
  Package,
  Pause,
  Play,
  Plus,
  Search,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatorMetricCard } from "@/components/creator-metric-card";
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
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { formatPrice } from "@/lib/utils";
import { getCategoryLabel } from "@/lib/categories";
import { PlatformIconBadge } from "@/components/platform-icons";
import type { CreatorPackage, PackageStatus } from "@/types";
import { toast } from "sonner";
import { useCreatorPackagesStore } from "@/store/creator-packages-store";

// ── Design constants ──────────────────────────────────────────────────────────
const panelClass =
  "rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]";
const inputClass =
  "h-10 w-full rounded-xl border-[#cddad1] bg-[#fbfaf5] px-3.5 text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] shadow-none focus-visible:border-[#2d6b4e] focus-visible:ring-4 focus-visible:ring-[#2d6b4e]/8 focus-visible:ring-offset-0";

// ── Static options ─────────────────────────────────────────────────────────────
const statusOptions: { value: PackageStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
];

const dealTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "paid", label: "Paid" },
  { value: "barter", label: "Barter" },
  { value: "hybrid", label: "Hybrid" },
];

const platformOptions = [
  { value: "all", label: "All Platforms" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "snapchat", label: "Snapchat" },
];

// ── Status helpers ─────────────────────────────────────────────────────────────
function statusBadgeClass(value: PackageStatus) {
  switch (value) {
    case "active":
      return "bg-[#e4f1e8] text-[#1e5c3e]";
    case "draft":
      return "bg-[#e8eae8] text-[#5a6a62]";
    case "paused":
      return "bg-[#fdf3dc] text-[#8a6010]";
    case "archived":
      return "bg-[#eeeeed] text-[#5a5a5a]";
    default:
      return "bg-[#e8eae8] text-[#5a6a62]";
  }
}

// ── Package card skeleton ─────────────────────────────────────────────────────
function PackageCardSkeleton() {
  return (
    <div className={`${panelClass} overflow-hidden`}>
      <div className="h-36 w-full animate-pulse bg-[#e8eeeb]" />
      <div className="px-4 pb-4 pt-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#e8eeeb]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#e8eeeb]" />
          </div>
          <div className="h-7 w-7 animate-pulse rounded-lg bg-[#e8eeeb]" />
        </div>
        <div className="h-3 w-full animate-pulse rounded bg-[#e8eeeb]" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-[#e8eeeb]" />
        <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden bg-[#e8eeeb]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white px-3 py-2.5 space-y-1">
              <div className="h-2 w-12 animate-pulse rounded bg-[#e8eeeb]" />
              <div className="h-3 w-10 animate-pulse rounded bg-[#e8eeeb]" />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-20 animate-pulse rounded-full bg-[#e8eeeb]" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-[#e8eeeb]" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#e8eeeb]">
          <div className="h-4 w-20 animate-pulse rounded bg-[#e8eeeb]" />
          <div className="flex gap-2">
            <div className="h-8 w-20 animate-pulse rounded-full bg-[#e8eeeb]" />
            <div className="h-8 w-16 animate-pulse rounded-full bg-[#e8eeeb]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page content ─────────────────────────────────────────────────────────
function CreatorPackagesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const packages = useCreatorPackagesStore((state) => state.packages);
  const isLoading = useCreatorPackagesStore((state) => state.isLoading);
  const fetchPackages = useCreatorPackagesStore((state) => state.fetchPackages);
  const duplicatePackage = useCreatorPackagesStore((state) => state.duplicatePackage);
  const archivePackage = useCreatorPackagesStore((state) => state.archivePackage);
  const togglePausePackage = useCreatorPackagesStore((state) => state.togglePausePackage);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PackageStatus | "all">("all");
  const [dealType, setDealType] = useState<"all" | "paid" | "barter" | "hybrid">("all");
  const [platform, setPlatform] = useState<"all" | "instagram" | "youtube" | "tiktok" | "facebook" | "snapchat">("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  useEffect(() => {
    void fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (!statusParam) {
      setStatus("all");
      return;
    }
    if (["active", "draft", "paused", "archived"].includes(statusParam)) {
      setStatus(statusParam as PackageStatus);
    }
  }, [searchParams]);

  const updateStatusWithUrl = useCallback((nextStatus: PackageStatus | "all") => {
    setStatus(nextStatus);
    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", nextStatus);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  const summary = useMemo(() => {
    const active = packages.filter((pkg) => pkg.status === "active").length;
    const drafts = packages.filter((pkg) => pkg.status === "draft").length;
    const archived = packages.filter((pkg) => pkg.status === "archived").length;
    const paused = packages.filter((pkg) => pkg.status === "paused").length;
    const monthlyProjection = packages
      .filter((pkg) => pkg.status === "active")
      .reduce((total, pkg) => total + pkg.price, 0);
    return { active, drafts, archived, paused, monthlyProjection };
  }, [packages]);

  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return packages
      .filter((pkg) => {
        const matchesSearch =
          !query ||
          pkg.title.toLowerCase().includes(query) ||
          pkg.shortDescription.toLowerCase().includes(query) ||
          pkg.tags.some((tag) => tag.toLowerCase().includes(query));

        const matchesStatus = status === "all" || pkg.status === status;
        const matchesDealType = dealType === "all" || pkg.dealType === dealType;
        const matchesPlatform = platform === "all" || pkg.platform === platform;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDealType &&
          matchesPlatform
        );
      })
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [packages, search, status, dealType, platform]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];

    if (status !== "all") {
      chips.push({
        key: "status",
        label: statusOptions.find((option) => option.value === status)?.label || status,
        clear: () => updateStatusWithUrl("all"),
      });
    }
    if (dealType !== "all") {
      chips.push({
        key: "dealType",
        label: dealTypeOptions.find((option) => option.value === dealType)?.label || dealType,
        clear: () => setDealType("all"),
      });
    }
    if (platform !== "all") {
      chips.push({
        key: "platform",
        label: platformOptions.find((option) => option.value === platform)?.label || platform,
        clear: () => setPlatform("all"),
      });
    }
    return chips;
  }, [dealType, platform, status, updateStatusWithUrl]);

  const clearAllFilters = () => {
    setSearch("");
    updateStatusWithUrl("all");
    setDealType("all");
    setPlatform("all");
  };

  const handleDuplicate = async (pkg: CreatorPackage) => {
    try {
      await duplicatePackage(pkg.id);
      toast.success("Package duplicated as draft");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to duplicate package";
      toast.error(message);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archivePackage(id);
      toast.success("Package moved to archive");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to archive package";
      toast.error(message);
    }
  };

  const handlePauseResume = async (pkg: CreatorPackage) => {
    try {
      await togglePausePackage(pkg.id);
      toast.success(pkg.status === "paused" ? "Package resumed" : "Package paused");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update package status";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-full bg-[#fbfaf5] px-4 pb-8 pt-2 text-[#1e3d2e] sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-[1320px] space-y-5">

        {/* ── Stat strip ── */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <CreatorMetricCard dark title="Active" value={summary.active} sub="live packages" Icon={Play} />
          <CreatorMetricCard title="Drafts" value={summary.drafts} sub="not published yet" Icon={FileText} />
          <CreatorMetricCard title="Archived" value={summary.archived} sub="stored packages" Icon={Archive} />
          <CreatorMetricCard gold title="Monthly Value" value={formatPrice(summary.monthlyProjection)} sub="active package total" Icon={Wallet} />
        </div>

        {/* ── Filter bar ── */}
        <div className={`${panelClass} px-4 py-3.5`}>
          {/* Row 1 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#b0bfb8]" />
              <input
                placeholder="Search packages…"
                className={`${inputClass} pl-9`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* More filters toggle */}
            <Button
              variant="outline"
              className="h-10 shrink-0 gap-1.5 rounded-xl border-[#cddad1] bg-[#fbfaf5] text-sm text-[#6b7870] hover:bg-[#e6eceb]"
              onClick={() => setShowMoreFilters((v) => !v)}
            >
              <Filter className="size-3.5" />
              Filters
              <ChevronDown
                className={`size-3.5 transition-transform ${showMoreFilters ? "rotate-180" : ""}`}
              />
            </Button>
          </div>

          {activeFilterChips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#e8eeeb] pt-3">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#e4f1e8] px-2.5 text-xs font-bold text-[#1e5c3e] transition-colors hover:bg-[#d7eadf]"
                >
                  {chip.label}
                  <X className="size-3" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="h-7 rounded-full px-2.5 text-xs font-bold text-[#7a8f82] transition-colors hover:bg-[#f4f7f5] hover:text-[#2d6b4e]"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Row 2 – collapsible secondary filters */}
          <Collapsible open={showMoreFilters}>
            <CollapsibleContent>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Select value={status} onValueChange={(v) => updateStatusWithUrl(v as PackageStatus | "all")}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dealType} onValueChange={(v) => setDealType(v as typeof dealType)}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Deal Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealTypeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <span className="inline-flex items-center gap-2">
                          {o.value !== "all" && <PlatformIconBadge platform={o.value} size="xs" />}
                          {o.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8 text-[#2d6b4e] hover:text-[#1f5239]"
                onClick={clearAllFilters}
              >
                Clear all
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* ── Package grid ── */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <PackageCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPackages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="size-12 text-[#c2d8cb]" />
            <h3 className="mt-4 text-lg font-extrabold text-[#1e3d2e]">
              {status === "active" ? "No active packages yet" : "No packages match your filters"}
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-[#87938b]">
              {status === "active"
                ? "Create your first barter, paid, or hybrid package to start getting inquiries."
                : "Try adjusting status, pricing type, or platform filters."}
            </p>
            <Link
              href="/creator/packages/new"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2d6b4e] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
            >
              <Plus className="size-4" />
              Create Package
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div className={`${panelClass} overflow-hidden`}>
                  {/* Thumbnail */}
                  <div className="relative h-36 w-full">
                    <Image
                      src={pkg.thumbnail}
                      alt={pkg.title}
                      fill
                      className="object-cover"
                    />
                    {/* Overlays */}
                    <div className="absolute left-3 top-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusBadgeClass(pkg.status)}`}
                      >
                        {pkg.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="absolute right-3 top-3">
                      <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold capitalize text-[#1e3d2e]">
                        {pkg.dealType}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-4 pb-4 pt-3">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-extrabold leading-tight text-[#1e3d2e]">
                          {pkg.title}
                        </h3>
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-[#87938b]">
                          <PlatformIconBadge platform={pkg.platform} size="xs" />
                          <span>{pkg.platform} · {getCategoryLabel(pkg.category)}</span>
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-[#87938b] hover:text-[#1e3d2e]"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/creator/packages/${pkg.id}/edit`}>
                              <FilePenLine className="mr-2 size-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDuplicate(pkg)}>
                            <Copy className="mr-2 size-4" /> Duplicate
                          </DropdownMenuItem>
                          {(pkg.status === "active" || pkg.status === "paused") && (
                            <DropdownMenuItem onSelect={() => handlePauseResume(pkg)}>
                              {pkg.status === "paused" ? (
                                <Play className="mr-2 size-4" />
                              ) : (
                                <Pause className="mr-2 size-4" />
                              )}
                              {pkg.status === "paused" ? "Resume" : "Pause"}
                            </DropdownMenuItem>
                          )}
                          {pkg.status !== "archived" && (
                            <DropdownMenuItem onSelect={() => handleArchive(pkg.id)}>
                              <Archive className="mr-2 size-4" /> Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/creator/packages/${pkg.id}`}>
                              <Eye className="mr-2 size-4" /> View details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Short description */}
                    <p className="mt-2 line-clamp-2 text-sm text-[#6b7870]">
                      {pkg.shortDescription}
                    </p>

                    {/* Analytics strip */}
                    <div className="mt-2 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-[#e8eeeb]">
                      <div className="bg-white px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Views</p>
                        <p className="mt-0.5 font-bold text-[#1e3d2e]">
                          {pkg.analytics.views.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Inquiries</p>
                        <p className="mt-0.5 font-bold text-[#1e3d2e]">{pkg.analytics.inquiries}</p>
                      </div>
                      <div className="bg-white px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Conversion</p>
                        <p className="mt-0.5 font-bold text-[#1e3d2e]">{pkg.analytics.conversionRate}%</p>
                      </div>
                    </div>

                    {/* Tags row */}
                    <div className="mt-2 inline-flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-[#e6eceb] px-2.5 py-0.5 text-[10px] font-bold text-[#2d6b4e]">
                        {pkg.ordersCompleted} orders
                      </span>
                      {pkg.analytics.completionRate > 0 && (
                        <span className="rounded-full bg-[#e6eceb] px-2.5 py-0.5 text-[10px] font-bold text-[#2d6b4e]">
                          {pkg.analytics.completionRate}% completion
                        </span>
                      )}
                      {pkg.analytics.repeatBrands > 0 && (
                        <span className="rounded-full bg-[#e6eceb] px-2.5 py-0.5 text-[10px] font-bold text-[#2d6b4e]">
                          {pkg.analytics.repeatBrands} repeat
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-3 flex items-center justify-between border-t border-[#e8eeeb] pt-3">
                      <p className="font-bold text-[#2d6b4e]">
                        {pkg.dealType === "barter"
                          ? "Barter"
                          : pkg.dealType === "hybrid"
                            ? `${formatPrice(pkg.hybridCashAmount ?? pkg.price)} + barter`
                            : formatPrice(pkg.price)}
                      </p>
                      <Button
                        className="h-8 rounded-full bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#1f5239]"
                        asChild
                      >
                        <Link href={`/creator/packages/${pkg.id}/edit`}>
                          <FilePenLine className="mr-1 size-3.5" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Top performers section ── */}
        <div className={panelClass}>
          <div className="px-6 pb-5 pt-5">
            {/* Section heading */}
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#87938b]">
                BEST PERFORMANCE
              </p>
              <h2 className="mt-1 text-lg font-extrabold text-[#1e3d2e]">
                Top converting packages
              </h2>
            </div>

            <div className="space-y-3">
              {packages
                .slice()
                .sort((a, b) => b.analytics.conversionRate - a.analytics.conversionRate)
                .slice(0, 3)
                .map((item) => (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="truncate pr-3 font-semibold text-[#1e3d2e]">{item.title}</p>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fdf8ec] px-2.5 py-0.5 text-xs font-bold text-[#b77a12]">
                        <TrendingUp className="size-3 text-[#e6aa38]" />
                        {item.analytics.conversionRate}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f4f7f5]">
                      <div
                        className="h-full rounded-full bg-[#e6aa38] transition-all"
                        style={{ width: `${Math.min(item.analytics.conversionRate * 8, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CreatorPackagesPage() {
  return (
    <Suspense fallback={<div className="min-h-full bg-[#fbfaf5]" />}>
      <CreatorPackagesPageContent />
    </Suspense>
  );
}
