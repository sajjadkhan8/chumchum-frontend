'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Search, ShoppingBag, MessageCircle, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

export function BottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return null;
  }

  const creatorNavItems: NavItem[] = [
    { href: '/creator/dashboard', icon: Home, label: 'Home' },
    { href: '/creator/packages', icon: Search, label: 'Explore' },
    { href: '/creator/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/creator/orders', icon: ShoppingBag, label: 'Orders' },
    { href: '/creator/settings', icon: User, label: 'Profile' },
  ];

  const brandNavItems: NavItem[] = [
    { href: '/brand/dashboard', icon: Home, label: 'Home' },
    { href: '/brand/explore', icon: Search, label: 'Explore' },
    { href: '/brand/orders', icon: ShoppingBag, label: 'Orders' },
    { href: '/brand/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/brand/settings', icon: User, label: 'Profile' },
  ];

  const navItems = user.role === 'creator' ? creatorNavItems : brandNavItems;

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/20 bg-brand-panel text-white md:hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.35rem)' }}
    >
      <div className="flex h-[4.25rem] items-center justify-around px-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'relative min-h-11 flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors',
                isActive ? 'text-primary' : 'text-white/75'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.label === 'Messages' && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    2
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium leading-none">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 h-0.5 w-10 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
