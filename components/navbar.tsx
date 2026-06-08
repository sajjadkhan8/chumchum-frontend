'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Menu, Bell, MessageCircle, User, LogOut, Package, Wallet, Bookmark, Building2, BriefcaseBusiness, Moon, Sun, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/store/auth-store';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { ZingZingLogo } from '@/src/components/ZingZingLogo';
import { messagesService } from '@/services/messages.service';
import { ordersService } from '@/services/orders.service';
import { notificationsService } from '@/services/notifications.service';
import type { Order } from '@/types';

interface NavbarProps {
  showSearch?: boolean;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
}

interface NavNotification {
  id: string;
  title: string;
  description: string;
  href: string;
  createdAt: Date;
}

const getNotificationSeenKey = (userId: string) => `nav-notifications-seen:${userId}`;

export function Navbar({ showSearch = false, onSearchChange, searchValue }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentHash, setCurrentHash] = useState('');
  const [mounted, setMounted] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [notifications, setNotifications] = useState<NavNotification[]>([]);
  const [seenNotificationIds, setSeenNotificationIds] = useState<string[]>([]);
  const [offerNotifCount, setOfferNotifCount] = useState(0);
  const { resolvedTheme, setTheme } = useTheme();
  const { user, isAuthenticated, hasHydrated, logout } = useAuthStore();
  const isSignedIn = hasHydrated && isAuthenticated && !!user;
  const isCreator = isSignedIn && user.role === 'creator';
  const isAdmin = isSignedIn && user.role === 'platform_admin';

  useEffect(() => {
    const syncHash = () => setCurrentHash(window.location.hash || '');
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user || isAdmin) {
      setSeenNotificationIds([]);
      return;
    }

    try {
      const raw = localStorage.getItem(getNotificationSeenKey(user.id));
      if (!raw) {
        setSeenNotificationIds([]);
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setSeenNotificationIds(parsed.filter((entry): entry is string => typeof entry === 'string'));
        return;
      }
    } catch {
      // Reset invalid local notification cache silently.
    }

    setSeenNotificationIds([]);
  }, [mounted, user, isAdmin]);

  useEffect(() => {
    if (!isSignedIn || !user || isAdmin) {
      setUnreadMessageCount(0);
      setNotifications([]);
      setOfferNotifCount(0);
      return;
    }

    let cancelled = false;

    const toNotification = (order: Order): NavNotification => {
      const baseHref = user.role === 'creator' ? '/creator/orders' : '/brand/orders';
      const statusLabel = order.status.replace('_', ' ');
      const participantName = user.role === 'creator' ? order.brand.name : order.creator.name;

      return {
        id: `order-${order.id}-${order.status}`,
        title: `${participantName} • ${order.package.title}`,
        description: `Status update: ${statusLabel}`,
        href: `${baseHref}?status=${order.status}`,
        createdAt: order.updatedAt,
      };
    };

    const loadNavSignals = async () => {
      try {
        const [conversationResult, ordersResult, offerNotifResult] = await Promise.allSettled([
          messagesService.getConversations(user.id, user.role as 'creator' | 'brand'),
          ordersService.getAll(),
          notificationsService.getUnreadCount(),
        ]);

        if (cancelled) return;

        if (conversationResult.status === 'fulfilled') {
          const unread = conversationResult.value.reduce((total, conversation) => total + Math.max(0, conversation.unreadCount || 0), 0);
          setUnreadMessageCount(unread);
        } else {
          setUnreadMessageCount(0);
        }

        if (offerNotifResult.status === 'fulfilled') {
          setOfferNotifCount(offerNotifResult.value);
        } else {
          setOfferNotifCount(0);
        }

        if (ordersResult.status === 'fulfilled') {
          const myOrders = ordersResult.value.filter((order) =>
            user.role === 'creator' ? order.creatorId === user.id : order.brandId === user.id
          );
          const relevantStatuses = user.role === 'creator'
            ? new Set(['pending', 'revision', 'review', 'cancelled'])
            : new Set(['delivered', 'review', 'revision', 'cancelled', 'completed']);

          const nextNotifications = myOrders
            .filter((order) => relevantStatuses.has(order.status))
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 8)
            .map(toNotification);

          setNotifications(nextNotifications);
        } else {
          setNotifications([]);
        }
      } catch {
        if (!cancelled) {
          setUnreadMessageCount(0);
          setNotifications([]);
          setOfferNotifCount(0);
        }
      }
    };

    void loadNavSignals();
    const intervalId = window.setInterval(() => {
      void loadNavSignals();
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isSignedIn, isAdmin, user, pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const publicNavLinks = [
    { href: '/brand/explore', label: 'Explore Creators' },
    { href: '/brand/ambassadors', label: 'Platform Ambassadors' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/about', label: 'About' },
    { href: '/help', label: 'Help Center' },
    { href: '/resources', label: 'Resources' },
    { href: '/pricing', label: 'Pricing' },
  ];

  const creatorNavLinks = [
    { href: '/creator/dashboard', label: 'Dashboard' },
    { href: '/creator/offers', label: 'Offers' },
    { href: '/creator/packages', label: 'My Packages' },
    { href: '/creator/ambassador-program', label: '👑 Ambassador Program' },
    { href: '/creator/orders', label: 'Orders' },
    { href: '/creator/payments?tab=withdraw', label: 'Payments' },
  ];

  const brandNavLinks = [
    { href: '/brand/dashboard', label: 'Dashboard' },
    { href: '/brand/offers', label: 'Offers' },
    { href: '/brand/ambassadors', label: 'Platform Ambassadors' },
    { href: '/brand/explore', label: 'Creators' },
    { href: '/brand/orders', label: 'Orders' },
    { href: '/brand/payments', label: 'Payments' },
  ];
  const adminNavLinks = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/payments', label: 'Payments Audit' },
    { href: '/admin/verification', label: 'Verification' },
  ];

  const navLinks = isSignedIn ? (isAdmin ? adminNavLinks : isCreator ? creatorNavLinks : brandNavLinks) : publicNavLinks;

  const profileMenu = isAdmin
    ? [
        { href: '/admin/dashboard', label: 'Admin Dashboard', icon: Shield },
        { href: '/admin/payments', label: 'Payments Audit', icon: Wallet },
        { href: '/admin/users', label: 'User Moderation', icon: User },
      ]
    : isCreator
    ? [
        { href: '/creator/profile/public', label: 'My Profile', icon: User },
        { href: '/creator/offers', label: 'Offers', icon: BriefcaseBusiness },
        { href: '/creator/packages', label: 'My Packages', icon: Package },
        { href: '/creator/payments?tab=withdraw', label: 'Payments', icon: Wallet },
        { href: '/creator/settings/preferences', label: 'Settings', icon: User },
      ]
    : [
        { href: '/brand/settings?tab=profile', label: 'Company Profile', icon: Building2 },
        { href: '/brand/offers', label: 'Offers', icon: BriefcaseBusiness },
        { href: '/brand/payments', label: 'Payments', icon: Wallet },
        { href: '/brand/explore?view=saved', label: 'Saved Creators', icon: Bookmark },
        { href: '/brand/orders', label: 'Orders', icon: BriefcaseBusiness },
        { href: '/brand/settings?tab=notifications', label: 'Settings', icon: User },
      ];

  const messagesLink = isSignedIn && !isAdmin ? `/${user.role}/messages` : '/messages';
  const unseenNotifications = notifications.filter((item) => !seenNotificationIds.includes(item.id));
  const notificationCount = unseenNotifications.length + offerNotifCount;

  const persistSeenNotificationIds = (next: string[]) => {
    if (!mounted || !user) return;
    setSeenNotificationIds(next);
    localStorage.setItem(getNotificationSeenKey(user.id), JSON.stringify(next));
  };

  const markAllNotificationsSeen = () => {
    const merged = Array.from(new Set([...seenNotificationIds, ...notifications.map((item) => item.id)]));
    persistSeenNotificationIds(merged);
  };

  const markNotificationSeen = (notificationId: string) => {
    if (seenNotificationIds.includes(notificationId)) return;
    persistSeenNotificationIds([...seenNotificationIds, notificationId]);
  };

  const isLinkActive = (href: string) => {
    const pathOnly = href.split('?')[0];
    if (pathOnly === '/') return pathname === '/';
    if (pathOnly.startsWith('/#')) {
      const targetHash = `#${pathOnly.split('#')[1]}`;
      return pathname === '/' && currentHash === targetHash;
    }
    return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:gap-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex min-h-11 items-center">
          <ZingZingLogo variant="icon" size={40} className="h-10 w-10" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden flex-1 items-center justify-center gap-5 md:flex lg:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                isLinkActive(link.href) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search Bar (optional) */}
        {showSearch && (
          <div className="hidden max-w-md flex-1 px-8 lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search food vloggers in Karachi or TikTok tech creators"
                className="w-full rounded-full bg-muted pl-10"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}

          {isSignedIn && user ? (
            <>
              {!isAdmin && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative hidden sm:flex" aria-label="Open notifications">
                        <Bell className="h-5 w-5" />
                        {notificationCount > 0 && (
                          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs">
                            {notificationCount > 99 ? '99+' : notificationCount}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[22rem] p-1">
                      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                        <span className="text-sm font-semibold">Notifications</span>
                        {notificationCount > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(event) => {
                              event.preventDefault();
                              markAllNotificationsSeen();
                            }}
                          >
                            Mark all as seen
                          </Button>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                      {notificationCount === 0 ? (
                        <div className="px-2 py-5 text-center text-sm text-muted-foreground">
                          You are all caught up.
                        </div>
                      ) : (
                        unseenNotifications.map((item) => (
                          <DropdownMenuItem asChild key={item.id} className="items-start py-2">
                            <Link href={item.href} className="flex w-full flex-col gap-1" onClick={() => markNotificationSeen(item.id)}>
                              <span className="flex items-center justify-between gap-2">
                                <span className="flex min-w-0 items-center gap-2">
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                                  <span className="line-clamp-1 text-sm font-medium">{item.title}</span>
                                </span>
                                <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
                              </span>
                              <span className="line-clamp-1 text-xs text-muted-foreground">{item.description}</span>
                            </Link>
                          </DropdownMenuItem>
                        ))
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={user.role === 'creator' ? '/creator/notifications' : '/brand/notifications'} className="justify-center text-sm font-medium text-primary">
                          View all notifications
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Link href={messagesLink}>
                    <Button variant="ghost" size="icon" className="relative hidden sm:flex">
                      <MessageCircle className="h-5 w-5" />
                      {unreadMessageCount > 0 && (
                        <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs">
                          {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                </>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {profileMenu.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem asChild key={item.label}>
                        <Link href={item.href}>
                          <Icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/brand/explore" className="hidden lg:block">
                <Button variant="outline" className="rounded-full">Find Creators</Button>
              </Link>
              <Link href="/signup">
                <Button className="rounded-full">Sign Up</Button>
              </Link>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="min-tap md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] max-w-sm p-0">
              <div className="border-b p-4">
                <p className="text-base font-semibold">Menu</p>
              </div>
              <nav className="flex flex-col gap-1 p-4 pb-safe">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'min-h-11 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted/60 hover:text-primary',
                        isLinkActive(link.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                {isSignedIn && user ? (
                  <>
                    <SheetClose asChild>
                      <Link href={messagesLink} className={cn('min-h-11 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted/60 hover:text-primary', isLinkActive(messagesLink) ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>
                        Messages
                      </Link>
                    </SheetClose>
                    {profileMenu.map((item) => (
                      <SheetClose asChild key={item.label}>
                        <Link href={item.href} className={cn('min-h-11 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted/60 hover:text-primary', isLinkActive(item.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                    <SheetClose asChild>
                      <Button variant="ghost" className="min-h-11 justify-start px-3 text-destructive hover:text-destructive" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link href="/login" className="min-h-11 rounded-lg px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-primary">
                        Log in
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/signup">
                        <Button className="mt-3 min-h-11 w-full rounded-full">Create Account</Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/brand/explore">
                        <Button className="mt-2 min-h-11 w-full rounded-full" variant="outline">Find Creators</Button>
                      </Link>
                    </SheetClose>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
