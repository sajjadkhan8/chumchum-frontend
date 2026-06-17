'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notificationsService, type AppNotification } from '@/services/notifications.service';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { notificationHref } from '@/lib/notification-href';
import { useAuthStore } from '@/store/auth-store';

const typeColors: Record<string, string> = {
  order: 'bg-[#e7f0ea] text-[#185c39]',
  message: 'bg-[#e8f0fb] text-[#2563b0]',
  payment: 'bg-[#fef9ec] text-[#8b5e12]',
  alert: 'bg-[#fce4e4] text-[#c13a3a]',
};
const typeColor = (type?: string) => typeColors[type ?? ''] ?? 'bg-[#f0f4f0] text-[#526259]';

export default function BrandNotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const load = useCallback(async (nextPage = 0) => {
    if (nextPage === 0) setIsLoading(true); else setIsLoadingMore(true);
    try {
      const result = await notificationsService.list(nextPage, 20);
      setNotifications((prev) => nextPage === 0 ? result.content : [...prev, ...result.content]);
      setTotalPages(result.totalPages);
      setPage(nextPage);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => { void load(0); }, [load]);

  const markRead = async (notif: AppNotification) => {
    if (notif.read) return;
    await notificationsService.markRead(notif.id).catch(() => null);
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await notificationsService.markAllRead().catch(() => null);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#f4f2e9]">
      {/* Hero */}
      <div className="bg-[#173b2a] px-4 pt-7 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#f0c56e]">
            <Bell className="size-3.5" />
            Notifications
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#e6aa38] px-2 py-0.5 text-[10px] font-black text-[#173b2a]">
                {unreadCount}
              </span>
            )}
          </div>
          <h1 className="sr-only">Notifications</h1>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div
          className="overflow-hidden rounded-[1.75rem] border border-[#d9e0d8] bg-white shadow-[0_18px_60px_rgba(38,70,50,0.07)]"
          style={{
            '--background': 'oklch(1 0 0)',
            '--foreground': 'oklch(0.1 0 0)',
            '--muted': 'oklch(0.96 0 0)',
            '--muted-foreground': 'oklch(0.45 0 0)',
            '--border': 'oklch(0.91 0 0)',
          } as React.CSSProperties}
        >
          {/* Card header */}
          <div className="flex items-center justify-between gap-3 border-b border-[#f0f4f0] px-5 py-3.5">
            <p className="text-sm font-extrabold text-[#1a2e22]">
              {isLoading ? 'Loading…' : notifications.length === 0 ? 'No notifications' : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
            </p>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#526259] hover:bg-[#f4f2e9] hover:text-[#2d6b4e]"
                onClick={() => void markAllRead()}
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex flex-col gap-2 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-[1.15rem] bg-[#f4f2e9]" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#e7f0ea]">
                <Bell className="size-5 text-[#2d6b4e]" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#1a2e22]">You&apos;re all caught up</p>
                <p className="mt-0.5 text-xs text-[#8fa098]">New activity from campaigns, orders, and messages will appear here</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f0]">
              {notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notificationHref(notif, user?.role)}
                  onClick={() => void markRead(notif)}
                  className={cn(
                    'flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[#f9faf8]',
                    !notif.read && 'bg-[#f4faf6]'
                  )}
                >
                  {/* Unread dot */}
                  <span className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full transition-colors',
                    notif.read ? 'bg-transparent' : 'bg-[#2d6b4e]'
                  )} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
                      <p className={cn('text-xs font-semibold', notif.read ? 'text-[#526259]' : 'text-[#1a2e22]')}>
                        {notif.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-[#8fa098]">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    {notif.body && (
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-[#8fa098]">{notif.body}</p>
                    )}
                    {notif.type && (
                      <span className={cn('mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold capitalize', typeColor(notif.type))}>
                        {notif.type.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {notif.read && (
                    <Check className="mt-1.5 size-3.5 shrink-0 text-[#b0bdb6]" />
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Load more */}
          {page < totalPages - 1 && (
            <div className="border-t border-[#f0f4f0] px-5 py-3.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-full rounded-xl border-[#d9e0d8] text-xs font-semibold text-[#526259] hover:bg-[#f4f2e9]"
                onClick={() => void load(page + 1)}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
