'use client';

import { type ComponentType, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Camera, Check, Instagram, Lock, MessageCircle, Music2, Plus, Trash2, Upload, X, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CampaignGoalBadge } from '@/components/campaign-goal-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CAMPAIGN_GOAL_SECTIONS, getCampaignGoalDescription } from '@/lib/offer-campaign-goals';
import { pakistanCities, pakistanLanguages } from '@/lib/localization';
import { offersService } from '@/services/offers.service';
import { uploadsService } from '@/services/uploads.service';
import type { BrandOffer } from '@/types';
import { toast } from 'sonner';

const DRAFT_KEY = 'brand-offer-wizard-draft-v1';
const steps = ['Basics', 'Deliverables', 'Budget & Payment', 'Control', 'References & Legal', 'Publish'];
const MAX_APPLICANTS = 20;

const platformOptions = ['instagram', 'youtube', 'tiktok', 'facebook', 'snapchat'] as const;
const platformMeta: Record<(typeof platformOptions)[number], { label: string; icon: ComponentType<{ className?: string }> }> = {
  instagram: { label: 'Instagram', icon: Instagram },
  youtube: { label: 'YouTube', icon: Youtube },
  tiktok: { label: 'TikTok', icon: Music2 },
  facebook: { label: 'Facebook', icon: MessageCircle },
  snapchat: { label: 'Snapchat', icon: Camera },
};

interface ServiceOption {
  key: string;
  label: string;
  description: string;
}

interface ServiceSection {
  label: string;
  items: ServiceOption[];
}

const serviceCatalogByPlatform: Record<SupportedPlatform, ServiceSection[]> = {
  instagram: [
    {
      label: 'Short-form video',
      items: [
        { key: 'ig_reel_15', label: 'Reel (15s)', description: 'Quick hook-first reel ideal for launches, drops, and offers.' },
        { key: 'ig_reel_30', label: 'Reel (30s)', description: 'Standard branded reel with product context and CTA.' },
        { key: 'ig_reel_60', label: 'Reel (60s)', description: 'Longer storytelling reel for benefits, demos, or testimonials.' },
      ],
    },
    {
      label: 'Stories',
      items: [
        { key: 'ig_story_1', label: 'Story Frame (1)', description: 'Single Instagram story frame with swipe cue or link CTA.' },
        { key: 'ig_story_3', label: 'Story Sequence (3)', description: 'Three-story sequence for awareness, proof, and CTA.' },
        { key: 'ig_story_5', label: 'Story Sequence (5)', description: 'Five-frame deeper campaign flow for launches and promos.' },
      ],
    },
    {
      label: 'Feed posts',
      items: [
        { key: 'ig_photo_single', label: 'Single Photo Post', description: 'Static feed post for product, lookbook, or campaign image.' },
        { key: 'ig_carousel_3_5', label: 'Carousel (3-5 slides)', description: 'Multi-slide post for features, before/after, or education.' },
      ],
    },
    {
      label: 'Live & collab',
      items: [
        { key: 'ig_live', label: 'Instagram Live', description: 'Live walkthrough, Q&A, launch, or creator-hosted session.' },
        { key: 'ig_collab_post', label: 'Collab Post', description: 'Joint feed post published as a collaboration with the brand.' },
      ],
    },
  ],
  youtube: [
    {
      label: 'Long-form video',
      items: [
        { key: 'yt_dedicated_video', label: 'Dedicated Video', description: 'Standalone YouTube video fully centered on your campaign.' },
        { key: 'yt_segment_30', label: 'Sponsored Segment (30s)', description: 'Short integration within a creator\'s long-form content.' },
        { key: 'yt_segment_60', label: 'Sponsored Segment (60s)', description: 'Longer integration for product story and stronger CTA.' },
      ],
    },
    {
      label: 'Shorts',
      items: [
        { key: 'yt_short_15', label: 'YouTube Short (15s)', description: 'Fast vertical short for awareness and launch moments.' },
        { key: 'yt_short_60', label: 'YouTube Short (60s)', description: 'Extended short for tutorials, demos, or offer explanation.' },
      ],
    },
    {
      label: 'Live',
      items: [
        { key: 'yt_live_mention', label: 'Live Stream Mention', description: 'Brand mention during a creator\'s live session.' },
        { key: 'yt_live_unboxing', label: 'Live Unboxing', description: 'Real-time unboxing or demo during a live stream.' },
      ],
    },
    {
      label: 'Community & extras',
      items: [
        { key: 'yt_pinned_comment', label: 'Pinned Comment', description: 'Campaign link or CTA pinned in the comments section.' },
        { key: 'yt_description_link', label: 'Description Link', description: 'Brand URL added to the video description.' },
      ],
    },
  ],
  tiktok: [
    {
      label: 'Video content',
      items: [
        { key: 'tt_video_15', label: 'TikTok Video (15s)', description: 'Short trend-friendly TikTok video with product placement.' },
        { key: 'tt_video_30', label: 'TikTok Video (30s)', description: 'Standard branded TikTok with clearer narrative and CTA.' },
        { key: 'tt_video_60', label: 'TikTok Video (60s)', description: 'Storytelling or tutorial-led TikTok with more detail.' },
      ],
    },
    {
      label: 'Live & interactive',
      items: [
        { key: 'tt_live', label: 'TikTok Live', description: 'Live mention, review, demo, or shopping-led format.' },
        { key: 'tt_promo_code', label: 'Promo Code Drop', description: 'Special discount or code reveal tied to campaign urgency.' },
      ],
    },
    {
      label: 'Duet & stitch',
      items: [
        { key: 'tt_duet', label: 'Duet Video', description: 'Creator duet format reacting to or extending brand content.' },
        { key: 'tt_stitch', label: 'Stitch Video', description: 'Brand clip stitched into creator commentary or demonstration.' },
      ],
    },
    {
      label: 'Shop & links',
      items: [
        { key: 'tt_shop_tag', label: 'TikTok Shop Tag', description: 'Product tagging for commerce-ready TikTok campaigns.' },
        { key: 'tt_bio_link', label: 'Bio Link Feature', description: 'Brand link placement in creator bio for conversion support.' },
      ],
    },
  ],
  facebook: [
    {
      label: 'Video',
      items: [
        { key: 'fb_reel', label: 'Facebook Reel', description: 'Short-form reel tailored for Facebook discovery and feeds.' },
        { key: 'fb_feed_video', label: 'In-Feed Video', description: 'Standard Facebook feed video with caption and CTA.' },
        { key: 'fb_long_video', label: 'Long-Form Video', description: 'Longer educational or storytelling video over 3 minutes.' },
      ],
    },
    {
      label: 'Feed posts',
      items: [
        { key: 'fb_photo', label: 'Photo Post', description: 'Static image post for visual campaigns or product focus.' },
        { key: 'fb_album', label: 'Album Post', description: 'Multi-photo Facebook post for campaigns needing more frames.' },
      ],
    },
    {
      label: 'Stories',
      items: [
        { key: 'fb_story', label: 'Facebook Story', description: 'Single story placement with quick campaign CTA.' },
        { key: 'fb_story_3', label: 'Story Sequence (3)', description: 'Three-story sequence for launch, proof, and conversion.' },
      ],
    },
    {
      label: 'Live & groups',
      items: [
        { key: 'fb_live', label: 'Facebook Live', description: 'Creator-hosted live coverage, promo, or walkthrough.' },
        { key: 'fb_group_post', label: 'Group Post', description: 'Campaign placement inside a relevant niche group.' },
      ],
    },
  ],
  snapchat: [
    {
      label: 'Snaps & stories',
      items: [
        { key: 'sc_snap_photo', label: 'Snap (Photo)', description: 'Direct photo snap highlighting brand or product moment.' },
        { key: 'sc_snap_video', label: 'Snap (Video, 10s)', description: 'Short video snap for quick attention and CTA.' },
        { key: 'sc_story_1', label: 'Story Frame (1)', description: 'Single Snapchat story frame with campaign mention.' },
        { key: 'sc_story_3_5', label: 'Story Sequence (3-5)', description: 'Multi-snap story arc for product or event storytelling.' },
      ],
    },
    {
      label: 'Spotlight',
      items: [
        { key: 'sc_spotlight_15', label: 'Spotlight Video (15s)', description: 'Short Spotlight video designed for rapid reach.' },
        { key: 'sc_spotlight_60', label: 'Spotlight Video (60s)', description: 'Longer Spotlight format for richer product context.' },
      ],
    },
    {
      label: 'Lens & AR',
      items: [
        { key: 'sc_custom_lens', label: 'Custom Lens Feature', description: 'Creator content featuring or promoting a branded lens.' },
        { key: 'sc_geofilter', label: 'Geofilter Promo', description: 'Location-based branded filter campaign activation.' },
      ],
    },
    {
      label: 'Map & links',
      items: [
        { key: 'sc_map_checkin', label: 'Snap Map Check-in', description: 'Location story or venue-based creator check-in.' },
        { key: 'sc_swipe_up', label: 'Swipe-Up Link', description: 'Direct swipe-up CTA to a brand page or landing destination.' },
      ],
    },
  ],
};

