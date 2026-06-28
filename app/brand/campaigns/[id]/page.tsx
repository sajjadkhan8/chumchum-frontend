'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Copy,
  Edit3,
  Eye,
  FileText,
  Layers,
  Loader2,
  MapPin,
  MessageCircle,
  Pause,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { cn, formatPrice, formatRelativeTime, getInitials } from '@/lib/utils';
import { toast } from 'sonner';

const statusActions: Partial<Record<BrandCampaignStatus, Array<{ label: string; next: Uppercase<BrandCampaignStatus>; icon: React.ElementType }>>> = {
  draft: [{ label: 'Publish', next: 'PUBLISHED', icon: Send }],
  published: [
    { label: 'Pause', next: 'PAUSED', icon: Pause },
    { label: 'Close', next: 'CLOSED', icon: XCircle },
  ],
  paused: [
    { label: 'Re-publish', next: 'PUBLISHED', icon: Send },
    { label: 'Close', next: 'CLOSED', icon: XCircle },
  ],
  closed: [{ label: 'Archive', next: 'ARCHIVED', icon: Layers }],
};

const ALL_STATUSES_VALUE = '__all_statuses__';
const ALL_TYPES_VALUE = '__all_types__';

const campaignStatusStyle: Record<BrandCampaignStatus, string> = {
  draft: 'bg-[#fff1cd] text-[#8b5e12] ring-[#efcf83]',
  published: 'bg-[#e7f0ea] text-[#185c39] ring-[#bcd3c5]',
  paused: 'bg-[#f5e7cf] text-[#8b5e12] ring-[#e6c792]',
  closed: 'bg-[#eef2eb] text-[#526259] ring-[#d5ddd6]',
  archived: 'bg-[#f2eee7] text-[#6d6258] ring-[#ddd2c7]',
};

const reactionStatusStyle: Record<BrandCampaignReaction['status'], string> = {
  submitted: 'bg-[#fff1cd] text-[#8b5e12] ring-[#efcf83]',
  shortlisted: 'bg-[#e7f0ea] text-[#185c39] ring-[#bcd3c5]',
  in_review: 'bg-[#e8edf8] text-[#2b4faa] ring-[#b8c6e8]',
  accepted: 'bg-[#dff2e7] text-[#185c39] ring-[#aed0bd]',
  rejected: 'bg-[#fce8e6] text-[#9c2f25] ring-[#efbeb9]',
  withdrawn: 'bg-[#f2eee7] text-[#6d6258] ring-[#ddd2c7]',
};

const reactionTypeStyle: Record<BrandCampaignReaction['reactionType'], string> = {
  interested: 'bg-[#e7f0ea] text-[#185c39]',
  proposal: 'bg-[#fdf4e1] text-[#9a6b00]',
  question: 'bg-[#e8edf8] text-[#2b4faa]',
  decline: 'bg-[#f2eee7] text-[#6d6258]',
};

const locationLabel = (campaign: BrandCampaign) => {
  if (campaign.locationTargetingMode === 'remote_only') return 'Remote / Online only';
  if (campaign.locationTargetingMode === 'region') return campaign.targetRegion || campaign.targetCity || 'Region';
  if (campaign.locationTargetingMode === 'cities') return campaign.targetCities || campaign.targetCity || 'Selected cities';
  return campaign.targetCity || 'Nationwide';
};

const pretty = (value?: string | null) => (value || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value?: string | Date) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : null;
  return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

function StatusBadge({ status }: { status: BrandCampaignStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black capitalize ring-1', campaignStatusStyle[status])}>
      {pretty(status)}
    </span>
  );
}

