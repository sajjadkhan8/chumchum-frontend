'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { notificationsService, type AppNotification } from '@/services/notifications.service';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { notificationHref } from '@/lib/notification-href';

interface Props {
  role?: string;
}

export function NotificationsFeed({ role }: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async (nextPage = 0) => {
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await notificationsService.list(nextPage, 20);
      setNotifications(nextPage === 0 ? result.content : (prev) => [...prev, ...result.content]);
      setTotalPages(result.totalPages);
      setPage(nextPage);
    } catch {
      if (nextPage === 0) setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const result = await notificationsService.list(0, 20);
        setNotifications(result.content);
        setTotalPages(result.totalPages);
      } catch {
        // Silent background poll failures are acceptable.
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (notif: AppNotification) => {
    if (notif.read) return;
    try {
      await notificationsService.markRead(notif.id);
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not mark notification as read');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not mark notifications as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <Badge className="rounded-full px-1.5 text-xs">{unreadCount}</Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => void markAllRead()}>
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : hasError ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Could not load notifications.{' '}
            <button type="button" onClick={() => void load(0)} className="font-bold underline">
              Retry
            </button>
          </p>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">You are all caught up.</p>
        ) : (
          <ScrollArea className="max-h-[480px]">
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notificationHref(notif, role)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50',
                    !notif.read && 'bg-primary/5',
                  )}
                  onClick={() => void markRead(notif)}
                >
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      notif.read ? 'bg-transparent' : 'bg-primary',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{notif.title}</p>
                    {notif.body ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{notif.body}</p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>
                  {notif.read && <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
                </Link>
              ))}
            </div>
            {page < totalPages - 1 && (
              <div className="p-4 text-center">
                <Button variant="outline" size="sm" onClick={() => void load(page + 1)} disabled={isLoading}>
                  Load more
                </Button>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
