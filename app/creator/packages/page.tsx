"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Archive,
  BarChart3,
  Copy,
  Eye,
  FilePenLine,
  Filter,
  Pause,
  Play,
  Plus,
  Search,
  Sparkles,
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
import { EmptyState } from "@/components/empty-state";
import { PackageCardSkeleton } from "@/components/skeletons";
import { creatorPackages } from "@/data/creator-packages";
import { cn, formatPrice } from "@/lib/utils";
import type { CreatorPackage, PackageStatus } from "@/types";
import { toast } from "sonner";

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
];

export default function CreatorPackagesPage() {
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<CreatorPackage[]>(creatorPackages);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PackageStatus | "all">("all");
  const [dealType, setDealType] = useState<"all" | "paid" | "barter" | "hybrid">("all");
  const [platform, setPlatform] = useState<"all" | "instagram" | "youtube" | "tiktok">("all");
  const [performance, setPerformance] = useState<"all" | "top" | "mid" | "low">("all");
  const [earningsBand, setEarningsBand] = useState<"all" | "under25" | "25to50" | "50plus">("all");
  const [sortBy, setSortBy] = useState<"recent" | "views" | "conversion" | "orders">("recent");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (!statusParam) return;

    if (["active", "draft", "paused", "archived", "under_review"].includes(statusParam)) {
      setStatus(statusParam as PackageStatus);
    }
  }, [searchParams]);

  const summary = useMemo(() => {
    const active = packages.filter((pkg) => pkg.status === "active").length;
    const drafts = packages.filter((pkg) => pkg.status === "draft").length;
    const archived = packages.filter((pkg) => pkg.status === "archived").length;
    const monthlyProjection = packages
      .filter((pkg) => pkg.status === "active")
      .reduce((total, pkg) => total + pkg.price, 0);

    return { active, drafts, archived, monthlyProjection };
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
      platform: "all" | "instagram" | "youtube" | "tiktok";
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

  const handleDuplicate = (pkg: CreatorPackage) => {
    const duplicate: CreatorPackage = {
      ...pkg,
      id: `copy-${Date.now()}`,
      title: `${pkg.title} (Copy)`,
      status: "draft",
      visibility: "private",
    };
    setPackages((prev) => [duplicate, ...prev]);
    toast.success("Package duplicated as draft");
  };

  const handleArchive = (id: string) => {
    setPackages((prev) => prev.map((pkg) => (pkg.id === id ? { ...pkg, status: "archived" } : pkg)));
    toast.success("Package moved to archive");
  };

  const handlePauseResume = (pkg: CreatorPackage) => {
    setPackages((prev) =>
      prev.map((item) =>
        item.id === pkg.id
          ? { ...item, status: item.status === "paused" ? "active" : "paused" }
          : item
      )
    );
    toast.success(pkg.status === "paused" ? "Package resumed" : "Package paused");
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Package Studio</h1>
          <p className="text-muted-foreground">Manage paid, barter, and hybrid offers like a professional creator business.</p>
        </div>
        <Button asChild>
          <Link href="/creator/packages/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Package
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active Packages</p><p className="text-2xl font-bold">{summary.active}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Drafts</p><p className="text-2xl font-bold">{summary.drafts}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Archived</p><p className="text-2xl font-bold">{summary.archived}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Monthly Package Value</p><p className="text-2xl font-bold text-primary">{formatPrice(summary.monthlyProjection)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search, Filter & Sort</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, tags, or package intent"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <Select value={status} onValueChange={(value) => setStatus(value as PackageStatus | "all")}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={dealType} onValueChange={(value) => setDealType(value as typeof dealType)}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>{dealTypeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={platform} onValueChange={(value) => setPlatform(value as typeof platform)}>
              <SelectTrigger><SelectValue placeholder="Platform" /></SelectTrigger>
              <SelectContent>{platformOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={performance} onValueChange={(value) => setPerformance(value as typeof performance)}>
              <SelectTrigger><SelectValue placeholder="Performance" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="top">Top Conversion</SelectItem>
                <SelectItem value="mid">Mid Conversion</SelectItem>
                <SelectItem value="low">Low Conversion</SelectItem>
              </SelectContent>
            </Select>
            <Select value={earningsBand} onValueChange={(value) => setEarningsBand(value as typeof earningsBand)}>
              <SelectTrigger><SelectValue placeholder="Earnings" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Earnings</SelectItem>
                <SelectItem value="under25">Under PKR 25k</SelectItem>
                <SelectItem value="25to50">PKR 25k - 50k</SelectItem>
                <SelectItem value="50plus">PKR 50k+</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="conversion">Best Conversion</SelectItem>
                <SelectItem value="orders">Most Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={saveCurrentFilter}>Save Filters</Button>
            <Button variant="outline" size="sm" onClick={applySavedFilter}>Use Saved Filters</Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setDealType("all");
                setPlatform("all");
                setPerformance("all");
                setEarningsBand("all");
                setSortBy("recent");
              }}
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <PackageCardSkeleton key={index} />
          ))}
        </div>
      ) : filteredPackages.length === 0 ? (
        <EmptyState
          title={status === "active" ? "No active packages yet" : "No packages match your filters"}
          description={
            status === "active"
              ? "Create your first barter, paid, or hybrid package to start getting inquiries."
              : "Try adjusting status, pricing type, or performance filters."
          }
          action={{
            label: "Create Package",
            onClick: () => toast.info("Use the Create Package button to launch a new listing."),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className="overflow-hidden border-border/70">
                <div className="relative h-40 w-full">
                  <Image src={pkg.thumbnail} alt={pkg.title} fill className="object-cover" />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <Badge variant="secondary" className={statusBadgeClass(pkg.status)}>{pkg.status.replace("_", " ")}</Badge>
                    <Badge variant="secondary" className="capitalize">{pkg.dealType}</Badge>
                  </div>
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{pkg.title}</h3>
                      <p className="text-sm text-muted-foreground">{pkg.platform} • {pkg.category}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><Filter className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => toast.info(`Editing ${pkg.title} in next iteration.`)}>
                          <FilePenLine className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDuplicate(pkg)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handlePauseResume(pkg)}>
                          {pkg.status === "paused" ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                          {pkg.status === "paused" ? "Resume" : "Pause"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleArchive(pkg.id)}>
                          <Archive className="mr-2 h-4 w-4" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toast.info(`Preview for ${pkg.title} is opening soon.`)}>
                          <Eye className="mr-2 h-4 w-4" /> Preview
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="line-clamp-2 text-sm text-muted-foreground">{pkg.shortDescription}</p>

                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/60 p-2 text-xs">
                    <div><p className="text-muted-foreground">Views</p><p className="font-semibold">{pkg.analytics.views.toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground">Inquiries</p><p className="font-semibold">{pkg.analytics.inquiries}</p></div>
                    <div><p className="text-muted-foreground">Conversion</p><p className="font-semibold">{pkg.analytics.conversionRate}%</p></div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Orders: {pkg.ordersCompleted}</Badge>
                    <Badge variant="outline">Completion: {pkg.analytics.completionRate}%</Badge>
                    <Badge variant="outline">Repeat: {pkg.analytics.repeatBrands}</Badge>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <p className="font-bold text-primary">
                      {pkg.dealType === "barter"
                        ? "Barter"
                        : pkg.dealType === "hybrid"
                          ? `${formatPrice(pkg.hybridCashAmount || pkg.price)} + barter`
                          : formatPrice(pkg.price)}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toast.info(`Preview for ${pkg.title} is opening soon.`)}>
                        <Eye className="mr-1 h-3 w-3" /> Preview
                      </Button>
                      <Button size="sm" onClick={() => toast.info(`Edit flow for ${pkg.title} is opening soon.`)}>
                        <FilePenLine className="mr-1 h-3 w-3" /> Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Performing Packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {packages
            .slice()
            .sort((a, b) => b.analytics.conversionRate - a.analytics.conversionRate)
            .slice(0, 3)
            .map((item) => (
              <div key={item.id} className="rounded-lg border border-border/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <TrendingUp className="mr-1 h-3 w-3" /> {item.analytics.conversionRate}%
                  </Badge>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(item.analytics.conversionRate * 8, 100)}%` }} />
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
