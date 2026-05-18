'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Star, Clock, Gift, TrendingUp, Zap, Instagram, Youtube, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { PlatformAmbassador } from '@/types';
import { cn, formatFollowers, formatPrice } from '@/lib/utils';

interface AmbassadorCardProps {
  ambassador: PlatformAmbassador;
  onContact?: () => void;
  className?: string;
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
};

export function AmbassadorCard({ ambassador, onContact, className }: AmbassadorCardProps) {
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
          className
        )}
      >
        {/* Premium Badge */}
        <div className="absolute right-3 top-3 z-10">
          <Badge className="bg-primary/90 text-[11px] text-primary-foreground backdrop-blur-sm">
            <Crown className="mr-1 h-3 w-3" />
            Ambassador
          </Badge>
        </div>

        <CardContent className="p-0">
          {/* Image Section */}
          <div className="relative aspect-[16/11] overflow-hidden sm:aspect-[4/3]">
            <Image
              src={ambassador.contentPreviews[0]?.thumbnail || ambassador.avatar}
              alt={ambassador.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Creator Info Overlay */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3">
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-9 w-9 border-2 border-white sm:h-10 sm:w-10">
                    <AvatarImage src={ambassador.avatar} alt={ambassador.name} />
                    <AvatarFallback>{ambassador.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="line-clamp-1 text-sm font-semibold text-white sm:text-base">{ambassador.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-white/80">
                      <MapPin className="h-3 w-3" />
                      {ambassador.city}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-3 p-3.5 sm:p-4">
            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2.5">
                {/* Platforms */}
                <div className="flex items-center gap-1">
                  {ambassador.platforms.slice(0, 3).map((platform) => {
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
                <span className="text-xs font-medium sm:text-sm">{formatFollowers(ambassador.totalFollowers)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-medium">{ambassador.rating}</span>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-1">
              {ambassador.categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="secondary" className="rounded-full text-xs">
                  {category}
                </Badge>
              ))}
            </div>

            {/* Engagement & Response */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{ambassador.avgEngagementRate}% engagement</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {ambassador.responseTime}
              </div>
            </div>

            {/* Ambassador Info */}
            <div className="border-t border-border pt-3">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span>Monthly: {formatPrice(ambassador.monthlyBase || 50000)}</span>
                </div>
                {ambassador.isExclusive && (
                  <div className="flex items-center gap-2">
                    <Crown className="h-3.5 w-3.5 text-primary" />
                    <span>Exclusive Partner</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid w-full grid-cols-2 gap-2 border-t border-border pt-3">
              <Link href={`/creator/${ambassador.username}`}>
                <Button size="sm" variant="outline" className="w-full min-h-10">
                  View
                </Button>
              </Link>
              <Button
                size="sm"
                className="min-h-10"
                onClick={onContact}
              >
                Contact
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

