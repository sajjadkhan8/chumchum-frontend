'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Menu, Bell, MessageCircle, User, LogOut, Package, Wallet, Bookmark, Building2, BriefcaseBusiness } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/brand-logo';

interface NavbarProps {
  showSearch?: boolean;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
}

export function Navbar({ showSearch = false, onSearchChange, searchValue }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentHash, setCurrentHash] = useState('');
  const { user, isAuthenticated, hasHydrated, logout } = useAuthStore();
  const isSignedIn = hasHydrated && isAuthenticated && !!user;
  const isCreator = isSignedIn && user.role === 'creator';

  useEffect(() => {
    const syncHash = () => setCurrentHash(window.location.hash || '');
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const publicNavLinks = [
    { href: '/brand/explore', label: 'Explore Creators' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/about', label: 'About' },
    { href: '/help', label: 'Help Center' },
    { href: '/resources', label: 'Resources' },
    { href: '/pricing', label: 'Pricing' },
  ];

  const creatorNavLinks = [
    { href: '/creator/dashboard', label: 'Dashboard' },
    { href: '/creator/packages', label: 'My Packages' },
    { href: '/creator/orders', label: 'Orders' },
    { href: '/creator/earnings', label: 'Earnings' },
  ];

  const brandNavLinks = [
    { href: '/brand/dashboard', label: 'Dashboard' },
    { href: '/brand/explore', label: 'Explore Creators' },
    { href: '/brand/orders', label: 'Campaigns' },
    { href: '/brand/saved', label: 'Saved Creators' },
  ];

  const navLinks = isSignedIn ? (isCreator ? creatorNavLinks : brandNavLinks) : publicNavLinks;

  const profileMenu = isCreator
    ? [
        { href: '/creator/profile/public', label: 'My Profile', icon: User },
        { href: '/creator/packages', label: 'My Packages', icon: Package },
        { href: '/creator/earnings', label: 'Earnings', icon: Wallet },
        { href: '/creator/settings?tab=profile', label: 'Settings', icon: User },
      ]
    : [
        { href: '/brand/settings?tab=profile', label: 'Company Profile', icon: Building2 },
        { href: '/brand/saved', label: 'Saved Creators', icon: Bookmark },
        { href: '/brand/orders', label: 'Campaigns', icon: BriefcaseBusiness },
        { href: '/brand/settings?tab=notifications', label: 'Settings', icon: User },
      ];

  const messagesLink = isSignedIn ? `/${user.role}/messages` : '/messages';

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
      className="sticky top-0 z-50 w-full border-b border-primary/20 bg-brand-panel text-white"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <BrandLogo textClassName="text-white" />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                isLinkActive(link.href) ? 'text-primary' : 'text-white/80'
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
                placeholder="Search food vloggers in Riyadh or TikTok tech creators"
                className="w-full rounded-full border-white/15 bg-white/10 pl-10 text-white placeholder:text-white/65"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isSignedIn && user ? (
            <>
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative hidden sm:flex">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                  3
                </Badge>
              </Button>

              {/* Messages */}
              <Link href={messagesLink}>
                <Button variant="ghost" size="icon" className="relative hidden sm:flex">
                  <MessageCircle className="h-5 w-5" />
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                    2
                  </Badge>
                </Button>
              </Link>

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
                <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">Log in</Button>
              </Link>
              <Link href="/brand/explore" className="hidden lg:block">
                <Button variant="outline" className="rounded-full border-white/30 bg-white/5 text-white hover:bg-white/10">Find Creators</Button>
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
