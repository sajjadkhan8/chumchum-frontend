"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ElementType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Clock,
  DollarSign,
  Gift,
  Lock,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { CreatorPackage, Platform } from "@/types";
import { creatorsService } from "@/services/creators.service";
import { useCreatorPackagesStore } from "@/store/creator-packages-store";
import { useAuthStore } from "@/store/auth-store";
import { uploadsService } from "@/services/uploads.service";
import { PlatformIconBadge, platformMeta } from "@/components/platform-icons";
import { categoryOptions, getCategoryLabel, normalizeCategories, normalizeCategory } from "@/lib/categories";

const DRAFT_KEY = "creator-package-draft-v3";
const PRICE_LIMITS = { min: 100, max: 1_000_000 };
const DELIVERY_LIMITS = { min: 1, max: 60 };
const REVISION_LIMITS = { min: 0, max: 10 };

const formatPkr = (value: number | string): string =>
  `PKR ${Number(value || 0).toLocaleString()}`;

const steps = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Services" },
  { id: 3, label: "Pricing" },
  { id: 4, label: "Media" },
  { id: 5, label: "Publish" },
];

const platforms = [
  { id: "instagram", label: platformMeta.instagram.label, icon: platformMeta.instagram.icon },
  { id: "youtube", label: platformMeta.youtube.label, icon: platformMeta.youtube.icon },
  { id: "tiktok", label: platformMeta.tiktok.label, icon: platformMeta.tiktok.icon },
  { id: "facebook", label: platformMeta.facebook.label, icon: platformMeta.facebook.icon },
  { id: "snapchat", label: platformMeta.snapchat.label, icon: platformMeta.snapchat.icon },
];

const platformOrder: Platform[] = ["instagram", "youtube", "tiktok", "facebook", "snapchat"];

interface ServiceOption {
  key: string;
  label: string;
  description: string;
}

interface ServiceSection {
  label: string;
  items: ServiceOption[];
}

interface DeliverableItem {
  serviceKey: string;
  label: string;
  quantity: number;
}

const serviceCatalogByPlatform: Record<Platform, ServiceSection[]> = {
  instagram: [
    {
      label: "Short-form video",
      items: [
        { key: "ig_reel_15", label: "Reel (15s)", description: "Short punchy reel with fast hook" },
        { key: "ig_reel_30", label: "Reel (30s)", description: "Standard reel for product showcase" },
        { key: "ig_reel_60", label: "Reel (60s)", description: "Longer storytelling reel" },
      ],
    },
    {
      label: "Stories",
      items: [
        { key: "ig_story_1", label: "Story Frame (1)", description: "Single story frame with CTA" },
        { key: "ig_story_3", label: "Story Sequence (3)", description: "3-frame campaign sequence" },
        { key: "ig_story_5", label: "Story Sequence (5)", description: "5-frame deeper campaign arc" },
      ],
    },
    {
      label: "Feed posts",
      items: [
        { key: "ig_photo_single", label: "Single Photo Post", description: "Static feed image with caption" },
        { key: "ig_carousel_3_5", label: "Carousel (3-5 slides)", description: "Multi-slide product or how-to post" },
      ],
    },
    {
      label: "Live & collab",
      items: [
        { key: "ig_live", label: "Instagram Live", description: "Live mention, Q&A, or walkthrough" },
        { key: "ig_collab_post", label: "Collab Post", description: "Joint post with brand account" },
      ],
    },
  ],
  youtube: [
    {
      label: "Long-form video",
      items: [
        { key: "yt_dedicated_video", label: "Dedicated Video", description: "Full video made for brand" },
        { key: "yt_segment_30", label: "Sponsored Segment (30s)", description: "Mid-roll or pre-roll ad read" },
        { key: "yt_segment_60", label: "Sponsored Segment (60s)", description: "Extended integration segment" },
      ],
    },
    {
      label: "Shorts",
      items: [
        { key: "yt_short_15", label: "YouTube Short (15s)", description: "Fast vertical short for feed" },
        { key: "yt_short_60", label: "YouTube Short (60s)", description: "Full-length short with CTA" },
      ],
    },
    {
      label: "Live",
      items: [
        { key: "yt_live_mention", label: "Live Stream Mention", description: "Brand shoutout during live" },
        { key: "yt_live_unboxing", label: "Live Unboxing", description: "Real-time unboxing during stream" },
      ],
    },
    {
      label: "Community & extras",
      items: [
        { key: "yt_pinned_comment", label: "Pinned Comment", description: "Brand link pinned in comments" },
        { key: "yt_description_link", label: "Description Link", description: "Brand URL in description" },
      ],
    },
  ],
  tiktok: [
    {
      label: "Video content",
      items: [
        { key: "tt_video_15", label: "TikTok Video (15s)", description: "Quick trend-riding short video" },
        { key: "tt_video_30", label: "TikTok Video (30s)", description: "Standard branded TikTok video" },
        { key: "tt_video_60", label: "TikTok Video (60s)", description: "Storytelling or tutorial format" },
      ],
    },
    {
      label: "Live & interactive",
      items: [
        { key: "tt_live", label: "TikTok Live", description: "Live mention or product demo" },
        { key: "tt_promo_code", label: "Promo Code Drop", description: "Exclusive discount announced live" },
      ],
    },
    {
      label: "Duet & stitch",
      items: [
        { key: "tt_duet", label: "Duet Video", description: "Side-by-side reaction format" },
        { key: "tt_stitch", label: "Stitch Video", description: "Brand clip plus creator commentary" },
      ],
    },
    {
      label: "Shop & links",
      items: [
        { key: "tt_shop_tag", label: "TikTok Shop Tag", description: "Product tagged for direct purchase" },
        { key: "tt_bio_link", label: "Bio Link Feature", description: "Brand link in profile bio" },
      ],
    },
  ],
  facebook: [
    {
      label: "Video",
      items: [
        { key: "fb_reel", label: "Facebook Reel", description: "Short vertical video for Reels tab" },
        { key: "fb_feed_video", label: "In-Feed Video", description: "Standard video in Facebook feed" },
        { key: "fb_long_video", label: "Long-Form Video", description: "Video over 3 minutes" },
      ],
    },
    {
      label: "Feed posts",
      items: [
        { key: "fb_photo", label: "Photo Post", description: "Static image with caption and tag" },
        { key: "fb_album", label: "Album Post", description: "Multi-photo campaign post" },
      ],
    },
    {
      label: "Stories",
      items: [
        { key: "fb_story", label: "Facebook Story", description: "24-hour story with CTA" },
        { key: "fb_story_3", label: "Story Sequence (3)", description: "3-frame story narrative" },
      ],
    },
    {
      label: "Live & groups",
      items: [
        { key: "fb_live", label: "Facebook Live", description: "Scheduled live segment" },
        { key: "fb_group_post", label: "Group Post", description: "Brand content in audience group" },
      ],
    },
  ],
  snapchat: [
    {
      label: "Snaps & stories",
      items: [
        { key: "sc_snap_photo", label: "Snap (Photo)", description: "Direct photo snap to followers" },
        { key: "sc_snap_video", label: "Snap (Video, 10s)", description: "Short video snap" },
        { key: "sc_story_1", label: "Story Frame (1)", description: "Single frame with brand tag" },
        { key: "sc_story_3_5", label: "Story Sequence (3-5)", description: "Multi-snap story arc" },
      ],
    },
    {
      label: "Spotlight",
      items: [
        { key: "sc_spotlight_15", label: "Spotlight Video (15s)", description: "Short video for Spotlight tab" },
        { key: "sc_spotlight_60", label: "Spotlight Video (60s)", description: "Extended Spotlight submission" },
      ],
    },
    {
      label: "Lens & AR",
      items: [
        { key: "sc_custom_lens", label: "Custom Lens Feature", description: "Use and promote brand AR lens" },
        { key: "sc_geofilter", label: "Geofilter Promo", description: "Location-based branded filter" },
      ],
    },
    {
      label: "Map & links",
      items: [
        { key: "sc_map_checkin", label: "Snap Map Check-in", description: "Location story pinned to map" },
        { key: "sc_swipe_up", label: "Swipe-Up Link", description: "Brand URL in story swipe-up" },
      ],
    },
  ],
};

