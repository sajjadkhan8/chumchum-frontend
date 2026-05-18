'use client';

import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles } from 'lucide-react';

interface CreatorTierBadgeProps {
  isAmbassador: boolean;
  className?: string;
}

export function CreatorTierBadge({ isAmbassador, className }: CreatorTierBadgeProps) {
  if (isAmbassador) {
    return (
      <Badge className={cn(
        'bg-gradient-to-r from-primary to-accent gap-1',
        className
      )}>
        <Crown className="h-3 w-3 fill-current" />
        Ambassador
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={cn('gap-1', className)}>
      <Sparkles className="h-3 w-3" />
      Independent
    </Badge>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

