"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PackageDetailsView, type PackageDetailBadge } from "@/components/package-details-view";
import { PackageOrderModal } from "@/components/package-order-modal";
import { creatorsService } from "@/services/creators.service";
import { ordersService } from "@/services/orders.service";
import { packagesService } from "@/services/packages.service";
import { useAuthStore } from "@/store/auth-store";
import type { Creator, CreatorPackage, Order } from "@/types";

const CONCLUDED_ORDER_STATUSES = new Set(["completed", "cancelled"]);
const isActivePackageOrder = (order: Order) => !CONCLUDED_ORDER_STATUSES.has(order.status);
const getOrderTime = (order: Order) => order.updatedAt?.getTime?.() || order.createdAt?.getTime?.() || 0;

function getPackageBadges(pkg: CreatorPackage): PackageDetailBadge[] {
  const badges: PackageDetailBadge[] = [];

  if (pkg.isPopular || pkg.isFeatured) {
    badges.push({
      label: "Featured",
      Icon: Sparkles,
      className: "border-[#efcf83] bg-[#fff1cd] text-[#8b5e12]",
    });
  }

  if (pkg.ordersCompleted > 0) {
    badges.push({
      label: "Proven delivery",
      Icon: BadgeCheck,
      className: "border-sky-100 bg-sky-50 text-sky-700",
    });
  }

  if (pkg.dealType === "barter" || pkg.dealType === "hybrid") {
    badges.push({
      label: "Barter-friendly",
      Icon: Wallet,
      className: "border-[#efcf83] bg-[#fff9e8] text-[#8b5e12]",
    });
  }

  if (pkg.analytics.conversionRate > 0) {
    badges.push({
      label: "High intent",
      Icon: TrendingUp,
      className: "border-[#d6eadf] bg-[#e8f0ec] text-[#2d6b4e]",
    });
  }

  return badges;
}

export default function PublicPackageDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [pkg, setPkg] = useState<CreatorPackage | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [canManagePackage, setCanManagePackage] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreatorPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadPackage = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await packagesService.getById(params.id);
      setPkg(response);
      if (!response) {
        setCreator(null);
        setActiveOrder(null);
        setCanManagePackage(false);
        return;
      }

      const [creatorResponse, ordersResponse, viewerCreatorResponse] = await Promise.allSettled([
        creatorsService.getById(response.creatorId),
        user?.role === "brand" ? ordersService.getAll({ limit: 200 }) : Promise.resolve({ orders: [], total: 0, hasMore: false }),
        user?.role === "creator" ? creatorsService.getMe() : Promise.resolve(null),
      ]);

      setCreator(creatorResponse.status === "fulfilled" ? creatorResponse.value : null);
      setCanManagePackage(
        viewerCreatorResponse.status === "fulfilled" &&
        Boolean(viewerCreatorResponse.value && viewerCreatorResponse.value.id === response.creatorId)
      );

      if (ordersResponse.status !== "fulfilled" || user?.role !== "brand") {
        setActiveOrder(null);
        return;
      }

      const order = ordersResponse.value.orders
        .filter((item) => item.packageId === response.id && isActivePackageOrder(item))
        .sort((a, b) => getOrderTime(b) - getOrderTime(a))[0] ?? null;
      setActiveOrder(order);
    } catch {
      setHasError(true);
      setPkg(null);
      setCreator(null);
      setActiveOrder(null);
      setCanManagePackage(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!params.id) return;
    void loadPackage();
    // Reload when route id or viewer role changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user?.role]);

  const handleOrder = (item: CreatorPackage) => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/packages/${item.id}`)}`);
      return;
    }

    if (user.role !== "brand") return;

    if (activeOrder) {
      router.push(`/brand/orders?orderId=${activeOrder.id}`);
      return;
    }

    void packagesService.trackEvent(item.id, "CLICK", "package_details_page").catch(() => undefined);
    setSelectedPackage(item);
  };

  const handleCreated = async (orderId: string) => {
    const order = await ordersService.getById(orderId).catch(() => null);
    if (order && isActivePackageOrder(order)) {
      setActiveOrder(order);
    }
    router.push(`/brand/orders?orderId=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-[#fbfaf5] pb-10">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <Button variant="ghost" asChild className="mb-4 rounded-xl px-2.5 text-[12px] font-extrabold text-[#496159] hover:bg-[#e8f0ec] hover:text-[#1e3d2e]">
          <Link href={creator ? `/creator/${creator.username || creator.id}` : "/"}>
            <ArrowLeft className="mr-2 size-4" />
            {creator ? "Back to creator" : "Back to home"}
          </Link>
        </Button>

        {isLoading ? (
          <Card className="overflow-hidden rounded-2xl border-[#e2e7e1] bg-white shadow-sm">
            <div className="h-44 animate-pulse bg-[#1e3d2e]" />
            <CardContent className="space-y-3 p-5">
              <div className="h-6 w-2/3 animate-pulse rounded bg-[#e8f0ec]" />
              <div className="h-4 w-full animate-pulse rounded bg-[#e8f0ec]" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#e8f0ec]" />
            </CardContent>
          </Card>
        ) : hasError ? (
          <ErrorState
            title="Unable to load package"
            description="Please try again in a moment."
            onRetry={() => {
              void loadPackage();
            }}
          />
        ) : !pkg ? (
          <EmptyState
            title="Package not found"
            description="This package may have been removed or is unavailable."
            action={{
              label: "Go to home",
              onClick: () => {
                router.push("/");
              },
            }}
          />
        ) : (
          <PackageDetailsView
            pkg={pkg}
            creator={creator}
            badges={getPackageBadges(pkg)}
            creatorProfileHref={creator ? `/creator/${creator.username || creator.id}` : undefined}
            activeOrder={activeOrder}
            canOrder={!user || user.role === "brand"}
            managementHref={canManagePackage ? `/creator/packages/${pkg.id}/edit` : undefined}
            onOrder={handleOrder}
            onViewActiveOrder={(order) => router.push(`/brand/orders?orderId=${order.id}`)}
            className="rounded-[1.75rem] border border-[#d1ddd6] shadow-[0_24px_64px_rgba(38,70,50,0.12)]"
          />
        )}
      </div>

      <PackageOrderModal
        isOpen={Boolean(selectedPackage)}
        pkg={selectedPackage}
        onClose={() => setSelectedPackage(null)}
        onCreated={handleCreated}
      />
    </div>
  );
}
