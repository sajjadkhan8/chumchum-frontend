"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

function MessagesRouteRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasHydrated, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (user.role === "platform_admin") {
      router.replace("/admin/dashboard");
      return;
    }

    const params = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      params.append(key, value);
    }

    const basePath = user.role === "creator" ? "/creator/messages" : "/brand/messages";
    const query = params.toString();
    router.replace(query ? `${basePath}?${query}` : basePath);
  }, [hasHydrated, isAuthenticated, router, searchParams, user]);

  return <div className="min-h-screen bg-background" />;
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MessagesRouteRedirect />
    </Suspense>
  );
}
