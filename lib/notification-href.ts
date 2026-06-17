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
  if (entityType === 'brand_campaign') {
    return role === 'brand' ? `/brand/campaigns/${notification.entityId ?? ''}` : '/creator/campaigns';
  }
  if (entityType === 'brand_campaign_reaction') {
    return role === 'brand' ? '/brand/campaigns' : '/creator/campaigns/reactions';
  }
  return role === 'brand' ? '/brand/dashboard' : '/creator/dashboard';
};
