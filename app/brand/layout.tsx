'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { BottomNav } from '@/components/bottom-nav';
import { useAuthStore } from '@/store/auth-store';

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
      <main className="pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