function StatTile({ label, value, icon: Icon, tone = 'green' }: { label: string; value: string; icon: React.ElementType; tone?: 'green' | 'gold' }) {
  return (
    <div className="rounded-[1.15rem] border border-white/12 bg-white/8 px-3 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-2xl', tone === 'gold' ? 'bg-[#e6aa38] text-[#173b2a]' : 'bg-white/10 text-[#f0c56e]')}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d4e0d8]">{label}</p>
          <p className="mt-0.5 truncate text-base font-black text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="rounded-2xl border border-[#e2e7e1] bg-[#fbfaf5] px-3 py-3">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#e7f0ea] text-[#185c39]">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7b867f]">{label}</p>
          <div className="mt-1 text-sm font-bold leading-6 text-[#173b2a]">{value}</div>
        </div>
      </div>
    </div>
  );
}

function SectionPanel({ eyebrow, title, children, action }: { eyebrow: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[1.45rem] border border-[#d9e0d8] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0eb] px-4 py-3.5 sm:px-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#b77a12]">{eyebrow}</p>
          <h2 className="mt-0.5 text-base font-black tracking-tight text-[#173b2a]">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export default function BrandCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campaignId = params.id;

  const [campaign, setCampaign] = useState<BrandCampaign | null>(null);
  const [reactions, setReactions] = useState<BrandCampaignReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [campaignId, loadCampaign, loadReactions]);

  const reactionCounts = useMemo(() => {
    return reactions.reduce<Record<BrandCampaignReaction['status'], number>>((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, { submitted: 0, shortlisted: 0, in_review: 0, accepted: 0, rejected: 0, withdrawn: 0 });
  }, [reactions]);

  const totalProposedValue = useMemo(
    () => reactions.reduce((total, reaction) => total + (reaction.proposedPrice || 0), 0),
    [reactions],
  );

  const detailRows = useMemo(() => {
    if (!campaign) return [];
    return [
      { icon: CircleDollarSign, label: 'Budget', value: `${formatPrice(campaign.budgetMin)} - ${formatPrice(campaign.budgetMax)} ${campaign.currency}` },
      { icon: Target, label: 'Goal', value: campaign.campaignGoal ? <CampaignGoalBadge goal={campaign.campaignGoal} /> : null },
      { icon: MapPin, label: 'Location', value: `${locationLabel(campaign)} / ${campaign.targetLanguage || 'Any language'}` },
      { icon: CalendarClock, label: 'Deadline', value: formatDate(campaign.deadlineDate) },
      { icon: Layers, label: 'Platforms', value: campaign.targetPlatforms },
      { icon: FileText, label: 'Formats', value: campaign.contentFormats },
      { icon: ClipboardList, label: 'Deliverables', value: campaign.deliverables },
      { icon: ShieldCheck, label: 'Visibility', value: pretty(campaign.visibility) },
    ];
  }, [campaign]);

  const briefingBlocks = useMemo(() => {
    if (!campaign) return [];
    return [
      { label: 'Key message', value: campaign.keyMessage },
      { label: "Do's and don'ts", value: campaign.dosAndDonts },
      { label: 'Hashtags and mentions', value: campaign.hashtagsMentions },
      { label: 'Reference content', value: campaign.referenceUrls },
      { label: 'Usage rights', value: campaign.usageRights },
      { label: 'Terms and conditions', value: campaign.termsAndConditions },
      { label: 'Expected outcomes', value: campaign.expectedOutcomes },
      { label: 'Screening questions', value: campaign.customScreeningQuestions },
    ].filter((item) => Boolean(item.value));
  }, [campaign]);

  const controlRows = useMemo(() => {
    if (!campaign) return [];
    return [
      { icon: Users, label: 'Creator type', value: campaign.creatorType },
      { icon: Eye, label: 'Follower range', value: campaign.followerRange },
      { icon: BadgeCheck, label: 'Application type', value: campaign.applicationType },
      { icon: Users, label: 'Max applicants', value: campaign.maxApplicants ? String(campaign.maxApplicants) : null },
      { icon: CircleDollarSign, label: 'Minimum proposal', value: campaign.minProposedPrice ? `${formatPrice(campaign.minProposedPrice)} ${campaign.currency}` : null },
      { icon: CalendarClock, label: 'Go-live date', value: formatDate(campaign.goLiveDate) },
      { icon: CalendarClock, label: 'Submission deadline', value: formatDate(campaign.contentSubmissionDeadline) },
      { icon: CalendarClock, label: 'Duration', value: campaign.campaignDuration ? `${campaign.campaignDuration} days` : null },
    ];
  }, [campaign]);

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
      toast.success('Campaign duplicated - redirecting to edit...');
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
      <div className="flex min-h-[60vh] items-center justify-center bg-[#fbfaf5] px-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#d9e0d8] bg-white px-10 py-8 shadow-sm">
          <div className="size-8 animate-spin rounded-full border-2 border-[#2d6b4e]/20 border-t-[#2d6b4e]" />
          <p className="text-sm font-bold text-[#647168]">Loading campaign...</p>
        </div>
      </div>
    );
  }

  const activeActions = statusActions[campaign.status] ?? [];

  return (
    <div className="min-h-screen bg-[#fbfaf5]">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-[#d9e0d8] bg-[#173b2a] text-white shadow-[0_24px_80px_rgba(23,59,42,0.14)]">
          <div className="grid gap-0 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="p-5 sm:p-6 lg:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={campaign.status} />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#f0c56e]">
                  <Sparkles className="size-3.5" />
                  Campaign desk
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                {campaign.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c7d8ce]">
                {campaign.offerType ? `${pretty(campaign.offerType)} campaign` : 'Campaign'} updated {formatRelativeTime(campaign.updatedAt)}.
                Manage the brief, creator responses, status, and alerts from one compact workspace.
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <StatTile label="Responses" value={String(reactions.length)} icon={MessageCircle} tone="gold" />
                <StatTile label="Accepted" value={String(reactionCounts.accepted || 0)} icon={CheckCircle2} />
                <StatTile label="Budget" value={`${formatPrice(campaign.budgetMin)} - ${formatPrice(campaign.budgetMax)}`} icon={CircleDollarSign} />
                <StatTile label="Proposals" value={totalProposedValue ? formatPrice(totalProposedValue) : 'No prices yet'} icon={ClipboardList} />
              </div>
            </div>

            <aside className="border-t border-white/10 bg-white/[0.06] p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f0c56e]">Actions</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <Button
                  variant="outline"
                  className="min-h-11 justify-start rounded-xl border-white/15 bg-white/8 text-white hover:bg-white/12 hover:text-white"
                  onClick={() => router.push('/brand/campaigns')}
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back to campaigns
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="min-h-11 justify-start rounded-xl border-white/15 bg-white/8 text-white hover:bg-white/12 hover:text-white"
                >
                  <Link href={`/brand/campaigns/${campaign.id}/edit`}>
                    <Edit3 className="mr-2 size-4" />
                    Edit campaign
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  disabled={isDuplicating}
                  className="min-h-11 justify-start rounded-xl border-white/15 bg-white/8 text-white hover:bg-white/12 hover:text-white"
                  onClick={() => void onDuplicate()}
                >
                  {isDuplicating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Copy className="mr-2 size-4" />}
                  {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                </Button>
                {activeActions.map((entry) => {
                  const Icon = entry.icon;
                  return (
                    <Button
                      key={entry.next}
                      className="min-h-11 justify-start rounded-xl bg-[#e6aa38] font-black text-[#173b2a] hover:bg-[#f0bb55]"
                      onClick={() => void onStatusChange(entry.next)}
                    >
                      <Icon className="mr-2 size-4" />
                      {entry.label}
                    </Button>
                  );
                })}
              </div>
            </aside>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-5">
            <SectionPanel eyebrow="Campaign brief" title="Core details">
              <p className="rounded-2xl border border-[#e2e7e1] bg-[#fbfaf5] p-4 text-sm leading-7 text-[#496159]">
                {campaign.brief}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {detailRows.map((row) => (
                  <InfoRow key={row.label} icon={row.icon} label={row.label} value={row.value} />
                ))}
              </div>
            </SectionPanel>

            {briefingBlocks.length > 0 && (
              <SectionPanel eyebrow="Creative guidance" title="References and rules">
                <div className="grid gap-3 md:grid-cols-2">
                  {briefingBlocks.map((block) => (
                    <div key={block.label} className="rounded-2xl border border-[#e2e7e1] bg-[#fbfaf5] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#b77a12]">{block.label}</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#496159]">{block.value}</p>
                    </div>
                  ))}
                </div>
              </SectionPanel>
            )}

            <SectionPanel
              eyebrow="Creator inbox"
              title="Creator reactions"
              action={(
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={statusFilter || ALL_STATUSES_VALUE} onValueChange={(v) => setStatusFilter(v === ALL_STATUSES_VALUE ? '' : v)}>
                    <SelectTrigger className="h-9 w-36 rounded-full border-[#d9e0d8] bg-[#fbfaf5] text-xs font-bold text-[#185c39]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_STATUSES_VALUE}>All statuses</SelectItem>
                      {['SUBMITTED', 'SHORTLISTED', 'IN_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'].map((s) => (
                        <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter || ALL_TYPES_VALUE} onValueChange={(v) => setTypeFilter(v === ALL_TYPES_VALUE ? '' : v)}>
                    <SelectTrigger className="h-9 w-32 rounded-full border-[#d9e0d8] bg-[#fbfaf5] text-xs font-bold text-[#185c39]">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_TYPES_VALUE}>All types</SelectItem>
                      {['INTERESTED', 'PROPOSAL', 'QUESTION', 'DECLINE'].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-9 rounded-full border-[#d9e0d8] text-xs font-black text-[#185c39]" onClick={() => void loadReactions(0)}>
                    Apply
                  </Button>
                </div>
              )}
            >
              {reactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#cdd7ce] bg-[#fbfaf5] p-8 text-center">
                  <MessageCircle className="mx-auto size-8 text-[#cdd7ce]" />
                  <p className="mt-3 text-sm font-black text-[#173b2a]">No reactions match your filters yet.</p>
                  <p className="mt-1 text-xs text-[#718077]">Creator interest, proposals, questions, and declines appear here.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {reactions.map((reaction) => (
                      <article key={reaction.id} className="rounded-[1.25rem] border border-[#d9e0d8] bg-[#fbfaf5] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#185c39] text-sm font-black text-white">
                              {getInitials(reaction.creatorName)}
                            </div>
                            <div className="min-w-0">
                              <Link className="truncate text-sm font-black text-[#173b2a] hover:underline" href={`/creator/${reaction.creatorId}`}>
                                {reaction.creatorName}
                              </Link>
                              <p className="mt-0.5 text-xs font-semibold text-[#87938b]">
                                Sent {formatRelativeTime(reaction.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-black capitalize', reactionTypeStyle[reaction.reactionType])}>
                              {pretty(reaction.reactionType)}
                            </span>
                            <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-black capitalize ring-1', reactionStatusStyle[reaction.status])}>
                              {pretty(reaction.status)}
                            </span>
                          </div>
                        </div>

                        {reaction.message ? (
                          <p className="mt-3 rounded-2xl bg-white px-3 py-3 text-sm leading-6 text-[#496159]">{reaction.message}</p>
                        ) : null}

                        {(reaction.proposedPrice || reaction.proposedDeliveryDays) ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <InfoRow icon={CircleDollarSign} label="Proposal" value={reaction.proposedPrice ? `${formatPrice(reaction.proposedPrice)} ${reaction.proposedCurrency}` : 'No price'} />
                            <InfoRow icon={CalendarClock} label="Timeline" value={reaction.proposedDeliveryDays ? `${reaction.proposedDeliveryDays} days` : 'No timeline'} />
                          </div>
                        ) : null}

                        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                          <Textarea
                            rows={2}
                            placeholder="Optional note for creator"
                            value={reactionNotes[reaction.id] || ''}
                            onChange={(event) => setReactionNotes((prev) => ({ ...prev, [reaction.id]: event.target.value }))}
                            className="min-h-[4.25rem] rounded-2xl border-[#d9e0d8] bg-white text-sm"
                          />
                          <div className="flex flex-wrap gap-2">
                            {reaction.orderId ? (
                              <Button size="sm" asChild className="rounded-full bg-[#185c39] text-white hover:bg-[#12462b]">
                                <Link href={`/brand/orders?orderId=${reaction.orderId}`}>View Order</Link>
                              </Button>
                            ) : null}
                            {!['accepted', 'rejected', 'withdrawn'].includes(reaction.status) ? (
                              <>
                                <Button size="sm" variant="outline" className="rounded-full" disabled={actioningReactionId === reaction.id} onClick={() => void onReactionAction(reaction.id, 'SHORTLIST')}>Shortlist</Button>
                                <Button size="sm" variant="outline" className="rounded-full" disabled={actioningReactionId === reaction.id} onClick={() => void onReactionAction(reaction.id, 'REVIEW')}>Review</Button>
                                {['interested', 'proposal'].includes(reaction.reactionType) ? (
                                  <Button size="sm" className="rounded-full bg-[#185c39] text-white hover:bg-[#12462b]" disabled={actioningReactionId === reaction.id} onClick={() => void onReactionAction(reaction.id, 'ACCEPT')}>
                                    Accept & Create Order
                                  </Button>
                                ) : null}
                                <Button size="sm" variant="outline" className="rounded-full border-[#efbeb9] text-[#9c2f25] hover:bg-[#fce8e6]" disabled={actioningReactionId === reaction.id} onClick={() => void onReactionAction(reaction.id, 'REJECT')}>Reject</Button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                  {reactionPage < reactionTotalPages - 1 && (
                    <div className="mt-4 text-center">
                      <Button variant="outline" className="rounded-full" size="sm" onClick={() => void loadReactions(reactionPage + 1, true)}>
                        Load more reactions
                      </Button>
                    </div>
                  )}
                </>
              )}
            </SectionPanel>
          </div>

          <aside className="space-y-5">
            <SectionPanel eyebrow="Response mix" title="Pipeline">
              <div className="space-y-2">
                {[
                  ['Submitted', reactionCounts.submitted],
                  ['Shortlisted', reactionCounts.shortlisted],
                  ['In review', reactionCounts.in_review],
                  ['Accepted', reactionCounts.accepted],
                  ['Rejected', reactionCounts.rejected],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl border border-[#e2e7e1] bg-[#fbfaf5] px-3 py-2.5">
                    <span className="text-xs font-black text-[#496159]">{label}</span>
                    <span className="text-sm font-black text-[#173b2a]">{value}</span>
                  </div>
                ))}
              </div>
            </SectionPanel>

            <SectionPanel eyebrow="Controls" title="Requirements">
              <div className="space-y-3">
                {controlRows.filter((row) => Boolean(row.value)).length > 0 ? (
                  controlRows.map((row) => (
                    <InfoRow key={row.label} icon={row.icon} label={row.label} value={row.value} />
                  ))
                ) : (
                  <p className="text-sm leading-6 text-[#718077]">No extra screening or schedule controls were added for this campaign.</p>
                )}
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-[#e2e7e1] bg-[#fbfaf5] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7b867f]">Proposal required</p>
                    <p className="mt-1 text-sm font-black text-[#173b2a]">{campaign.proposalRequired ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="rounded-2xl border border-[#e2e7e1] bg-[#fbfaf5] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7b867f]">Portfolio required</p>
                    <p className="mt-1 text-sm font-black text-[#173b2a]">{campaign.portfolioRequired ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </SectionPanel>

            <SectionPanel
              eyebrow="Alert rules"
              title="Campaign alerts"
              action={(
                <Button size="sm" variant="outline" className="h-9 rounded-full border-[#d9e0d8] text-xs font-black text-[#185c39]" onClick={() => setIsAddingAlert((v) => !v)}>
                  <Plus className="mr-1.5 size-4" />
                  Add alert
                </Button>
              )}
            >
              <div className="space-y-3">
                {isAddingAlert ? (
                  <div className="space-y-3 rounded-2xl border border-[#e8f0ec] bg-[#f4f8f5] p-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#526259]">Alert type</label>
                      <Select value={newAlertType} onValueChange={(v) => setNewAlertType(v as AlertRuleType)}>
                        <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ALERT_TYPE_LABELS) as AlertRuleType[]).map((t) => (
                            <SelectItem key={t} value={t}>{ALERT_TYPE_LABELS[t]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#526259]">
                        Threshold ({ALERT_TYPE_UNITS[newAlertType]})
                      </label>
                      <input
                        type="number"
                        onWheel={(event) => event.currentTarget.blur()}
                        min="1"
                        value={newAlertThreshold}
                        onChange={(e) => setNewAlertThreshold(e.target.value)}
                        className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#185c39]"
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="rounded-full bg-[#185c39] text-white hover:bg-[#12462b]" disabled={isSavingAlert || !newAlertThreshold} onClick={() => void onAddAlert()}>
                        {isSavingAlert ? 'Saving...' : 'Save'}
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-full" onClick={() => { setIsAddingAlert(false); setNewAlertThreshold(''); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}

                {alertRules.length === 0 && !isAddingAlert ? (
                  <div className="rounded-2xl border border-dashed border-[#cdd7ce] bg-[#fbfaf5] p-5 text-center">
                    <Bell className="mx-auto size-6 text-[#cdd7ce]" />
                    <p className="mt-2 text-sm font-bold text-[#718077]">No alert rules yet.</p>
                  </div>
                ) : null}

                {alertRules.map((rule) => (
                  <div key={rule.id} className="rounded-2xl border border-[#e1e6df] bg-[#fbfaf5] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Bell className={cn('mt-0.5 size-4 shrink-0', rule.isActive ? 'text-[#b77a12]' : 'text-[#c5cdc8]')} />
                        <div>
                          <p className="text-sm font-black text-[#173b2a]">
                            {ALERT_TYPE_LABELS[rule.type]} {rule.threshold} {ALERT_TYPE_UNITS[rule.type]}
                          </p>
                          <p className="mt-1 text-xs text-[#9ba8a1]">
                            {rule.lastTriggeredAt
                              ? `Last triggered ${formatDate(rule.lastTriggeredAt)}`
                              : 'Not yet triggered'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => void onDeleteAlert(rule.id)}
                        className="grid size-7 shrink-0 place-items-center rounded-lg text-[#9ba8a1] hover:bg-red-50 hover:text-red-500"
                        aria-label="Delete alert"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => void onToggleAlert(rule)}
                      className={cn('mt-3 inline-flex h-7 items-center gap-2 rounded-full px-2.5 text-xs font-black', rule.isActive ? 'bg-[#e7f0ea] text-[#185c39]' : 'bg-[#eef2eb] text-[#647168]')}
                    >
                      <span className={cn('size-2 rounded-full', rule.isActive ? 'bg-[#185c39]' : 'bg-[#9ba8a1]')} />
                      {rule.isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>
                ))}
              </div>
            </SectionPanel>
          </aside>
        </div>
      </div>
    </div>
  );
}
