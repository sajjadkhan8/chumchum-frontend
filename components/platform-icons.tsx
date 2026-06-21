import type { ElementType } from 'react';
import { Camera, Facebook, Instagram, Music2, Youtube } from 'lucide-react';

export type SupportedPlatform = 'instagram' | 'youtube' | 'tiktok' | 'facebook' | 'snapchat';

export const platformMeta: Record<SupportedPlatform, { label: string; color: string; icon: ElementType }> = {
  instagram: { label: 'Instagram', color: '#e1306c', icon: Instagram },
  youtube: { label: 'YouTube', color: '#ff0000', icon: Youtube },
  tiktok: { label: 'TikTok', color: '#010101', icon: Music2 },
  facebook: { label: 'Facebook', color: '#1877f2', icon: Facebook },
  snapchat: { label: 'Snapchat', color: '#fffc00', icon: Camera },
};

export const platformIcons = Object.fromEntries(
  Object.entries(platformMeta).map(([platform, meta]) => [platform, meta.icon]),
) as Record<SupportedPlatform, ElementType>;

export function getPlatformMeta(platform?: string | null) {
  const key = (platform || '').toLowerCase() as SupportedPlatform;
  return platformMeta[key] ?? null;
}

export function getPlatformIcon(platform?: string | null): ElementType {
  return getPlatformMeta(platform)?.icon ?? Camera;
}
