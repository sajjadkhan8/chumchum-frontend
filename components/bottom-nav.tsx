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
  const { user } = useAuthStore();

  const creatorNavItems: NavItem[] = [
    { href: '/creator/dashboard', icon: Home, label: 'Home' },
    { href: '/creator/orders', icon: ShoppingBag, label: 'Orders' },
    { href: '/creator/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/creator/earnings', icon: User, label: 'Earnings' },
    { href: '/creator/settings', icon: User, label: 'Profile' },
  ];

  const brandNavItems: NavItem[] = [
    { href: '/brand/dashboard', icon: Home, label: 'Home' },
    { href: '/brand/explore', icon: Search, label: 'Explore' },
    { href: '/brand/orders', icon: ShoppingBag, label: 'Orders' },
    { href: '/brand/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/brand/settings', icon: User, label: 'Profile' },
  ];

  const navItems = user?.role === 'creator' ? creatorNavItems : brandNavItems;

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
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
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 h-0.5 w-12 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
