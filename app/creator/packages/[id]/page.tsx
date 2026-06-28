"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CreatorPackagePreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      router.replace(`/packages/${params.id}`);
    }
  }, [params.id, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <div className="size-8 animate-spin rounded-full border-2 border-[#2d6b4e]/20 border-t-[#2d6b4e]" />
    </div>
  );
}
