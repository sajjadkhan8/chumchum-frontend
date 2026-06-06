"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Share2,
  MessageCircle,
  Star,
  MapPin,
  Calendar,
  Users,
  Play,
  ExternalLink,
  Check,
  Clock,
  Package,
  TrendingUp,
  Instagram,
  Youtube,
  Music2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PackageCard } from "@/components/package-card";
import { ReviewCard } from "@/components/review-card";
import { QuickDealModal } from "@/components/quick-deal-modal";
import { PackageOrderModal } from "@/components/package-order-modal";
import { CreatorTrustBadge, getCreatorTrustLabel } from "@/components/creator-trust-badge";
import { formatFollowers, formatPrice, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { creatorsService } from "@/services/creators.service";
import { packagesService } from "@/services/packages.service";
import { reviewsService } from "@/services/reviews.service";
import type { Creator, CreatorPackage, Review } from "@/types";

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music2,
};

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
  const [creator, setCreator] = useState<Creator | null>(null);
  const [creatorPackages, setCreatorPackages] = useState<CreatorPackage[]>([]);
  const [creatorReviews, setCreatorReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingCreator, setIsSavingCreator] = useState(false);

  useEffect(() => {
    const loadCreatorProfile = async () => {
      setIsLoading(true);
      try {
        const foundCreator = await creatorsService.getByIdentifier(id);

        if (!foundCreator) {
          setCreator(null);
          setCreatorPackages([]);
          setCreatorReviews([]);
          return;
        }

        setCreator(foundCreator);

        const [packagesResponse, reviewsResponse] = await Promise.all([
          packagesService.getByCreatorId(foundCreator.id),
          reviewsService.getByCreatorId(foundCreator.id),
        ]);

        setCreatorPackages(packagesResponse);
        setCreatorReviews(reviewsResponse);
      } finally {
        setIsLoading(false);
      }
    };

    void loadCreatorProfile();
  }, [id]);

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
  const creatorMessagePath = `/messages?creator=${creator.id}`;
  const creatorMessageHref = user
    ? creatorMessagePath
    : `/login?next=${encodeURIComponent(creatorMessagePath)}`;
  const totalFollowers = creator.platforms.reduce(
    (sum, p) => sum + p.followers,
    0
  );
  const avgEngagement =
    creator.platforms.reduce((sum, p) => sum + p.engagementRate, 0) /
    creator.platforms.length;
  const creatorLanguages = ["Arabic", "English"];
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
  const featuredPackages = creatorPackages.filter((pkg) => pkg.isPopular).slice(0, 2);
  const trendingPackages = [...creatorPackages]
    .sort((a, b) => b.ordersCompleted - a.ordersCompleted)
    .slice(0, 2);
  const barterFriendlyPackages = creatorPackages.filter((pkg) => pkg.dealType === "barter" || pkg.dealType === "hybrid");
  const bestPerformingPackages = [...creatorPackages]
    .sort((a, b) => (b.ordersCompleted + (b.isPopular ? 10 : 0)) - (a.ordersCompleted + (a.isPopular ? 10 : 0)))
    .slice(0, 2);
  const completionRate = Math.min(99, Math.round((creator.completedDeals / (creator.completedDeals + 5)) * 100));
  const repeatClients = Math.max(3, Math.round(creator.completedDeals * 0.24));

  const handleBookPackage = (pkg: CreatorPackage) => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "brand") {
      return;
    }

    setSelectedPackage(pkg);
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
    <div className="min-h-screen bg-background pb-20 md:pb-0">

      {/* Hero Section */}
      <section className="relative">
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 md:h-64">
          {creator.coverImage && (
            <Image
              src={creator.coverImage}
              alt={`${creator.name} cover`}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Profile Info Overlay */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-16 md:-mt-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              {/* Avatar & Basic Info */}
              <div className="flex items-end gap-4">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-background md:h-36 md:w-36">
                    <AvatarImage src={creator.avatar} alt={creator.name} />
                    <AvatarFallback className="text-2xl">
                      {getInitials(creator.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                      {creator.name}
                    </h1>
                    <CreatorTrustBadge level={creator.badgeLevel} isVerified={creator.isVerified} />
                    {creator.isTrending && (
                      <Badge
                        variant="secondary"
                        className="bg-accent text-accent-foreground"
                      >
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Trending
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{creator.username}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {creator.city}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {canHireCreator && (
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={isSavingCreator}
                    onClick={handleSavedCreatorToggle}
                  >
                    <Heart
                      className={`h-5 w-5 ${isSaved ? "fill-destructive text-destructive" : ""}`}
                    />
                  </Button>
                )}
                <Button variant="outline" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
                {canHireCreator && (
                  <>
                    <Button variant="outline" asChild>
                      <Link href={creatorMessageHref}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message
                      </Link>
                    </Button>
                    <Button onClick={() => setQuickDealOpen(true)}>
                      Quick Deal
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto mt-4 px-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Response Time</p>
              <p className="font-semibold">{creator.responseTime}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Completion Rate</p>
              <p className="font-semibold">{completionRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Repeat Clients</p>
              <p className="font-semibold">{repeatClients}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Verification</p>
              <p className="font-semibold">{getCreatorTrustLabel(creator.badgeLevel, creator.isVerified)}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto mt-8 px-4">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Bio & Stats */}
          <div className="space-y-6 lg:col-span-1">
            {/* Bio Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{creator.bio}</p>

                {/* Categories */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {creator.categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>

                {/* Languages */}
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-foreground">
                    Languages
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {creatorLanguages.map((lang) => (
                      <Badge key={lang} variant="outline">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Followers</span>
                  <span className="font-semibold">
                    {formatFollowers(totalFollowers)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Avg. Engagement</span>
                  <span className="font-semibold">
                    {avgEngagement.toFixed(1)}%
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="font-semibold">
                      {creator.rating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({creator.totalReviews})
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Completed Orders
                  </span>
                  <span className="font-semibold">
                    {creator.completedDeals}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Response Time</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-semibold">
                      {creator.responseTime}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platforms Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Platforms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {creator.platforms.map((platform) => {
                  const Icon = platformIcons[platform.platform] || Users;
                  return (
                    <div
                      key={platform.platform}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {platform.platform}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{platform.username}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatFollowers(platform.followers)}
                        </p>
                        <p className="text-sm text-primary">
                          {platform.engagementRate}% eng.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 w-full justify-start">
                <TabsTrigger value="packages" className="flex-1 md:flex-none">
                  <Package className="mr-2 h-4 w-4" />
                  Packages
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="flex-1 md:flex-none">
                  <Play className="mr-2 h-4 w-4" />
                  Portfolio
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1 md:flex-none">
                  <Star className="mr-2 h-4 w-4" />
                  Reviews
                </TabsTrigger>
              </TabsList>

              {/* Packages Tab */}
              <TabsContent value="packages" className="space-y-4">
                {creatorPackages.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Featured Packages</h3>
                      {(featuredPackages.length > 0 ? featuredPackages : creatorPackages.slice(0, 2)).map((pkg) => (
                        <PackageCard
                          key={`featured-${pkg.id}`}
                          pkg={pkg}
                          onOrder={canHireCreator ? () => handleBookPackage(pkg) : undefined}
                        />
                      ))}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Trending Packages</h3>
                      {(trendingPackages.length > 0 ? trendingPackages : creatorPackages.slice(0, 2)).map((pkg) => (
                        <PackageCard
                          key={`trending-${pkg.id}`}
                          pkg={pkg}
                          onOrder={canHireCreator ? () => handleBookPackage(pkg) : undefined}
                        />
                      ))}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Barter Friendly Packages</h3>
                      {barterFriendlyPackages.length > 0 ? (
                        barterFriendlyPackages.map((pkg) => (
                          <PackageCard
                            key={`barter-${pkg.id}`}
                            pkg={pkg}
                            onOrder={canHireCreator ? () => handleBookPackage(pkg) : undefined}
                          />
                        ))
                      ) : (
                        <Card>
                          <CardContent className="py-6 text-sm text-muted-foreground">
                            No barter-focused offers yet.
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Best Performing Packages</h3>
                      {bestPerformingPackages.map((pkg) => (
                        <PackageCard
                          key={`best-${pkg.id}`}
                          pkg={pkg}
                          onOrder={canHireCreator ? () => handleBookPackage(pkg) : undefined}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-semibold">
                        No packages available
                      </h3>
                      <p className="text-center text-muted-foreground">
                        This creator hasn&apos;t set up any packages yet.
                        <br />
                        Use Quick Deal to send a custom offer.
                      </p>
                      <Button
                        className="mt-4"
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
                        <Card className="group overflow-hidden transition-shadow hover:shadow-md">
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
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Play className="mb-4 h-12 w-12 text-muted-foreground" />
                          <h3 className="mb-2 text-lg font-semibold">
                            No portfolio items
                          </h3>
                          <p className="text-center text-muted-foreground">
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
                <Card>
                  <CardContent className="flex flex-col items-center gap-6 py-6 md:flex-row md:justify-between">
                    <div className="text-center md:text-left">
                      <div className="flex items-center justify-center gap-2 md:justify-start">
                        <span className="text-4xl font-bold">
                          {creator.rating.toFixed(1)}
                        </span>
                        <Star className="h-8 w-8 fill-accent text-accent" />
                      </div>
                      <p className="text-muted-foreground">
                        Based on {creator.totalReviews} reviews
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <Star
                          key={star}
                          className={`h-6 w-6 ${star <= Math.round(creator.rating) ? "fill-accent text-accent" : "text-muted"}`}
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
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Star className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-semibold">
                        No reviews yet
                      </h3>
                      <p className="text-center text-muted-foreground">
                        Be the first to work with this creator and leave a
                        review.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
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
        onCreated={() => router.push("/brand/orders")}
      />
    </div>
  );
}
