"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  TrendingUp,
  Star,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Zap,
  Shield,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { CreatorCard } from "@/components/creator-card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { ZingZingLogo } from "@/src/components/ZingZingLogo";
import { creatorsService } from "@/services/creators.service";
import { packagesService } from "@/services/packages.service";
import { useAuthStore } from "@/store/auth-store";
import type { Creator, CreatorPackage } from "@/types";

const categories = [
  { id: "fashion", name: "Fashion", icon: "👗", count: 245 },
  { id: "tech", name: "Tech", icon: "💻", count: 189 },
  { id: "food", name: "Food", icon: "🍕", count: 312 },
  { id: "beauty", name: "Beauty", icon: "💄", count: 278 },
  { id: "fitness", name: "Fitness", icon: "💪", count: 156 },
  { id: "travel", name: "Travel", icon: "✈️", count: 198 },
  { id: "gaming", name: "Gaming", icon: "🎮", count: 167 },
  { id: "lifestyle", name: "Lifestyle", icon: "🌟", count: 234 },
];

const stats = [
  { label: "Active Creators", value: "5,000+", icon: Users },
  { label: "Campaigns Completed", value: "25,000+", icon: Zap },
  { label: "Brands Trust Us", value: "500+", icon: Shield },
];

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [searchQuery, setSearchQuery] = useState("");
  const [featuredPagination, setFeaturedPagination] = useState({ page: 0, size: 12 });
  const [featuredPackages, setFeaturedPackages] = useState<CreatorPackage[]>([]);
  const [featuredTotalPages, setFeaturedTotalPages] = useState<number | undefined>(undefined);
  const [featuredTotalElements, setFeaturedTotalElements] = useState<number | undefined>(undefined);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);
  const [isFeaturedLoadingMore, setIsFeaturedLoadingMore] = useState(false);
  const [hasFeaturedError, setHasFeaturedError] = useState(false);
  const [trendingCreators, setTrendingCreators] = useState<Creator[]>([]);
  const [risingStars, setRisingStars] = useState<Creator[]>([]);
  const [verifiedCreators, setVerifiedCreators] = useState<Creator[]>([]);
  const trendingRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const shouldRedirectAuthenticatedHome = hasHydrated && isAuthenticated && Boolean(user?.role);
  const homeRedirectPath = user?.role === "creator" ? "/creator/dashboard" : "/brand/dashboard";

  const fetchFeaturedPackages = async (
    page = featuredPagination.page,
    size = featuredPagination.size,
    options?: { append?: boolean },
  ) => {
    const append = Boolean(options?.append);

    if (append) {
      setIsFeaturedLoadingMore(true);
    } else {
      setIsFeaturedLoading(true);
      setHasFeaturedError(false);
    }

    try {
      const response = await packagesService.getFeatured(page, size);
      setFeaturedPackages((current) => (append ? [...current, ...response.items] : response.items));
      setFeaturedPagination({ page: response.page, size: response.size });
      setFeaturedTotalPages(response.totalPages);
      setFeaturedTotalElements(response.totalElements);
    } catch {
      setHasFeaturedError(true);
      if (!append) {
        setFeaturedPackages([]);
      }
    } finally {
      if (append) {
        setIsFeaturedLoadingMore(false);
      } else {
        setIsFeaturedLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!shouldRedirectAuthenticatedHome) return;
    router.replace(homeRedirectPath);
  }, [homeRedirectPath, router, shouldRedirectAuthenticatedHome]);

  useEffect(() => {
    if (shouldRedirectAuthenticatedHome) return;
    void fetchFeaturedPackages(0, featuredPagination.size);
    // Fetch on home load; keep page/size in state for future load more.
  }, [featuredPagination.size, shouldRedirectAuthenticatedHome]);

  useEffect(() => {
    if (shouldRedirectAuthenticatedHome) return;

    const loadCreators = async () => {
      try {
        const [trending, all] = await Promise.all([
          creatorsService.getTrending(8),
          creatorsService.getAll(),
        ]);
        const trendingList = trending.length ? trending : all.slice(0, 8);
        setTrendingCreators(trendingList);
        setRisingStars(all.filter((creator) => creator.isTrending).slice(0, 6));
        setVerifiedCreators(all.filter((creator) => creator.isVerified).slice(0, 4));
      } catch {
        setTrendingCreators([]);
        setRisingStars([]);
        setVerifiedCreators([]);
      }
    };

    void loadCreators();
  }, [shouldRedirectAuthenticatedHome]);

  const handleScroll = () => {
    if (trendingRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = trendingRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (trendingRef.current) {
      const scrollAmount = 320;
      trendingRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const featuredPrimary = featuredPackages[0];
  const featuredSecondary = featuredPackages.slice(1, 4);
  const featuredMore = featuredPackages.slice(4);
  const hasMoreFeatured =
    featuredTotalPages !== undefined
      ? featuredPagination.page + 1 < featuredTotalPages
      : featuredPackages.length > 0 && featuredPackages.length % featuredPagination.size === 0;

  const handleLoadMoreFeatured = () => {
    if (isFeaturedLoadingMore || !hasMoreFeatured) return;
    void fetchFeaturedPackages(featuredPagination.page + 1, featuredPagination.size, { append: true });
  };

  if (shouldRedirectAuthenticatedHome) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                variant="secondary"
                className="mb-4 bg-primary/10 text-primary hover:bg-primary/15"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Pakistan&apos;s Influencer Marketplace
              </Badge>
            </motion.div>

            <motion.h1
              className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Connect with{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Top Creators
              </span>
              <br />
              in Pakistan
            </motion.h1>

            <motion.p
              className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Find the perfect influencer for your brand or showcase your talent
              to thousands of businesses. Quick deals, instant messaging, and
              secure payments.
            </motion.p>

            <motion.div
              className="mx-auto mb-8 flex max-w-xl flex-col gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search creators, niches, or skills..."
                  className="h-12 pl-10 pr-4 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="lg" className="h-12 px-8" asChild>
                <Link href="/brand/explore">
                  Explore Creators
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <stat.icon className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">
                    {stat.value}
                  </span>
                  <span>{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-muted/20 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">Featured Packages</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Handpicked offers ranked by backend curation.
                {featuredTotalElements !== undefined ? ` ${featuredTotalElements} total offers.` : ""}
              </p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Sparkles className="mr-1 h-3 w-3" />
              Ranked Feed
            </Badge>
          </div>

          {isFeaturedLoading ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="min-h-[360px] animate-pulse rounded-2xl border border-border bg-card lg:col-span-2" />
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="min-h-[112px] animate-pulse rounded-2xl border border-border bg-card" />
                ))}
              </div>
            </div>
          ) : hasFeaturedError ? (
            <ErrorState
              title="Unable to load featured packages"
              description="Please check your connection and retry."
              onRetry={() => {
                void fetchFeaturedPackages(featuredPagination.page, featuredPagination.size);
              }}
            />
          ) : featuredPackages.length === 0 || !featuredPrimary ? (
            <EmptyState
              title="No featured packages yet"
              description="Featured offers will show up here once available."
              action={{
                label: "Refresh",
                onClick: () => {
                  void fetchFeaturedPackages(featuredPagination.page, featuredPagination.size);
                },
              }}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <Link href={`/packages/${featuredPrimary.id}`} className="group lg:col-span-2">
                  <Card className="overflow-hidden border-border/60 transition-shadow hover:shadow-lg">
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src={featuredPrimary.thumbnail || "https://picsum.photos/seed/featured-main/1200/675"}
                        alt={featuredPrimary.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        {featuredPrimary.isFeatured && (
                          <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                        )}
                        {featuredPrimary.isPopular && (
                          <Badge variant="secondary" className="bg-accent text-accent-foreground">Popular</Badge>
                        )}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="line-clamp-2 text-xl font-bold text-white md:text-2xl">{featuredPrimary.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-white/85">
                          {featuredPrimary.shortDescription || featuredPrimary.description}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/90">
                          <span className="font-semibold">
                            {(featuredPrimary.currency || "PKR")} {featuredPrimary.price.toLocaleString()}
                          </span>
                          <span>•</span>
                          <span>{featuredPrimary.ordersCompleted} orders completed</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>

                <div className="grid gap-4">
                  {featuredSecondary.map((pkg) => (
                    <Link key={pkg.id} href={`/packages/${pkg.id}`} className="group">
                      <Card className="overflow-hidden border-border/60 transition-shadow hover:shadow-lg">
                        <CardContent className="p-0">
                          <div className="flex min-h-[112px]">
                            <div className="relative w-32 shrink-0">
                              <Image
                                src={pkg.thumbnail || `https://picsum.photos/seed/${pkg.id}/400/300`}
                                alt={pkg.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 p-3">
                              <div className="mb-1 flex flex-wrap items-center gap-1">
                                {pkg.isFeatured && (
                                  <Badge className="h-5 bg-primary/90 px-2 text-[10px] text-primary-foreground">Featured</Badge>
                                )}
                                {pkg.isPopular && (
                                  <Badge variant="secondary" className="h-5 px-2 text-[10px]">Popular</Badge>
                                )}
                              </div>
                              <p className="line-clamp-1 text-sm font-semibold text-foreground">{pkg.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {pkg.shortDescription || pkg.description}
                              </p>
                              <p className="mt-2 text-xs font-medium text-primary">
                                {(pkg.currency || "PKR")} {pkg.price.toLocaleString()} • {pkg.ordersCompleted} orders
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>

              {featuredMore.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {featuredMore.map((pkg) => (
                    <Link key={pkg.id} href={`/packages/${pkg.id}`} className="group">
                      <Card className="overflow-hidden border-border/60 transition-shadow hover:shadow-lg">
                        <div className="relative aspect-[4/3] w-full">
                          <Image
                            src={pkg.thumbnail || `https://picsum.photos/seed/${pkg.id}/640/480`}
                            alt={pkg.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardContent className="p-3">
                          <div className="mb-2 flex flex-wrap items-center gap-1">
                            {pkg.isFeatured && (
                              <Badge className="h-5 bg-primary/90 px-2 text-[10px] text-primary-foreground">Featured</Badge>
                            )}
                            {pkg.isPopular && <Badge variant="secondary" className="h-5 px-2 text-[10px]">Popular</Badge>}
                          </div>
                          <p className="line-clamp-1 text-sm font-semibold text-foreground">{pkg.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {pkg.shortDescription || pkg.description}
                          </p>
                          <p className="mt-2 text-xs font-medium text-primary">
                            {(pkg.currency || "PKR")} {pkg.price.toLocaleString()} • {pkg.ordersCompleted} orders
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {isFeaturedLoadingMore && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="min-h-[220px] animate-pulse rounded-2xl border border-border bg-card" />
                  ))}
                </div>
              )}

              {hasMoreFeatured && (
                <div className="pt-2 text-center">
                  <Button onClick={handleLoadMoreFeatured} variant="outline" className="rounded-full" disabled={isFeaturedLoadingMore}>
                    {isFeaturedLoadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 text-right text-xs text-muted-foreground">
            Page {featuredPagination.page + 1}
            {featuredTotalPages ? ` of ${featuredTotalPages}` : ""} • size {featuredPagination.size}
          </div>
        </div>
      </section>

      {/* Two-Tier Marketplace Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <Badge
              variant="secondary"
              className="mb-4 bg-primary/10 text-primary"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Two Ways to Collaborate
            </Badge>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Choose Your Creator Partner
            </h2>
            <p className="mt-4 text-muted-foreground">
              Whether you need verified premium talent or diverse creator specialists, we have the perfect match for your campaign.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Platform Ambassadors */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden border-border/50 shadow-sm transition-shadow hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-2xl">👑</span>
                    </div>
                    <h3 className="text-2xl font-bold">Platform Ambassadors</h3>
                  </div>
                  
                  <p className="mb-6 text-muted-foreground">
                    Pakistan&apos;s most trusted creators, carefully verified and managed by our platform. Quality assurance guaranteed.
                  </p>

                  <ul className="mb-8 space-y-3">
                    {[
                      '✓ 100K+ followers minimum',
                      '✓ 5%+ engagement rate verified',
                      '✓ Dedicated platform support',
                      '✓ Premium brand partnerships',
                      '✓ Quality assured',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Button className="w-full" asChild>
                    <Link href="/brand/ambassadors">
                      Browse Ambassadors
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Independent Creators */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="overflow-hidden border-border/50 shadow-sm transition-shadow hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-2xl">🌟</span>
                    </div>
                    <h3 className="text-2xl font-bold">Independent Creators</h3>
                  </div>

                  <p className="mb-6 text-muted-foreground">
                    Diverse talent across all niches and experience levels. Direct collaboration with creative professionals.
                  </p>

                  <ul className="mb-8 space-y-3">
                    {[
                      '✓ All experience levels',
                      '✓ 10,000+ creators available',
                      '✓ Flexible pricing & packages',
                      '✓ Direct negotiation',
                      '✓ Niche specialists',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/brand/explore">
                      Explore All Creators
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* For Creators Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 rounded-lg border border-border/50 bg-muted/30 p-8 text-center"
          >
            <h3 className="mb-3 text-2xl font-bold">Ready to Level Up Your Influence?</h3>
            <p className="mb-6 text-muted-foreground">
              Join our Platform Ambassador program and earn guaranteed monthly income while working with premium brands.
            </p>
            <Button size="lg" asChild>
              <Link href="/creator/ambassador-program">
                Apply for Ambassador Program
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                Browse Categories
              </h2>
              <p className="mt-1 text-muted-foreground">
                Find creators in your industry
              </p>
            </div>
            <Button variant="ghost" className="hidden md:flex" asChild>
              <Link href="/brand/explore">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link href={`/brand/explore?category=${category.id}`}>
                  <Card className="group cursor-pointer border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
                    <CardContent className="flex flex-col items-center p-4 text-center">
                      <span className="mb-2 text-3xl">{category.icon}</span>
                      <span className="font-medium text-foreground">
                        {category.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {category.count} creators
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Creators Carousel */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  Trending Creators
                </h2>
                <p className="text-muted-foreground">
                  Most booked this week
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            ref={trendingRef}
            onScroll={handleScroll}
            className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4"
          >
            {trendingCreators.map((creator, index) => (
              <motion.div
                key={creator.id}
                className="w-[280px] flex-shrink-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <CreatorCard creator={creator} variant="compact" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rising Stars Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/30">
                <Star className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  Rising Stars
                </h2>
                <p className="text-muted-foreground">
                  Emerging talent with great potential
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/brand/explore?filter=rising">
                Discover More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {risingStars.map((creator, index) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <CreatorCard creator={creator} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="scroll-mt-24 bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
              How ZingZing Works
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Get started in minutes with our simple, streamlined process
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Browse & Discover",
                description:
                  "Explore thousands of verified creators filtered by niche, location, price, and engagement rates.",
                icon: Search,
              },
              {
                step: "02",
                title: "Connect & Negotiate",
                description:
                  "Send a Quick Deal offer or message creators directly. Discuss requirements and finalize terms.",
                icon: Users,
              },
              {
                step: "03",
                title: "Execute & Pay",
                description:
                  "Track deliverables, approve content, and release secure payments upon completion.",
                icon: Shield,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.15 }}
              >
                <Card className="relative overflow-hidden border-border/50">
                  <CardContent className="p-6">
                    <span className="absolute -right-4 -top-4 text-8xl font-bold text-primary/5">
                      {item.step}
                    </span>
                    <div className="relative">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Verified Creators */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  Verified Creators
                </h2>
                <p className="text-muted-foreground">
                  Trusted professionals with proven track records
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {verifiedCreators.map((creator, index) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <CreatorCard creator={creator} variant="compact" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 md:py-24 dark:bg-card">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-lg text-primary-foreground/80">
              Join thousands of brands and creators already using ZingZing to
              grow their business.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                asChild
              >
                <Link href="/signup">
                  Sign Up as Creator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/signup">Find Creators</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="mb-4 inline-flex items-center">
                <ZingZingLogo variant="light" className="h-9 w-[180px]" />
              </Link>
              <p className="text-sm text-muted-foreground">
                Pakistan&apos;s influencer marketplace connecting brands
                with verified creators.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-foreground">For Brands</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/brand/explore" className="hover:text-primary">
                    Find Creators
                  </Link>
                </li>
                <li>
                  <Link href="/brand/orders" className="hover:text-primary">
                    Manage Campaigns
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-primary">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-foreground">
                For Creators
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/signup" className="hover:text-primary">
                    Join as Creator
                  </Link>
                </li>
                <li>
                  <Link
                    href="/creator/dashboard"
                    className="hover:text-primary"
                  >
                    Creator Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-primary">
                    Resources
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-foreground">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-primary">
                    About ZingZing
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-primary">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-primary">
                    Resources
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 ZingZing. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
