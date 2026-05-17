"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { CreatorSidebar, CreatorSidebarDrawer } from "@/components/creator-sidebar";
import { useAuthStore } from "@/store/auth-store";
import { BrandBanner } from "@/components/brand-banner";

export default function CreatorLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const isProtectedCreatorRoute =
    pathname.startsWith('/creator/dashboard') ||
    pathname.startsWith('/creator/orders') ||
    pathname.startsWith('/creator/earnings') ||
    pathname.startsWith('/creator/packages') ||
    pathname.startsWith('/creator/settings') ||
    pathname.startsWith('/creator/messages') ||
    pathname.startsWith('/creator/insights') ||
    pathname.startsWith('/creator/performance') ||
    pathname.startsWith('/creator/profile') ||
    pathname.startsWith('/creator/help');

  useEffect(() => {
    if (isProtectedCreatorRoute && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isProtectedCreatorRoute && user && user.role !== "creator") {
      router.replace("/brand/dashboard");
    }
  }, [isAuthenticated, user, router, isProtectedCreatorRoute]);

  if ((isProtectedCreatorRoute && !isAuthenticated) || (isProtectedCreatorRoute && user?.role !== 'creator')) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <BrandBanner variant="light" className="h-20 w-full sm:h-24" />
        </div>
        {isProtectedCreatorRoute ? (
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="mb-4 lg:hidden">
              <CreatorSidebarDrawer />
            </div>
            <div className="flex gap-6">
            <CreatorSidebar />
            <div className="min-w-0 flex-1">{children}</div>
            </div>
          </div>
        ) : (
          children
        )}
      </main>
      <BottomNav />
    </div>
  );
}
