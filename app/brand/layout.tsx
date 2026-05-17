'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { BottomNav } from '@/components/bottom-nav';
import { useAuthStore } from '@/store/auth-store';
import { BrandBanner } from '@/components/brand-banner';

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const isProtectedBrandRoute =
    pathname.startsWith('/brand/dashboard') ||
    pathname.startsWith('/brand/orders') ||
    pathname.startsWith('/brand/saved') ||
    pathname.startsWith('/brand/settings') ||
    pathname.startsWith('/brand/messages') ||
    pathname.startsWith('/brand/analytics');

  useEffect(() => {
    if (isProtectedBrandRoute && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user && user.role === 'creator') {
      router.replace('/creator/dashboard');
    }
  }, [isAuthenticated, user, router, isProtectedBrandRoute]);

  if ((isProtectedBrandRoute && !isAuthenticated) || user?.role === 'creator') {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="container mx-auto px-4 pt-4 sm:px-6 lg:px-8">
          <BrandBanner variant="light" className="h-20 w-full sm:h-24" />
        </div>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
