'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { AdminSidebar, AdminSidebarDrawer } from '@/components/admin-sidebar';
import { useAuthStore } from '@/store/auth-store';

const isAdminRole = (role?: string) => role === 'platform_admin' || role === 'support' || role === 'finance_ops';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user && !isAdminRole(user.role)) {
      router.replace(user.role === 'creator' ? '/creator/dashboard' : '/brand/dashboard');
    }
  }, [hasHydrated, isAuthenticated, router, user]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, [pathname]);

  if (!hasHydrated || !isAuthenticated || !isAdminRole(user?.role)) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-4 lg:hidden">
            <AdminSidebarDrawer />
          </div>
          <div className="flex gap-6">
            <AdminSidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
