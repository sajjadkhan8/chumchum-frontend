'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Menu, Bell, MessageCircle, User, LogOut, Bookmark, Building2, Moon, Sun, Shield, Settings, Share2, Star, CircleHelp, X } from 'lucide-react';
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
import { notificationsService } from '@/services/notifications.service';
import { notificationHref } from '@/lib/notification-href';

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

interface ProfileMenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  accent?: 'amber';
}

export function Navbar({ showSearch = false, onSearchChange, searchValue }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentHash, setCurrentHash] = useState('');
  const [mounted, setMounted] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [notifications, setNotifications] = useState<NavNotification[]>([]);
  const [creatorGlobalSearch, setCreatorGlobalSearch] = useState('');
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
    const syncCreatorSearch = () => {
      const nextSearchValue = pathname === '/creator/offers'
        ? new URLSearchParams(window.location.search).get('search')?.trim() ?? ''
        : '';
      setCreatorGlobalSearch(nextSearchValue);
    };

    if (!isCreator) {
      setCreatorGlobalSearch('');
      return;
    }

    syncCreatorSearch();
    window.addEventListener('popstate', syncCreatorSearch);

    return () => {
      window.removeEventListener('popstate', syncCreatorSearch);
    };
  }, [isCreator, pathname]);

  useEffect(() => {
    if (!isSignedIn || !user || isAdmin) {
      setUnreadMessageCount(0);
      setNotifications([]);
      return;
    }

    let cancelled = false;

    const loadNavSignals = async () => {
      try {
        const [conversationResult, notificationResult] = await Promise.allSettled([
          messagesService.getConversations(user.id, user.role as 'creator' | 'brand'),
          notificationsService.list(0, 8),
        ]);

        if (cancelled) return;

        if (conversationResult.status === 'fulfilled') {
          const unread = conversationResult.value.reduce((total, conversation) => total + Math.max(0, conversation.unreadCount || 0), 0);
          setUnreadMessageCount(unread);
        } else {
          setUnreadMessageCount(0);
        }

        if (notificationResult.status === 'fulfilled') {
          setNotifications(notificationResult.value.content.filter((item) => !item.read).map((item) => ({
            id: item.id,
            title: item.title,
            description: item.body || 'Open notification',
            href: notificationHref(item, user.role),
            createdAt: item.createdAt,
          })));
        } else {
          setNotifications([]);
        }
      } catch {
        if (!cancelled) {
          setUnreadMessageCount(0);
          setNotifications([]);
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
    { href: '/brand/explore', label: 'Explore' },
    { href: '/packages', label: 'Campaigns' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/help', label: 'Help' },
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
  const showCreatorUtilityTopbar = isCreator && isSignedIn;

  const profileMenu: ProfileMenuItem[] = isAdmin
    ? [
        { href: '/admin/dashboard', label: 'Admin Dashboard', icon: Shield },
        { href: '/admin/users', label: 'User Moderation', icon: User },
      ]
    : isCreator
    ? [
        { href: '/creator/profile/public', label: 'My Profile', icon: User },
        { href: '/creator/profile/social', label: 'Social Accounts', icon: Share2 },
        { href: '/creator/ambassador-program', label: 'Ambassador Program', icon: Star, badge: '79/100', accent: 'amber' },
        { href: '/creator/settings/preferences', label: 'Preferences', icon: Settings },
      ]
    : [
        { href: '/brand/settings?tab=profile', label: 'Company Profile', icon: Building2 },
        { href: '/brand/explore?view=saved', label: 'Saved Creators', icon: Bookmark },
        { href: '/brand/settings?tab=notifications', label: 'Settings', icon: User },
      ];

  const messagesLink = isSignedIn && !isAdmin ? `/${user.role}/messages` : '/messages';
  const notificationCount = notifications.length;
  const creatorRoleLabel = user?.role === 'creator' ? 'Creator' : user?.role;

  const markAllNotificationsSeen = () => {
    setNotifications([]);
    void notificationsService.markAllRead();
  };

  const markNotificationSeen = (notificationId: string) => {
    setNotifications((current) => current.filter((item) => item.id !== notificationId));
    void notificationsService.markRead(notificationId);
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

  const runCreatorGlobalSearch = () => {
    const term = creatorGlobalSearch.trim();
    if (!term) {
      router.push('/creator/offers');
      return;
    }

    // Route to offers with a query parameter so creator search has one consistent entry point.
    router.push(`/creator/offers?search=${encodeURIComponent(term)}`);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className={cn(
        'mx-auto flex items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:gap-6 lg:px-8',
        isCreator ? 'h-[5.25rem] w-full max-w-none' : 'h-16 max-w-7xl'
      )}>
        {/* Logo */}
        <Link href="/" className="flex min-h-11 items-center gap-3">
          <ZingZingLogo variant="icon" size={40} className="h-10 w-10" />
          {isCreator && <span className="hidden text-2xl font-semibold tracking-tight text-foreground lg:inline">ZingZing</span>}
        </Link>

        {/* Desktop Navigation */}
        {!showCreatorUtilityTopbar && (
          <nav className={cn('hidden flex-1 items-center justify-center md:flex', isCreator ? 'gap-12' : 'gap-5 lg:gap-6')}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'font-medium transition-colors hover:text-primary',
                  isCreator ? 'text-lg font-normal tracking-[-0.01em]' : 'text-sm',
                  isLinkActive(link.href) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Creator Global Search */}
        {showCreatorUtilityTopbar && (
          <div className="mx-auto hidden w-full max-w-2xl flex-1 px-4 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search offers, brands, or creators"
                className="h-11 rounded-md border-border/60 bg-muted/25 pl-10 pr-10 text-sm"
                value={creatorGlobalSearch}
                onChange={(e) => setCreatorGlobalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    runCreatorGlobalSearch();
                  }
                }}
              />
              {creatorGlobalSearch.trim() && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
                  aria-label="Clear creator search"
                  onClick={() => {
                    setCreatorGlobalSearch('');
                    router.push('/creator/offers');
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search Bar (optional) */}
        {!showCreatorUtilityTopbar && showSearch && (
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
        <div className={cn('ml-auto flex items-center gap-2 sm:gap-3', showCreatorUtilityTopbar && 'gap-1.5 sm:gap-2')}>
          {/* Theme Toggle */}
          {mounted && !isCreator && (
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
                  {showCreatorUtilityTopbar && (
                    <Link href="/creator/help">
                      <Button variant="ghost" size="icon" className={cn('hidden sm:flex', isCreator && 'h-10 w-10')} aria-label="Open help">
                        <CircleHelp className={cn('h-5 w-5', isCreator && 'h-[17px] w-[17px]')} />
                      </Button>
                    </Link>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className={cn('relative hidden sm:flex', isCreator && 'h-10 w-10')} aria-label="Open notifications">
                        <Bell className={cn('h-5 w-5', isCreator && 'h-[17px] w-[17px]')} />
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
                        notifications.map((item) => (
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
                    <Button variant="ghost" size="icon" className={cn('relative hidden sm:flex', isCreator && 'h-10 w-10')}>
                      <MessageCircle className={cn('h-5 w-5', isCreator && 'h-[17px] w-[17px]')} />
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
                  <Button variant="ghost" className={cn('relative h-10 w-10 rounded-full', isCreator && 'h-10 w-10')}>
                    <Avatar className={cn('h-9 w-9', isCreator && 'h-9 w-9')}>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className={cn(isCreator && 'bg-emerald-700 text-emerald-50')}>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={cn('w-56', isCreator && 'w-[23.5rem] rounded-xl border-border/70 p-0')} align="end">
                  <div className={cn('flex items-center gap-2 p-2', isCreator && 'gap-3 p-5')}>
                    <Avatar className={cn('h-10 w-10', isCreator && 'h-12 w-12')}>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className={cn(isCreator && 'bg-emerald-700 text-emerald-50')}>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className={cn('text-sm font-medium', isCreator && 'text-2xl')}>{user.name}</p>
                      <p className={cn('text-xs text-muted-foreground capitalize', isCreator && 'text-base capitalize')}>{creatorRoleLabel}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {profileMenu.map((item) => {
                    const Icon = item.icon;
                    const isAmbassadorEntry = isCreator && item.accent === 'amber';
                    return (
                      <DropdownMenuItem
                        asChild
                        key={item.label}
                        className={cn(
                          isCreator && 'mx-2 my-1 rounded-xl px-5 py-3 text-base data-[highlighted]:bg-muted/40',
                          isAmbassadorEntry && 'text-amber-400 data-[highlighted]:text-amber-300'
                        )}
                      >
                        <Link href={item.href} className="flex w-full items-center justify-between gap-3">
                          <span className="flex items-center">
                            <Icon className={cn('mr-2 h-4 w-4', isCreator && 'h-5 w-5')} />
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-sm font-semibold text-amber-300">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className={cn('text-destructive', isCreator && 'mx-2 my-1 rounded-xl px-5 py-3 text-base data-[highlighted]:bg-muted/40')}>
                    <LogOut className={cn('mr-2 h-4 w-4', isCreator && 'h-5 w-5')} />
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
                    {!isCreator && (
                      <SheetClose asChild>
                        <Link href={messagesLink} className={cn('min-h-11 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted/60 hover:text-primary', isLinkActive(messagesLink) ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>
                          Messages
                        </Link>
                      </SheetClose>
                    )}
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
