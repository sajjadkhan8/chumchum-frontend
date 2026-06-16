'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  CreditCard,
  Layers,
  LayoutDashboard,
  MessageCircle,
  Menu,
  Plus,
  Bookmark,
  Search,
  ClipboardList,
  Eye,
  BadgePercent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { ordersService } from '@/services/orders.service';
import { useEffect, useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Workspace',
    items: [
      { href: '/creator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/creator/insights', label: 'Audience Insights', icon: Eye },
      { href: '/creator/performance', label: 'Order Performance', icon: BarChart3 },
    ],
  },
  {
    title: 'Packages',
    items: [
      { href: '/creator/packages', label: 'All Packages', icon: Layers },
      { href: '/creator/packages/new', label: 'Create Package', icon: Plus },
    ],
  },
  {
    title: 'Offers',
    items: [
      { href: '/creator/offers', label: 'Discover Offers', icon: Search },
      { href: '/creator/offers/reactions', label: 'Saved Offers', icon: Bookmark },
    ],
  },
  {
    title: 'Work',
    items: [
      { href: '/creator/orders', label: 'Orders', icon: ClipboardList },
      { href: '/creator/messages', label: 'Messages', icon: MessageCircle },
      { href: '/creator/payments', label: 'Payments', icon: CreditCard },
      { href: '/creator/affiliate', label: 'Affiliate', icon: BadgePercent },
    ],
  },
];

function CreatorSidebarNav({ compact = false, closeOnNavigate = false, onNavigate }: { compact?: boolean; closeOnNavigate?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const [ordersBadgeCount, setOrdersBadgeCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'creator') {
      setOrdersBadgeCount(0);
      return;
    }

    let cancelled = false;

    const loadOrderBadgeCount = async () => {
      try {
        const orders = await ordersService.getAll();
        if (cancelled) return;

        const openStatuses = new Set(['pending', 'revision', 'review', 'in_progress']);
        const count = orders.filter((order) => order.creatorId === user.id && openStatuses.has(order.status)).length;
        setOrdersBadgeCount(count);
      } catch {
        if (!cancelled) setOrdersBadgeCount(0);
      }
    };

    void loadOrderBadgeCount();

    return () => {
      cancelled = true;
    };
  }, [user, pathname]);

  return (
    <div className={cn('space-y-6', compact && 'space-y-5')}>
      {navGroups.map((group) => (
        <div key={group.title} className="space-y-2">
          <p className="px-3 text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-[#a16d16]">
            {group.title}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const [itemPath, itemQuery = ''] = item.href.split('?');
              const itemTab = new URLSearchParams(itemQuery).get('tab');
              const currentTab = searchParams.get('tab') || (itemPath === '/creator/payments' ? 'withdraw' : null);
              const isExactMatch = pathname === itemPath;
              const isParentMatch = pathname.startsWith(`${itemPath}/`) && !/\/(new|reactions|edit|settings)($|\/)/.test(pathname.substring(itemPath.length));
              const pathMatches = isExactMatch || isParentMatch;
              const isActive = pathMatches && (!itemTab || itemTab === currentTab);
              const Icon = item.icon || BookOpen;

              const linkNode = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border border-transparent px-3 text-sm font-bold transition-all',
                    compact ? 'min-h-11 py-2.5' : 'py-2.5',
                    isActive
                      ? 'border-[#2d6b4e] bg-[#2d6b4e] text-white shadow-sm'
                      : 'text-[#6b7870] hover:border-[#d1ddd6] hover:bg-white hover:text-[#2d6b4e]'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-[#f0c56e]')} />
                  <span className="flex-1">{item.label}</span>
                  {item.href === '/creator/orders' && ordersBadgeCount > 0 && (
                    <span className="rounded-full bg-[#e6aa38] px-2.5 py-0.5 text-[10px] font-extrabold text-[#1e3d2e]">
                      {ordersBadgeCount > 99 ? '99+' : ordersBadgeCount}
                    </span>
                  )}
                </Link>
              );

              if (closeOnNavigate) {
                return (
                  <SheetClose asChild key={item.href}>
                    {linkNode}
                  </SheetClose>
                );
              }

              return linkNode;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CreatorSidebar() {
  return (
    <aside className="sticky top-[5.25rem] hidden h-[calc(100vh-5.25rem)] w-[17rem] shrink-0 overflow-y-auto overscroll-contain border-r border-[#d1ddd6] bg-[#f4f2e9] px-4 py-6 xl:w-[18rem] lg:block">
      <CreatorSidebarNav />
    </aside>
  );
}

export function CreatorSidebarDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="min-h-11 gap-2 lg:hidden">
          <Menu className="h-4 w-4" />
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[90vw] max-w-sm overflow-y-auto border-[#d1ddd6] bg-[#f4f2e9] p-0">
        <div className="p-4 pb-safe pt-5">
          <CreatorSidebarNav compact closeOnNavigate />
        </div>
      </SheetContent>
    </Sheet>
  );
}
