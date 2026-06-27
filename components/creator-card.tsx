'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Clock, Gift, TrendingUp, Zap, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Creator } from '@/types';
import { cn, formatFollowers, formatPrice } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { CreatorAmbassadorBadge } from '@/components/creator-ambassador-badge';
import { CreatorTrustBadge } from '@/components/creator-trust-badge';
import { PlatformIconBadge } from '@/components/platform-icons';
import { getCategoryLabel } from '@/lib/categories';

interface CreatorCardProps {
  creator: Creator;
  onQuickDeal?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'horizontal';
}

const CREATOR_CARD_FALLBACK_IMAGE = '/creator-card-fallback.svg';

export function CreatorCard({ creator, onQuickDeal, className, variant = 'default' }: CreatorCardProps) {
  const { user, savedCreators, toggleSavedCreator } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const preferredImage = creator.contentPreviews[0]?.thumbnail || creator.coverImage || creator.avatar || CREATOR_CARD_FALLBACK_IMAGE;
  const [imageSrc, setImageSrc] = useState(preferredImage);
  const canSendDeal = !user || user.role === 'brand';
  const canSaveCreator = user?.role === 'brand';
  const isSaved = savedCreators.includes(creator.id);

  useEffect(() => {
    setImageSrc(preferredImage);
  }, [preferredImage]);

  const handleSaveToggle = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsSaving(true);
    try {
      await toggleSavedCreator(creator.id);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group relative overflow-hidden rounded-2xl border-2 border-[#dce8e2] bg-white transition-colors duration-200 hover:border-[#2d6b4e]/45',
          variant === 'horizontal' && 'md:max-w-none',
          className
        )}
        style={{ boxShadow: '0 2px 8px rgba(30,61,46,0.07), 0 1px 2px rgba(30,61,46,0.04)' }}
      >
        <div className="absolute left-0 top-0 h-[3px] w-full rounded-t-2xl bg-gradient-to-r from-[#2d6b4e]/55 via-[#e6aa38]/50 to-transparent" />
        <CardContent className="p-0">
          <div className="relative h-20 overflow-hidden bg-[#e8f0ec] sm:h-24">
            <Image
              src={imageSrc}
              alt=""
              fill
              className="object-cover"
              sizes="(min-width: 1280px) 320px, (min-width: 640px) 50vw, 100vw"
              onError={() => {
                setImageSrc((current) => {
                  if (current !== creator.coverImage && creator.coverImage) return creator.coverImage;
                  if (current !== creator.avatar && creator.avatar) return creator.avatar;
                  return CREATOR_CARD_FALLBACK_IMAGE;
                });
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1e3d2e]/72 via-[#1e3d2e]/18 to-transparent" />
            {canSaveCreator && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-3 top-3 size-9 rounded-xl border border-white/50 bg-white/92 text-[#496159] shadow-sm hover:bg-white hover:text-[#1e3d2e]"
                disabled={isSaving}
                onClick={handleSaveToggle}
                aria-label={isSaved ? 'Remove saved creator' : 'Save creator'}
              >
                <Heart className={cn('size-4', isSaved && 'fill-[#e6aa38] text-[#b77a12]')} />
              </Button>
            )}
          </div>
          <div className={cn('p-4 sm:p-5', variant === 'compact' && 'p-4')}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="-mt-9 size-14 shrink-0 border-4 border-white bg-[#e8f0ec] shadow-sm">
                  <AvatarImage src={creator.avatar || undefined} alt={creator.name} />
                  <AvatarFallback className="bg-[#e8f0ec] text-sm font-extrabold text-[#2d6b4e]">
                    {creator.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="line-clamp-1 text-[15px] font-extrabold tracking-tight text-[#1e3d2e]">{creator.name}</h3>
                  <div className="mt-1 flex min-w-0 items-center gap-1 text-[11px] font-semibold text-[#87938b]">
                    <MapPin className="size-3.5 shrink-0 text-[#b77a12]" />
                    <span className="truncate">{creator.city ?? 'Pakistan'}</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-start gap-2">
                <span className="rounded-full bg-[#fdf8ec] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#b77a12]">
                  Creator
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <CreatorTrustBadge
                level={creator.badgeLevel}
                isVerified={creator.isVerified}
                compact
                className="border-sky-300 bg-white text-sky-800 shadow-sm"
              />
              <CreatorAmbassadorBadge creator={creator} className="shadow-sm" />
              {creator.isTrending && (
                <Badge className="rounded-full border border-[#d6eadf] bg-[#e8f0ec] px-2 py-0.5 text-[10px] font-extrabold text-[#2d6b4e] shadow-none">
                  <TrendingUp className="mr-1 size-3" />
                  Trending
                </Badge>
              )}
              {(creator.activeOrderCount ?? 0) >= 3 &&
                creator.availabilityStatus !== 'UNAVAILABLE' &&
                creator.availabilityStatus !== 'ON_VACATION' && (
                  <Badge className="rounded-full border border-[#efcf83] bg-[#fff1cd] px-2 py-0.5 text-[10px] font-extrabold text-[#8b5e12] shadow-none">
                    Limited
                  </Badge>
                )}
              {creator.collaborationPreferences.includes('barter') && (
                <Badge className="rounded-full border border-[#efcf83] bg-[#fff1cd] px-2 py-0.5 text-[10px] font-extrabold text-[#8b5e12] shadow-none">
                  <Gift className="mr-1 size-3" />
                  Barter
                </Badge>
              )}
              {creator.isFastResponder && (
                <Badge className="rounded-full border border-[#dce8e2] bg-[#fbfaf5] px-2 py-0.5 text-[10px] font-extrabold text-[#496159] shadow-none">
                  <Zap className="mr-1 size-3" />
                  Fast
                </Badge>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-2.5 py-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#7a9a87]">Reach</p>
                <p className="mt-1 truncate text-[13px] font-extrabold text-[#1e3d2e]">{formatFollowers(creator.totalFollowers)}</p>
              </div>
              <div className="rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-2.5 py-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#7a9a87]">Rating</p>
                <p className="mt-1 flex items-center gap-1 text-[13px] font-extrabold text-[#1e3d2e]">
                  <Star className="size-3 fill-[#e6aa38] text-[#e6aa38]" />
                  {creator.rating}
                </p>
              </div>
              <div className="rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-2.5 py-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#7a9a87]">Eng.</p>
                <p className="mt-1 truncate text-[13px] font-extrabold text-[#1e3d2e]">{creator.avgEngagementRate}%</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {creator.categories.slice(0, 3).map((category) => (
                <span key={category} className="rounded-full bg-[#e8f0ec] px-2.5 py-1 text-[10px] font-bold text-[#2d6b4e]">
                  {getCategoryLabel(category)}
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-semibold text-[#87938b]">
              <div className="flex min-w-0 items-center gap-1.5">
                <Clock className="size-3.5 shrink-0 text-[#b77a12]" />
                <span className="truncate">{creator.responseTime}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {creator.platforms.slice(0, 4).map((platform) => (
                  <PlatformIconBadge
                    key={platform.platform}
                    platform={platform.platform}
                    size="sm"
                    title={`${platform.platform}: ${formatFollowers(platform.followers)}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[#edf1ed] pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                {creator.collaborationPreferences.includes('paid') && creator.minPrice && (
                  <p className="truncate text-[14px] font-extrabold text-[#1e3d2e]">
                    From {formatPrice(creator.minPrice)}
                  </p>
                )}
                {creator.collaborationPreferences.includes('barter') && !creator.minPrice && (
                  <p className="truncate text-[14px] font-extrabold text-[#2d6b4e]">
                    Barter Available
                  </p>
                )}
                {creator.collaborationPreferences.includes('barter') && creator.minPrice && (
                  <p className="mt-0.5 text-[10px] font-semibold text-[#87938b]">
                    Barter also available
                  </p>
                )}
              </div>
              
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                {canSendDeal && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-9 rounded-xl border-[#d1ddd6] bg-white px-3 text-[12px] font-extrabold text-[#2d6b4e] hover:bg-[#e8f0ec]"
                    onClick={(e) => {
                      e.preventDefault();
                      onQuickDeal?.();
                    }}
                  >
                    Quick Deal
                  </Button>
                )}
                <Link href={`/creator/${creator.username}`}>
                  <Button size="sm" className="min-h-9 w-full rounded-xl bg-[#2d6b4e] px-3 text-[12px] font-extrabold text-white hover:bg-[#1f5239]">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