type Visibility = 'public' | 'private';

interface DeliverableItem {
  id: string;
  label: string;
  quantity: number;
}

interface OfferForm {
   title: string;
   brief: string;
   offerType: string;
   campaignGoal: string;
   targetPlatforms: string[];
   contentFormats: string[];
   selectedServiceKeys: string[];
   deliverableItems: DeliverableItem[];
   deliverableNotes: string;
   budgetType: string;
   budgetMin: string;
   budgetMax: string;
   paymentStructure: string;
   barterProductDesc: string;
   barterEstimatedValue: string;
   travelCostsCovered: boolean;
   deadlineDate: string;
   targetCity: string;
   targetLanguage: string;
   categories: string[];
   niches: string[];
   coverImageUrl: string;
   referenceUrls: string[];
   keyMessage: string;
   dosAndDonts: string;
   hashtagsMentions: string;
   usageRights: string;
   termsAndConditions: string;
   expectedOutcomes: string;
   visibility: Visibility;
   // Control tab fields
   creatorType: string;
   followerRange: string;
   creatorGenderPreference: string;
   minAge: string;
   maxAge: string;
   applicationType: string;
   maxApplicants: string;
   proposalRequired: boolean;
   portfolioRequired: boolean;
   customScreeningQuestions: string[];
   contentSubmissionDeadline: string;
   goLiveDate: string;
   campaignDuration: string;
 }

const defaultForm: OfferForm = {
   title: '',
   brief: '',
   offerType: '',
   campaignGoal: '',
   targetPlatforms: [],
   contentFormats: [],
   selectedServiceKeys: [],
   deliverableItems: [],
   deliverableNotes: '',
   budgetType: 'fixed',
   budgetMin: '25000',
   budgetMax: '80000',
   paymentStructure: 'full_upfront',
   barterProductDesc: '',
   barterEstimatedValue: '',
   travelCostsCovered: false,
   deadlineDate: '',
   targetCity: '',
   targetLanguage: '',
   categories: [],
   niches: [],
   coverImageUrl: '',
   referenceUrls: [''],
   keyMessage: '',
   dosAndDonts: '',
   hashtagsMentions: '',
   usageRights: '',
   termsAndConditions: '',
   expectedOutcomes: '',
   visibility: 'public',
   // Control tab defaults
   creatorType: '',
   followerRange: '',
   creatorGenderPreference: 'any',
   minAge: '',
    maxAge: '',
    applicationType: 'open',
    maxApplicants: '20',
    proposalRequired: false,
    portfolioRequired: false,
   customScreeningQuestions: [],
   contentSubmissionDeadline: '',
   goLiveDate: '',
   campaignDuration: '30',
 };

type SupportedPlatform = (typeof platformOptions)[number];

const isSupportedPlatform = (value: unknown): value is SupportedPlatform =>
  typeof value === 'string' && platformOptions.includes(value as SupportedPlatform);

const normalizeMaxApplicantsInput = (value: string | undefined): string => {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return '';
  return String(Math.min(MAX_APPLICANTS, Math.max(1, Math.trunc(parsed))));
};

const normalizeDraftForm = (rawForm?: Partial<OfferForm>): OfferForm => {
   const pf = rawForm ?? {};
   return {
     ...defaultForm,
     ...pf,
     offerType: isSupportedPlatform(pf.offerType) ? pf.offerType : defaultForm.offerType,
     visibility: pf.visibility === 'private' ? 'private' : 'public',
     budgetType: pf.budgetType ?? defaultForm.budgetType,
     paymentStructure: pf.paymentStructure ?? defaultForm.paymentStructure,
     travelCostsCovered: typeof pf.travelCostsCovered === 'boolean' ? pf.travelCostsCovered : defaultForm.travelCostsCovered,
     proposalRequired: typeof pf.proposalRequired === 'boolean' ? pf.proposalRequired : defaultForm.proposalRequired,
     portfolioRequired: typeof pf.portfolioRequired === 'boolean' ? pf.portfolioRequired : defaultForm.portfolioRequired,
     // Guarantee every array field is always an array regardless of stale/corrupt localStorage data.
     categories: Array.isArray(pf.categories) ? pf.categories : defaultForm.categories,
     niches: Array.isArray(pf.niches) ? pf.niches : defaultForm.niches,
     customScreeningQuestions: Array.isArray(pf.customScreeningQuestions) ? pf.customScreeningQuestions : defaultForm.customScreeningQuestions,
     targetPlatforms: isSupportedPlatform(pf.offerType)
       ? [pf.offerType]
       : Array.isArray(pf.targetPlatforms)
         ? pf.targetPlatforms
         : defaultForm.targetPlatforms,
      contentFormats: Array.isArray(pf.contentFormats) ? pf.contentFormats : defaultForm.contentFormats,
      referenceUrls: Array.isArray(pf.referenceUrls) ? pf.referenceUrls : defaultForm.referenceUrls,
      deliverableItems: Array.isArray(pf.deliverableItems) ? pf.deliverableItems : defaultForm.deliverableItems,
      selectedServiceKeys: Array.isArray(pf.selectedServiceKeys) ? pf.selectedServiceKeys : defaultForm.selectedServiceKeys,
      maxApplicants: pf.maxApplicants === undefined
        ? defaultForm.maxApplicants
        : normalizeMaxApplicantsInput(pf.maxApplicants),
    };
  };

  const splitCsv = (value?: string) =>
    (value || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

  const splitLines = (value?: string) =>
    (value || '')
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean);

  const parseDeliverableItems = (offerType: string, deliverables?: string): DeliverableItem[] => {
    const platformPrefix = isSupportedPlatform(offerType) ? `${offerType}::` : 'imported::';
    return splitLines(deliverables)
      .filter((line) => !line.toLowerCase().startsWith('notes:'))
      .map((line, index) => {
        const match = line.match(/^(\d+)x\s+(.+)$/i);
        const quantity = match ? Number(match[1]) : 1;
        const label = (match ? match[2] : line).trim();
        return {
          id: `${platformPrefix}imported_${index}`,
          label,
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        };
      });
  };

  const mapOfferToForm = (offer: BrandOffer): OfferForm =>
    normalizeDraftForm({
      title: offer.title || '',
      brief: offer.brief || '',
      offerType: offer.offerType || '',
      campaignGoal: offer.campaignGoal || '',
      targetPlatforms: splitCsv(offer.targetPlatforms),
      contentFormats: splitCsv(offer.contentFormats),
      deliverableItems: parseDeliverableItems(offer.offerType, offer.deliverables),
      deliverableNotes: splitLines(offer.deliverables)
        .find((line) => line.toLowerCase().startsWith('notes:'))
        ?.replace(/^notes:\s*/i, '') || '',
      budgetType: offer.budgetType || 'fixed',
      budgetMin: String(offer.budgetMin ?? ''),
      budgetMax: String(offer.budgetMax ?? ''),
      paymentStructure: offer.paymentStructure || 'full_upfront',
      barterProductDesc: offer.barterProductDesc || '',
      barterEstimatedValue: offer.barterEstimatedValue != null ? String(offer.barterEstimatedValue) : '',
      travelCostsCovered: Boolean(offer.travelCostsCovered),
      deadlineDate: offer.deadlineDate || '',
      targetCity: offer.targetCity || '',
      targetLanguage: offer.targetLanguage || '',
      categories: splitCsv(offer.categories),
      niches: splitCsv(offer.niches),
      coverImageUrl: offer.coverImageUrl || '',
      referenceUrls: splitLines(offer.referenceUrls).length > 0 ? splitLines(offer.referenceUrls) : [''],
      visibility: offer.visibility === 'private' ? 'private' : 'public',
      creatorType: offer.creatorType || '',
      followerRange: offer.followerRange || '',
      creatorGenderPreference: offer.creatorGenderPreference || 'any',
      minAge: offer.minAge != null ? String(offer.minAge) : '',
      maxAge: offer.maxAge != null ? String(offer.maxAge) : '',
      applicationType: offer.applicationType || 'open',
      maxApplicants: offer.maxApplicants != null ? String(Math.min(MAX_APPLICANTS, Math.max(1, offer.maxApplicants))) : '',
      proposalRequired: Boolean(offer.proposalRequired),
      portfolioRequired: Boolean(offer.portfolioRequired),
      customScreeningQuestions: splitLines(offer.customScreeningQuestions),
      contentSubmissionDeadline: offer.contentSubmissionDeadline || '',
      goLiveDate: offer.goLiveDate || '',
      campaignDuration: offer.campaignDuration != null ? String(offer.campaignDuration) : '30',
      keyMessage: offer.keyMessage || '',
      dosAndDonts: offer.dosAndDonts || '',
      hashtagsMentions: offer.hashtagsMentions || '',
      usageRights: offer.usageRights || '',
      termsAndConditions: offer.termsAndConditions || '',
      expectedOutcomes: offer.expectedOutcomes || '',
    });

