'use client';

import { type ComponentType, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Camera, Check, Instagram, Lock, MessageCircle, Music2, Plus, Trash2, Upload, X, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CAMPAIGN_GOAL_SECTIONS } from '@/lib/offer-campaign-goals';
import { offersService } from '@/services/offers.service';
import { uploadsService } from '@/services/uploads.service';
import { toast } from 'sonner';

const DRAFT_KEY = 'brand-offer-wizard-draft-v1';
const steps = ['Basics', 'Deliverables', 'Budget & Targeting', 'References', 'Publish'];

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
  budgetMin: string;
  budgetMax: string;
  deadlineDate: string;
  targetCity: string;
  targetLanguage: string;
  minFollowers: string;
  minEngagementRate: string;
  preferredDeliveryDays: string;
  slots: string;
  categories: string[];
  niches: string[];
  tags: string[];
  requirements: string;
  coverImageUrl: string;
  referenceUrls: string[];
  visibility: Visibility;
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
  budgetMin: '25000',
  budgetMax: '80000',
  deadlineDate: '',
  targetCity: '',
  targetLanguage: '',
  minFollowers: '',
  minEngagementRate: '',
  preferredDeliveryDays: '',
  slots: '',
  categories: [],
  niches: [],
  tags: [],
  requirements: '',
  coverImageUrl: '',
  referenceUrls: [''],
  visibility: 'public',
};

type SupportedPlatform = (typeof platformOptions)[number];

const isSupportedPlatform = (value: unknown): value is SupportedPlatform =>
  typeof value === 'string' && platformOptions.includes(value as SupportedPlatform);

const normalizeDraftForm = (rawForm?: Partial<OfferForm>): OfferForm => {
  const pf = rawForm ?? {};
  return {
    ...defaultForm,
    ...pf,
    offerType: isSupportedPlatform(pf.offerType) ? pf.offerType : defaultForm.offerType,
    visibility: pf.visibility === 'private' ? 'private' : 'public',
    // Guarantee every array field is always an array regardless of stale/corrupt localStorage data.
    categories: Array.isArray(pf.categories) ? pf.categories : defaultForm.categories,
    niches: Array.isArray(pf.niches) ? pf.niches : defaultForm.niches,
    tags: Array.isArray(pf.tags) ? pf.tags : defaultForm.tags,
    targetPlatforms: isSupportedPlatform(pf.offerType)
      ? [pf.offerType]
      : Array.isArray(pf.targetPlatforms)
        ? pf.targetPlatforms
        : defaultForm.targetPlatforms,
    contentFormats: Array.isArray(pf.contentFormats) ? pf.contentFormats : defaultForm.contentFormats,
    referenceUrls: Array.isArray(pf.referenceUrls) ? pf.referenceUrls : defaultForm.referenceUrls,
    deliverableItems: Array.isArray(pf.deliverableItems) ? pf.deliverableItems : defaultForm.deliverableItems,
    selectedServiceKeys: Array.isArray(pf.selectedServiceKeys) ? pf.selectedServiceKeys : defaultForm.selectedServiceKeys,
  };
};

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

