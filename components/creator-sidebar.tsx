'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  CreditCard,
  Gauge,
  HelpCircle,
  Layers,
  LayoutDashboard,
  MessageCircle,
  Package,
  Settings,
  ShieldCheck,
  User,
  Wallet,
  Menu,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

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
    title: 'Main',
    items: [{ href: '/creator/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Packages',
    items: [
      { href: '/creator/packages', label: 'All Packages', icon: Layers },
      { href: '/creator/packages/new', label: 'Create Package', icon: Package },
      { href: '/creator/packages/drafts', label: 'Drafts' },
      { href: '/creator/packages/archived', label: 'Archived Packages' },
    ],
  },
  {
    title: 'Orders',
    items: [
      { href: '/creator/orders/active', label: 'Active Orders' },
      { href: '/creator/orders/completed', label: 'Completed' },
      { href: '/creator/orders/pending-approval', label: 'Pending Approval' },
      { href: '/creator/orders/cancelled', label: 'Cancelled' },
    ],
  },
  {
    title: 'Communication',
    items: [{ href: '/creator/messages', label: 'Messages', icon: MessageCircle }],
  },
  {
    title: 'Analytics',
    items: [
      { href: '/creator/earnings', label: 'Earnings', icon: Wallet },
      { href: '/creator/insights', label: 'Insights', icon: BarChart3 },
      { href: '/creator/performance', label: 'Performance', icon: Gauge },
    ],
  },
  {
    title: 'Profile',
    items: [
      { href: '/creator/profile/public', label: 'Public Profile', icon: User },
      { href: '/creator/profile/social', label: 'Social Accounts' },
      { href: '/creator/profile/verification', label: 'Verification', icon: ShieldCheck },
    ],
  },
  {
    title: 'Settings',
    items: [
      { href: '/creator/settings/payment-methods', label: 'Payment Methods', icon: CreditCard },
      { href: '/creator/settings/preferences', label: 'Preferences' },
      { href: '/creator/settings/notifications', label: 'Notifications', icon: Settings },
    ],
  },
  {
    title: 'Support',
    items: [{ href: '/creator/help', label: 'Help & Support', icon: HelpCircle }],
  },
];

function CreatorSidebarNav({ compact = false, closeOnNavigate = false, onNavigate }: { compact?: boolean; closeOnNavigate?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="space-y-5">
      {navGroups.map((group) => (
        <div key={group.title} className="space-y-1.5">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon || BookOpen;

              const linkNode = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2.5 text-sm transition-colors',
                    compact ? 'min-h-11 py-2.5' : 'py-2',
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
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
    <Card className="sticky top-20 hidden h-[calc(100vh-6rem)] w-72 overflow-hidden lg:block">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Creator Studio</CardTitle>
      </CardHeader>
      <CardContent className="h-full overflow-y-auto pb-6">
        <CreatorSidebarNav />
      </CardContent>
    </Card>
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
      <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Creator Studio</SheetTitle>
        </SheetHeader>
        <div className="p-4 pb-safe">
          <CreatorSidebarNav compact closeOnNavigate />
        </div>
      </SheetContent>
    </Sheet>
  );
}