const parseTags = (value: string): string[] =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const normalizeTag = (value: string): string =>
  value
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ");

const MAX_TAGS = 5;

interface WizardFormData {
  title: string;
  category: string;
  platform: string;
  fullDescription: string;
  tags: string;
  responseTime: string;
  selectedServiceKeys: string[];
  deliverableItems: DeliverableItem[];
  serviceNotes: string;
  deliveryDays: string;
  revisions: string;
  dealType: "paid" | "barter" | "hybrid";
  price: string;
  barterExpectations: string;
  minimumBarterValue: string;
  hybridCashAmount: string;
  thumbnailUrl: string;
  previousWorkUrls: string[];
  visibility: "public" | "private";
  status: "active" | "draft" | "under_review";
}

type BoundedNumberField = keyof Pick<
  WizardFormData,
  "price" | "hybridCashAmount" | "minimumBarterValue" | "deliveryDays" | "revisions"
>;

const getBoundedFieldError = (value: string, limits: { min: number; max: number }, label: string): string | null => {
  if (!value.trim()) return `${label} is required`;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return `${label} must be a number`;
  if (numericValue < limits.min || numericValue > limits.max) {
    return `${label} must be between ${limits.min.toLocaleString()} and ${limits.max.toLocaleString()}`;
  }
  return null;
};

const defaultForm: WizardFormData = {
  title: "",
  category: "",
  platform: "",
  fullDescription: "",
  tags: "",
  responseTime: "Within 3 hours",
  selectedServiceKeys: [],
  deliverableItems: [],
  serviceNotes: "",
  deliveryDays: "5",
  revisions: "2",
  dealType: "paid",
  price: "",
  barterExpectations: "",
  minimumBarterValue: "",
  hybridCashAmount: "",
  thumbnailUrl: "",
  previousWorkUrls: [""],
  visibility: "public",
  status: "active",
};

const isDefaultDraft = (formData: WizardFormData, currentStep: number) => (
  currentStep === 1
  && formData.title === defaultForm.title
  && formData.fullDescription === defaultForm.fullDescription
  && formData.tags === defaultForm.tags
  && formData.responseTime === defaultForm.responseTime
  && formData.selectedServiceKeys.length === 0
  && formData.deliverableItems.length === 0
  && formData.serviceNotes === defaultForm.serviceNotes
  && formData.deliveryDays === defaultForm.deliveryDays
  && formData.revisions === defaultForm.revisions
  && formData.dealType === defaultForm.dealType
  && formData.price === defaultForm.price
  && formData.barterExpectations === defaultForm.barterExpectations
  && formData.minimumBarterValue === defaultForm.minimumBarterValue
  && formData.hybridCashAmount === defaultForm.hybridCashAmount
  && formData.thumbnailUrl === defaultForm.thumbnailUrl
  && formData.previousWorkUrls.length === defaultForm.previousWorkUrls.length
  && formData.previousWorkUrls.every((url, index) => url === defaultForm.previousWorkUrls[index])
  && formData.visibility === defaultForm.visibility
  && formData.status === defaultForm.status
);

const buildDeliverableItemsFromLegacy = (deliverables: string[] = []): DeliverableItem[] =>
  deliverables
    .map((label, index) => ({
      serviceKey: `legacy-${index}`,
      label: label.trim(),
      quantity: 1,
    }))
    .filter((item) => item.label.length > 0);

interface CreatorPackageWizardProps {
  mode: "create" | "edit";
  initialPackage?: CreatorPackage;
}

const panelClass =
  "rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]";

const inputClass =
  "h-10 w-full rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] shadow-none transition-colors duration-150 focus-visible:border-[#2d6b4e] focus-visible:ring-4 focus-visible:ring-[#2d6b4e]/8 focus-visible:ring-offset-0";

const textareaClass =
  "w-full rounded-xl border-2 border-[#dce6df] bg-white px-3.5 py-3 text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] shadow-none transition-colors duration-150 focus-visible:outline-none focus-visible:border-[#2d6b4e] focus-visible:ring-4 focus-visible:ring-[#2d6b4e]/8 resize-none";

const labelClass = "text-[10px] font-bold uppercase tracking-widest text-[#7a8f82]";

const sectionTitle = "text-base font-bold text-[#1e3d2e] tracking-tight";

