import type { AppNotification } from '@/services/notifications.service';

export const notificationHref = (notification: AppNotification, role?: string): string => {
  const entityType = notification.entityType?.toLowerCase();
  if (entityType === 'conversation') {
    const base = role === 'brand' ? '/brand/messages' : '/creator/messages';
    return notification.entityId ? `${base}?conversation=${notification.entityId}` : base;
  }
  if (entityType === 'order') {
    return role === 'brand' ? '/brand/orders' : '/creator/orders';
  }
  if (entityType === 'brand_offer') {
    return role === 'brand' ? `/brand/offers/${notification.entityId ?? ''}` : '/creator/offers';
  }
  if (entityType === 'brand_offer_reaction') {
    return role === 'brand' ? '/brand/offers' : '/creator/offers/reactions';
  }
  return role === 'brand' ? '/brand/dashboard' : '/creator/dashboard';
};
