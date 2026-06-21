'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { BottomNav } from '@/components/bottom-nav';
import { useAuthStore } from '@/store/auth-store';

export default function BrandLayout({ children }: { children: React.ReactNode }) {
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
    if (user?.role === 'creator') {
      router.replace('/creator/dashboard');
    }
    if (user?.role === 'platform_admin') {
      router.replace('/admin/dashboard');
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, [pathname]);

  if (!hasHydrated || !isAuthenticated || user?.role === 'creator' || user?.role === 'platform_admin') {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
