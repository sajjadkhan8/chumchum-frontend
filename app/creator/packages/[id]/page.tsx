"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PackageCardSkeleton } from "@/components/skeletons";
import { PackageDetailsView } from "@/components/package-details-view";
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
    <div className="space-y-4 p-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" asChild className="rounded-xl px-2.5 text-[12px] font-extrabold text-[#496159] hover:bg-[#e8f0ec] hover:text-[#1e3d2e]">
          <Link href="/creator/packages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Packages
          </Link>
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl border-[#d1ddd6] bg-white text-[12px] font-extrabold text-[#2d6b4e] hover:bg-[#e8f0ec]">
            <Link href={`/packages/${pkg.id}`}>
              Public Page
              <ExternalLink className="ml-2 size-3.5" />
            </Link>
          </Button>
          <Button asChild className="rounded-xl bg-[#2d6b4e] text-[12px] font-extrabold text-white hover:bg-[#1f5239]">
            <Link href={`/creator/packages/${pkg.id}/edit`}>
              <Edit className="mr-2 size-3.5" />
              Edit Package
            </Link>
          </Button>
        </div>
      </div>

      <PackageDetailsView
        pkg={pkg}
        canOrder={false}
        shareUrl={`/packages/${pkg.id}`}
        className="rounded-[1.75rem] border border-[#d1ddd6] shadow-[0_24px_64px_rgba(38,70,50,0.12)]"
      />
    </div>
  );
}