export function BrandOfferWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const prevOfferTypeRef = useRef<string>('');
  const [form, setForm] = useState<OfferForm>(() => {
    if (typeof window === 'undefined') return defaultForm;
    const raw = window.localStorage.getItem(DRAFT_KEY);
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

  const serviceMap = useMemo(() => new Map(serviceOptions.map((entry) => [entry.key, entry.label])), [serviceOptions]);

  const persistDraft = (nextForm: OfferForm, nextStep = step) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ step: nextStep, form: nextForm }));
    setHasSavedDraft(true);
  };

  const updateForm = (patch: Partial<OfferForm>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      persistDraft(next);
      return next;
    });
  };

  const getMissingFields = (targetStep: number): string[] => {
    if (targetStep === 1) {
      const missing: string[] = [];
      if (!form.title.trim()) missing.push('Title');
      if (!form.brief.trim()) missing.push('Brief');
      if (!form.campaignGoal.trim()) missing.push('Campaign goal');
      if (!form.offerType.trim()) missing.push('Primary platform');
      return missing;
    }
    if (targetStep === 2) {
      const missing: string[] = [];
      if (!form.deliverableItems.length) missing.push('At least one deliverable');
      return missing;
    }
    if (targetStep === 3) {
      const missing: string[] = [];
      if (!form.budgetMin) missing.push('Budget min');
      if (!form.budgetMax) missing.push('Budget max');
      if (Number(form.budgetMin || 0) > Number(form.budgetMax || 0)) missing.push('Budget min must be <= budget max');
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
  }, [form.deliverableItems, form.offerType, form.selectedServiceKeys, form.targetPlatforms]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setHasSavedDraft(Boolean(window.localStorage.getItem(DRAFT_KEY)));
  }, []);

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
        ...new Set(
          form.deliverableItems.map((item) => item.id.split('::')[0])
        ),
      ];

      const created = await offersService.createOffer({
        title: form.title.trim(),
        brief: form.brief.trim(),
        offerType: form.offerType.trim(),
        campaignGoal: form.campaignGoal.trim(),
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        deliverables: buildDeliverablesText(),
        contentFormats: form.contentFormats.length > 0 ? form.contentFormats.join(', ') : undefined,
        targetPlatforms: autoPlatforms.join(', '),
        categories: form.categories.join(', '),
        niches: form.niches.join(', '),
        tags: form.tags.join(', '),
        requirements: form.requirements.trim() || undefined,
        referenceUrls: form.referenceUrls.map((url) => url.trim()).filter(Boolean).join('\n') || undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        deadlineDate: form.deadlineDate || undefined,
        targetCity: form.targetCity || undefined,
        targetLanguage: form.targetLanguage || undefined,
        minFollowers: form.minFollowers ? Number(form.minFollowers) : undefined,
        minEngagementRate: form.minEngagementRate ? Number(form.minEngagementRate) : undefined,
        preferredDeliveryDays: form.preferredDeliveryDays ? Number(form.preferredDeliveryDays) : undefined,
        slots: form.slots ? Number(form.slots) : undefined,
        visibility: form.visibility,
      });

      if (publish) {
        await offersService.updateOfferStatus(created.id, 'PUBLISHED');
        toast.success('Offer published');
      } else {
        toast.success('Offer saved as draft');
      }

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(DRAFT_KEY);
      }
      setHasSavedDraft(false);
      router.push(`/brand/offers/${created.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create offer');
    } finally {
      setIsSaving(false);
    }
  };

  const restoreDraft = () => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(DRAFT_KEY);
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
    window.localStorage.removeItem(DRAFT_KEY);
    setHasSavedDraft(false);
    toast.success('Saved draft cleared');
  };

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
            <h1 className="text-2xl font-bold md:text-3xl">Create Offer</h1>
            <p className="text-muted-foreground">Build a detailed brand requirement in five guided steps.</p>
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
              <SectionRow label="Campaign goal *" count={form.campaignGoal ? 1 : 0} max={1} hint="selected" />
              <div className="grid gap-3 xl:grid-cols-2">
                {CAMPAIGN_GOAL_SECTIONS.map((section) => (
                  <div key={section.label} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                    <p className="mb-3 text-sm font-semibold">{section.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {section.options.map((goal) => {
                        const isSelected = form.campaignGoal === goal;
                        return (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => updateForm({ campaignGoal: goal })}
                            className={`rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors sm:text-sm ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                : 'border-border bg-background hover:border-primary/40 hover:bg-primary/5'
                            }`}
                          >
                            {goal}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Choose the main business outcome you want this creator campaign to optimize for.</p>
            </div>
            <div className="space-y-2">
              <SectionRow label="Primary platform *" count={form.offerType ? 1 : 0} max={1} hint="selected" />
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
               <p className="text-xs text-muted-foreground">Your primary platform selection will determine available deliverable options in Step 2 (Deliverables).</p>
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
            <div className="grid gap-4 sm:grid-cols-3">
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
              <ChipInput
                label="Tags"
                chips={form.tags}
                onAdd={(v) => updateForm({ tags: [...form.tags, v] })}
                onRemove={(i) => updateForm({ tags: form.tags.filter((_, idx) => idx !== i) })}
                placeholder="ramadan, launch…"
                max={10}
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
          <CardHeader><CardTitle>Step 3 — Budget & Targeting</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Budget range (PKR) <span className="text-destructive">*</span></Label>
                {form.budgetMin && form.budgetMax && Number(form.budgetMin) <= Number(form.budgetMax) && (
                  <span className="text-xs text-muted-foreground">
                    PKR {Number(form.budgetMin).toLocaleString()} – {Number(form.budgetMax).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Minimum</Label>
                  <Input type="number" min={0} value={form.budgetMin} onChange={(e) => updateForm({ budgetMin: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Maximum</Label>
                  <Input type="number" min={0} value={form.budgetMax} onChange={(e) => updateForm({ budgetMax: e.target.value })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">This is the budget you're willing to offer per creator. Creators will see this range when browsing.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Target city</Label>
                <Input value={form.targetCity} onChange={(e) => updateForm({ targetCity: e.target.value })} placeholder="Karachi" />
                <p className="text-xs text-muted-foreground">Leave blank for nationwide.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Target language</Label>
                <Input value={form.targetLanguage} onChange={(e) => updateForm({ targetLanguage: e.target.value })} placeholder="Urdu" />
              </div>
              <div className="space-y-1.5">
                <Label>Application deadline</Label>
                <Input type="date" value={form.deadlineDate} onChange={(e) => updateForm({ deadlineDate: e.target.value })} />
                <p className="text-xs text-muted-foreground">Offer auto-closes after this date.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Min followers</Label>
                <Input type="number" min={0} value={form.minFollowers} onChange={(e) => updateForm({ minFollowers: e.target.value })} placeholder="10000" />
              </div>
              <div className="space-y-1.5">
                <Label>Min engagement %</Label>
                <Input type="number" min={0} max={100} step="0.1" value={form.minEngagementRate} onChange={(e) => updateForm({ minEngagementRate: e.target.value })} placeholder="2.5" />
              </div>
              <div className="space-y-1.5">
                <Label>Delivery days</Label>
                <Input type="number" min={1} value={form.preferredDeliveryDays} onChange={(e) => updateForm({ preferredDeliveryDays: e.target.value })} placeholder="14" />
                <p className="text-xs text-muted-foreground">From approval to delivery.</p>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Creator slots
                  {form.slots ? <span className="ml-1 text-xs text-muted-foreground">({form.slots} open)</span> : null}
                </Label>
                <Input type="number" min={1} value={form.slots} onChange={(e) => updateForm({ slots: e.target.value })} placeholder="5" />
                <p className="text-xs text-muted-foreground">Max creators you'll accept.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Requirements & do/don'ts</Label>
                <span className="text-xs text-muted-foreground">{form.requirements.length} chars</span>
              </div>
              <Textarea rows={4} value={form.requirements} onChange={(e) => updateForm({ requirements: e.target.value })} placeholder="Usage rights, do/don't list, legal disclaimers, approval flow..." />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>Step 4 — References</CardTitle></CardHeader>
          <CardContent className="space-y-5">
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
                label="Reference links"
                count={form.referenceUrls.filter(Boolean).length}
                max={5}
                hint="links"
              />
              <p className="text-xs text-muted-foreground">Add inspiration posts, competitor campaigns, or mood-board links.</p>
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
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader><CardTitle>Step 5 — Review & Publish</CardTitle></CardHeader>
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
                {form.slots && <p>Slots: <span className="font-medium">{form.slots}</span></p>}
                {form.deadlineDate && <p>Deadline: <span className="font-medium">{form.deadlineDate}</span></p>}
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Budget</p>
                <p className="text-base font-semibold">PKR {Number(form.budgetMin || 0).toLocaleString()} – {Number(form.budgetMax || 0).toLocaleString()}</p>
                {form.targetCity && <p>City: <span className="font-medium">{form.targetCity}</span></p>}
                {form.minFollowers && <p>Min followers: <span className="font-medium">{Number(form.minFollowers).toLocaleString()}</span></p>}
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
            {(form.categories.length > 0 || form.niches.length > 0 || form.tags.length > 0) && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categories / Niches / Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {form.categories.map((c) => <Badge key={c} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{c}</Badge>)}
                  {form.niches.map((n) => <Badge key={n} className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">{n}</Badge>)}
                  {form.tags.map((t) => <Badge key={t} variant="outline">#{t}</Badge>)}
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
        {step < 5 ? (
          <Button type="button" className="flex-1" onClick={() => {
            if (!canContinue) {
              toast.error(`Please complete: ${getMissingFields(step).join(', ')}`);
              return;
            }
            const nextStep = Math.min(5, step + 1);
            setStep(nextStep);
            persistDraft(form, nextStep);
          }}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <div className="flex flex-1 gap-2">
            <Button type="button" variant="outline" className="flex-1" disabled={isSaving} onClick={() => void submit(false)}>
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button type="button" className="flex-1" disabled={isSaving} onClick={() => void submit(true)}>
              {isSaving ? 'Publishing...' : 'Publish Offer'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

