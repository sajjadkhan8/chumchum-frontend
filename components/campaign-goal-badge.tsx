import { Badge } from '@/components/ui/badge';
import { getCampaignGoalMeta } from '@/lib/offer-campaign-goals';
import { cn } from '@/lib/utils';

interface CampaignGoalBadgeProps {
  goal?: string | null;
  className?: string;
}

export function CampaignGoalBadge({ goal, className }: CampaignGoalBadgeProps) {
  const meta = getCampaignGoalMeta(goal);

  if (!meta) return null;

  return (
    <Badge
      variant="outline"
      className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium', meta.badgeClassName, className)}
    >
      {meta.goal}
    </Badge>
  );
}

