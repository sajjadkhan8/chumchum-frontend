'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Star, Clock, Gift, TrendingUp, Zap, Instagram, Youtube } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Creator } from '@/types';
import { cn, formatFollowers, formatPrice } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

interface CreatorCardProps {
  creator: Creator;
  onQuickDeal?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'horizontal';
}

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  tiktok: TikTokIcon,
  youtube: Youtube,
  facebook: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
};

export function CreatorCard({ creator, onQuickDeal, className, variant = 'default' }: CreatorCardProps) {
  const { user } = useAuthStore();
  const canSendDeal = !user || user.role === 'brand';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group overflow-hidden rounded-2xl border-border/50 shadow-sm transition-shadow hover:shadow-lg',
          variant === 'horizontal' && 'md:flex',
          className
        )}
      >
        <CardContent className="p-0">
          {/* Image Section */}
          <div
            className={cn(
              'relative aspect-[4/3] overflow-hidden',
              variant === 'horizontal' && 'md:h-full md:w-56 md:shrink-0'
            )}
          >
            <Image
              src={creator.contentPreviews[0]?.thumbnail || creator.avatar}
              alt={creator.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Badges */}
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {creator.isTrending && (
                <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Trending
                </Badge>
              )}
              {creator.dealTypes.includes('barter') && (
                <Badge className="bg-accent/90 text-accent-foreground backdrop-blur-sm">
                  <Gift className="mr-1 h-3 w-3" />
                  Barter
                </Badge>
              )}
              {creator.isFastResponder && (
                <Badge variant="secondary" className="backdrop-blur-sm">
                  <Zap className="mr-1 h-3 w-3" />
                  Fast
                </Badge>
              )}
            </div>

            {/* Creator Info Overlay */}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10 border-2 border-white">
                    <AvatarImage src={creator.avatar} alt={creator.name} />
                    <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white text-balance">{creator.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-white/80">
                      <MapPin className="h-3 w-3" />
                      {creator.city}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className={cn('space-y-3 p-4', variant === 'compact' && 'space-y-2')}>
            {/* Stats Row */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                {/* Platforms */}
                <div className="flex items-center gap-1">
                  {creator.platforms.slice(0, 3).map((platform) => {
                    const Icon = platformIcons[platform.platform];
                    return (
                      <div
                        key={platform.platform}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-muted"
                        title={`${platform.platform}: ${formatFollowers(platform.followers)}`}
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    );
                  })}
                </div>
                <span className="font-medium">{formatFollowers(creator.totalFollowers)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-medium">{creator.rating}</span>
                <span className="text-muted-foreground">({creator.totalReviews})</span>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-1">
              {creator.categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="secondary" className="rounded-full text-xs">
                  {category}
                </Badge>
              ))}
            </div>

            {/* Engagement & Response */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{creator.avgEngagementRate}% engagement</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {creator.responseTime}
              </div>
            </div>

            {/* Pricing */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div>
                {creator.dealTypes.includes('paid') && creator.minPrice && (
                  <p className="font-semibold text-foreground">
                    From {formatPrice(creator.minPrice)}
                  </p>
                )}
                {creator.dealTypes.includes('barter') && !creator.minPrice && (
                  <p className="font-semibold text-primary">
                    <Gift className="mr-1 inline h-4 w-4" />
                    Barter Available
                  </p>
                )}
                {creator.dealTypes.includes('barter') && creator.minPrice && (
                  <p className="text-xs text-muted-foreground">
                    <Gift className="mr-1 inline h-3 w-3" />
                    Barter also available
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                {canSendDeal && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      onQuickDeal?.();
                    }}
                  >
                    Quick Deal
                  </Button>
                )}
                <Link href={`/creator/${creator.username}`}>
                  <Button size="sm" className="rounded-full">
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
