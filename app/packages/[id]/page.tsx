"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { packagesService } from "@/services/packages.service";
import type { CreatorPackage } from "@/types";

export default function PublicPackageDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [pkg, setPkg] = useState<CreatorPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadPackage = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await packagesService.getById(params.id);
      setPkg(response);
    } catch {
      setHasError(true);
      setPkg(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!params.id) return;
    void loadPackage();
    // Reload when route id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <Button variant="ghost" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>
      </Button>

      {isLoading ? (
        <Card className="mt-4 overflow-hidden">
          <div className="aspect-[16/9] animate-pulse bg-muted" />
          <CardContent className="space-y-3 p-5">
            <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
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
        <Card className="mt-4 overflow-hidden">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={pkg.thumbnail || `https://picsum.photos/seed/${pkg.id}/1200/675`}
              alt={pkg.title}
              fill
              className="object-cover"
            />
            <div className="absolute left-4 top-4 flex items-center gap-2">
              {pkg.isFeatured && <Badge className="bg-primary text-primary-foreground">Featured</Badge>}
              {pkg.isPopular && (
                <Badge variant="secondary" className="bg-accent text-accent-foreground">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Popular
                </Badge>
              )}
            </div>
          </div>

          <CardHeader>
            <CardTitle>{pkg.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{pkg.shortDescription || pkg.description}</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-semibold text-primary">
                {(pkg.currency || "PKR")} {pkg.price.toLocaleString()}
              </span>
              <span className="text-muted-foreground">{pkg.ordersCompleted} completed orders</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {pkg.deliveryDays} days delivery
              </span>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Deliverables</h3>
              <div className="space-y-2">
                {pkg.deliverables.length > 0 ? (
                  pkg.deliverables.map((item) => (
                    <div key={item} className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No deliverables listed.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

