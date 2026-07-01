import type { CSSProperties, ElementType } from 'react';
import { Camera, Facebook, Instagram, Music2, Youtube } from 'lucide-react';

export type SupportedPlatform = 'instagram' | 'youtube' | 'tiktok' | 'facebook' | 'snapchat';

export const platformMeta: Record<SupportedPlatform, { label: string; color: string; icon: ElementType; iconColor?: string; backgroundColor?: string }> = {
  instagram: { label: 'Instagram', color: '#e1306c', icon: Instagram },
  youtube: { label: 'YouTube', color: '#ff0000', icon: Youtube },
  tiktok: { label: 'TikTok', color: '#010101', icon: Music2 },
  facebook: { label: 'Facebook', color: '#1877f2', icon: Facebook },
  snapchat: { label: 'Snapchat', color: '#fffc00', icon: Camera, iconColor: '#111827', backgroundColor: '#fffc00' },
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

const badgeSizeClasses = {
  xs: { wrapper: 'size-5 rounded-md', icon: 'size-3' },
  sm: { wrapper: 'size-6 rounded-lg', icon: 'size-3.5' },
  md: { wrapper: 'size-9 rounded-xl', icon: 'size-4' },
  lg: { wrapper: 'size-10 rounded-xl', icon: 'size-5' },
} as const;

interface PlatformIconBadgeProps {
  platform?: string | null;
  className?: string;
  iconClassName?: string;
  fallbackColor?: string;
  fallbackIcon?: ElementType;
  size?: keyof typeof badgeSizeClasses;
  title?: string;
}

export function PlatformIconBadge({
  platform,
  className = '',
  iconClassName = '',
  fallbackColor = '#2d6b4e',
  fallbackIcon: FallbackIcon = Camera,
  size = 'md',
  title,
}: PlatformIconBadgeProps) {
  const meta = getPlatformMeta(platform);
  const Icon = meta?.icon ?? FallbackIcon;
  const color = meta?.color ?? fallbackColor;
  const backgroundColor = meta?.backgroundColor ?? `${color}18`;
  const iconColor = meta?.iconColor ?? color;
  const classes = badgeSizeClasses[size];

  return (
    <span
      className={`grid shrink-0 place-items-center ${classes.wrapper} ${className}`.trim()}
      style={{ background: backgroundColor } as CSSProperties}
      title={title}
    >
      <Icon className={`${classes.icon} ${iconClassName}`.trim()} style={{ color: iconColor }} />
    </span>
  );
}
