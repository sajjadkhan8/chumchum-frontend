'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Crown,
  CreditCard,
  Gauge,
  HelpCircle,
  Layers,
  LayoutDashboard,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
  Menu,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ZingZingLogo } from '@/src/components/ZingZingLogo';
import { useAuthStore } from '@/store/auth-store';

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
    ],
  },
  {
    title: 'Orders',
    items: [
      { href: '/creator/orders', label: 'All Orders' },
    ],
  },
  {
    title: 'Communication',
    items: [{ href: '/creator/messages', label: 'Messages', icon: MessageCircle }],
  },
  {
    title: 'Analytics',
    items: [
      { href: '/creator/insights', label: 'Insights', icon: BarChart3 },
      { href: '/creator/performance', label: 'Performance', icon: Gauge },
    ],
  },
  {
    title: 'Payments',
    items: [
      { href: '/creator/earnings', label: 'Earnings Analytics', icon: Wallet },
      { href: '/creator/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    title: 'Profile',
    items: [
      { href: '/creator/profile/public', label: 'Public Profile', icon: User },
      { href: '/creator/profile/social', label: 'Social Accounts' },
    ],
  },
   {
     title: 'Settings',
     items: [
       { href: '/creator/settings/preferences', label: 'Preferences' },
     ],
   },
  {
    title: 'Support',
    items: [{ href: '/creator/help', label: 'Help & Support', icon: HelpCircle }],
  },
];

const ambassadorNavGroup: NavGroup = {
  title: 'Ambassador Ops',
  items: [
    { href: '/creator/dashboard', label: 'Command Center', icon: Crown },
    { href: '/creator/ambassador-program', label: 'Ambassador Program', icon: Sparkles },
    { href: '/creator/performance', label: 'SLA & Performance', icon: ShieldCheck },
    { href: '/creator/messages', label: 'Priority Queue', icon: MessageCircle },
  ],
};

const getNavGroups = (isActiveAmbassador: boolean): NavGroup[] => {
  if (!isActiveAmbassador) return navGroups;

  const supportIndex = navGroups.findIndex((group) => group.title === 'Support');
  if (supportIndex < 0) return [...navGroups, ambassadorNavGroup];

  return [
    ...navGroups.slice(0, supportIndex),
    ambassadorNavGroup,
    ...navGroups.slice(supportIndex),
  ];
};

function CreatorSidebarNav({ compact = false, closeOnNavigate = false, onNavigate }: { compact?: boolean; closeOnNavigate?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const isActiveAmbassador =
    user?.role === 'creator' &&
    (user?.creatorProgramStatus === 'active_ambassador' || user?.email === 'ambassador@test.com');
  const renderedNavGroups = getNavGroups(isActiveAmbassador);

  return (
    <div className="space-y-5">
      {renderedNavGroups.map((group) => (
        <div key={group.title} className="space-y-1.5">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const [itemPath, itemQuery = ''] = item.href.split('?');
              const itemTab = new URLSearchParams(itemQuery).get('tab');
              const currentTab = searchParams.get('tab') || (itemPath === '/creator/payments' ? 'withdraw' : null);
              const pathMatches = pathname === itemPath || pathname.startsWith(`${itemPath}/`);
              const isActive = pathMatches && (!itemTab || itemTab === currentTab);
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
        <CardTitle className="flex items-center gap-2 text-base">
          <ZingZingLogo variant="icon" size={24} className="h-6 w-6" />
          Creator Studio
        </CardTitle>
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
          <SheetTitle className="flex items-center gap-2">
            <ZingZingLogo variant="icon" size={24} className="h-6 w-6" />
            Creator Studio
          </SheetTitle>
        </SheetHeader>
        <div className="p-4 pb-safe">
          <CreatorSidebarNav compact closeOnNavigate />
        </div>
      </SheetContent>
    </Sheet>
  );
}