export function CreatorPackageWizard({ mode, initialPackage }: CreatorPackageWizardProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const creatorProfile = useAuthStore((state) => state.creatorProfile);
  const setCreatorProfile = useAuthStore((state) => state.setCreatorProfile);
  const createPackage = useCreatorPackagesStore((state) => state.createPackage);
  const updatePackage = useCreatorPackagesStore((state) => state.updatePackage);
  const [currentStep, setCurrentStep] = useState(1);
  const wizardTopRef = useRef<HTMLDivElement | null>(null);
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftNoticeDismissed, setDraftNoticeDismissed] = useState(false);
  const draftKey = useMemo(
    () => (user?.id ? `${DRAFT_KEY}:${user.id}` : null),
    [user?.id],
  );

  const initialForm = useMemo<WizardFormData>(() => {
    if (!initialPackage) return defaultForm;

    return {
      title: initialPackage.title,
      category: normalizeCategory(initialPackage.category),
      platform: initialPackage.platform,
      fullDescription: initialPackage.fullDescription,
      tags: initialPackage.tags.join(", "),
      responseTime: initialPackage.responseTime,
      selectedServiceKeys: [],
      deliverableItems: buildDeliverableItemsFromLegacy(initialPackage.deliverables),
      serviceNotes: "",
      deliveryDays: String(initialPackage.deliveryDays),
      revisions: String(initialPackage.revisions || 0),
      dealType: initialPackage.dealType,
      price: String(initialPackage.price || ""),
      barterExpectations: initialPackage.creatorExpectations || "",
      minimumBarterValue: initialPackage.barterValue?.match(/\d[\d,]*/)?.[0]?.replace(/,/g, "") || "",
      hybridCashAmount: String(initialPackage.hybridCashAmount || ""),
      thumbnailUrl: initialPackage.thumbnail,
      previousWorkUrls: initialPackage.mediaUrls?.length ? initialPackage.mediaUrls : [""],
      visibility: initialPackage.visibility,
      status: initialPackage.status === "draft" ? "draft" : initialPackage.status === "under_review" ? "under_review" : "active",
    };
  }, [initialPackage]);

  const [formData, setFormData] = useState<WizardFormData>(initialForm);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [uploadingSampleIndex, setUploadingSampleIndex] = useState<number | null>(null);
  const [isLoadingPlatformOptions, setIsLoadingPlatformOptions] = useState(true);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [tagInput, setTagInput] = useState("");

  const scrollWizardToTop = useCallback(() => {
    requestAnimationFrame(() => {
      const top = wizardTopRef.current
        ? wizardTopRef.current.getBoundingClientRect().top + window.scrollY - 88
        : 0;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  }, []);

  const goToStep = useCallback((nextStep: number | ((step: number) => number)) => {
    setCurrentStep((step) => {
      const resolvedStep = typeof nextStep === "function" ? nextStep(step) : nextStep;
      const boundedStep = Math.min(steps.length, Math.max(1, resolvedStep));
      if (boundedStep !== step) scrollWizardToTop();
      return boundedStep;
    });
  }, [scrollWizardToTop]);

  const serviceSections = useMemo(() => {
    const platform = formData.platform as Platform;
    return serviceCatalogByPlatform[platform] || [];
  }, [formData.platform]);

  const serviceOptions = useMemo(
    () => serviceSections.flatMap((section) => section.items),
    [serviceSections]
  );

  const selectedServiceSet = useMemo(
    () => new Set(formData.selectedServiceKeys),
    [formData.selectedServiceKeys]
  );

  const serviceLabelMap = useMemo(
    () => new Map(serviceOptions.map((option) => [option.key, option.label])),
    [serviceOptions]
  );

  const tagsList = useMemo(() => parseTags(formData.tags), [formData.tags]);

  const resolvedDeliverables = useMemo(() => {
    const items = [
      ...formData.deliverableItems.map((item) =>
        item.quantity > 1 ? `${item.quantity}x ${item.label}` : item.label
      ),
      formData.serviceNotes?.trim() ? `Notes: ${formData.serviceNotes.trim()}` : undefined,
    ].filter((item): item is string => Boolean(item));

    if (items.length > 0) return items;
    if (initialPackage?.deliverables?.length) return initialPackage.deliverables;
    return ["Custom deliverable - confirm scope in chat"];
  }, [formData.deliverableItems, formData.serviceNotes, initialPackage?.deliverables]);

  useEffect(() => {
    const deriveConnectedPlatforms = (platformsList: { platform: Platform; profileUrl?: string }[]) => {
      const connected = new Set<Platform>();
      platformsList.forEach((account) => {
        if (account.profileUrl) connected.add(account.platform);
      });
      return platformOrder.filter((platform) => connected.has(platform));
    };

    let isMounted = true;

    const resolveConnectedPlatforms = async () => {
      setIsLoadingPlatformOptions(true);
      try {
        if (creatorProfile) {
          const derived = deriveConnectedPlatforms(creatorProfile.platforms);
          if (isMounted) {
            setConnectedPlatforms(derived);
            setIsLoadingPlatformOptions(false);
          }
          if (derived.length > 0) return;
        }

        const freshProfile = await creatorsService.getMe();
        if (!isMounted) return;

        if (freshProfile) {
          setCreatorProfile(freshProfile);
          setConnectedPlatforms(deriveConnectedPlatforms(freshProfile.platforms));
        } else {
          setConnectedPlatforms([]);
        }
      } catch {
        if (isMounted) {
          setConnectedPlatforms([]);
        }
      } finally {
        if (isMounted) setIsLoadingPlatformOptions(false);
      }
    };

    void resolveConnectedPlatforms();

    return () => {
      isMounted = false;
    };
  }, [creatorProfile, setCreatorProfile]);

  useEffect(() => {
    if (!connectedPlatforms.length) return;
    if (!formData.platform) return;
    if (connectedPlatforms.includes(formData.platform as Platform)) return;

    setFormData((prev) => ({
      ...prev,
      platform: "",
      selectedServiceKeys: [],
      deliverableItems: [],
      serviceNotes: "",
    }));
  }, [connectedPlatforms, formData.platform]);

  useEffect(() => {
    if (mode !== "create") return;
    if (formData.platform) return;
    if (connectedPlatforms.length !== 1) return;

    setFormData((prev) => ({
      ...prev,
      platform: connectedPlatforms[0],
      selectedServiceKeys: [],
      deliverableItems: [],
      serviceNotes: "",
    }));
  }, [connectedPlatforms, formData.platform, mode]);

  const platformOptions = useMemo(
    () => platforms.filter((platform) => connectedPlatforms.includes(platform.id as Platform)),
    [connectedPlatforms]
  );

  const connectedPlatformSet = useMemo(
    () => new Set(connectedPlatforms),
    [connectedPlatforms]
  );

  const profileCategories = useMemo(
    () => normalizeCategories(creatorProfile?.categories),
    [creatorProfile?.categories]
  );

  const profileCategoryOptions = useMemo(
    () => categoryOptions.filter((category) => profileCategories.includes(category.value)),
    [profileCategories]
  );

  const otherCategoryOptions = useMemo(
    () => categoryOptions.filter((category) => !profileCategories.includes(category.value)),
    [profileCategories]
  );

  useEffect(() => {
    if (mode !== "create") return;
    if (formData.category || profileCategories.length === 0) return;

    setFormData((prev) => ({
      ...prev,
      category: prev.category || profileCategories[0],
    }));
  }, [formData.category, mode, profileCategories]);

  useEffect(() => {
    if (mode !== "create" || !draftKey) return;
    localStorage.removeItem(DRAFT_KEY);
    const raw = localStorage.getItem(draftKey);
    setDraftNoticeDismissed(false);
    setHasRecoverableDraft(Boolean(raw));
    if (raw) {
      setShowDraftModal(true);
    }
  }, [draftKey, mode]);

  useEffect(() => {
    if (mode !== "create" || !draftKey) return;

    const payload = {
      currentStep,
      formData,
    };

    if (isDefaultDraft(formData, currentStep)) {
      localStorage.removeItem(draftKey);
      return;
    }

    localStorage.setItem(draftKey, JSON.stringify(payload));
  }, [draftKey, mode, currentStep, formData]);

  const restoreDraft = () => {
    if (!draftKey) return;
    const raw = localStorage.getItem(draftKey);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as {
        currentStep: number;
        formData: Partial<WizardFormData>;
      };
      const deliverableItems = Array.isArray(draft.formData?.deliverableItems)
        ? draft.formData.deliverableItems
            .map((item) => ({
              serviceKey: typeof item?.serviceKey === "string" ? item.serviceKey : "",
              label: typeof item?.label === "string" ? item.label : "",
              quantity:
                typeof item?.quantity === "number" && item.quantity > 0
                  ? Math.floor(item.quantity)
                  : 1,
            }))
            .filter((item) => item.serviceKey && item.label)
        : [];

      goToStep(draft.currentStep || 1);
      setFormData({
        ...defaultForm,
        ...draft.formData,
        category: normalizeCategory(draft.formData?.category) || "",
        selectedServiceKeys: deliverableItems.map((item) => item.serviceKey),
        deliverableItems,
      });
      setDraftNoticeDismissed(true);
      setHasRecoverableDraft(false);
      setShowDraftModal(false);
      toast.success("Draft restored");
    } catch {
      toast.error("Could not restore draft");
    }
  };

  const clearDraft = () => {
    if (draftKey) localStorage.removeItem(draftKey);
    goToStep(1);
    setFormData(defaultForm);
    setDraftNoticeDismissed(true);
    setHasRecoverableDraft(false);
    setShowDraftModal(false);
    toast.success("Saved draft cleared");
  };

  const getStepMissingFields = (stepId: number): string[] => {
    if (stepId === 1) {
      const missing: string[] = [];
      if (!formData.title.trim()) missing.push("Title");
      if (!formData.category.trim()) missing.push("Category");
      if (!isLoadingPlatformOptions && platformOptions.length === 0) missing.push("Connected social account");
      if (!formData.platform.trim()) missing.push("Platform");
      return missing;
    }

    if (stepId === 2) {
      return formData.deliverableItems.length > 0 ? [] : ["At least one package deliverable"];
    }

    if (stepId === 3) {
      const missing: string[] = [];

      if (formData.dealType === "paid") {
        const priceError = getBoundedFieldError(formData.price, PRICE_LIMITS, "Price");
        if (priceError) missing.push(priceError);
      }

      if (formData.dealType === "barter") {
        if (!formData.barterExpectations.trim()) missing.push("Barter expectations");
        if (formData.minimumBarterValue.trim()) {
          const minimumBarterError = getBoundedFieldError(formData.minimumBarterValue, PRICE_LIMITS, "Minimum barter value");
          if (minimumBarterError) missing.push(minimumBarterError);
        }
      }

      if (formData.dealType === "hybrid") {
        const cashError = getBoundedFieldError(formData.hybridCashAmount, PRICE_LIMITS, "Cash amount");
        if (cashError) missing.push(cashError);
        if (formData.minimumBarterValue.trim()) {
          const minimumBarterError = getBoundedFieldError(formData.minimumBarterValue, PRICE_LIMITS, "Minimum barter value");
          if (minimumBarterError) missing.push(minimumBarterError);
        }
      }

      const deliveryError = getBoundedFieldError(formData.deliveryDays, DELIVERY_LIMITS, "Delivery time");
      if (deliveryError) missing.push(deliveryError);

      const revisionError = getBoundedFieldError(formData.revisions, REVISION_LIMITS, "Revisions included");
      if (revisionError) missing.push(revisionError);

      return missing;
    }

    return [];
  };

  const isStepComplete = (stepId: number): boolean => getStepMissingFields(stepId).length === 0;

  const maxUnlockedStep = (() => {
    let unlocked = 1;
    for (let stepId = 1; stepId < steps.length; stepId += 1) {
      if (!isStepComplete(stepId)) break;
      unlocked = stepId + 1;
    }
    return unlocked;
  })();

  useEffect(() => {
    if (currentStep > maxUnlockedStep) {
      goToStep(maxUnlockedStep);
    }
  }, [currentStep, goToStep, maxUnlockedStep]);

  const canMoveNext = getStepMissingFields(currentStep).length === 0;

  const updateField = (field: keyof WizardFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateBoundedNumberField = (
    field: BoundedNumberField,
    value: string,
  ) => {
    if (value === "" || /^\d*$/.test(value)) {
      updateField(field, value);
    }
  };

  const normalizeBoundedNumberField = (
    field: BoundedNumberField,
    limits: { min: number; max: number },
  ) => {
    const raw = formData[field];
    if (!raw) return;
    const next = Math.min(limits.max, Math.max(limits.min, Number(raw)));
    updateField(field, String(Number.isFinite(next) ? next : limits.min));
  };

  const setBoundedNumberTo = (
    field: BoundedNumberField,
    value: number,
  ) => {
    updateField(field, String(value));
  };

  const BoundedNumberControl = ({
    field,
    label,
    limits,
    icon: Icon,
    prefix,
    suffix,
    placeholder,
    helper,
    required = true,
  }: {
    field: BoundedNumberField;
    label: string;
    limits: { min: number; max: number };
    icon: ElementType;
    prefix?: string;
    suffix?: string;
    placeholder?: string;
    helper?: string;
    required?: boolean;
  }) => {
    const error = required || formData[field].trim()
      ? getBoundedFieldError(formData[field], limits, label)
      : null;

    return (
      <div className="rounded-2xl border border-[#dce6df] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e]">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <Label htmlFor={`bounded-${field}`} className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#7a8f82]">
                {label}
              </Label>
              <p className="mt-0.5 text-xs leading-5 text-[#87938b]">
            {helper || `${required ? "Allowed" : "Optional"} range: ${limits.min.toLocaleString()}-${limits.max.toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setBoundedNumberTo(field, limits.min)}
              className="inline-flex h-7 items-center rounded-full border border-[#dce6df] bg-[#fbfaf5] px-2.5 text-[11px] font-bold text-[#496159] transition-colors hover:border-[#2d6b4e] hover:text-[#1e3d2e]"
            >
              Min
            </button>
            <button
              type="button"
              onClick={() => setBoundedNumberTo(field, limits.max)}
              className="inline-flex h-7 items-center rounded-full border border-[#dce6df] bg-[#fbfaf5] px-2.5 text-[11px] font-bold text-[#496159] transition-colors hover:border-[#2d6b4e] hover:text-[#1e3d2e]"
            >
              Max
            </button>
          </div>
        </div>
        <div className="mt-3 flex overflow-hidden rounded-xl border-2 border-[#dce6df] bg-[#fbfaf5] focus-within:border-[#2d6b4e] focus-within:ring-4 focus-within:ring-[#2d6b4e]/8">
          {prefix && (
            <span className="flex h-11 shrink-0 items-center border-r border-[#dce6df] px-3 text-xs font-extrabold text-[#7a8f82]">
              {prefix}
            </span>
          )}
          <Input
            id={`bounded-${field}`}
            type="number"
            min={limits.min}
            max={limits.max}
            value={formData[field]}
            onChange={(event) => updateBoundedNumberField(field, event.target.value)}
            onBlur={() => normalizeBoundedNumberField(field, limits)}
            placeholder={placeholder}
            className="h-11 rounded-none border-0 bg-transparent px-3 text-base font-extrabold text-[#1e3d2e] shadow-none placeholder:text-sm placeholder:font-medium placeholder:text-[#a8b8af] focus-visible:ring-0"
          />
          {suffix && (
            <span className="flex h-11 shrink-0 items-center border-l border-[#dce6df] px-3 text-xs font-extrabold text-[#7a8f82]">
              {suffix}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className={error ? "font-bold text-[#c0392b]" : "font-semibold text-[#7a8f82]"}>
            {error || (required ? "Looks good" : "Optional")}
          </span>
          <span className="font-semibold text-[#a0b4aa]">
            {limits.min.toLocaleString()} - {limits.max.toLocaleString()}
          </span>
        </div>
      </div>
    );
  };

  const addTagsFromRawInput = (rawInput: string) => {
    const rawPieces = rawInput
      .split(/[,\n]/)
      .map((part) => normalizeTag(part))
      .filter(Boolean);

    if (!rawPieces.length) return;

    let reachedLimit = false;

    setFormData((prev) => {
      const existing = parseTags(prev.tags);
      const seen = new Set(existing.map((tag) => tag.toLowerCase()));
      const next = [...existing];

      rawPieces.forEach((piece) => {
        if (next.length >= MAX_TAGS) {
          reachedLimit = true;
          return;
        }

        const key = piece.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          next.push(piece);
        }
      });

      return { ...prev, tags: next.join(", ") };
    });

    if (reachedLimit) {
      toast.error(`You can add up to ${MAX_TAGS} tags only.`);
    }

    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => {
      const next = parseTags(prev.tags).filter((tag) => tag !== tagToRemove);
      return { ...prev, tags: next.join(", ") };
    });
  };

  const onToggleService = (serviceKey: string) => {
    setFormData((prev) => {
      const exists = prev.deliverableItems.some((item) => item.serviceKey === serviceKey);
      const label = serviceLabelMap.get(serviceKey);
      if (!exists && !label) return prev;

      return {
        ...prev,
        selectedServiceKeys: exists
          ? prev.selectedServiceKeys.filter((key) => key !== serviceKey)
          : [...prev.selectedServiceKeys, serviceKey],
        deliverableItems: exists
          ? prev.deliverableItems.filter((item) => item.serviceKey !== serviceKey)
          : [...prev.deliverableItems, { serviceKey, label: label!, quantity: 1 }],
      };
    });
  };

  const updateDeliverableQuantity = (serviceKey: string, delta: number) => {
    setFormData((prev) => ({
      ...prev,
      deliverableItems: prev.deliverableItems
        .map((item) =>
          item.serviceKey === serviceKey
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0),
    }));
  };

  const removeDeliverableItem = (serviceKey: string) => {
    setFormData((prev) => ({
      ...prev,
      deliverableItems: prev.deliverableItems.filter((item) => item.serviceKey !== serviceKey),
      selectedServiceKeys: prev.selectedServiceKeys.filter((key) => key !== serviceKey),
    }));
  };

  const updateWorkSample = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      previousWorkUrls: prev.previousWorkUrls.map((item, i) => (i === index ? value : item)),
    }));
  };

  const addWorkSample = () => {
    setFormData((prev) => ({ ...prev, previousWorkUrls: [...prev.previousWorkUrls, ""] }));
  };

  const removeWorkSample = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      previousWorkUrls: prev.previousWorkUrls.filter((_, i) => i !== index),
    }));
  };

  const uploadThumbnail = async (file?: File | null) => {
    if (!file) return;

    setIsUploadingThumbnail(true);
    try {
      const uploaded = await uploadsService.packageThumbnail(file, mode === "edit" ? initialPackage?.id : undefined);
      updateField("thumbnailUrl", uploaded.url);
      toast.success("Package thumbnail uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload thumbnail";
      toast.error(message);
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const uploadWorkSample = async (index: number, file?: File | null) => {
    if (!file) return;

    setUploadingSampleIndex(index);
    try {
      const uploaded = await uploadsService.contentPreview(
        file,
        formData.platform || undefined,
        mode === "edit" ? initialPackage?.id : undefined,
      );
      updateWorkSample(index, uploaded.url);
      toast.success("Preview media uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload preview media";
      toast.error(message);
    } finally {
      setUploadingSampleIndex(null);
    }
  };

  const submitPackage = async () => {
    if (formData.status !== "draft" && !normalizeCategory(formData.category)) {
      toast.error("Select a category before publishing");
      return;
    }

    const tags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const packagePayload: CreatorPackage = {
      id: mode === "edit" && initialPackage ? initialPackage.id : `cp-${Date.now()}`,
      creatorId: initialPackage?.creatorId || creatorProfile?.id || "",
      title: formData.title,
      shortDescription: formData.fullDescription || formData.title,
      description: formData.fullDescription || formData.title,
      fullDescription: formData.fullDescription,
      category: normalizeCategory(formData.category),
      deliverables: resolvedDeliverables,
      deliveryDays: Number(formData.deliveryDays || 0),
      revisions: Number(formData.revisions || 0),
      responseTime: formData.responseTime,
      price:
        formData.dealType === "barter"
          ? 0
          : Number(formData.dealType === "hybrid" ? formData.hybridCashAmount || 0 : formData.price || 0),
      currency: "PKR",
      dealType: formData.dealType,
      barterValue:
        (formData.dealType === "barter" || formData.dealType === "hybrid") && formData.minimumBarterValue
          ? `Min PKR ${Number(formData.minimumBarterValue || 0).toLocaleString()}`
          : undefined,
      barterDescription:
        formData.dealType === "barter" || formData.dealType === "hybrid"
          ? formData.barterExpectations
          : undefined,
      creatorExpectations:
        formData.dealType === "barter" || formData.dealType === "hybrid"
          ? formData.barterExpectations
          : undefined,
      hybridCashAmount:
        formData.dealType === "hybrid" ? Number(formData.hybridCashAmount || 0) : undefined,
      platform: formData.platform as CreatorPackage["platform"],
      tags,
      isPopular: initialPackage?.isPopular || false,
      ordersCompleted: initialPackage?.ordersCompleted || 0,
      status: formData.status,
      thumbnail:
        formData.thumbnailUrl ||
        initialPackage?.thumbnail ||
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
      mediaUrls: formData.previousWorkUrls.map((url) => url.trim()).filter(Boolean),
      visibility: formData.visibility,
      analytics: initialPackage?.analytics || {
        views: 0,
        clicks: 0,
        inquiries: 0,
        conversionRate: 0,
        completionRate: 0,
        repeatBrands: 0,
        engagementPerformance: 0,
      },
    };

    try {
      const shouldSyncProfileCategory =
        formData.status !== "draft" &&
        normalizeCategory(formData.category) &&
        !profileCategories.includes(normalizeCategory(formData.category));

      if (shouldSyncProfileCategory && creatorProfile) {
        const updatedProfile = await creatorsService.updateMe({
          categories: normalizeCategories([...creatorProfile.categories, formData.category]),
        });
        setCreatorProfile(updatedProfile);
      }

      if (mode === "edit" && initialPackage) {
        await updatePackage(initialPackage.id, packagePayload);
      } else {
        await createPackage(packagePayload);
      }

      if (mode === "create") {
        if (draftKey) localStorage.removeItem(draftKey);
        setHasRecoverableDraft(false);
      }

      toast.success(
        mode === "edit"
          ? "Package updated"
          : formData.status === "draft"
            ? "Package saved as draft"
            : "Package published"
      );
      router.push("/creator/packages");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save package";
      toast.error(message);
    }
  };

  return (
    <div ref={wizardTopRef} className="container mx-auto p-4 pb-6 md:p-6">

      {/* Step progress */}
      <div className={`sticky top-16 z-20 mb-6 ${panelClass} p-3`}>
        {mode === "create" && hasRecoverableDraft && !showDraftModal && !draftNoticeDismissed && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e3c97a] bg-[#fdf3dc] px-3.5 py-2.5 text-xs text-[#8a6010]">
            <span className="font-semibold">You have a saved draft.</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreDraft}
                className="rounded-full bg-[#e3a52f] px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-[#c98e22]"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={clearDraft}
                className="rounded-full border border-[#e3c97a] px-3 py-1 text-xs font-bold text-[#8a6010] transition-colors hover:bg-[#f7e8c8]"
              >
                Start fresh
              </button>
            </div>
          </div>
        )}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {steps.map((step) => {
            const isUnlocked = step.id <= maxUnlockedStep;
            const isCurrent = currentStep === step.id;
            const isCompleted = step.id < currentStep && isStepComplete(step.id);

            return (
              <button
                key={step.id}
                type="button"
                aria-disabled={!isUnlocked}
                onClick={() => {
                  if (!isUnlocked) {
                    const previousStep = Math.max(1, step.id - 1);
                    const missing = getStepMissingFields(previousStep);
                    toast.error(
                      missing.length
                        ? `Complete Step ${previousStep}: ${missing.slice(0, 2).join(", ")}`
                        : `Complete Step ${previousStep} first.`
                    );
                    return;
                  }
                  goToStep(step.id);
                }}
                className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                  isCurrent
                    ? "bg-[#2d6b4e] text-white shadow-sm"
                    : isCompleted
                      ? "bg-[#e4f1e8] text-[#1e5c3e]"
                      : isUnlocked
                        ? "text-[#496159] hover:bg-[#f0f5f1] hover:text-[#1e3d2e]"
                        : "cursor-not-allowed text-[#b0bfb8]"
                }`}
              >
                {isCompleted ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#2d6b4e] text-white">
                    <Check className="size-3" />
                  </span>
                ) : !isUnlocked ? (
                  <Lock className="size-3.5 text-[#b0bfb8]" />
                ) : (
                  <span className={`flex size-5 items-center justify-center rounded-full text-[11px] font-extrabold ${isCurrent ? "bg-white/20" : "bg-[#d1ddd6] text-[#496159]"}`}>
                    {step.id}
                  </span>
                )}
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Draft recovery modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-sm ${panelClass} overflow-hidden`}>
            <div className="relative bg-[#2d6b4e] px-6 py-5">
              <h3 className="text-base font-bold text-white">Unsaved draft found</h3>
              <p className="mt-1 text-sm text-white/70">Restore where you left off, or start fresh.</p>
              <button
                type="button"
                onClick={() => {
                  setShowDraftModal(false);
                  setDraftNoticeDismissed(true);
                  setHasRecoverableDraft(false);
                }}
                className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex gap-2 p-5">
              <button
                type="button"
                onClick={restoreDraft}
                className="flex-1 rounded-full bg-[#2d6b4e] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
              >
                Restore Draft
              </button>
              <button
                type="button"
                onClick={clearDraft}
                className="flex-1 rounded-full border-2 border-[#dce6df] py-2.5 text-sm font-bold text-[#496159] transition-colors hover:border-[#2d6b4e] hover:text-[#1e3d2e]"
              >
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── Step 1: Basic Info ── */}
        {currentStep === 1 && (
          <div className={`${panelClass} p-6 md:p-8`}>
            <h2 className={`mb-6 ${sectionTitle}`}>Basic Info</h2>
            <div className="space-y-6">

              {/* Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pkg-title" className={labelClass}>Title</Label>
                  <span className="text-[11px] text-[#a0b4aa]">{formData.title.length}/100</span>
                </div>
                <Input
                  id="pkg-title"
                  maxLength={100}
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Ramzan Food Reel Bundle"
                  className={inputClass}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pkg-desc" className={labelClass}>Description</Label>
                  <span className="text-[11px] text-[#a0b4aa]">{formData.fullDescription.length} chars</span>
                </div>
                <Textarea
                  id="pkg-desc"
                  rows={4}
                  value={formData.fullDescription}
                  onChange={(e) => updateField("fullDescription", e.target.value)}
                  placeholder="Add complete package details and collaboration scope"
                  className={textareaClass}
                />
              </div>

              {/* Platform */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className={labelClass}>Platform</Label>
                  <span className="text-[11px] text-[#a0b4aa]">
                    {formData.platform ? "1 selected" : "none selected"}
                  </span>
                </div>

                {isLoadingPlatformOptions && (
                  <p className="rounded-xl border border-[#dce6df] p-3 text-sm text-[#a0b4aa]">
                    Loading connected platforms…
                  </p>
                )}

                {!isLoadingPlatformOptions && platformOptions.length === 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-amber-800">Connect a social account first</p>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-amber-700">
                          Packages are tied to the platform where brands will book your content. Add at least one connected account to continue.
                        </p>
                      </div>
                      <Button
                        asChild
                        className="h-9 shrink-0 rounded-full bg-[#2d6b4e] px-4 text-xs font-bold text-white hover:bg-[#24563f]"
                      >
                        <Link href="/creator/profile/social">
                          Connect social account
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {platforms.map((platform) => {
                      const isConnected = connectedPlatformSet.has(platform.id as Platform);
                      const isDisabled = isLoadingPlatformOptions || !isConnected;
                      const isSelected = formData.platform === platform.id;

                      return (
                        <button
                          key={platform.id}
                          type="button"
                          aria-disabled={isDisabled}
                          onClick={() => {
                            if (isDisabled) {
                              toast.info(`Connect ${platform.label} in Social Accounts to enable.`);
                              return;
                            }
                            setFormData((prev) => ({
                              ...prev,
                              platform: platform.id,
                              selectedServiceKeys: [],
                              deliverableItems: [],
                              serviceNotes: "",
                            }));
                          }}
                          className={`rounded-xl border-2 p-3 text-sm transition-all duration-200 ${
                            isSelected
                              ? "border-[#2d6b4e] bg-[#e4f1e8] text-[#1e5c3e]"
                              : isDisabled
                                ? "cursor-not-allowed border-[#eef1ef] bg-[#f4f7f5] text-[#b0bfb8]"
                                : "border-[#dce6df] text-[#496159] hover:border-[#2d6b4e] hover:text-[#1e3d2e]"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2 font-semibold">
                            <PlatformIconBadge platform={platform.id} size="sm" />
                            {platform.label}
                          </div>
                          <p className="mt-1 text-center text-[10px] font-medium text-[#a0b4aa]">
                            {isConnected ? "Connected" : "Connect to enable"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl border border-[#dce6df] bg-[#f4f7f5] px-4 py-3">
                  <p className="text-xs text-[#6b7870]">
                    {connectedPlatforms.length}/{platforms.length} platforms connected
                  </p>
                  <Link
                    href="/creator/profile/social"
                    className="text-xs font-bold text-[#2d6b4e] hover:underline"
                  >
                    Manage accounts
                  </Link>
                </div>
              </div>

              {/* Category / Tags */}
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Category */}
                <div className="space-y-1.5">
                  <Label className={labelClass}>Category</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({
                      ...p,
                      category: e.target.value,
                    }))}
                    className="h-10 w-full rounded-xl border-2 border-[#dce6df] bg-white px-3 text-sm text-[#1e3d2e] transition-colors focus:border-[#2d6b4e] focus:outline-none focus:ring-4 focus:ring-[#2d6b4e]/8"
                  >
                    <option value="">Select a category</option>
                    {profileCategoryOptions.length > 0 && (
                      <optgroup label="On your profile">
                        {profileCategoryOptions.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label={profileCategoryOptions.length > 0 ? "Other categories" : "All categories"}>
                      {otherCategoryOptions.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {formData.category && !profileCategories.includes(formData.category) && formData.status !== "draft" && (
                    <p className="text-[11px] font-semibold text-[#7a8f82]">
                      Publishing will also add {getCategoryLabel(formData.category)} to your public profile.
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className={labelClass}>Tags</Label>
                    <span className="text-[11px] text-[#a0b4aa]">{tagsList.length}/{MAX_TAGS}</span>
                  </div>
                  <div className="min-h-10 rounded-xl border-2 border-[#dce6df] bg-white px-3 py-2 transition-colors focus-within:border-[#2d6b4e] focus-within:ring-4 focus-within:ring-[#2d6b4e]/8">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {tagsList.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#fdf3dc] px-2.5 py-0.5 text-xs font-bold text-[#8a6010]">
                          {tag}
                          <button
                            type="button"
                            aria-label={`Remove ${tag}`}
                            onClick={() => removeTag(tag)}
                            className="rounded-full p-0.5 text-[#8a6010]/60 transition-colors hover:text-[#8a6010]"
                          >
                            <X className="size-2.5" />
                          </button>
                        </span>
                      ))}
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
                            if (!tagInput.trim()) return;
                            e.preventDefault();
                            addTagsFromRawInput(tagInput);
                            return;
                          }
                          if (e.key === "Backspace" && !tagInput.trim() && tagsList.length) {
                            e.preventDefault();
                            removeTag(tagsList[tagsList.length - 1]);
                          }
                        }}
                        onBlur={() => addTagsFromRawInput(tagInput)}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData("text");
                          if (!pasted.includes(",") && !pasted.includes("\n")) return;
                          e.preventDefault();
                          addTagsFromRawInput(pasted);
                        }}
                        placeholder={tagsList.length ? "Add more…" : "e.g. ramzan"}
                        className="min-w-[80px] flex-1 border-0 bg-transparent py-0.5 text-sm text-[#1e3d2e] outline-none placeholder:text-[#b0bfb8]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#a0b4aa]">Up to {MAX_TAGS}. Enter or comma to add.</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── Step 2: Services ── */}
        {currentStep === 2 && (
          <div className={`${panelClass} p-6 md:p-8`}>
            <h2 className={`mb-6 ${sectionTitle}`}>Services &amp; Deliverables</h2>

            {!formData.platform && (
              <div className="rounded-xl border border-[#dce6df] bg-[#f4f7f5] p-4 text-sm text-[#6b7870]">
                Select a platform in Step 1 to unlock service options.
              </div>
            )}

            {formData.platform && (
              <div className="space-y-6">
                {serviceSections.map((section) => (
                  <div key={section.label}>
                    <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-[#7a8f82]">
                      {section.label}
                    </p>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {section.items.map((option) => {
                        const isSelected = selectedServiceSet.has(option.key);
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => onToggleService(option.key)}
                            className={`rounded-xl border-2 p-3.5 text-left transition-all duration-150 ${
                              isSelected
                                ? "border-[#2d6b4e] bg-[#e4f1e8]"
                                : "border-[#dce6df] hover:border-[#b0c5ba] hover:bg-[#f4f7f5]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-bold ${isSelected ? "text-[#1e5c3e]" : "text-[#1e3d2e]"}`}>
                                {option.label}
                              </p>
                              <span
                                className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                  isSelected
                                    ? "border-[#2d6b4e] bg-[#2d6b4e]"
                                    : "border-[#dce6df]"
                                }`}
                              >
                                {isSelected && <Check className="size-3 text-white" />}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[#6b7870]">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Service notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="service-notes" className={labelClass}>Service Notes (optional)</Label>
                  <Textarea
                    id="service-notes"
                    rows={3}
                    value={formData.serviceNotes}
                    onChange={(e) => updateField("serviceNotes", e.target.value)}
                    placeholder="e.g. 2 hooks for approval, Urdu voiceover, include campaign hashtag"
                    className={textareaClass}
                  />
                </div>

                {/* Deliverables list */}
                <div className="rounded-xl border border-[#dce6df] bg-[#f4f7f5] p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#1e3d2e]">Package Deliverables</p>
                    {formData.deliverableItems.length > 0 && (
                      <span className="rounded-full bg-[#2d6b4e] px-2.5 py-0.5 text-[11px] font-bold text-white">
                        {formData.deliverableItems.reduce((t, i) => t + i.quantity, 0)} total
                      </span>
                    )}
                  </div>

                  {formData.deliverableItems.length === 0 ? (
                    <p className="text-sm text-[#a0b4aa]">
                      Nothing added yet. Select a service above to add it to this package.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {formData.deliverableItems.map((item) => (
                        <div
                          key={item.serviceKey}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#d1ddd6] bg-white px-4 py-2.5"
                        >
                          <p className="text-sm font-semibold text-[#1e3d2e]">{item.label}</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateDeliverableQuantity(item.serviceKey, -1)}
                              className="flex size-7 items-center justify-center rounded-full border-2 border-[#dce6df] text-sm font-bold text-[#496159] transition-colors hover:border-[#2d6b4e] hover:text-[#2d6b4e]"
                            >
                              −
                            </button>
                            <span className="min-w-[2rem] text-center text-sm font-bold text-[#1e3d2e]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateDeliverableQuantity(item.serviceKey, 1)}
                              className="flex size-7 items-center justify-center rounded-full border-2 border-[#dce6df] text-sm font-bold text-[#496159] transition-colors hover:border-[#2d6b4e] hover:text-[#2d6b4e]"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDeliverableItem(item.serviceKey)}
                              className="flex size-7 items-center justify-center rounded-full text-[#b0bfb8] transition-colors hover:bg-[#ffe8e8] hover:text-[#c0392b]"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Deliverables preview */}
            <div className="mt-6 rounded-xl border border-[#dce6df] bg-[#f4f7f5] p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#7a8f82]">
                Preview (auto-generated)
              </p>
              <div className="space-y-1">
                {resolvedDeliverables.map((item, index) => (
                  <p key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-[#496159]">
                    <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-[#2d6b4e]" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Pricing ── */}
        {currentStep === 3 && (
          <div className={`${panelClass} overflow-hidden`}>
            <div className="border-b border-[#edf1ed] bg-[#fbfaf5] px-5 py-5 sm:px-6 md:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Commercial terms</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-[#1e3d2e]">Pricing &amp; Delivery</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[#647168]">
                    Set bounded, brand-ready package terms that are easy to compare and safe to publish.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-[#496159] sm:min-w-[24rem]">
                  <div className="rounded-xl border border-[#dce6df] bg-white px-3 py-2">
                    <p className="text-[9px] uppercase tracking-widest text-[#a0b4aa]">Price</p>
                    <p className="mt-1 truncate text-[#1e3d2e]">
                      {formData.dealType === "barter"
                        ? "Barter"
                        : formatPkr(formData.dealType === "hybrid" ? formData.hybridCashAmount : formData.price)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#dce6df] bg-white px-3 py-2">
                    <p className="text-[9px] uppercase tracking-widest text-[#a0b4aa]">Delivery</p>
                    <p className="mt-1 text-[#1e3d2e]">{formData.deliveryDays || "0"} days</p>
                  </div>
                  <div className="rounded-xl border border-[#dce6df] bg-white px-3 py-2">
                    <p className="text-[9px] uppercase tracking-widest text-[#a0b4aa]">Revisions</p>
                    <p className="mt-1 text-[#1e3d2e]">{formData.revisions || "0"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 md:p-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { key: "paid", label: "Paid", icon: DollarSign, desc: "Cash package", note: "Best for fixed-scope content" },
                    { key: "barter", label: "Barter", icon: Gift, desc: "Products / services", note: "Best for exchange campaigns" },
                    { key: "hybrid", label: "Hybrid", icon: Sparkles, desc: "Cash + barter", note: "Best for premium deals" },
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => updateField("dealType", option.key)}
                      className={`group rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                        formData.dealType === option.key
                          ? "border-[#2d6b4e] bg-[#2d6b4e] text-white shadow-[0_18px_36px_rgba(45,107,78,0.18)]"
                          : "border-[#dce6df] bg-white text-[#496159] hover:border-[#2d6b4e] hover:bg-[#fbfaf5]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={`grid size-10 place-items-center rounded-xl ${
                          formData.dealType === option.key ? "bg-white/15 text-white" : "bg-[#e8f0ec] text-[#2d6b4e]"
                        }`}>
                          <option.icon className="size-4" />
                        </span>
                        {formData.dealType === option.key && <Check className="size-4 text-white" />}
                      </div>
                      <p className="mt-3 text-sm font-black">{option.label}</p>
                      <p className={`mt-1 text-xs font-bold ${formData.dealType === option.key ? "text-white/80" : "text-[#7a8f82]"}`}>
                        {option.desc}
                      </p>
                      <p className={`mt-2 text-[11px] leading-5 ${formData.dealType === option.key ? "text-white/65" : "text-[#87938b]"}`}>
                        {option.note}
                      </p>
                    </button>
                  ))}
                </div>

                {(formData.dealType === "paid" || formData.dealType === "hybrid") && (
                  <BoundedNumberControl
                    field={formData.dealType === "hybrid" ? "hybridCashAmount" : "price"}
                    label={formData.dealType === "hybrid" ? "Cash amount" : "Package price"}
                    limits={PRICE_LIMITS}
                    icon={DollarSign}
                    prefix="PKR"
                    placeholder="e.g. 15000"
                    helper={`Cash must be between ${formatPkr(PRICE_LIMITS.min)} and ${formatPkr(PRICE_LIMITS.max)}.`}
                  />
                )}

                {(formData.dealType === "barter" || formData.dealType === "hybrid") && (
                  <div className="space-y-4 rounded-2xl border border-[#d1ddd6] bg-[#f4f7f5] p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Barter terms</p>
                        <h3 className="mt-1 text-base font-black text-[#1e3d2e]">What brands should provide</h3>
                      </div>
                      <span className="rounded-full border border-[#efcf83] bg-[#fff7df] px-3 py-1 text-[11px] font-bold text-[#8b5e12]">
                        Minimum value required
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="barter-exp" className={labelClass}>Barter Expectations</Label>
                      <Textarea
                        id="barter-exp"
                        rows={4}
                        value={formData.barterExpectations}
                        onChange={(e) => updateField("barterExpectations", e.target.value)}
                        placeholder="Hotel stay, salon service, product gifting, or event invite expectations"
                        className={`${textareaClass} bg-white`}
                      />
                    </div>

                    <BoundedNumberControl
                      field="minimumBarterValue"
                      label="Minimum barter value"
                      limits={PRICE_LIMITS}
                      icon={Gift}
                      prefix="PKR"
                      placeholder="e.g. 20000"
                      required={false}
                      helper={`Optional floor for barter value, capped at ${formatPkr(PRICE_LIMITS.max)}.`}
                    />
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  <BoundedNumberControl
                    field="deliveryDays"
                    label="Delivery time"
                    limits={DELIVERY_LIMITS}
                    icon={Clock}
                    suffix="days"
                    placeholder="e.g. 5"
                    helper={`Delivery must be ${DELIVERY_LIMITS.min}-${DELIVERY_LIMITS.max} days.`}
                  />
                  <BoundedNumberControl
                    field="revisions"
                    label="Revisions included"
                    limits={REVISION_LIMITS}
                    icon={RotateCcw}
                    suffix="rounds"
                    placeholder="e.g. 2"
                    helper={`Revisions must be ${REVISION_LIMITS.min}-${REVISION_LIMITS.max} rounds.`}
                  />
                </div>
              </div>

              <aside className="space-y-4 xl:sticky xl:top-32 xl:self-start">
                <div className="rounded-2xl border border-[#dce6df] bg-[#1e3d2e] p-5 text-white shadow-[0_18px_42px_rgba(30,61,46,0.16)]">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#f0c56e]">Package terms</p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-white/55">Deal type</p>
                      <p className="mt-0.5 text-lg font-black capitalize">{formData.dealType}</p>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="text-xs font-semibold text-white/55">Creator receives</p>
                      <p className="mt-0.5 text-base font-black">
                        {formData.dealType === "paid" && formatPkr(formData.price)}
                        {formData.dealType === "barter" && (formData.minimumBarterValue ? `Barter worth at least ${formatPkr(formData.minimumBarterValue)}` : "Barter offer")}
                        {formData.dealType === "hybrid" && `${formatPkr(formData.hybridCashAmount)} + ${formData.minimumBarterValue ? `barter worth at least ${formatPkr(formData.minimumBarterValue)}` : "barter"}`}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-white/8 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">Delivery</p>
                        <p className="mt-1 text-sm font-black">{formData.deliveryDays || "0"} days</p>
                      </div>
                      <div className="rounded-xl bg-white/8 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">Revisions</p>
                        <p className="mt-1 text-sm font-black">{formData.revisions || "0"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#efcf83] bg-[#fff7df] p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0c56e]/30 text-[#8b5e12]">
                      <Lock className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-[#6e4a10]">Publishing guardrails</p>
                      <p className="mt-1 text-xs leading-5 text-[#8b5e12]">
                        Price uses {formatPkr(PRICE_LIMITS.min)}-{formatPkr(PRICE_LIMITS.max)}, delivery uses {DELIVERY_LIMITS.min}-{DELIVERY_LIMITS.max} days, and revisions use {REVISION_LIMITS.min}-{REVISION_LIMITS.max} rounds.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* ── Step 4: Media ── */}
        {currentStep === 4 && (
          <div className={`${panelClass} p-6 md:p-8`}>
            <h2 className={`mb-6 ${sectionTitle}`}>Media &amp; Preview</h2>
            <div className="space-y-6">

              {/* Thumbnail */}
              <div className="space-y-1.5">
                <Label className={labelClass}>Package Thumbnail</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={formData.thumbnailUrl}
                    onChange={(e) => updateField("thumbnailUrl", e.target.value)}
                    placeholder="https://…"
                    className={inputClass}
                  />
                  <label
                    htmlFor="package-thumbnail-upload"
                    className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 border-[#dce6df] bg-white px-4 text-sm font-bold text-[#2d6b4e] transition-colors hover:border-[#2d6b4e] ${isUploadingThumbnail ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <Upload className="size-4" />
                    {isUploadingThumbnail ? "Uploading…" : "Upload"}
                  </label>
                  <input
                    id="package-thumbnail-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={isUploadingThumbnail}
                    onChange={(e) => void uploadThumbnail(e.target.files?.[0])}
                  />
                </div>
                {formData.thumbnailUrl && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-[#d1ddd6]">
                    <img
                      src={formData.thumbnailUrl}
                      alt="Thumbnail preview"
                      className="h-40 w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  </div>
                )}
              </div>

              {/* Work samples */}
              <div className="space-y-2">
                <Label className={labelClass}>Previous Work / Preview Gallery</Label>
                {formData.previousWorkUrls.map((url, index) => (
                  <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={url}
                      onChange={(e) => updateWorkSample(index, e.target.value)}
                      placeholder="https://…"
                      className={inputClass}
                    />
                    <label
                      htmlFor={`work-sample-upload-${index}`}
                      className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 border-[#dce6df] bg-white px-4 text-sm font-bold text-[#2d6b4e] transition-colors hover:border-[#2d6b4e] ${uploadingSampleIndex !== null ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <Upload className="size-4" />
                      {uploadingSampleIndex === index ? "Uploading…" : "Upload"}
                    </label>
                    <input
                      id={`work-sample-upload-${index}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/x-msvideo"
                      className="hidden"
                      disabled={uploadingSampleIndex !== null}
                      onChange={(e) => void uploadWorkSample(index, e.target.files?.[0])}
                    />
                    {formData.previousWorkUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWorkSample(index)}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#b0bfb8] transition-colors hover:bg-[#ffe8e8] hover:text-[#c0392b]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addWorkSample}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-[#b0c5ba] px-4 py-2 text-sm font-bold text-[#496159] transition-colors hover:border-[#2d6b4e] hover:text-[#2d6b4e]"
                >
                  <Plus className="size-4" /> Add Sample
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── Step 5: Publish ── */}
        {currentStep === 5 && (
          <div className={`${panelClass} p-6 md:p-8`}>
            <h2 className={`mb-6 ${sectionTitle}`}>Review &amp; Publish</h2>
            <div className="space-y-6">

              {/* Preview card */}
              <div className="rounded-2xl border border-[#d1ddd6] bg-[#f4f7f5] p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a8f82]">Package Preview</p>
                <p className="mt-3 text-base font-bold text-[#1e3d2e]">{formData.title || "Untitled Package"}</p>
                <p className="mt-1 text-sm text-[#6b7870]">{formData.fullDescription || "No description yet"}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {formData.platform && (
                    <span className="rounded-full bg-[#e4f1e8] px-2.5 py-0.5 text-xs font-bold capitalize text-[#1e5c3e]">
                      {formData.platform}
                    </span>
                  )}
                  <span className="rounded-full bg-[#e4f1e8] px-2.5 py-0.5 text-xs font-bold capitalize text-[#1e5c3e]">
                    {formData.dealType}
                  </span>
                  <span className="rounded-full bg-[#e8eae8] px-2.5 py-0.5 text-xs font-bold text-[#5a6a62]">
                    {resolvedDeliverables.length} deliverable{resolvedDeliverables.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mt-4 text-lg font-extrabold text-[#2d6b4e]">
                  {formData.dealType === "paid" && (formData.price ? `PKR ${Number(formData.price).toLocaleString()}` : "PKR 0")}
                  {formData.dealType === "barter" && (formData.minimumBarterValue ? `Barter · Min PKR ${Number(formData.minimumBarterValue).toLocaleString()}` : "Barter")}
                  {formData.dealType === "hybrid" &&
                    `PKR ${Number(formData.hybridCashAmount || 0).toLocaleString()} + barter${formData.minimumBarterValue ? ` (Min PKR ${Number(formData.minimumBarterValue).toLocaleString()})` : ""}`}
                </p>
              </div>

              {/* Visibility / status / response time */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Visibility</Label>
                  <Select value={formData.visibility} onValueChange={(v) => updateField("visibility", v as "public" | "private")}>
                    <SelectTrigger className="h-10 rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] focus:border-[#2d6b4e] focus:ring-4 focus:ring-[#2d6b4e]/8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Publish Status</Label>
                  <Select value={formData.status} onValueChange={(v) => updateField("status", v as "active" | "draft" | "under_review")}>
                    <SelectTrigger className="h-10 rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] focus:border-[#2d6b4e] focus:ring-4 focus:ring-[#2d6b4e]/8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Publish Active</SelectItem>
                      <SelectItem value="draft">Save Draft</SelectItem>
                      <SelectItem value="under_review">Submit for Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="response-time" className={labelClass}>Response Time</Label>
                  <Input
                    id="response-time"
                    value={formData.responseTime}
                    onChange={(e) => updateField("responseTime", e.target.value)}
                    placeholder="Within 3 hours"
                    className={inputClass}
                  />
                </div>
              </div>

            </div>
          </div>
        )}

      </motion.div>

      {/* ── Bottom navigation ── */}
      <div className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-20 mt-4 flex gap-3 rounded-[1.6rem] border border-[#d1ddd6] bg-white/95 p-3 shadow-[0_18px_55px_rgba(38,70,50,0.07)] backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:shadow-none md:p-0">
        <Button
          type="button"
          disabled={currentStep === 1}
          onClick={() => goToStep((step) => Math.max(1, step - 1))}
          className="flex-1 h-11 rounded-full border-2 border-[#dce6df] bg-white text-sm font-bold text-[#496159] shadow-none transition-colors hover:border-[#2d6b4e] hover:text-[#1e3d2e] disabled:opacity-40"
        >
          Back
        </Button>
        {currentStep < steps.length ? (
          <Button
            type="button"
            onClick={() => {
              if (!canMoveNext) {
                const missing = getStepMissingFields(currentStep);
                toast.error(
                  missing.length
                    ? `Please complete: ${missing.slice(0, 3).join(", ")}`
                    : "Please complete required fields in this step."
                );
                return;
              }
              goToStep((step) => Math.min(steps.length, step + 1));
            }}
            className="flex-1 h-11 rounded-full bg-[#2d6b4e] text-sm font-bold text-white shadow-none transition-colors hover:bg-[#1f5239]"
          >
            Next <ArrowRight className="ml-2 size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={submitPackage}
            className="flex-1 h-11 rounded-full bg-[#2d6b4e] text-sm font-bold text-white shadow-none transition-colors hover:bg-[#1f5239]"
          >
            {mode === "edit"
              ? "Update Package"
              : formData.status === "draft"
                ? "Save Draft"
                : formData.status === "under_review"
                  ? "Submit for Review"
                  : "Publish Package"}
          </Button>
        )}
      </div>
    </div>
  );
}
