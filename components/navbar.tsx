'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Menu, Bell, MessageCircle, User, LogOut, Building2, Moon, Sun, Shield, Settings, Share2, Star, CircleHelp, X, ChevronRight } from 'lucide-react';
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
  const isBrand = isSignedIn && user.role === 'brand';

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
      const nextSearchValue = pathname === '/creator/search'
        ? new URLSearchParams(window.location.search).get('q')?.trim() ?? ''
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
    { href: '/brand/explore', label: 'Creators' },
    { href: '/brand/campaigns', label: 'Campaigns' },
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
        { href: '/brand/profile', label: 'Company Profile', icon: Building2 },
        { href: '/brand/settings', label: 'Settings', icon: Settings },
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
      router.push('/creator/campaigns');
      return;
    }

    router.push(`/creator/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur",
        isCreator
          ? "border-[#d1ddd6] bg-[#fbfaf5]/95"
          : isBrand
          ? "border-[#d9e0d8] bg-[#fbfaf5]/95 shadow-[0_10px_34px_rgba(38,70,50,0.06)] supports-[backdrop-filter]:bg-[#fbfaf5]/88"
          : "border-border bg-background/95 supports-[backdrop-filter]:bg-background/60"
      )}
    >
      <div className={cn(
        'mx-auto flex items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:gap-6 lg:px-8',
        isCreator ? 'h-[5.25rem] w-full max-w-none' : 'h-16 max-w-7xl'
      )}>
        {/* Logo */}
        {isBrand ? (
          <Link href="/brand/dashboard" className="flex min-h-11 items-center gap-2.5">
            <ZingZingLogo variant="icon" size={36} className="h-9 w-9 rounded-2xl shadow-[0_8px_20px_rgba(24,92,57,0.18)]" />
            <span className="hidden text-xl font-black tracking-[-0.055em] text-[#173b2a] sm:inline">
              Zing<span className="text-[#e6aa38]">Zing</span>
            </span>
          </Link>
        ) : (
          <Link href="/" className="flex min-h-11 items-center gap-3">
            <ZingZingLogo variant="icon" size={40} className="h-10 w-10" />
            {isCreator && <span className="hidden text-xl font-extrabold tracking-[-0.04em] text-[#1e3d2e] lg:inline">Zing<span className="text-[#e3a52f]">Zing</span></span>}
          </Link>
        )}

        {/* Desktop Navigation */}
        {!showCreatorUtilityTopbar && (
          <nav className={cn('hidden flex-1 items-center justify-center md:flex', isCreator ? 'gap-12' : isBrand ? 'gap-1.5 lg:gap-2' : 'gap-5 lg:gap-6')}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'font-medium transition-colors',
                  isBrand && 'rounded-full px-3 py-2 font-bold tracking-[-0.01em] hover:bg-[#f2efe4] hover:text-[#173b2a]',
                  isCreator ? 'text-lg font-normal tracking-[-0.01em]' : 'text-sm',
                  isLinkActive(link.href)
                    ? isBrand
                      ? 'bg-[#e7f0ea] text-[#185c39] shadow-[inset_0_0_0_1px_rgba(24,92,57,0.08)]'
                      : 'text-primary'
                    : isBrand
                    ? 'text-[#607168]'
                    : 'text-muted-foreground hover:text-primary'
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
            <div className="group relative rounded-full border border-[#cddad1] bg-[#f4f2e9] p-1 transition-[border-color,box-shadow,background-color] focus-within:border-[#2d6b4e] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(24,92,57,0.10)]">
              <span className="absolute left-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white text-[#2d6b4e] shadow-sm transition group-focus-within:bg-[#2d6b4e] group-focus-within:text-white">
                <Search className="size-4" />
              </span>
              <input
                type="text"
                role="searchbox"
                aria-label="Search campaigns, brands, or creators"
                placeholder="Search campaigns, brands, or creators..."
                className="h-10 w-full rounded-full border-0 bg-transparent pl-11 pr-11 text-sm font-semibold text-[#1e3d2e] outline-none placeholder:font-medium placeholder:text-[#87938b]"
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
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[#718077] transition hover:bg-[#f7e8c8] hover:text-[#8b5e12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6b4e]/25"
                  aria-label="Clear creator search"
                  onClick={() => {
                    setCreatorGlobalSearch('');
                    router.push('/creator/dashboard');
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
                className={cn(
                  "w-full rounded-full bg-muted pl-10",
                  isBrand && "border-[#d9e0d8] bg-[#f4f2e9] text-[#173b2a] placeholder:text-[#7c8a82] focus-visible:ring-[#185c39]/20"
                )}
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
              className={cn(isBrand && 'h-10 w-10 rounded-full text-[#385046] hover:bg-[#f2efe4] hover:text-[#185c39]')}
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
                      <Button variant="ghost" size="icon" className={cn('hidden sm:flex', isCreator && 'h-10 w-10 text-[#496159] hover:bg-[#e6eceb] hover:text-[#2d6b4e]')} aria-label="Open help">
                        <CircleHelp className={cn('h-5 w-5', isCreator && 'h-[17px] w-[17px]')} />
                      </Button>
                    </Link>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className={cn('relative hidden sm:flex', isCreator && 'h-10 w-10 text-[#496159] hover:bg-[#e6eceb] hover:text-[#2d6b4e]', isBrand && 'h-10 w-10 rounded-full text-[#385046] hover:bg-[#f2efe4] hover:text-[#185c39]')} aria-label="Open notifications">
                        <Bell className={cn('h-5 w-5', (isCreator || isBrand) && 'h-[17px] w-[17px]')} />
                        {notificationCount > 0 && (
                          <Badge className={cn("absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs", isBrand && "border-[#fbfaf5] bg-[#e6aa38] text-[#173b2a]")}>
                            {notificationCount > 99 ? '99+' : notificationCount}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className={cn(
                        'w-[22rem] p-1',
                        isBrand && 'w-[22rem] rounded-2xl border-[#d9e0d8] bg-[#fbfaf5] p-1.5 shadow-[0_18px_50px_rgba(38,70,50,0.14)]'
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-between gap-2 px-2 py-1.5',
                        isBrand && 'rounded-xl bg-[#173b2a] px-3 py-2.5'
                      )}>
                        <span className={cn('text-sm font-semibold', isBrand && 'text-xs font-extrabold uppercase tracking-[0.12em] text-white')}>
                          Notifications
                        </span>
                        {notificationCount > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn('h-7 px-2 text-xs', isBrand && 'h-6 rounded-lg px-2 text-[10px] font-bold text-[#f0c56e] hover:bg-white/10 hover:text-white')}
                            onClick={(event) => {
                              event.preventDefault();
                              markAllNotificationsSeen();
                            }}
                          >
                            Mark all seen
                          </Button>
                        )}
                      </div>
                      <DropdownMenuSeparator className={cn(isBrand && 'mx-1.5 my-1.5 bg-[#d9e0d8]')} />
                      {notificationCount === 0 ? (
                        <div className={cn('px-2 py-5 text-center text-sm text-muted-foreground', isBrand && 'py-6 text-xs font-semibold text-[#8fa098]')}>
                          You are all caught up.
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <DropdownMenuItem
                            asChild
                            key={item.id}
                            className={cn(
                              'items-start py-2',
                              isBrand && 'rounded-lg px-2 py-2 data-[highlighted]:bg-[#e7f0ea]'
                            )}
                          >
                            <Link href={item.href} className="flex w-full flex-col gap-1" onClick={() => markNotificationSeen(item.id)}>
                              <span className="flex items-center justify-between gap-2">
                                <span className="flex min-w-0 items-center gap-2">
                                  <span className={cn('h-2 w-2 shrink-0 rounded-full bg-primary', isBrand && 'bg-[#2d6b4e]')} aria-hidden="true" />
                                  <span className={cn('line-clamp-1 text-sm font-medium', isBrand && 'text-xs font-bold text-[#1a2e22]')}>{item.title}</span>
                                </span>
                                <span className={cn('shrink-0 text-[11px] text-muted-foreground', isBrand && 'text-[10px] text-[#8fa098]')}>{formatRelativeTime(item.createdAt)}</span>
                              </span>
                              <span className={cn('line-clamp-1 text-xs text-muted-foreground', isBrand && 'pl-4 text-[11px] text-[#8fa098]')}>{item.description}</span>
                            </Link>
                          </DropdownMenuItem>
                        ))
                      )}
                      <DropdownMenuSeparator className={cn(isBrand && 'mx-1.5 my-1.5 bg-[#d9e0d8]')} />
                      <DropdownMenuItem asChild className={cn(isBrand && 'rounded-lg data-[highlighted]:bg-[#e7f0ea]')}>
                        <Link
                          href={user.role === 'creator' ? '/creator/notifications' : '/brand/notifications'}
                          className={cn('justify-center text-sm font-medium text-primary', isBrand && 'justify-center text-xs font-bold text-[#185c39]')}
                        >
                          View all notifications
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Link href={messagesLink}>
                    <Button variant="ghost" size="icon" className={cn('relative hidden sm:flex', isCreator && 'h-10 w-10 text-[#496159] hover:bg-[#e6eceb] hover:text-[#2d6b4e]', isBrand && 'h-10 w-10 rounded-full text-[#385046] hover:bg-[#f2efe4] hover:text-[#185c39]')}>
                      <MessageCircle className={cn('h-5 w-5', (isCreator || isBrand) && 'h-[17px] w-[17px]')} />
                      {unreadMessageCount > 0 && (
                        <Badge className={cn("absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs", isBrand && "border-[#fbfaf5] bg-[#e6aa38] text-[#173b2a]")}>
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
                  <Button
                    variant="ghost"
                    className={cn(
                      'relative h-10 w-10 rounded-full',
                      isCreator && 'border border-transparent bg-[#e6eceb] p-0 transition hover:border-[#b0c5ba] hover:bg-white data-[state=open]:border-[#2d6b4e] data-[state=open]:bg-white data-[state=open]:shadow-[0_0_0_4px_rgba(24,92,57,0.10)]',
                      isBrand && 'border border-[#d9e0d8] bg-[#f2efe4] p-0 transition hover:border-[#b7c8bd] hover:bg-white data-[state=open]:border-[#185c39] data-[state=open]:bg-white data-[state=open]:shadow-[0_0_0_4px_rgba(24,92,57,0.10)]'
                    )}
                    aria-label="Open profile menu"
                  >
                    <Avatar className={cn('h-9 w-9', (isCreator || isBrand) && 'h-8 w-8')}>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className={cn(isCreator && 'bg-[#2d6b4e] text-sm font-extrabold text-white', isBrand && 'bg-[#185c39] text-sm font-extrabold text-white')}>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {isCreator && <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#fbfaf5] bg-[#e6aa38]" aria-hidden="true" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    'w-56',
                    isCreator && 'w-[18rem] rounded-2xl border-[#d1ddd6] bg-[#fbfaf5] p-1.5 shadow-[0_18px_50px_rgba(38,70,50,0.16)]',
                    isBrand && 'w-[18rem] rounded-2xl border-[#d9e0d8] bg-[#fbfaf5] p-1.5 shadow-[0_18px_50px_rgba(38,70,50,0.14)]'
                  )}
                  align="end"
                  sideOffset={8}
                >
                  <div className={cn('flex items-center gap-2 p-2', isCreator && 'rounded-xl bg-[#1e3d2e] px-3 py-2.5 text-white', isBrand && 'rounded-xl bg-[#173b2a] px-3 py-2.5 text-white')}>
                    <Avatar className={cn('h-10 w-10', (isCreator || isBrand) && 'size-9 border border-white/15')}>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className={cn(isCreator && 'bg-[#244c39] text-sm font-extrabold text-white', isBrand && 'bg-[#185c39] text-sm font-extrabold text-white')}>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm font-medium', (isCreator || isBrand) && 'truncate text-sm font-extrabold tracking-[-0.01em] text-white')}>{user.name}</p>
                      <p className={cn('text-xs text-muted-foreground capitalize', (isCreator || isBrand) && 'text-[9px] font-bold uppercase tracking-[0.12em] text-[#f0c56e]')}>{creatorRoleLabel}</p>
                    </div>
                    {isCreator && (
                      <span className="size-2 rounded-full bg-[#e6aa38]" title="Online" aria-label="Online" />
                    )}
                  </div>
                  <DropdownMenuSeparator className={cn((isCreator || isBrand) && 'mx-1.5 my-1.5 bg-[#d1ddd6]')} />
                  {profileMenu.map((item) => {
                    const Icon = item.icon;
                    const isAmbassadorEntry = isCreator && item.accent === 'amber';
                    return (
                      <DropdownMenuItem
                        asChild
                        key={item.label}
                        className={cn(
                          isCreator && 'rounded-lg px-2 py-1.5 text-xs font-bold text-[#526259] data-[highlighted]:bg-[#e6eceb] data-[highlighted]:text-[#2d6b4e]',
                          isBrand && 'rounded-lg px-2 py-1.5 text-xs font-bold text-[#526259] data-[highlighted]:bg-[#e7f0ea] data-[highlighted]:text-[#185c39]',
                          isAmbassadorEntry && 'bg-[#f7e8c8]/65 text-[#8b5e12] data-[highlighted]:bg-[#f7e8c8] data-[highlighted]:text-[#73541e]'
                        )}
                      >
                        <Link href={item.href} className="flex w-full items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg', isAmbassadorEntry ? 'bg-white/75 text-[#9b6712]' : 'bg-white text-[#2d6b4e]', isBrand && !isAmbassadorEntry && 'bg-[#e7f0ea] text-[#185c39]')}>
                              <Icon className="size-3.5" />
                            </span>
                            <span className="truncate">{item.label}</span>
                          </span>
                          {item.badge && (
                            <span className="rounded-full bg-white/75 px-1.5 py-0.5 text-[9px] font-extrabold text-[#8b5e12]">
                              {item.badge}
                            </span>
                          )}
                          {!item.badge && isCreator && <ChevronRight className="size-3 text-[#9aa49d]" />}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator className={cn((isCreator || isBrand) && 'mx-1.5 my-1.5 bg-[#d1ddd6]')} />
                  <DropdownMenuItem onClick={handleLogout} className={cn('text-destructive', isCreator && 'rounded-lg px-2 py-1.5 text-xs font-bold text-[#9d3c36] data-[highlighted]:bg-[#f9ebe8] data-[highlighted]:text-[#8b302b]', isBrand && 'rounded-lg px-2 py-1.5 text-xs font-bold text-[#9d3c36] data-[highlighted]:bg-[#f9ebe8] data-[highlighted]:text-[#8b302b]')}>
                    <span className={cn((isCreator || isBrand) && 'grid size-7 place-items-center rounded-lg bg-[#f9ebe8]')}>
                      <LogOut className={cn('h-3.5 w-3.5', !(isCreator || isBrand) && 'mr-2')} />
                    </span>
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
              <Button variant="ghost" size="icon" className={cn("min-tap md:hidden", isBrand && "rounded-full text-[#385046] hover:bg-[#f2efe4] hover:text-[#185c39]")}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className={cn("w-[88vw] max-w-sm p-0", isBrand && "border-[#d9e0d8] bg-[#fbfaf5]")}>
              <div className={cn("border-b p-4", isBrand && "border-[#d9e0d8]")}>
                <p className={cn("text-base font-semibold", isBrand && "text-[#173b2a]")}>Menu</p>
              </div>
              <nav className="flex flex-col gap-1 p-4 pb-safe">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'min-h-11 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted/60 hover:text-primary',
                        isBrand && 'rounded-xl font-bold hover:bg-[#f2efe4] hover:text-[#173b2a]',
                        isLinkActive(link.href)
                          ? isBrand
                            ? 'bg-[#e7f0ea] text-[#185c39]'
                            : 'bg-primary/10 text-primary'
                          : isBrand
                          ? 'text-[#607168]'
                          : 'text-muted-foreground'
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
                        <Link href={messagesLink} className={cn('min-h-11 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted/60 hover:text-primary', isBrand && 'rounded-xl font-bold hover:bg-[#f2efe4] hover:text-[#173b2a]', isLinkActive(messagesLink) ? isBrand ? 'bg-[#e7f0ea] text-[#185c39]' : 'bg-primary/10 text-primary' : isBrand ? 'text-[#607168]' : 'text-muted-foreground')}>
                          Messages
                        </Link>
                      </SheetClose>
                    )}
                    {profileMenu.map((item) => (
                      <SheetClose asChild key={item.label}>
                        <Link href={item.href} className={cn('min-h-11 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted/60 hover:text-primary', isBrand && 'rounded-xl font-bold hover:bg-[#f2efe4] hover:text-[#173b2a]', isLinkActive(item.href) ? isBrand ? 'bg-[#e7f0ea] text-[#185c39]' : 'bg-primary/10 text-primary' : isBrand ? 'text-[#607168]' : 'text-muted-foreground')}>
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                    <SheetClose asChild>
                      <Button variant="ghost" className={cn("min-h-11 justify-start px-3 text-destructive hover:text-destructive", isBrand && "rounded-xl font-bold hover:bg-[#f9ebe8]")} onClick={handleLogout}>
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
