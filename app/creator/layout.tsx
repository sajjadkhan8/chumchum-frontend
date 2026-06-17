"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { CreatorSidebar, CreatorSidebarDrawer } from "@/components/creator-sidebar";
import { useAuthStore } from "@/store/auth-store";

export default function CreatorLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [hideCreatorWorkspacePanel, setHideCreatorWorkspacePanel] = useState(false);

  const isProtectedCreatorRoute =
    pathname.startsWith('/creator/dashboard') ||
    pathname.startsWith('/creator/campaigns') ||
    pathname.startsWith('/creator/orders') ||
    pathname.startsWith('/creator/earnings') ||
    pathname.startsWith('/creator/affiliate') ||
    pathname.startsWith('/creator/payments') ||
    pathname.startsWith('/creator/packages') ||
    pathname.startsWith('/creator/settings') ||
    pathname.startsWith('/creator/messages') ||
    pathname.startsWith('/creator/insights') ||
    pathname.startsWith('/creator/performance') ||
    pathname.startsWith('/creator/profile') ||
    pathname.startsWith('/creator/help') ||
    pathname.startsWith('/creator/search') ||
    pathname.startsWith('/creator/notifications') ||
    pathname.startsWith('/creator/ambassador-program');

  useEffect(() => {
    if (!hasHydrated) return;

    if (isProtectedCreatorRoute && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isProtectedCreatorRoute && user && user.role === "platform_admin") {
      router.replace("/admin/dashboard");
      return;
    }
    if (isProtectedCreatorRoute && user && user.role !== "creator") {
      router.replace("/brand/dashboard");
    }
  }, [hasHydrated, isAuthenticated, user, router, isProtectedCreatorRoute]);

  useEffect(() => {
    const handleSearchLayoutMode = (event: Event) => {
      const detail = (event as CustomEvent<{ hideSidebar?: boolean }>).detail;
      setHideCreatorWorkspacePanel(Boolean(detail?.hideSidebar));
    };

    window.addEventListener('creator-search-layout-mode', handleSearchLayoutMode as EventListener);
    return () => {
      window.removeEventListener('creator-search-layout-mode', handleSearchLayoutMode as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!pathname.startsWith('/creator/campaigns') && !pathname.startsWith('/creator/search')) {
      setHideCreatorWorkspacePanel(false);
    }
  }, [pathname]);

  if (
    (isProtectedCreatorRoute && !hasHydrated) ||
    (isProtectedCreatorRoute && !isAuthenticated) ||
    (isProtectedCreatorRoute && user?.role !== 'creator')
  ) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-[#fbfaf5]">
      <Navbar />
      <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {isProtectedCreatorRoute ? (
          <>
            {!hideCreatorWorkspacePanel && (
              <div className="bg-[#fbfaf5] px-4 py-3 lg:hidden">
                <CreatorSidebarDrawer />
              </div>
            )}
            <div className="flex min-h-[calc(100vh-4rem)]">
              {!hideCreatorWorkspacePanel && <CreatorSidebar />}
              <div className="min-w-0 flex-1">{children}</div>
            </div>
          </>
        ) : (
          children
        )}
      </main>
      <BottomNav />
    </div>
  );
}
