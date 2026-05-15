"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CreatorPackageWizard } from "@/components/creator-package-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorPackagesStore } from "@/store/creator-packages-store";

export default function EditCreatorPackagePage() {
  const params = useParams<{ id: string }>();
  const packages = useCreatorPackagesStore((state) => state.packages);
  const pkg = packages.find((item) => item.id === params.id);

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