// ─── Chip Input ──────────────────────────────────────────────────────────────

interface ChipInputProps {
  label: string;
  chips: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  max?: number;
  helperText?: string;
}

function ChipInput({ label, chips, onAdd, onRemove, placeholder, max, helperText }: ChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const trimmed = raw.trim().replace(/,+$/, '');
    if (!trimmed) return;
    if (max && chips.length >= max) {
      toast.error(`Maximum ${max} ${label.toLowerCase()} allowed`);
      return;
    }
    if (!chips.includes(trimmed)) onAdd(trimmed);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', 'Tab'].includes(e.key)) {
      e.preventDefault();
      commit(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && chips.length > 0) {
      onRemove(chips.length - 1);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">
          {chips.length}{max ? `/${max}` : ''}
        </span>
      </div>
      <div
        className="flex min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-ring"
        onClick={() => inputRef.current?.focus()}
      >
        {chips.map((chip, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
          >
            {chip}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
              className="ml-0.5 rounded-full opacity-60 hover:opacity-100"
              aria-label={`Remove ${chip}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(inputValue)}
          placeholder={chips.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
}

// ─── Section row (label + right-side counter / hint) ─────────────────────────

function SectionRow({ label, count, max, hint }: { label: string; count?: number; max?: number; hint?: string }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <span className="text-xs text-muted-foreground">
        {count !== undefined ? (max ? `${count}/${max}` : String(count)) : ''}{hint ? ` ${hint}` : ''}
      </span>
    </div>
  );
}

interface BrandOfferWizardProps {
  offerId?: string;
}

export function BrandOfferWizard({ offerId }: BrandOfferWizardProps) {
  const router = useRouter();
  const isEditMode = Boolean(offerId);
  const draftKey = isEditMode ? `${DRAFT_KEY}-edit-${offerId}` : DRAFT_KEY;
  const [step, setStep] = useState(1);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [isHydratingOffer, setIsHydratingOffer] = useState(false);
  const prevOfferTypeRef = useRef<string>('');
  const [activeCampaignGoalSection, setActiveCampaignGoalSection] = useState<string>(CAMPAIGN_GOAL_SECTIONS[0].label);
  const [form, setForm] = useState<OfferForm>(() => {
    if (typeof window === 'undefined') return defaultForm;
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return defaultForm;
    try {
      const parsed = JSON.parse(raw) as { step?: number; form?: Partial<OfferForm> };
      return normalizeDraftForm(parsed.form);
    } catch {
      return defaultForm;
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const serviceSections = useMemo(
    () => {
      // Only use the primary platform from Basics tab
      const platforms = form.offerType && isSupportedPlatform(form.offerType) ? [form.offerType] : [];
      return platforms.map((platform) => ({
        platform,
        platformLabel: platformMeta[platform].label,
        sections: serviceCatalogByPlatform[platform] || [],
      }));
    },
    [form.offerType]
  );

  const serviceOptions = useMemo(
    () => serviceSections.flatMap((entry) =>
      entry.sections.flatMap((section) =>
        section.items.map((option) => ({
          ...option,
          key: `${entry.platform}::${option.key}`,
          label: `${entry.platformLabel} — ${option.label}`,
        }))
      )
    ),
    [serviceSections]
  );

  const selectedServiceSet = useMemo(() => new Set(form.selectedServiceKeys), [form.selectedServiceKeys]);

  const selectedCampaignGoalSection = useMemo(
    () => CAMPAIGN_GOAL_SECTIONS.find((section) => section.options.some((goal) => goal === form.campaignGoal)),
    [form.campaignGoal]
  );

  const activeCampaignGoalOptions = useMemo(
    () => CAMPAIGN_GOAL_SECTIONS.find((section) => section.label === activeCampaignGoalSection)?.options ?? [],
    [activeCampaignGoalSection]
  );

  const serviceMap = useMemo(() => new Map(serviceOptions.map((entry) => [entry.key, entry.label])), [serviceOptions]);

  const persistDraft = useCallback((nextForm: OfferForm, nextStep = step) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(draftKey, JSON.stringify({ step: nextStep, form: nextForm }));
    setHasSavedDraft(true);
  }, [draftKey, step]);

  const updateForm = useCallback((patch: Partial<OfferForm>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      persistDraft(next);
      return next;
    });
  }, [persistDraft]);

   const getMissingFields = (targetStep: number): string[] => {
     if (targetStep === 1) {
       const missing: string[] = [];
       if (!form.title.trim()) missing.push('Title');
       if (!form.brief.trim()) missing.push('Brief');
       if (!form.offerType.trim()) missing.push('Platform');
       return missing;
     }
     if (targetStep === 2) {
       const missing: string[] = [];
       if (!form.deliverableItems.length) missing.push('At least one deliverable');
       return missing;
     }
     if (targetStep === 3) {
       const missing: string[] = [];
       if (!form.budgetType) missing.push('Budget type');
       const isBarterOnly = form.budgetType === 'barter_only';
       const hasBarter = form.budgetType === 'barter_only' || form.budgetType === 'paid_and_barter';
       if (!isBarterOnly) {
         if (!form.budgetMin) missing.push('Budget min');
         if (!form.budgetMax) missing.push('Budget max');
         if (Number(form.budgetMin || 0) > Number(form.budgetMax || 0)) missing.push('Budget min must be ≤ budget max');
       }
       if (hasBarter && !form.barterProductDesc.trim()) missing.push('Barter product description');
       return missing;
     }
     if (targetStep === 4) {
       const missing: string[] = [];
       if (!form.creatorType.trim()) missing.push('Creator type');
       if (!form.applicationType.trim()) missing.push('Application type');
       return missing;
     }
     return [];
   };

  const canContinue = getMissingFields(step).length === 0;

  const maxUnlockedStep = (() => {
    let unlocked = 1;
    for (let idx = 1; idx < steps.length; idx += 1) {
      if (getMissingFields(idx).length > 0) break;
      unlocked = idx + 1;
    }
    return unlocked;
  })();

   useEffect(() => {
     if (step > maxUnlockedStep) setStep(maxUnlockedStep);
   }, [maxUnlockedStep, step]);

   // Scroll to top when step changes
   useEffect(() => {
     window.scrollTo({ top: 0, behavior: 'smooth' });
   }, [step]);

  // Clear incompatible deliverables when primary platform changes
  useEffect(() => {
    const platformChanged = prevOfferTypeRef.current !== form.offerType;
    prevOfferTypeRef.current = form.offerType;

    if (!platformChanged) return;

    if (!form.offerType) {
      if (form.targetPlatforms.length > 0 || form.selectedServiceKeys.length > 0 || form.deliverableItems.length > 0) {
        updateForm({ targetPlatforms: [], selectedServiceKeys: [], deliverableItems: [] });
      }
      return;
    }

    const currentPlatformPrefix = `${form.offerType}::`;
    const validSelectedKeys = form.selectedServiceKeys.filter((key) =>
      key.startsWith(currentPlatformPrefix)
    );
    const validDeliverables = form.deliverableItems.filter((item) =>
      item.id.startsWith(currentPlatformPrefix)
    );

    if (
      form.targetPlatforms[0] !== form.offerType ||
      form.targetPlatforms.length !== 1 ||
      validSelectedKeys.length !== form.selectedServiceKeys.length ||
      validDeliverables.length !== form.deliverableItems.length
    ) {
      updateForm({
        targetPlatforms: [form.offerType],
        selectedServiceKeys: validSelectedKeys,
        deliverableItems: validDeliverables,
      });
    }
  }, [form.deliverableItems, form.offerType, form.selectedServiceKeys, form.targetPlatforms, updateForm]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setHasSavedDraft(Boolean(window.localStorage.getItem(draftKey)));
  }, [draftKey]);

  useEffect(() => {
    if (!offerId) return;
    let isMounted = true;
    setIsHydratingOffer(true);
    offersService.getBrandOffer(offerId)
      .then((offer) => {
        if (!isMounted) return;
        setForm(mapOfferToForm(offer));
        setStep(1);
      })
      .catch(() => {
        if (!isMounted) return;
        toast.error('Failed to load offer for editing');
        router.push('/brand/offers');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsHydratingOffer(false);
      });
    return () => {
      isMounted = false;
    };
  }, [offerId, router]);

  useEffect(() => {
    if (selectedCampaignGoalSection && selectedCampaignGoalSection.label !== activeCampaignGoalSection) {
      setActiveCampaignGoalSection(selectedCampaignGoalSection.label);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignGoalSection]);


  const toggleServiceSelection = (serviceKey: string) => {
    const exists = form.selectedServiceKeys.includes(serviceKey);
    updateForm({
      selectedServiceKeys: exists
        ? form.selectedServiceKeys.filter((it) => it !== serviceKey)
        : [...form.selectedServiceKeys, serviceKey],
    });
  };

  const addSelectedServices = () => {
    if (!form.selectedServiceKeys.length) {
      toast.error('Select one or more deliverables first');
      return;
    }

    const nextItems = [...form.deliverableItems];
    form.selectedServiceKeys.forEach((key) => {
      const label = serviceMap.get(key);
      if (!label) return;
      const idx = nextItems.findIndex((item) => item.id === key);
      if (idx >= 0) {
        nextItems[idx] = { ...nextItems[idx], quantity: nextItems[idx].quantity + 1 };
      } else {
        nextItems.push({ id: key, label, quantity: 1 });
      }
    });

    updateForm({ deliverableItems: nextItems, selectedServiceKeys: [] });
  };

  const updateQuantity = (id: string, delta: number) => {
    updateForm({
      deliverableItems: form.deliverableItems
        .map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item),
    });
  };

  const removeDeliverable = (id: string) => {
    updateForm({ deliverableItems: form.deliverableItems.filter((item) => item.id !== id) });
  };

  const updateReferenceUrl = (index: number, value: string) => {
    updateForm({ referenceUrls: form.referenceUrls.map((entry, i) => i === index ? value : entry) });
  };

  const uploadCover = async (file?: File | null) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const uploaded = await uploadsService.packageThumbnail(file);
      updateForm({ coverImageUrl: uploaded.url });
      toast.success('Cover uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const buildDeliverablesText = () => {
    const entries = form.deliverableItems.map((item) => `${item.quantity}x ${item.label}`);
    if (form.deliverableNotes.trim()) entries.push(`Notes: ${form.deliverableNotes.trim()}`);
    return entries.join('\n');
  };

   const submit = async (publish = false) => {
     setIsSaving(true);
     try {
       // Auto-derive platforms from selected deliverables
       const autoPlatforms = [
         ...Array.from(new Set(form.deliverableItems.map((item) => item.id.split('::')[0])))
           .filter((entry): entry is SupportedPlatform => isSupportedPlatform(entry)),
       ];
       const resolvedPlatforms = autoPlatforms.length > 0
         ? autoPlatforms
         : splitCsv(form.targetPlatforms.join(', ')).filter((entry) => isSupportedPlatform(entry));
       const isBarterOnly = form.budgetType === 'barter_only';

       const payload = {
         title: form.title.trim(),
         brief: form.brief.trim(),
         offerType: form.offerType.trim(),
         campaignGoal: form.campaignGoal.trim(),
         budgetType: form.budgetType,
         budgetMin: isBarterOnly ? 0 : Number(form.budgetMin),
         budgetMax: isBarterOnly ? 0 : Number(form.budgetMax),
         paymentStructure: isBarterOnly ? undefined : form.paymentStructure,
         barterProductDesc: form.barterProductDesc.trim() || undefined,
         barterEstimatedValue: form.barterEstimatedValue ? Number(form.barterEstimatedValue) : undefined,
         travelCostsCovered: form.travelCostsCovered,
         deliverables: buildDeliverablesText(),
         contentFormats: form.contentFormats.length > 0 ? form.contentFormats.join(', ') : undefined,
         targetPlatforms: (resolvedPlatforms.length > 0 ? resolvedPlatforms : [form.offerType]).join(', '),
         categories: form.categories.join(', '),
         niches: form.niches.join(', '),
         referenceUrls: form.referenceUrls.map((url) => url.trim()).filter(Boolean).join('\n') || undefined,
         keyMessage: form.keyMessage.trim() || undefined,
         dosAndDonts: form.dosAndDonts.trim() || undefined,
         hashtagsMentions: form.hashtagsMentions.trim() || undefined,
         usageRights: form.usageRights.trim() || undefined,
         termsAndConditions: form.termsAndConditions.trim() || undefined,
         expectedOutcomes: form.expectedOutcomes.trim() || undefined,
         coverImageUrl: form.coverImageUrl || undefined,
         deadlineDate: form.deadlineDate || undefined,
          targetCity: form.targetCity.trim() || undefined,
          targetLanguage: form.targetLanguage.trim() || undefined,
         visibility: form.visibility,
         creatorType: form.creatorType || undefined,
         followerRange: form.followerRange || undefined,
         creatorGenderPreference: form.creatorGenderPreference || undefined,
         minAge: form.minAge ? Number(form.minAge) : undefined,
         maxAge: form.maxAge ? Number(form.maxAge) : undefined,
         applicationType: form.applicationType || 'open',
          maxApplicants: form.maxApplicants ? Math.min(MAX_APPLICANTS, Number(form.maxApplicants)) : undefined,
         proposalRequired: form.proposalRequired,
         portfolioRequired: form.portfolioRequired,
         customScreeningQuestions: form.customScreeningQuestions.length > 0 ? form.customScreeningQuestions.join('\n') : undefined,
         contentSubmissionDeadline: form.contentSubmissionDeadline || undefined,
         goLiveDate: form.goLiveDate || undefined,
         campaignDuration: form.campaignDuration ? Number(form.campaignDuration) : undefined,
       };
       const savedOffer = isEditMode && offerId
         ? await offersService.updateOffer(offerId, payload)
         : await offersService.createOffer(payload);

       if (publish) {
         await offersService.updateOfferStatus(savedOffer.id, 'PUBLISHED');
         toast.success(isEditMode ? 'Offer updated and published' : 'Offer published');
       } else {
         toast.success(isEditMode ? 'Offer updated successfully' : 'Offer saved as draft');
       }

       if (typeof window !== 'undefined') {
         window.localStorage.removeItem(draftKey);
       }
       setHasSavedDraft(false);
       router.push(`/brand/offers/${savedOffer.id}`);
     } catch (error) {
       toast.error(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} offer`);
     } finally {
       setIsSaving(false);
     }
   };

  const restoreDraft = () => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { step?: number; form?: Partial<OfferForm> };
      const nextForm = normalizeDraftForm(parsed.form);
      const nextStep = Math.max(1, Math.min(parsed.step || 1, steps.length));
      setForm(nextForm);
      setStep(nextStep);
      setHasSavedDraft(true);
      toast.success('Draft restored');
    } catch {
      toast.error('Could not restore draft');
    }
  };

  const clearDraft = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(draftKey);
    setHasSavedDraft(false);
    toast.success('Saved draft cleared');
  };

  if (isEditMode && isHydratingOffer) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 px-1 pb-6 sm:space-y-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading offer for editing…</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-1 pb-6 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/brand/offers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{isEditMode ? 'Edit Offer' : 'Create Offer'}</h1>
            <p className="text-muted-foreground">Build a detailed brand requirement in six guided steps.</p>
          </div>
        </div>
      </div>

      {hasSavedDraft && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
            <p className="text-sm text-muted-foreground">A local draft is available for this offer form.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={restoreDraft}>Restore Draft</Button>
              <Button size="sm" variant="ghost" onClick={clearDraft}>Clear Draft</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="sticky top-16 z-20 border-border/80 bg-background/95 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {steps.map((label, idx) => {
              const id = idx + 1;
              const unlocked = id <= maxUnlockedStep;
              const isCurrent = id === step;
              const isCompleted = id < step && getMissingFields(id).length === 0;
              return (
                <button
                  key={label}
                  type="button"
                  aria-disabled={!unlocked}
                  onClick={() => {
                    if (!unlocked) {
                      const previousStep = Math.max(1, id - 1);
                      const missing = getMissingFields(previousStep);
                      toast.error(missing.length ? `Complete Step ${previousStep}: ${missing.slice(0, 2).join(', ')}` : `Complete Step ${previousStep} first.`);
                      return;
                    }
                    setStep(id);
                    persistDraft(form, id);
                  }}
                  className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : unlocked
                        ? 'bg-muted text-muted-foreground hover:text-foreground'
                        : 'cursor-not-allowed bg-muted/60 text-muted-foreground/60'
                  }`}
                >
                  {id}. {label}
                  {isCompleted && <Check className="h-3.5 w-3.5" />}
                  {!unlocked && <Lock className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Step 1 — Basics</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Offer title <span className="text-destructive">*</span></Label>
                <span className="text-xs text-muted-foreground">{form.title.length}/100</span>
              </div>
              <Input
                maxLength={100}
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value })}
                placeholder="Summer skincare launch collaboration"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Brief <span className="text-destructive">*</span></Label>
                <span className="text-xs text-muted-foreground">{form.brief.length} chars</span>
              </div>
              <Textarea
                rows={4}
                value={form.brief}
                onChange={(e) => updateForm({ brief: e.target.value })}
                placeholder="Explain your objective and what creators should pitch"
              />
              <p className="text-xs text-muted-foreground">Aim for 80–300 characters to give creators enough context.</p>
            </div>
            <div className="space-y-3">
              <SectionRow label="Platform *" count={form.offerType ? 1 : 0} max={1} hint="selected" />
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {platformOptions.map((platform) => {
                  const { icon: Icon, label } = platformMeta[platform];
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => updateForm({
                        offerType: platform,
                        targetPlatforms: [platform],
                      })}
                      className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm transition-colors ${
                        form.offerType === platform
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
               </div>
               <p className="text-xs text-muted-foreground">Your platform selection determines available deliverable options in Step 2.</p>
             </div>
            <div className="space-y-3">
              <SectionRow label="Campaign goal (optional)" count={form.campaignGoal ? 1 : 0} max={1} hint="selected" />
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">Pick a campaign goal</p>
                  <p className="text-xs text-muted-foreground">Select a category, then pick one specific goal below.</p>
                </div>


                <div className="mt-3 flex flex-wrap gap-2">
                  {CAMPAIGN_GOAL_SECTIONS.map((section) => {
                    const isActive = activeCampaignGoalSection === section.label;
                    const isSelectedSection = selectedCampaignGoalSection?.label === section.label;
                    return (
                      <button
                        key={section.label}
                        type="button"
                        onClick={() => {
                          setActiveCampaignGoalSection(section.label);
                        }}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                          isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background hover:border-primary/40 hover:bg-primary/5'
                        }`}
                      >
                        {section.label}
                        {isSelectedSection ? <Check className="ml-1.5 inline h-3.5 w-3.5" /> : null}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 rounded-lg border border-border/60 bg-background p-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">{activeCampaignGoalSection}</p>
                  <div className="flex flex-wrap gap-2">
                    {activeCampaignGoalOptions.map((goal) => {
                      const isSelected = form.campaignGoal === goal;
                      return (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => {
                            updateForm({ campaignGoal: goal });
                          }}
                          className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                              : 'border-border bg-background hover:border-primary/40 hover:bg-primary/5'
                          }`}
                        >
                          <p>{goal}</p>
                          <p className={`mt-1 text-[11px] leading-snug ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                            {getCampaignGoalDescription(goal)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.campaignGoal ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                    <CampaignGoalBadge goal={form.campaignGoal} />
                    <span className="text-xs text-muted-foreground">{getCampaignGoalDescription(form.campaignGoal)}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-7 px-2 text-xs"
                      onClick={() => updateForm({ campaignGoal: '' })}
                    >
                      Clear
                    </Button>
                  </div>
                ) : null}

              </div>
              <p className="text-xs text-muted-foreground">Choose the main business outcome you want this creator campaign to optimize for.</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <Label>Visibility</Label>
                  <p className="text-xs text-muted-foreground">
                    {form.visibility === 'public' ? 'Public to creators' : 'Private (share manually)'}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs text-muted-foreground">Private</span>
                  <Switch
                    checked={form.visibility === 'public'}
                    onCheckedChange={(checked) => updateForm({ visibility: checked ? 'public' : 'private' })}
                    aria-label="Toggle visibility"
                  />
                  <span className="text-xs text-muted-foreground">Public</span>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ChipInput
                label="Categories"
                chips={form.categories}
                onAdd={(v) => updateForm({ categories: [...form.categories, v] })}
                onRemove={(i) => updateForm({ categories: form.categories.filter((_, idx) => idx !== i) })}
                placeholder="Beauty, Lifestyle…"
                max={5}
                helperText="Press Enter, comma, or Tab to add"
              />
              <ChipInput
                label="Niches"
                chips={form.niches}
                onAdd={(v) => updateForm({ niches: [...form.niches, v] })}
                onRemove={(i) => updateForm({ niches: form.niches.filter((_, idx) => idx !== i) })}
                placeholder="UGC, Reviews…"
                max={5}
                helperText="Press Enter, comma, or Tab to add"
              />
            </div>
          </CardContent>
        </Card>
      )}

       {step === 2 && (
         <Card>
           <CardHeader><CardTitle>Step 2 — Deliverables</CardTitle></CardHeader>
           <CardContent className="space-y-4 p-4 sm:p-6">
             {serviceSections.length === 0 ? (
               <p className="rounded-lg border border-border/60 p-3 text-sm text-muted-foreground">
                 Please select a primary platform in Step 1 (Basics) to see available deliverable options here.
               </p>
            ) : (
              <>
                {serviceSections.map((platformEntry) => (
                  <div key={platformEntry.platform} className="space-y-3">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = platformMeta[platformEntry.platform].icon;
                        return <Icon className="h-4 w-4 text-muted-foreground" />;
                      })()}
                      <p className="text-sm font-semibold">{platformEntry.platformLabel} deliverables</p>
                    </div>

                    {platformEntry.sections.map((section) => (
                      <div key={`${platformEntry.platform}-${section.label}`} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {section.label}
                        </p>
                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                          {section.items.map((option) => {
                            const serviceKey = `${platformEntry.platform}::${option.key}`;
                            const isSelected = selectedServiceSet.has(serviceKey);

                            return (
                              <button
                                key={serviceKey}
                                type="button"
                                onClick={() => toggleServiceSelection(serviceKey)}
                                className={`rounded-lg border p-3 text-left transition-colors ${
                                  isSelected
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-border/80 hover:bg-muted/40'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{option.label}</p>
                                  <span
                                    className={`ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                                      isSelected
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border text-transparent'
                                    }`}
                                  >
                                    <Check className="h-3 w-3" />
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                <div className="space-y-2">
                  <Label>Deliverable notes (Optional)</Label>
                  <Textarea
                    rows={3}
                    value={form.deliverableNotes}
                    onChange={(e) => updateForm({ deliverableNotes: e.target.value })}
                    placeholder="Example: 2 hooks for approval, Urdu voiceover, mandatory CTA, coupon mention"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-sm">
                  <p className="text-muted-foreground">
                    {form.selectedServiceKeys.length > 0
                      ? `${form.selectedServiceKeys.length} selected (ready to add)`
                      : 'Select one or more deliverables for this offer'}
                  </p>
                  <div className="flex items-center gap-2">
                    {form.selectedServiceKeys.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addSelectedServices}
                      >
                        <Plus className="mr-1 h-4 w-4" /> Add to deliverables
                      </Button>
                    )}
                    {form.selectedServiceKeys.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => updateForm({ selectedServiceKeys: [] })}
                      >
                        Clear selection
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Offer Deliverables</p>
                    <Badge variant="outline">
                      {form.deliverableItems.reduce((total, item) => total + item.quantity, 0)} total
                    </Badge>
                  </div>

                  {form.deliverableItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nothing added yet. Select deliverables above, then click &quot;Add to deliverables&quot;.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {form.deliverableItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 bg-muted/20 p-2"
                        >
                          <p className="text-sm font-medium">{item.label}</p>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              -
                            </Button>
                            <Badge variant="secondary">Qty {item.quantity}</Badge>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              +
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => removeDeliverable(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              <p className="text-sm font-medium">Deliverables preview (auto-generated)</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                {(buildDeliverablesText() || 'No deliverables added yet.').split('\n').filter(Boolean).map((item, index) => (
                  <p key={`${item}-${index}`}>- {item}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Step 3 — Budget & Payment</CardTitle></CardHeader>
          <CardContent className="space-y-5">

            {/* Budget type */}
            <div className="space-y-2">
              <Label>Budget type <span className="text-destructive">*</span></Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  { value: 'fixed', label: '💰 Fixed price', desc: 'You set a fixed PKR amount per creator' },
                  { value: 'open_to_bids', label: '📊 Open to bids', desc: 'Creators propose their own rates within a range' },
                  { value: 'paid_and_barter', label: '🤝 Paid + barter', desc: 'Cash fee plus a product or service exchange' },
                  { value: 'barter_only', label: '🎁 Barter only', desc: 'Product or service exchange — no cash payment' },
                ] as const).map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateForm({ budgetType: value })}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      form.budgetType === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash budget — hidden for barter_only */}
            {form.budgetType !== 'barter_only' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    {form.budgetType === 'fixed' ? 'Fixed amount (PKR)' : 'Bid range (PKR)'}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  {form.budgetMin && form.budgetMax && Number(form.budgetMin) <= Number(form.budgetMax) && (
                    <span className="text-xs text-muted-foreground">
                      PKR {Number(form.budgetMin).toLocaleString()}{form.budgetType !== 'fixed' ? ` – ${Number(form.budgetMax).toLocaleString()}` : ''}
                    </span>
                  )}
                </div>
                {form.budgetType === 'fixed' ? (
                  <Input
                    type="number"
                    min={0}
                    value={form.budgetMin}
                    onChange={(e) => updateForm({ budgetMin: e.target.value, budgetMax: e.target.value })}
                    placeholder="e.g. 25000"
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Minimum</Label>
                      <Input type="number" min={0} value={form.budgetMin} onChange={(e) => updateForm({ budgetMin: e.target.value })} placeholder="e.g. 10000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Maximum</Label>
                      <Input type="number" min={0} value={form.budgetMax} onChange={(e) => updateForm({ budgetMax: e.target.value })} placeholder="e.g. 80000" />
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Per creator, in PKR. Creators will see this when browsing.</p>
              </div>
            )}

            {/* Payment structure — hidden for barter_only */}
            {form.budgetType !== 'barter_only' && (
              <div className="space-y-2">
                <Label>Payment structure</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {([
                    { value: 'full_upfront', label: '🔒 Full upfront into escrow', desc: '100% held in escrow before work begins' },
                    { value: 'split_50_50', label: '✂️ 50% upfront + 50% on delivery', desc: 'Split payment — milestone-based release' },
                  ] as const).map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateForm({ paymentStructure: value })}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        form.paymentStructure === value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/40 hover:bg-muted/30'
                      }`}
                    >
                      <p className="text-sm font-medium">{label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Barter details — shown for barter types */}
            {(form.budgetType === 'barter_only' || form.budgetType === 'paid_and_barter') && (
              <div className="space-y-4 rounded-xl border border-amber-200/70 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Barter details</p>
                <div className="space-y-1.5">
                  <Label>Product / service description <span className="text-destructive">*</span></Label>
                  <Textarea
                    rows={3}
                    value={form.barterProductDesc}
                    onChange={(e) => updateForm({ barterProductDesc: e.target.value })}
                    placeholder="e.g. One full-size skincare kit (moisturiser, serum, SPF) worth PKR 8,000 — shipped within 3 days of confirmation."
                  />
                  <p className="text-xs text-muted-foreground">Describe what the creator will receive as their barter compensation.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Estimated value (PKR)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.barterEstimatedValue}
                    onChange={(e) => updateForm({ barterEstimatedValue: e.target.value })}
                    placeholder="e.g. 8000"
                  />
                  <p className="text-xs text-muted-foreground">Approximate retail / market value. Helps creators evaluate the offer.</p>
                </div>
              </div>
            )}

            {/* Travel & extra costs */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Travelling & extra costs covered</Label>
                  <p className="text-xs text-muted-foreground">
                    {form.travelCostsCovered
                      ? 'Brand covers reasonable travel or shoot expenses'
                      : 'Creator is responsible for their own expenses'}
                  </p>
                </div>
                <Switch
                  checked={form.travelCostsCovered}
                  onCheckedChange={(checked) => updateForm({ travelCostsCovered: checked })}
                  aria-label="Toggle travel costs covered"
                />
              </div>
            </div>

            {/* Targeting and requirements moved to Control / References & Legal for cleaner separation */}
           </CardContent>
         </Card>
       )}

       {step === 4 && (
         <Card>
           <CardHeader><CardTitle>Step 4 — Creator Control & Timeline</CardTitle></CardHeader>
           <CardContent className="space-y-5">

             {/* Creator Profile Requirements */}
             <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
               <p className="mb-4 text-sm font-semibold">Creator Profile Requirements</p>

               <div className="space-y-4">
                 {/* Creator Type */}
                 <div className="space-y-2">
                   <Label>Creator type <span className="text-destructive">*</span></Label>
                   <div className="grid gap-2 sm:grid-cols-3">
                     {([
                       { value: 'influencer', label: '📢 Influencer', desc: 'Focus: Reach & audience size' },
                       { value: 'creator', label: '🎬 Creator', desc: 'Focus: Content quality & storytelling' },
                       { value: 'both', label: '⭐ Both', desc: 'Open to any creator type' },
                     ] as const).map(({ value, label, desc }) => (
                       <button
                         key={value}
                         type="button"
                         onClick={() => updateForm({ creatorType: value })}
                         className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                           form.creatorType === value
                             ? 'border-primary bg-primary/10'
                             : 'border-border hover:border-primary/40 hover:bg-muted/30'
                         }`}
                       >
                         <p className="font-medium">{label}</p>
                         <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Follower Range & Gender */}
                 <div className="grid gap-4 sm:grid-cols-2">
                   <div className="space-y-2">
                     <Label>Follower range (optional)</Label>
                     <select
                       value={form.followerRange}
                       onChange={(e) => updateForm({ followerRange: e.target.value })}
                       className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                     >
                       <option value="">— Any follower range</option>
                       <option value="nano">🌱 Nano (1K–10K)</option>
                       <option value="micro">📱 Micro (10K–100K)</option>
                       <option value="macro">📈 Macro (100K–1M)</option>
                       <option value="mega">🚀 Mega (1M+)</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <Label>Creator gender preference (optional)</Label>
                     <select
                       value={form.creatorGenderPreference}
                       onChange={(e) => updateForm({ creatorGenderPreference: e.target.value })}
                       className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                     >
                       <option value="any">Any</option>
                       <option value="male">Male</option>
                       <option value="female">Female</option>
                     </select>
                   </div>
                 </div>

                 {/* Age Range */}
                 <div className="grid gap-4 sm:grid-cols-2">
                   <div className="space-y-1.5">
                     <Label>Min age (optional)</Label>
                     <Input type="number" min={13} max={120} value={form.minAge} onChange={(e) => updateForm({ minAge: e.target.value })} placeholder="e.g. 18" />
                   </div>
                   <div className="space-y-1.5">
                     <Label>Max age (optional)</Label>
                     <Input type="number" min={13} max={120} value={form.maxAge} onChange={(e) => updateForm({ maxAge: e.target.value })} placeholder="e.g. 35" />
                   </div>
                 </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Target city (optional)</Label>
                      <select
                        value={form.targetCity}
                        onChange={(e) => updateForm({ targetCity: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">— Nationwide (any city)</option>
                        {pakistanCities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">Leave blank for nationwide targeting.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Target language (optional)</Label>
                      <select
                        value={form.targetLanguage}
                        onChange={(e) => updateForm({ targetLanguage: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">— Any language</option>
                        {pakistanLanguages.map((language) => (
                          <option key={language} value={language}>{language}</option>
                        ))}
                      </select>
                    </div>
                  </div>
               </div>
             </div>

             {/* Application Settings */}
             <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
               <p className="mb-4 text-sm font-semibold">Application Settings</p>

               <div className="space-y-4">
                 {/* Application Type */}
                 <div className="space-y-2">
                   <Label>Application type <span className="text-destructive">*</span></Label>
                   <div className="grid gap-2 sm:grid-cols-3">
                     {([
                       { value: 'open', label: '🔓 Open', desc: 'Anyone can apply' },
                       { value: 'shortlist', label: '📋 Shortlist-then-invite', desc: 'You review, then invite' },
                       { value: 'invite_only', label: '🔐 Invite-only', desc: 'You invite specific creators' },
                     ] as const).map(({ value, label, desc }) => (
                       <button
                         key={value}
                         type="button"
                         onClick={() => updateForm({ applicationType: value })}
                         className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                           form.applicationType === value
                             ? 'border-primary bg-primary/10'
                             : 'border-border hover:border-primary/40 hover:bg-muted/30'
                         }`}
                       >
                         <p className="font-medium">{label}</p>
                         <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Max Applicants & Toggles */}
                  <div className="space-y-2">
                    <Label>Maximum applicants (optional)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={MAX_APPLICANTS}
                      value={form.maxApplicants}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        if (!nextValue) {
                          updateForm({ maxApplicants: '' });
                          return;
                        }
                        const parsed = Number(nextValue);
                        if (!Number.isFinite(parsed)) return;
                        updateForm({ maxApplicants: String(Math.min(MAX_APPLICANTS, Math.max(1, parsed))) });
                      }}
                      placeholder="e.g. 20"
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for no cap. Maximum allowed is {MAX_APPLICANTS}.</p>
                  </div>

                 <div className="grid gap-3 sm:grid-cols-2">
                   <div className="rounded-lg border p-3 flex items-center justify-between">
                     <div className="space-y-0.5">
                       <Label className="text-sm">Proposal required</Label>
                       <p className="text-xs text-muted-foreground">Creators pitch before applying</p>
                     </div>
                     <Switch
                       checked={form.proposalRequired}
                       onCheckedChange={(checked) => updateForm({ proposalRequired: checked })}
                       aria-label="Require proposal"
                     />
                   </div>
                   <div className="rounded-lg border p-3 flex items-center justify-between">
                     <div className="space-y-0.5">
                       <Label className="text-sm">Portfolio required</Label>
                       <p className="text-xs text-muted-foreground">Creators submit past work samples</p>
                     </div>
                     <Switch
                       checked={form.portfolioRequired}
                       onCheckedChange={(checked) => updateForm({ portfolioRequired: checked })}
                       aria-label="Require portfolio"
                     />
                   </div>
                 </div>
               </div>
             </div>

             {/* Custom Screening Questions */}
             <div className="space-y-2">
               <SectionRow
                 label="Custom screening questions (optional)"
                 count={form.customScreeningQuestions.length}
                 max={3}
               />
               <p className="text-xs text-muted-foreground">Ask up to 3 custom questions to screen creators during applications.</p>
               {form.customScreeningQuestions.map((question, idx) => (
                 <div key={idx} className="flex gap-2">
                   <Input
                     value={question}
                     onChange={(e) => {
                       const updated = [...form.customScreeningQuestions];
                       updated[idx] = e.target.value;
                       updateForm({ customScreeningQuestions: updated });
                     }}
                     placeholder={`Question ${idx + 1}…`}
                   />
                   <Button
                     type="button"
                     size="icon"
                     variant="ghost"
                     onClick={() => {
                       updateForm({
                         customScreeningQuestions: form.customScreeningQuestions.filter((_, i) => i !== idx),
                       });
                     }}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               ))}
               {form.customScreeningQuestions.length < 3 && (
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={() => updateForm({ customScreeningQuestions: [...form.customScreeningQuestions, ''] })}
                 >
                   <Plus className="mr-2 h-4 w-4" /> Add question
                 </Button>
               )}
             </div>

             {/* Timeline & Campaign Duration */}
             <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
               <p className="mb-4 text-sm font-semibold">Timeline & Duration</p>

               <div className="space-y-3">
                 <div className="grid gap-4 sm:grid-cols-2">
                   <div className="space-y-1.5">
                     <Label>Application deadline (optional)</Label>
                     <Input
                       type="date"
                       value={form.deadlineDate}
                       onChange={(e) => updateForm({ deadlineDate: e.target.value })}
                     />
                     <p className="text-xs text-muted-foreground">Last date creators can apply.</p>
                   </div>
                   <div className="space-y-1.5">
                     <Label>Content submission deadline (optional)</Label>
                     <Input
                       type="date"
                       value={form.contentSubmissionDeadline}
                       onChange={(e) => updateForm({ contentSubmissionDeadline: e.target.value })}
                     />
                     <p className="text-xs text-muted-foreground">When creators must submit their content.</p>
                   </div>
                   <div className="space-y-1.5">
                     <Label>Go-live / publish date (optional)</Label>
                     <Input
                       type="date"
                       value={form.goLiveDate}
                       onChange={(e) => updateForm({ goLiveDate: e.target.value })}
                     />
                     <p className="text-xs text-muted-foreground">When content should go live.</p>
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <Label>Campaign duration (days)</Label>
                   <Input
                     type="number"
                     min={1}
                     max={365}
                     value={form.campaignDuration}
                     onChange={(e) => updateForm({ campaignDuration: e.target.value })}
                     placeholder="e.g. 30"
                   />
                   <p className="text-xs text-muted-foreground">How long the content should remain live (e.g., 30 days).</p>
                 </div>
               </div>
             </div>

           </CardContent>
         </Card>
       )}

       {step === 5 && (
         <Card>
           <CardHeader><CardTitle>Step 5 — References</CardTitle></CardHeader>
          <CardContent className="space-y-5">

              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-4">
                <p className="text-sm font-semibold">Messaging & brand guidelines</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Key message / talking points</Label>
                    <span className="text-xs text-muted-foreground">{form.keyMessage.length} chars</span>
                  </div>
                  <Textarea
                    rows={3}
                    value={form.keyMessage}
                    onChange={(e) => updateForm({ keyMessage: e.target.value })}
                    placeholder="What must be communicated in every creator submission"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Do's and don'ts</Label>
                    <span className="text-xs text-muted-foreground">{form.dosAndDonts.length} chars</span>
                  </div>
                  <Textarea
                    rows={4}
                    value={form.dosAndDonts}
                    onChange={(e) => updateForm({ dosAndDonts: e.target.value })}
                    placeholder="Include brand tone, mandatory claims, and forbidden competitor mentions"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Hashtags & mentions</Label>
                  <Textarea
                    rows={2}
                    value={form.hashtagsMentions}
                    onChange={(e) => updateForm({ hashtagsMentions: e.target.value })}
                    placeholder="Example: #ChamChamGlow #Ad @brand_handle"
                  />
                </div>
              </div>

            <div className="space-y-1.5">
              <Label>Cover image</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input value={form.coverImageUrl} onChange={(e) => updateForm({ coverImageUrl: e.target.value })} placeholder="https://…" />
                <Button asChild variant="outline" disabled={isUploading}>
                  <Label htmlFor="brand-offer-cover-upload" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />{isUploading ? 'Uploading…' : 'Upload'}
                  </Label>
                </Button>
              </div>
              {form.coverImageUrl && (
                <img src={form.coverImageUrl} alt="Cover preview" className="mt-2 h-32 w-full rounded-md object-cover" />
              )}
              <p className="text-xs text-muted-foreground">Recommended: 1200 × 630 px, max 5 MB (JPEG/PNG/WebP).</p>
              <Input id="brand-offer-cover-upload" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void uploadCover(e.target.files?.[0])} />
            </div>

            <div className="space-y-2">
              <SectionRow
                label="Reference content links"
                count={form.referenceUrls.filter(Boolean).length}
                max={5}
                hint="links"
              />
              <p className="text-xs text-muted-foreground">Add inspiration posts/videos for desired tone, style, and execution quality.</p>
              {form.referenceUrls.map((value, index) => (
                <div key={`ref-${index}`} className="flex gap-2">
                  <Input value={value} onChange={(e) => updateReferenceUrl(index, e.target.value)} placeholder={`https://example.com/reference-${index + 1}`} />
                  {form.referenceUrls.length > 1 && (
                    <Button type="button" size="icon" variant="ghost" onClick={() => updateForm({ referenceUrls: form.referenceUrls.filter((_, i) => i !== index) })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {form.referenceUrls.length < 5 && (
                <Button type="button" variant="outline" size="sm" onClick={() => updateForm({ referenceUrls: [...form.referenceUrls, ''] })}>
                  <Plus className="mr-2 h-4 w-4" /> Add link
                </Button>
              )}
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-4">
              <p className="text-sm font-semibold">Rights, terms & outcomes</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Usage rights</Label>
                  <span className="text-xs text-muted-foreground">{form.usageRights.length} chars</span>
                </div>
                <Textarea
                  rows={3}
                  value={form.usageRights}
                  onChange={(e) => updateForm({ usageRights: e.target.value })}
                  placeholder="Can brand repurpose creator content? For which channels and for how long?"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Terms & conditions</Label>
                  <span className="text-xs text-muted-foreground">{form.termsAndConditions.length} chars</span>
                </div>
                <Textarea
                  rows={3}
                  value={form.termsAndConditions}
                  onChange={(e) => updateForm({ termsAndConditions: e.target.value })}
                  placeholder="Legal/disclosure requirements, payment caveats, cancellation policy, compliance notes"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Expectations / desired outcomes</Label>
                  <span className="text-xs text-muted-foreground">{form.expectedOutcomes.length} chars</span>
                </div>
                <Textarea
                  rows={3}
                  value={form.expectedOutcomes}
                  onChange={(e) => updateForm({ expectedOutcomes: e.target.value })}
                  placeholder="What success looks like (quality bar, CTA behavior, expected audience response)"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

       {step === 6 && (
         <Card>
           <CardHeader><CardTitle>Step 6 — Review & Publish</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {form.coverImageUrl && (
              <img src={form.coverImageUrl} alt="Cover" className="h-40 w-full rounded-lg object-cover" />
            )}
            <div>
              <p className="text-lg font-semibold">{form.title || 'Untitled offer'}</p>
              <p className="mt-1 text-muted-foreground">{form.brief || 'No brief yet.'}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-lg border p-3 space-y-1">
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Offer details</p>
                <p>Primary platform: <span className="font-medium capitalize">{form.offerType || 'Not selected'}</span></p>
                <p>Campaign goal: <span className="font-medium">{form.campaignGoal || 'Not selected'}</span></p>
                <p>Visibility: <span className="font-medium capitalize">{form.visibility}</span></p>
                {form.deadlineDate && <p>Deadline: <span className="font-medium">{form.deadlineDate}</span></p>}
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Budget & Payment</p>
                {form.budgetType === 'barter_only' ? (
                  <p>Budget type: <span className="font-medium">Barter only</span></p>
                ) : (
                  <>
                    <p>Budget type: <span className="font-medium capitalize">{(form.budgetType || 'fixed').replace('_', ' ')}</span></p>
                    <p className="text-base font-semibold">
                      PKR {Number(form.budgetMin || 0).toLocaleString()}
                      {form.budgetType !== 'fixed' ? ` – ${Number(form.budgetMax || 0).toLocaleString()}` : ''}
                    </p>
                    {form.paymentStructure && (
                      <p>Payment: <span className="font-medium">{form.paymentStructure === 'split_50_50' ? '50% upfront + 50% on delivery' : 'Full upfront into escrow'}</span></p>
                    )}
                  </>
                )}
                {(form.budgetType === 'barter_only' || form.budgetType === 'paid_and_barter') && form.barterProductDesc && (
                  <p>Barter: <span className="font-medium">{form.barterProductDesc}</span></p>
                )}
                {form.barterEstimatedValue && (
                  <p>Barter value: <span className="font-medium">PKR {Number(form.barterEstimatedValue).toLocaleString()}</span></p>
                )}
                <p>Travel costs: <span className="font-medium">{form.travelCostsCovered ? 'Covered by brand' : 'Not covered'}</span></p>
                {form.targetCity && <p>City: <span className="font-medium">{form.targetCity}</span></p>}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Platforms & formats</p>
              <div className="flex flex-wrap gap-1.5">
                {form.targetPlatforms.map((p) => {
                  if (!isSupportedPlatform(p)) {
                    return <Badge key={p} variant="secondary" className="capitalize">{p}</Badge>;
                  }
                  const { icon: Icon, label } = platformMeta[p];
                  return (
                    <Badge key={p} variant="secondary" className="inline-flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </Badge>
                  );
                })}
                {form.contentFormats.map((f) => <Badge key={f} variant="outline">{f.replace('_', ' ')}</Badge>)}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Deliverables ({form.deliverableItems.length} types · {form.deliverableItems.reduce((t, i) => t + i.quantity, 0)} units)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {form.deliverableItems.map((item) => (
                  <Badge key={item.id} variant="outline">{item.quantity}× {item.label}</Badge>
                ))}
              </div>
            </div>
            {(form.categories.length > 0 || form.niches.length > 0) && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categories / Niches</p>
                <div className="flex flex-wrap gap-1.5">
                  {form.categories.map((c) => <Badge key={c} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{c}</Badge>)}
                  {form.niches.map((n) => <Badge key={n} className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">{n}</Badge>)}
                </div>
              </div>
            )}
            {(form.keyMessage || form.dosAndDonts || form.hashtagsMentions || form.usageRights || form.termsAndConditions || form.expectedOutcomes || form.referenceUrls.some(Boolean)) && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">References & Guidelines</p>
                <div className="space-y-1 text-muted-foreground">
                  {form.keyMessage && <p><span className="font-medium text-foreground">Key message:</span> {form.keyMessage}</p>}
                  {form.dosAndDonts && <p><span className="font-medium text-foreground">Do's/Don'ts:</span> {form.dosAndDonts}</p>}
                  {form.hashtagsMentions && <p><span className="font-medium text-foreground">Hashtags & mentions:</span> {form.hashtagsMentions}</p>}
                  {form.usageRights && <p><span className="font-medium text-foreground">Usage rights:</span> {form.usageRights}</p>}
                  {form.termsAndConditions && <p><span className="font-medium text-foreground">Terms:</span> {form.termsAndConditions}</p>}
                  {form.expectedOutcomes && <p><span className="font-medium text-foreground">Expected outcomes:</span> {form.expectedOutcomes}</p>}
                  {form.referenceUrls.filter(Boolean).length > 0 && (
                    <p><span className="font-medium text-foreground">Reference links:</span> {form.referenceUrls.filter(Boolean).join(', ')}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </motion.div>

      <div className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 flex gap-2 rounded-xl border border-border bg-background/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <Button type="button" variant="outline" className="flex-1" disabled={step === 1} onClick={() => {
          const nextStep = Math.max(1, step - 1);
          setStep(nextStep);
          persistDraft(form, nextStep);
        }}>
          Back
        </Button>
         {step < 6 ? (
           <Button type="button" className="flex-1" onClick={() => {
             if (!canContinue) {
               toast.error(`Please complete: ${getMissingFields(step).join(', ')}`);
               return;
             }
             const nextStep = Math.min(6, step + 1);
             setStep(nextStep);
             persistDraft(form, nextStep);
           }}>
             Next <ArrowRight className="ml-2 h-4 w-4" />
           </Button>
         ) : (
          <div className="flex flex-1 gap-2">
            <Button type="button" variant="outline" className="flex-1" disabled={isSaving} onClick={() => void submit(false)}>
              {isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save Draft'}
            </Button>
            <Button type="button" className="flex-1" disabled={isSaving} onClick={() => void submit(true)}>
              {isSaving ? 'Publishing...' : isEditMode ? 'Save & Publish' : 'Publish Offer'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
