'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, FileCheck2, LayoutDashboard, Menu, Scale, Shield, ShoppingBag, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/verification', label: 'Verification', icon: FileCheck2 },
  { href: '/admin/disputes', label: 'Disputes & Audit', icon: Scale },
  { href: '/admin/payments', label: 'Payments Audit', icon: Wallet },
];

function AdminNav({ compact = false, closeOnNavigate = false }: { compact?: boolean; closeOnNavigate?: boolean }) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const link = (
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-lg px-2.5 text-sm transition-colors',
              compact ? 'min-h-11 py-2.5' : 'py-2',
              isActive ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );

        if (closeOnNavigate) {
          return (
            <SheetClose asChild key={item.href}>
              {link}
            </SheetClose>
          );
        }

        return <div key={item.href}>{link}</div>;
      })}
    </div>
  );
}

export function AdminSidebar() {
  return (
    <Card className="sticky top-20 hidden h-[calc(100vh-6rem)] w-64 overflow-hidden lg:block">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          Admin Console
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <AdminNav />
        <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            Production Ops
          </div>
          Monitor users, orders, verification, disputes, and moderation actions from live backend data.
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminSidebarDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="min-h-11 gap-2 lg:hidden">
          <Menu className="h-4 w-4" />
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Admin Console
          </SheetTitle>
        </SheetHeader>
        <div className="p-4 pb-safe">
          <AdminNav compact closeOnNavigate />
        </div>
      </SheetContent>
    </Sheet>
  );
}
