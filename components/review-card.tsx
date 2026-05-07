'use client';

import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Review } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.brand.logo} alt={review.brand.name} />
              <AvatarFallback>{review.brand.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{review.brand.name}</p>
              <p className="text-xs text-muted-foreground">{review.brand.industry}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < review.rating ? 'fill-accent text-accent' : 'text-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative mt-4">
          <Quote className="absolute -left-1 -top-1 h-6 w-6 text-muted-foreground/20" />
          <p className="pl-5 text-sm leading-relaxed text-muted-foreground">
            {review.comment}
          </p>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {formatRelativeTime(review.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}
