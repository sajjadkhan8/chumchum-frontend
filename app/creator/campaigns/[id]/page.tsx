'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CampaignGoalBadge } from '@/components/campaign-goal-badge';
import { campaignsService } from '@/services/campaigns.service';
import type { BrandCampaign, BrandCampaignReactionType } from '@/types';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

const inputClass =
  'h-10 w-full rounded-xl border-[#cddad1] bg-[#fbfaf5] px-3.5 text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] shadow-none focus-visible:border-[#2d6b4e] focus-visible:ring-4 focus-visible:ring-[#2d6b4e]/8 focus-visible:ring-offset-0';

const locationLabel = (offer: BrandCampaign) => {
  const locationMode = offer.locationTargetingMode;
  const targetRegion = offer.targetRegion;
  const targetCities = offer.targetCities;

  if (locationMode === 'remote_only') return 'Remote / Online only';
  if (locationMode === 'region') return targetRegion || offer.targetCity || 'Region';
  if (locationMode === 'cities') return targetCities || offer.targetCity || 'Selected cities';
  return offer.targetCity || 'Nationwide';
};

export default function CreatorCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [offer, setOffer] = useState<BrandCampaign | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reactionType, setReactionType] = useState<BrandCampaignReactionType>('interested');
  const [message, setMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedDays, setProposedDays] = useState('');

  useEffect(() => {
    void campaignsService.getCreatorCampaign(params.id).then(setOffer).catch(() => setOffer(null));
  }, [params.id]);

  const openReaction = () => {
    setReactionType('interested');
    setMessage('');
    setProposedPrice('');
    setProposedDays('');
    setIsDialogOpen(true);
  };

  const submitReaction = async () => {
    if (!offer) return;

    if (reactionType === 'proposal' && (!proposedPrice.trim() || !proposedDays.trim())) {
      toast.error('A proposal requires a price and delivery timeline');
      return;
    }
    if ((reactionType === 'question' || reactionType === 'decline') && !message.trim()) {
      toast.error(reactionType === 'question' ? 'Please include your question' : 'Please provide a reason for declining');
      return;
    }

    setIsSubmitting(true);
    try {
      await campaignsService.reactToCampaign(offer.id, {
        reactionType: reactionType.toUpperCase() as Uppercase<BrandCampaignReactionType>,
        message: message || undefined,
        proposedPrice: proposedPrice ? Number(proposedPrice) : undefined,
        proposedDeliveryDays: proposedDays ? Number(proposedDays) : undefined,
      });
      toast.success('Reaction submitted to brand');
      setIsDialogOpen(false);
      router.push('/creator/campaigns/reactions');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit reaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!offer) {
    return (
      <div className="container mx-auto p-4 pb-6 md:p-6">
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Campaign not available.</CardContent></Card>
      </div>
    );
  }

  const canReact = offer.status === 'published';

  return (
    <div className="container mx-auto p-4 pb-6 md:p-6 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{offer.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{offer.brandName} • {offer.offerType}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge>{offer.status}</Badge>
              {canReact && (
                <button
                  onClick={openReaction}
                  className="rounded-full bg-[#2d6b4e] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
                >
                  React
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{offer.brief}</p>
          <p><span className="font-medium">Budget:</span> {formatPrice(offer.budgetMin)} - {formatPrice(offer.budgetMax)} {offer.currency}</p>
          {offer.campaignGoal ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Campaign goal:</span>
              <CampaignGoalBadge goal={offer.campaignGoal} />
            </div>
          ) : null}
          {offer.targetPlatforms ? <p><span className="font-medium">Platforms:</span> {offer.targetPlatforms}</p> : null}
          {offer.contentFormats ? <p><span className="font-medium">Formats:</span> {offer.contentFormats}</p> : null}
          {offer.deliverables ? <p><span className="font-medium">Deliverables:</span> {offer.deliverables}</p> : null}
          {offer.keyMessage ? <p><span className="font-medium">Key message:</span> {offer.keyMessage}</p> : null}
          {offer.dosAndDonts ? <p><span className="font-medium">Do&apos;s and don&apos;ts:</span> {offer.dosAndDonts}</p> : null}
          {offer.hashtagsMentions ? <p><span className="font-medium">Hashtags &amp; mentions:</span> {offer.hashtagsMentions}</p> : null}
          {offer.referenceUrls ? <p><span className="font-medium">Reference content:</span> {offer.referenceUrls}</p> : null}
          {offer.usageRights ? <p><span className="font-medium">Usage rights:</span> {offer.usageRights}</p> : null}
          {offer.termsAndConditions ? <p><span className="font-medium">Terms &amp; conditions:</span> {offer.termsAndConditions}</p> : null}
          {offer.expectedOutcomes ? <p><span className="font-medium">Expected outcomes:</span> {offer.expectedOutcomes}</p> : null}
          <p><span className="font-medium">Target:</span> {locationLabel(offer)} • {offer.targetLanguage || 'Any language'}</p>
          {offer.customScreeningQuestions ? (
            <div className="rounded-xl border border-[#e8f0ec] bg-[#f4f8f5] p-3">
              <p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-[#185c39]">Screening Questions</p>
              <p className="whitespace-pre-line text-sm text-[#3a5244]">{offer.customScreeningQuestions}</p>
            </div>
          ) : null}
          {offer.minProposedPrice ? <p><span className="font-medium">Minimum price:</span> {offer.minProposedPrice.toLocaleString()} {offer.currency}</p> : null}
          {offer.goLiveDate ? <p><span className="font-medium">Expected go-live:</span> {offer.goLiveDate}</p> : null}
          {offer.contentSubmissionDeadline ? <p><span className="font-medium">Content submission by:</span> {offer.contentSubmissionDeadline}</p> : null}
          {offer.campaignDuration ? <p><span className="font-medium">Campaign duration:</span> {offer.campaignDuration} days</p> : null}
          <p><span className="font-medium">Deadline:</span> {offer.deadlineDate || 'Open'}</p>
        </CardContent>
      </Card>

      {/* Reaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg overflow-hidden rounded-[1.6rem] p-0">
          <DialogHeader className="bg-[#1e3d2e] px-6 py-5">
            <DialogTitle className="text-white">React to Campaign</DialogTitle>
            <p className="mt-0.5 text-sm text-[#87b49a]">{offer.title}</p>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Reaction Type</p>
              <div className="flex flex-wrap gap-2">
                {(['interested', 'proposal', 'question', 'decline'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setReactionType(type)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition-colors capitalize ${
                      reactionType === type
                        ? 'bg-[#2d6b4e] text-white'
                        : 'border border-[#d1ddd6] bg-white text-[#6b7870] hover:bg-[#e6eceb]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Message</p>
              <Textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your approach, pitch, or question"
                className="resize-none rounded-xl border-[#cddad1] bg-[#fbfaf5] text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] focus-visible:border-[#2d6b4e] focus-visible:ring-4 focus-visible:ring-[#2d6b4e]/8 focus-visible:ring-offset-0"
              />
            </div>

            {reactionType === 'proposal' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Proposed Price (PKR)</p>
                  <Input
                    type="number"
                    min={0}
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className={inputClass}
                  />
                  {offer.minProposedPrice && (
                    <p className="mt-1 text-[11px] text-[#87938b]">
                      Minimum bid: PKR {offer.minProposedPrice.toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Delivery Days</p>
                  <Input
                    type="number"
                    min={1}
                    value={proposedDays}
                    onChange={(e) => setProposedDays(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-full border border-[#d1ddd6] bg-white px-5 py-2 text-sm font-bold text-[#6b7870] transition-colors hover:bg-[#e6eceb]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitReaction()}
                disabled={isSubmitting}
                className="rounded-full bg-[#2d6b4e] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1f5239] disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Reaction'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
