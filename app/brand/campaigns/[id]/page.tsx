'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignGoalBadge } from '@/components/campaign-goal-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { campaignsService } from '@/services/campaigns.service';
import {
  campaignAlertsService,
  type CampaignAlertRule,
  type AlertRuleType,
  ALERT_TYPE_LABELS,
  ALERT_TYPE_UNITS,
} from '@/services/campaign-alerts.service';
import type { BrandCampaign, BrandCampaignReaction, BrandCampaignStatus } from '@/types';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

const statusActions: Partial<Record<BrandCampaignStatus, Array<{ label: string; next: Uppercase<BrandCampaignStatus> }>>> = {
  draft: [{ label: 'Publish', next: 'PUBLISHED' }],
  published: [
    { label: 'Pause', next: 'PAUSED' },
    { label: 'Close', next: 'CLOSED' },
  ],
  paused: [
    { label: 'Re-publish', next: 'PUBLISHED' },
    { label: 'Close', next: 'CLOSED' },
  ],
  closed: [{ label: 'Archive', next: 'ARCHIVED' }],
};

const ALL_STATUSES_VALUE = '__all_statuses__';
const ALL_TYPES_VALUE = '__all_types__';

const locationLabel = (campaign: BrandCampaign) => {
  if (campaign.locationTargetingMode === 'remote_only') return 'Remote / Online only';
  if (campaign.locationTargetingMode === 'region') return campaign.targetRegion || campaign.targetCity || 'Region';
  if (campaign.locationTargetingMode === 'cities') return campaign.targetCities || campaign.targetCity || 'Selected cities';
  return campaign.targetCity || 'Nationwide';
};

