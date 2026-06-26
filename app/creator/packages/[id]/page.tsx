"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageCardSkeleton } from "@/components/skeletons";
import { formatPrice } from "@/lib/utils";
import { useCreatorPackagesStore } from "@/store/creator-packages-store";
import type { CreatorPackage } from "@/types";

export default function CreatorPackagePreviewPage() {
  const params = useParams<{ id: string }>();
  const packages = useCreatorPackagesStore((state) => state.packages);
  const fetchPackageById = useCreatorPackagesStore((state) => state.fetchPackageById);
  const [pkg, setPkg] = useState<CreatorPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existing = packages.find((item) => item.id === params.id);
    if (existing) {
      setPkg(existing);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    void fetchPackageById(params.id)
      .then((item) => {
        if (isMounted) setPkg(item);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fetchPackageById, packages, params.id]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-1">
        <PackageCardSkeleton />
        <PackageCardSkeleton />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="space-y-4 p-1">
        <Button variant="ghost" asChild>
          <Link href="/creator/packages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Packages
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Package not found.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <Button variant="ghost" asChild>
        <Link href="/creator/packages">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Packages
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{pkg.title}</CardTitle>
            <Badge variant="outline" className="capitalize">{pkg.status.replace("_", " ")}</Badge>
            <Badge variant="secondary" className="capitalize">{pkg.dealType}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{pkg.shortDescription}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{pkg.fullDescription}</p>

          <div className="flex flex-wrap gap-2">
            {pkg.tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Pricing</p>
              <p className="font-semibold text-primary">
                {pkg.dealType === "barter"
                  ? "Barter"
                  : pkg.dealType === "hybrid"
                    ? `${formatPrice(pkg.hybridCashAmount || pkg.price)} + barter`
                    : formatPrice(pkg.price)}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Delivery</p>
              <p className="font-semibold">{pkg.deliveryDays} days</p>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Revisions</p>
              <p className="font-semibold">{pkg.revisions ?? 0} rounds</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Deliverables</p>
            <div className="space-y-2">
              {pkg.deliverables.map((item) => (
                <div key={item} className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{item}</div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4" /> Package Analytics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/60 p-3"><p className="text-xs text-muted-foreground">Views</p><p className="font-semibold">{pkg.analytics.views.toLocaleString()}</p></div>
          <div className="rounded-lg border border-border/60 p-3"><p className="text-xs text-muted-foreground">Clicks</p><p className="font-semibold">{pkg.analytics.clicks.toLocaleString()}</p></div>
          <div className="rounded-lg border border-border/60 p-3"><p className="text-xs text-muted-foreground">Inquiries</p><p className="font-semibold">{pkg.analytics.inquiries}</p></div>
          <div className="rounded-lg border border-border/60 p-3"><p className="text-xs text-muted-foreground">Conversion</p><p className="font-semibold">{pkg.analytics.conversionRate}%</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
