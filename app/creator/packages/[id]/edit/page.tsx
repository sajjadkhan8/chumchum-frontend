"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CreatorPackageWizard } from "@/components/creator-package-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PackageCardSkeleton } from "@/components/skeletons";
import { useCreatorPackagesStore } from "@/store/creator-packages-store";
import type { CreatorPackage } from "@/types";

export default function EditCreatorPackagePage() {
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
          <CardContent className="py-12 text-center text-muted-foreground">
            Package not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return <CreatorPackageWizard mode="edit" initialPackage={pkg} />;
}