export default function BrandCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campaignId = params.id;

  const [campaign, setCampaign] = useState<BrandCampaign | null>(null);
  const [reactions, setReactions] = useState<BrandCampaignReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // inbox filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [reactionPage, setReactionPage] = useState(0);
  const [reactionTotalPages, setReactionTotalPages] = useState(1);

  const [actioningReactionId, setActioningReactionId] = useState<string | null>(null);
  const [reactionNotes, setReactionNotes] = useState<Record<string, string>>({});
  const [isDuplicating, setIsDuplicating] = useState(false);

  const [alertRules, setAlertRules] = useState<CampaignAlertRule[]>([]);
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [newAlertType, setNewAlertType] = useState<AlertRuleType>('reaction_threshold');
  const [newAlertThreshold, setNewAlertThreshold] = useState('');
  const [isSavingAlert, setIsSavingAlert] = useState(false);

  const loadCampaign = useCallback(async () => {
    const result = await campaignsService.getBrandCampaign(campaignId).catch(() => null);
    setCampaign(result);
  }, [campaignId]);

  const loadReactions = useCallback(async (nextPage = 0, append = false) => {
    const result = await campaignsService.getCampaignReactions(campaignId, {
      status: statusFilter || undefined,
      reactionType: typeFilter || undefined,
      page: nextPage,
      size: 20,
    }).catch(() => ({ content: [], totalElements: 0, totalPages: 1, last: true }));
    setReactions(append ? (prev) => [...prev, ...result.content] : result.content);
    setReactionTotalPages(result.totalPages);
    setReactionPage(nextPage);
  }, [campaignId, statusFilter, typeFilter]);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      await Promise.all([loadCampaign(), loadReactions(0)]);
      campaignAlertsService.getAlertRules(campaignId).then(setAlertRules).catch((error) => {
        toast.error(error instanceof Error ? error.message : 'Could not load campaign alerts');
      });
      setIsLoading(false);
    };
    void run();
  }, [loadCampaign, loadReactions]);

  const reactionCounts = useMemo(() => {
    return reactions.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }, [reactions]);

  const onStatusChange = async (next: Uppercase<BrandCampaignStatus>) => {
    try {
      const updated = await campaignsService.updateCampaignStatus(campaignId, next);
      setCampaign(updated);
      toast.success('Campaign status updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const onReactionAction = async (reactionId: string, action: 'SHORTLIST' | 'REVIEW' | 'ACCEPT' | 'REJECT') => {
    setActioningReactionId(reactionId);
    try {
      const updated = await campaignsService.actionReaction(campaignId, reactionId, action, reactionNotes[reactionId]);
      setReactions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(
        action === 'ACCEPT' && updated.orderId
          ? 'Proposal accepted and order created'
          : `Reaction ${action.toLowerCase()}ed`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update reaction');
    } finally {
      setActioningReactionId(null);
    }
  };

  const onDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const cloned = await campaignsService.cloneCampaign(campaignId);
      toast.success('Campaign duplicated — redirecting to edit…');
      router.push(`/brand/campaigns/${cloned.id}/edit`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate campaign');
    } finally {
      setIsDuplicating(false);
    }
  };

  const onAddAlert = async () => {
    const n = Number(newAlertThreshold);
    if (!newAlertThreshold || isNaN(n) || n <= 0) return;
    setIsSavingAlert(true);
    try {
      const created = await campaignAlertsService.createAlertRule(campaignId, {
        type: newAlertType,
        threshold: n,
      });
      setAlertRules((prev) => [...prev, created]);
      setIsAddingAlert(false);
      setNewAlertThreshold('');
      toast.success('Alert rule added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add alert');
    } finally {
      setIsSavingAlert(false);
    }
  };

  const onToggleAlert = async (rule: CampaignAlertRule) => {
    try {
      const updated = await campaignAlertsService.toggleAlertRule(campaignId, rule.id, !rule.isActive);
      setAlertRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      toast.error('Failed to update alert');
    }
  };

  const onDeleteAlert = async (ruleId: string) => {
    try {
      await campaignAlertsService.deleteAlertRule(campaignId, ruleId);
      setAlertRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast.success('Alert removed');
    } catch {
      toast.error('Failed to delete alert');
    }
  };

  if (isLoading || !campaign) {
    return (
      <div className="container mx-auto p-4 pb-6 md:p-6">
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Loading campaign…</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-6 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{campaign.title}</h1>
          <p className="text-sm text-muted-foreground">{campaign.offerType} • Updated {formatRelativeTime(campaign.updatedAt)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/brand/campaigns')}>Back</Button>
          <Button variant="outline" asChild>
            <Link href={`/brand/campaigns/${campaign.id}/edit`}>Edit Campaign</Link>
          </Button>
          <Button variant="outline" disabled={isDuplicating} onClick={() => void onDuplicate()}>
            {isDuplicating ? 'Duplicating…' : 'Duplicate'}
          </Button>
          {statusActions[campaign.status]?.map((entry) => (
            <Button key={entry.next} onClick={() => void onStatusChange(entry.next)}>{entry.label}</Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Campaign Brief</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{campaign.brief}</p>
            <p><span className="font-medium">Budget:</span> {formatPrice(campaign.budgetMin)} – {formatPrice(campaign.budgetMax)} {campaign.currency}</p>
            {campaign.campaignGoal ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Campaign goal:</span>
                <CampaignGoalBadge goal={campaign.campaignGoal} />
              </div>
            ) : null}
            {campaign.targetPlatforms ? <p><span className="font-medium">Platforms:</span> {campaign.targetPlatforms}</p> : null}
            {campaign.contentFormats ? <p><span className="font-medium">Formats:</span> {campaign.contentFormats}</p> : null}
            {campaign.deadlineDate ? <p><span className="font-medium">Deadline:</span> {campaign.deadlineDate}</p> : null}
            {campaign.deliverables ? <p><span className="font-medium">Deliverables:</span> {campaign.deliverables}</p> : null}
            {campaign.keyMessage ? <p><span className="font-medium">Key message:</span> {campaign.keyMessage}</p> : null}
            {campaign.dosAndDonts ? <p><span className="font-medium">Do's and don'ts:</span> {campaign.dosAndDonts}</p> : null}
            {campaign.hashtagsMentions ? <p><span className="font-medium">Hashtags & mentions:</span> {campaign.hashtagsMentions}</p> : null}
            {campaign.referenceUrls ? <p><span className="font-medium">Reference content:</span> {campaign.referenceUrls}</p> : null}
            {campaign.usageRights ? <p><span className="font-medium">Usage rights:</span> {campaign.usageRights}</p> : null}
            {campaign.termsAndConditions ? <p><span className="font-medium">Terms & conditions:</span> {campaign.termsAndConditions}</p> : null}
            {campaign.expectedOutcomes ? <p><span className="font-medium">Expected outcomes:</span> {campaign.expectedOutcomes}</p> : null}
            {campaign.customScreeningQuestions ? (
              <div className="rounded-xl border border-[#e8f0ec] bg-[#f4f8f5] p-3">
                <p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-[#185c39]">Screening Questions</p>
                <p className="whitespace-pre-line text-[#3a5244]">{campaign.customScreeningQuestions}</p>
              </div>
            ) : null}
            {campaign.minProposedPrice ? <p><span className="font-medium">Minimum proposed price:</span> {campaign.minProposedPrice.toLocaleString()} {campaign.currency}</p> : null}
            {campaign.goLiveDate ? <p><span className="font-medium">Go-live date:</span> {campaign.goLiveDate}</p> : null}
            {campaign.contentSubmissionDeadline ? <p><span className="font-medium">Content submission deadline:</span> {campaign.contentSubmissionDeadline}</p> : null}
            {campaign.campaignDuration ? <p><span className="font-medium">Campaign duration:</span> {campaign.campaignDuration} days</p> : null}
            <p><span className="font-medium">Target:</span> {locationLabel(campaign)} • {campaign.targetLanguage || 'Any language'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Responses</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Total:</span> {reactions.length}</p>
            <p>Submitted: {reactionCounts.submitted || 0}</p>
            <p>Shortlisted: {reactionCounts.shortlisted || 0}</p>
            <p>In Review: {reactionCounts.in_review || 0}</p>
            <p>Accepted: {reactionCounts.accepted || 0}</p>
            <p>Rejected: {reactionCounts.rejected || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Reaction inbox */}
      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Creator Reactions</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter || ALL_STATUSES_VALUE} onValueChange={(v) => setStatusFilter(v === ALL_STATUSES_VALUE ? '' : v)}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUSES_VALUE}>All statuses</SelectItem>
                  {['SUBMITTED', 'SHORTLISTED', 'IN_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter || ALL_TYPES_VALUE} onValueChange={(v) => setTypeFilter(v === ALL_TYPES_VALUE ? '' : v)}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_TYPES_VALUE}>All types</SelectItem>
                  {['INTERESTED', 'PROPOSAL', 'QUESTION', 'DECLINE'].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="h-8" onClick={() => void loadReactions(0)}>Apply</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reactions match your filters yet.</p>
          ) : (
            <>
              <div className="space-y-4">
                {reactions.map((reaction) => (
                  <div key={reaction.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Link className="font-medium hover:underline" href={`/creator/${reaction.creatorId}`}>
                        {reaction.creatorName}
                      </Link>
                      <Badge variant="secondary">{reaction.reactionType}</Badge>
                      <Badge>{reaction.status.replace('_', ' ')}</Badge>
                    </div>
                    {reaction.message ? <p className="text-sm text-muted-foreground">{reaction.message}</p> : null}
                    {(reaction.proposedPrice || reaction.proposedDeliveryDays) ? (
                      <p className="mt-2 text-sm">
                        Proposal: {reaction.proposedPrice ? `${formatPrice(reaction.proposedPrice)} ${reaction.proposedCurrency}` : 'N/A'}
                        {' '}&bull;{' '}
                        {reaction.proposedDeliveryDays ? `${reaction.proposedDeliveryDays} days` : 'No timeline'}
                      </p>
                    ) : null}
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Textarea
                        rows={2}
                        placeholder="Optional note for creator"
                        value={reactionNotes[reaction.id] || ''}
                        onChange={(event) => setReactionNotes((prev) => ({ ...prev, [reaction.id]: event.target.value }))}
                      />
                      <div className="flex flex-wrap gap-2">
                        {reaction.orderId ? (
                          <Button size="sm" asChild>
                            <Link href={`/brand/orders?orderId=${reaction.orderId}`}>View Order</Link>
                          </Button>
                        ) : null}
                        {!['accepted', 'rejected', 'withdrawn'].includes(reaction.status) ? (
                          <>
                            <Button size="sm" variant="outline" disabled={actioningReactionId === reaction.id} onClick={() => void onReactionAction(reaction.id, 'SHORTLIST')}>Shortlist</Button>
                            <Button size="sm" variant="outline" disabled={actioningReactionId === reaction.id} onClick={() => void onReactionAction(reaction.id, 'REVIEW')}>Review</Button>
                            {['interested', 'proposal'].includes(reaction.reactionType) ? (
                              <Button size="sm" disabled={actioningReactionId === reaction.id} onClick={() => void onReactionAction(reaction.id, 'ACCEPT')}>Accept & Create Order</Button>
                            ) : null}
                            <Button size="sm" variant="destructive" disabled={actioningReactionId === reaction.id} onClick={() => void onReactionAction(reaction.id, 'REJECT')}>Reject</Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {reactionPage < reactionTotalPages - 1 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" onClick={() => void loadReactions(reactionPage + 1, true)}>
                    Load more reactions
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Alert Rules */}
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-[#b77a12]" /> Alert Rules
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setIsAddingAlert((v) => !v)}>
              <Plus className="mr-1.5 size-4" /> Add alert
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isAddingAlert ? (
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#e8f0ec] bg-[#f4f8f5] p-3">
              <div className="min-w-[180px] flex-1 space-y-1">
                <label className="text-xs font-bold text-[#526259]">Alert type</label>
                <Select
                  value={newAlertType}
                  onValueChange={(v) => setNewAlertType(v as AlertRuleType)}
                >
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ALERT_TYPE_LABELS) as AlertRuleType[]).map((t) => (
                      <SelectItem key={t} value={t}>{ALERT_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28 space-y-1">
                <label className="text-xs font-bold text-[#526259]">
                  Threshold ({ALERT_TYPE_UNITS[newAlertType]})
                </label>
                <input
                  type="number"
                  onWheel={(event) => event.currentTarget.blur()}
                  min="1"
                  value={newAlertThreshold}
                  onChange={(e) => setNewAlertThreshold(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#185c39]"
                  placeholder="e.g. 10"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={isSavingAlert || !newAlertThreshold} onClick={() => void onAddAlert()}>
                  {isSavingAlert ? 'Saving…' : 'Save'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsAddingAlert(false); setNewAlertThreshold(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          {alertRules.length === 0 && !isAddingAlert ? (
            <p className="text-sm text-muted-foreground">
              No alert rules yet. Add one to get notified when this campaign hits key thresholds.
            </p>
          ) : null}

          {alertRules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#e1e6df] bg-[#fbfaf5] p-3"
            >
              <div className="flex items-center gap-3">
                <Bell className={`size-4 shrink-0 ${rule.isActive ? 'text-[#b77a12]' : 'text-[#c5cdc8]'}`} />
                <div>
                  <p className="text-sm font-extrabold text-[#173b2a]">
                    {ALERT_TYPE_LABELS[rule.type]} {rule.threshold} {ALERT_TYPE_UNITS[rule.type]}
                  </p>
                  <p className="text-xs text-[#9ba8a1]">
                    {rule.lastTriggeredAt
                      ? `Last triggered ${new Date(rule.lastTriggeredAt).toLocaleDateString('en-PK')}`
                      : 'Not yet triggered'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void onToggleAlert(rule)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.isActive ? 'bg-[#185c39]' : 'bg-[#d1ddd6]'}`}
                  aria-label={rule.isActive ? 'Disable alert' : 'Enable alert'}
                >
                  <span className={`inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform ${rule.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <button
                  onClick={() => void onDeleteAlert(rule.id)}
                  className="grid size-7 place-items-center rounded-lg text-[#9ba8a1] hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
