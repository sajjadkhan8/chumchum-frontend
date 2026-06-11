"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Archive,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Copy,
  Eye,
  FilePenLine,
  Filter,
  Pause,
  Play,
  Search,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { EmptyState } from "@/components/empty-state";
import { PackageCardSkeleton } from "@/components/skeletons";
import { formatPrice } from "@/lib/utils";
import type { CreatorPackage, PackageStatus } from "@/types";
import { toast } from "sonner";
import { useCreatorPackagesStore } from "@/store/creator-packages-store";

const statusOptions: { value: PackageStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
  { value: "under_review", label: "Under Review" },
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
  const [performance, setPerformance] = useState<"all" | "top" | "mid" | "low">("all");
  const [earningsBand, setEarningsBand] = useState<"all" | "under25" | "25to50" | "50plus">("all");
  const [sortBy, setSortBy] = useState<"recent" | "views" | "conversion" | "orders">("recent");
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

    if (["active", "draft", "paused", "archived", "under_review"].includes(statusParam)) {
      setStatus(statusParam as PackageStatus);
    }
  }, [searchParams]);

  const updateStatusWithUrl = (nextStatus: PackageStatus | "all") => {
    setStatus(nextStatus);
    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", nextStatus);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const summary = useMemo(() => {
    const active = packages.filter((pkg) => pkg.status === "active").length;
    const drafts = packages.filter((pkg) => pkg.status === "draft").length;
    const archived = packages.filter((pkg) => pkg.status === "archived").length;
    const paused = packages.filter((pkg) => pkg.status === "paused").length;
    const underReview = packages.filter((pkg) => pkg.status === "under_review").length;
    const monthlyProjection = packages
      .filter((pkg) => pkg.status === "active")
      .reduce((total, pkg) => total + pkg.price, 0);

    return { active, drafts, archived, paused, underReview, monthlyProjection };
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

        const matchesPerformance =
          performance === "all" ||
          (performance === "top" && pkg.analytics.conversionRate >= 8) ||
          (performance === "mid" && pkg.analytics.conversionRate >= 5 && pkg.analytics.conversionRate < 8) ||
          (performance === "low" && pkg.analytics.conversionRate < 5);

        const matchesEarnings =
          earningsBand === "all" ||
          (earningsBand === "under25" && pkg.price < 25000) ||
          (earningsBand === "25to50" && pkg.price >= 25000 && pkg.price <= 50000) ||
          (earningsBand === "50plus" && pkg.price > 50000);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDealType &&
          matchesPlatform &&
          matchesPerformance &&
          matchesEarnings
        );
      })
      .sort((a, b) => {
        if (sortBy === "views") return b.analytics.views - a.analytics.views;
        if (sortBy === "conversion") return b.analytics.conversionRate - a.analytics.conversionRate;
        if (sortBy === "orders") return b.ordersCompleted - a.ordersCompleted;
        return b.id.localeCompare(a.id);
      });
  }, [packages, search, status, dealType, platform, performance, earningsBand, sortBy]);

  const saveCurrentFilter = () => {
    const payload = { status, dealType, platform, performance, earningsBand, sortBy };
    localStorage.setItem("creator-package-filters", JSON.stringify(payload));
    toast.success("Filter saved");
  };

  const applySavedFilter = () => {
    const raw = localStorage.getItem("creator-package-filters");
    if (!raw) {
      toast.info("No saved filters found yet.");
      return;
    }

    const parsed = JSON.parse(raw) as {
      status: PackageStatus | "all";
      dealType: "all" | "paid" | "barter" | "hybrid";
      platform: "all" | "instagram" | "youtube" | "tiktok" | "facebook" | "snapchat";
      performance: "all" | "top" | "mid" | "low";
      earningsBand: "all" | "under25" | "25to50" | "50plus";
      sortBy: "recent" | "views" | "conversion" | "orders";
    };

    setStatus(parsed.status);
    setDealType(parsed.dealType);
    setPlatform(parsed.platform);
    setPerformance(parsed.performance);
    setEarningsBand(parsed.earningsBand);
    setSortBy(parsed.sortBy);
    toast.success("Saved filter applied");
  };

  const statusBadgeClass = (value: PackageStatus) =>
    value === "active"
      ? "bg-green-100 text-green-700"
      : value === "draft"
        ? "bg-muted text-muted-foreground"
        : value === "paused"
          ? "bg-amber-100 text-amber-700"
          : value === "archived"
            ? "bg-slate-100 text-slate-700"
            : "bg-blue-100 text-blue-700";

  const handleDuplicate = async (pkg: CreatorPackage) => {
    try {
      await duplicatePackage(pkg.id);
      toast.success("Package duplicated as draft");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to duplicate package';
      toast.error(message);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archivePackage(id);
      toast.success("Package moved to archive");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to archive package';
      toast.error(message);
    }
  };

  const handlePauseResume = async (pkg: CreatorPackage) => {
    try {
      await togglePausePackage(pkg.id);
      toast.success(pkg.status === "paused" ? "Package resumed" : "Package paused");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update package status';
      toast.error(message);
    }
  };

  return (
    <div className="container mx-auto p-2.5 pb-3 md:p-3">

      {/* ── Compact stat strip ── */}
      <div className="mb-2.5 grid grid-cols-2 gap-2 xl:grid-cols-4">
        {[
          { label: "Active", value: summary.active },
          { label: "Drafts", value: summary.drafts },
          { label: "Archived", value: summary.archived },
          { label: "Monthly Value", value: formatPrice(summary.monthlyProjection), accent: true },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between px-3 py-2">
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className={`text-base font-bold leading-none ${s.accent ? "text-primary" : ""}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Inline search + status + actions ── */}
      <Card className="mb-2.5">
        <CardContent className="px-3 py-2">
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search packages…"
                className="h-8 pl-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status — most-used filter inline */}
            <Select value={status} onValueChange={(v) => updateStatusWithUrl(v as PackageStatus | "all")}>
              <SelectTrigger className="h-8 w-36 shrink-0 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Sort — second most-used inline */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="h-8 w-36 shrink-0 text-xs">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="conversion">Best Conversion</SelectItem>
                <SelectItem value="orders">Most Orders</SelectItem>
              </SelectContent>
            </Select>

            {/* More filters toggle */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1 text-xs"
              onClick={() => setShowMoreFilters((v) => !v)}
            >
              <Filter className="h-3 w-3" />
              Filters
              <ChevronDown className={`h-3 w-3 transition-transform ${showMoreFilters ? "rotate-180" : ""}`} />
            </Button>

            {/* Save/load filters hidden in icon dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <Bookmark className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={saveCurrentFilter}>
                  <Bookmark className="mr-2 h-4 w-4" /> Save current filters
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={applySavedFilter}>
                  <BookmarkCheck className="mr-2 h-4 w-4" /> Load saved filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Collapsible secondary filters */}
          <Collapsible open={showMoreFilters}>
            <CollapsibleContent>
              <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                <Select value={dealType} onValueChange={(v) => setDealType(v as typeof dealType)}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Deal Type" /></SelectTrigger>
                  <SelectContent>{dealTypeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Platform" /></SelectTrigger>
                  <SelectContent>{platformOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={performance} onValueChange={(v) => setPerformance(v as typeof performance)}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Performance" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Performance</SelectItem>
                    <SelectItem value="top">Top Conversion</SelectItem>
                    <SelectItem value="mid">Mid Conversion</SelectItem>
                    <SelectItem value="low">Low Conversion</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={earningsBand} onValueChange={(v) => setEarningsBand(v as typeof earningsBand)}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Earnings" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Earnings</SelectItem>
                    <SelectItem value="under25">Under PKR 625k</SelectItem>
                    <SelectItem value="25to50">PKR 625k – 1.25M</SelectItem>
                    <SelectItem value="50plus">PKR 1.25M+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1.5 h-7"
                onClick={() => {
                  setSearch("");
                  updateStatusWithUrl("all");
                  setDealType("all");
                  setPlatform("all");
                  setPerformance("all");
                  setEarningsBand("all");
                  setSortBy("recent");
                }}
              >
                Clear all
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* ── Package grid ── */}
      {isLoading ? (
        <div className="grid gap-2.5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <PackageCardSkeleton key={i} />)}
        </div>
      ) : filteredPackages.length === 0 ? (
        <EmptyState
          title={status === "active" ? "No active packages yet" : "No packages match your filters"}
          description={
            status === "active"
              ? "Create your first barter, paid, or hybrid package to start getting inquiries."
              : "Try adjusting status, pricing type, or performance filters."
          }
          action={{ label: "Create Package", onClick: () => toast.info("Use the Create Package button to launch a new listing.") }}
        />
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {filteredPackages.map((pkg, index) => (
            <motion.div key={pkg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Card className="overflow-hidden border-border/70">
                <div className="relative h-28 w-full">
                  <Image src={pkg.thumbnail} alt={pkg.title} fill className="object-cover" />
                  <div className="absolute left-2.5 top-2.5 flex gap-1.5">
                    <Badge variant="secondary" className={statusBadgeClass(pkg.status)}>{pkg.status.replace("_", " ")}</Badge>
                    <Badge variant="secondary" className="capitalize">{pkg.dealType}</Badge>
                  </div>
                </div>
                <CardContent className="space-y-2 px-3 pb-2.5 pt-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold leading-tight">{pkg.title}</h3>
                      <p className="text-sm text-muted-foreground">{pkg.platform} • {pkg.category}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><Filter className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/creator/packages/${pkg.id}/edit`}><FilePenLine className="mr-2 h-4 w-4" /> Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDuplicate(pkg)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        {(pkg.status === "active" || pkg.status === "paused") && (
                          <DropdownMenuItem onSelect={() => handlePauseResume(pkg)}>
                            {pkg.status === "paused" ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                            {pkg.status === "paused" ? "Resume" : "Pause"}
                          </DropdownMenuItem>
                        )}
                        {pkg.status !== "archived" && (
                          <DropdownMenuItem onSelect={() => handleArchive(pkg.id)}>
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={`/creator/packages/${pkg.id}`}><Eye className="mr-2 h-4 w-4" /> Preview</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="line-clamp-2 text-sm text-muted-foreground">{pkg.shortDescription}</p>

                  <div className="grid grid-cols-3 gap-1.5 rounded-md border border-border/60 p-1.5 text-xs">
                    <div><p className="text-muted-foreground">Views</p><p className="font-semibold">{pkg.analytics.views.toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground">Inquiries</p><p className="font-semibold">{pkg.analytics.inquiries}</p></div>
                    <div><p className="text-muted-foreground">Conversion</p><p className="font-semibold">{pkg.analytics.conversionRate}%</p></div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">Orders: {pkg.ordersCompleted}</Badge>
                    <Badge variant="outline">Completion: {pkg.analytics.completionRate}%</Badge>
                    <Badge variant="outline">Repeat: {pkg.analytics.repeatBrands}</Badge>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <p className="text-sm font-bold text-primary">
                      {pkg.dealType === "barter" ? "Barter" : pkg.dealType === "hybrid" ? `${formatPrice(pkg.hybridCashAmount || pkg.price)} + barter` : formatPrice(pkg.price)}
                    </p>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/creator/packages/${pkg.id}`}><Eye className="mr-1 h-3 w-3" /> Preview</Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/creator/packages/${pkg.id}/edit`}><FilePenLine className="mr-1 h-3 w-3" /> Edit</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Top Performing Packages ── */}
      <Card className="mt-2.5">
        <CardHeader className="px-3 py-2.5">
          <CardTitle>Top Performing Packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 pb-2.5 pt-0">
          {packages
            .slice()
            .sort((a, b) => b.analytics.conversionRate - a.analytics.conversionRate)
            .slice(0, 3)
            .map((item) => (
              <div key={item.id} className="rounded-md border border-border/60 p-2">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <TrendingUp className="mr-1 h-3 w-3" /> {item.analytics.conversionRate}%
                  </Badge>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(item.analytics.conversionRate * 8, 100)}%` }} />
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreatorPackagesPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-6" />}>
      <CreatorPackagesPageContent />
    </Suspense>
  );
}
