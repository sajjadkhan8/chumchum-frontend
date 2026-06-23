'use client';

import { Suspense } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { NotificationsFeed } from '@/components/notifications-feed';

export default function BrandNotificationsPage() {
  const { user } = useAuthStore();
  return (
    <div className="container mx-auto max-w-2xl p-4 pb-6 md:p-6">
      <Suspense fallback={null}>
        <NotificationsFeed role={user?.role} />
      </Suspense>
    </div>
  );
}
