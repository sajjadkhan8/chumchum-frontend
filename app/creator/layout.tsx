"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { useAuthStore } from "@/store/auth-store";

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
    pathname.startsWith('/creator/messages');

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
      <main className="pb-20 pt-16 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
