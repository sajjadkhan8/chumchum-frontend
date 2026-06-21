"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  DollarSign,
  Gift,
  Lock,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
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
import type { CreatorPackage, PackageTier, Platform } from "@/types";
import { creatorsService } from "@/services/creators.service";
import { useCreatorPackagesStore } from "@/store/creator-packages-store";
import { useAuthStore } from "@/store/auth-store";
import { uploadsService } from "@/services/uploads.service";
import { platformMeta } from "@/components/platform-icons";

const DRAFT_KEY = "creator-package-draft-v3";

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
        { key: "fb_group_post", label: "Group Post", description: "Brand content in niche group" },
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

const MAX_NICHES = 5;
const MAX_TAGS = 5;

interface WizardFormData {
  title: string;
  category: string;
  platform: string;
  niche: string;
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
  barterCategory: string;
  estimatedBarterValue: string;
  preferredBrands: string;
  minimumBarterValue: string;
  hybridCashAmount: string;
  thumbnailUrl: string;
  previousWorkUrls: string[];
  visibility: "public" | "private";
  status: "active" | "draft" | "under_review";
  packageType: "ONE_TIME" | "SUBSCRIPTION";
  subscriptionInterval: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  subscriptionDuration: string;
}

const defaultForm: WizardFormData = {
  title: "",
  category: "",
  platform: "",
  niche: "",
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
  barterCategory: "products",
  estimatedBarterValue: "",
  preferredBrands: "",
  minimumBarterValue: "",
  hybridCashAmount: "",
  thumbnailUrl: "",
  previousWorkUrls: [""],
  visibility: "public",
  status: "active",
  packageType: "ONE_TIME",
  subscriptionInterval: "MONTHLY",
  subscriptionDuration: "3",
};

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
  const creatorProfile = useAuthStore((state) => state.creatorProfile);
  const setCreatorProfile = useAuthStore((state) => state.setCreatorProfile);
  const createPackage = useCreatorPackagesStore((state) => state.createPackage);
  const updatePackage = useCreatorPackagesStore((state) => state.updatePackage);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showTierForm, setShowTierForm] = useState(false);
  const [expandedTiers, setExpandedTiers] = useState<Set<number>>(new Set());

  const [tiers, setTiers] = useState<PackageTier[]>(initialPackage?.tiers || []);
  const [tierForm, setTierForm] = useState<Partial<PackageTier>>({
    name: "",
    price: undefined,
    deliverables: [""],
    description: "",
    position: 0,
    isPrimary: tiers.length === 0,
  });

  const initialForm = useMemo<WizardFormData>(() => {
    if (!initialPackage) return defaultForm;

    return {
      title: initialPackage.title,
      category: initialPackage.category,
      platform: initialPackage.platform,
      niche: initialPackage.category,
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
      barterCategory: initialPackage.barterCategory || "products",
      estimatedBarterValue: String(initialPackage.estimatedBarterValue || ""),
      preferredBrands: "",
      minimumBarterValue: String(initialPackage.hybridBarterValue || initialPackage.estimatedBarterValue || ""),
      hybridCashAmount: String(initialPackage.hybridCashAmount || ""),
      thumbnailUrl: initialPackage.thumbnail,
      previousWorkUrls: initialPackage.mediaUrls?.length ? initialPackage.mediaUrls : [""],
      visibility: initialPackage.visibility,
      status: initialPackage.status === "draft" ? "draft" : initialPackage.status === "under_review" ? "under_review" : "active",
      packageType: initialPackage.packageType ?? "ONE_TIME",
      subscriptionInterval: initialPackage.subscriptionInterval ?? "MONTHLY",
      subscriptionDuration: String(initialPackage.subscriptionDuration ?? 3),
    };
  }, [initialPackage]);

  const [formData, setFormData] = useState<WizardFormData>(initialForm);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [uploadingSampleIndex, setUploadingSampleIndex] = useState<number | null>(null);
  const [isLoadingPlatformOptions, setIsLoadingPlatformOptions] = useState(true);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [nicheInput, setNicheInput] = useState("");

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
  const nichesList = useMemo(() => parseTags(formData.niche), [formData.niche]);

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

  const platformOptions = useMemo(
    () => platforms.filter((platform) => connectedPlatforms.includes(platform.id as Platform)),
    [connectedPlatforms]
  );

  const connectedPlatformSet = useMemo(
    () => new Set(connectedPlatforms),
    [connectedPlatforms]
  );

  useEffect(() => {
    if (mode !== "create") return;
    const raw = localStorage.getItem(DRAFT_KEY);
    setHasSavedDraft(Boolean(raw));
    if (raw) {
      setShowDraftModal(true);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "create") return;

    const payload = {
      currentStep,
      formData,
      tiers,
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  }, [mode, currentStep, formData, tiers]);

  const restoreDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as {
        currentStep: number;
        formData: Partial<WizardFormData>;
        tiers?: PackageTier[];
      };

      setCurrentStep(draft.currentStep || 1);
      setFormData({
        ...defaultForm,
        ...draft.formData,
        selectedServiceKeys: Array.isArray(draft.formData?.selectedServiceKeys)
          ? draft.formData.selectedServiceKeys
          : [],
        deliverableItems: Array.isArray(draft.formData?.deliverableItems)
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
          : [],
      });
      if (draft.tiers?.length) setTiers(draft.tiers);
      toast.success("Draft restored");
    } catch {
      toast.error("Could not restore draft");
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasSavedDraft(false);
    toast.success("Saved draft cleared");
  };

  const getStepMissingFields = (stepId: number): string[] => {
    if (stepId === 1) {
      const missing: string[] = [];
      if (!formData.title.trim()) missing.push("Title");
      if (!formData.category.trim()) missing.push("Category");
      if (!isLoadingPlatformOptions && platformOptions.length === 0) missing.push("Connected social account");
      if (!formData.platform.trim()) missing.push("Platform");
      if (!formData.niche.trim()) missing.push("Niche");
      return missing;
    }

    if (stepId === 2) {
      return formData.deliverableItems.length > 0 ? [] : ["At least one package deliverable"];
    }

    if (stepId === 3) {
      if (formData.dealType === "paid") {
        return formData.price.trim() ? [] : ["Price (PKR)"];
      }

      if (formData.dealType === "barter") {
        const missing: string[] = [];
        if (!formData.barterExpectations.trim()) missing.push("Barter expectations");
        if (!formData.minimumBarterValue.trim()) missing.push("Minimum barter value");
        return missing;
      }

      const missing: string[] = [];
      if (!formData.hybridCashAmount.trim()) missing.push("Cash amount (PKR)");
      if (!formData.minimumBarterValue.trim()) missing.push("Minimum barter value");
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
      setCurrentStep(maxUnlockedStep);
    }
  }, [currentStep, maxUnlockedStep]);

  const canMoveNext = getStepMissingFields(currentStep).length === 0;

  const updateField = (field: keyof WizardFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const addNichesFromRawInput = (rawInput: string) => {
    const rawPieces = rawInput
      .split(/[,\n]/)
      .map((part) => normalizeTag(part))
      .filter(Boolean);

    if (!rawPieces.length) return;

    let reachedLimit = false;

    setFormData((prev) => {
      const existing = parseTags(prev.niche);
      const seen = new Set(existing.map((item) => item.toLowerCase()));
      const next = [...existing];

      rawPieces.forEach((piece) => {
        if (next.length >= MAX_NICHES) {
          reachedLimit = true;
          return;
        }

        const key = piece.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          next.push(piece);
        }
      });

      return { ...prev, niche: next.join(", ") };
    });

    if (reachedLimit) {
      toast.error(`You can add up to ${MAX_NICHES} niches only.`);
    }

    setNicheInput("");
  };

  const removeNiche = (nicheToRemove: string) => {
    setFormData((prev) => {
      const next = parseTags(prev.niche).filter((item) => item !== nicheToRemove);
      return { ...prev, niche: next.join(", ") };
    });
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => {
      const next = parseTags(prev.tags).filter((tag) => tag !== tagToRemove);
      return { ...prev, tags: next.join(", ") };
    });
  };

  const onToggleService = (serviceKey: string) => {
    setFormData((prev) => {
      const exists = prev.selectedServiceKeys.includes(serviceKey);
      return {
        ...prev,
        selectedServiceKeys: exists
          ? prev.selectedServiceKeys.filter((key) => key !== serviceKey)
          : [...prev.selectedServiceKeys, serviceKey],
      };
    });
  };

  const addSelectedServicesToDeliverables = () => {
    if (!formData.selectedServiceKeys.length) {
      toast.error("Select at least one service first.");
      return;
    }

    setFormData((prev) => {
      const nextItems = [...prev.deliverableItems];

      prev.selectedServiceKeys.forEach((serviceKey) => {
        const label = serviceLabelMap.get(serviceKey);
        if (!label) return;

        const existingIndex = nextItems.findIndex((item) => item.serviceKey === serviceKey);
        if (existingIndex >= 0) {
          nextItems[existingIndex] = {
            ...nextItems[existingIndex],
            quantity: nextItems[existingIndex].quantity + 1,
          };
        } else {
          nextItems.push({ serviceKey, label, quantity: 1 });
        }
      });

      return {
        ...prev,
        deliverableItems: nextItems,
        selectedServiceKeys: [],
      };
    });

    toast.success("Added to deliverables");
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

  const addTier = () => {
    if (!tierForm.name || tierForm.price === undefined || !tierForm.deliverables?.length) {
      toast.error("Fill tier name, price, and at least one deliverable");
      return;
    }

    const newTier: PackageTier = {
      id: `tier-${Date.now()}`,
      name: tierForm.name,
      price: tierForm.price,
      deliverables: tierForm.deliverables.filter((d) => d.trim().length > 0),
      description: tierForm.description,
      position: tierForm.position ?? tiers.length,
      isPrimary: tierForm.isPrimary ?? (tiers.length === 0),
      currency: "PKR",
    };

    setTiers((prev) => [...prev, newTier]);
    setTierForm({
      name: "",
      price: undefined,
      deliverables: [""],
      description: "",
      position: tiers.length + 1,
      isPrimary: false,
    });
    setShowTierForm(false);
    toast.success("Tier added");
  };

  const removeTier = (index: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    toast.success("Tier removed");
  };

  const toggleTierExpand = (index: number) => {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const uploadThumbnail = async (file?: File | null) => {
    if (!file) return;

    setIsUploadingThumbnail(true);
    try {
      const uploaded = await uploadsService.packageThumbnail(file);
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
      const uploaded = await uploadsService.contentPreview(file, formData.platform || undefined);
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
      category: formData.category,
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
        formData.dealType === "barter" || formData.dealType === "hybrid"
          ? `Min PKR ${Number(formData.minimumBarterValue || 0).toLocaleString()}`
          : undefined,
      barterDescription:
        formData.dealType === "barter" || formData.dealType === "hybrid"
          ? formData.barterExpectations
          : undefined,
      barterCategory:
        formData.dealType === "barter" || formData.dealType === "hybrid"
          ? (formData.barterCategory as CreatorPackage["barterCategory"])
          : undefined,
      estimatedBarterValue:
        formData.dealType === "barter" || formData.dealType === "hybrid"
          ? Number(formData.estimatedBarterValue || formData.minimumBarterValue || 0)
          : undefined,
      creatorExpectations:
        formData.dealType === "barter" || formData.dealType === "hybrid"
          ? formData.barterExpectations
          : undefined,
      hybridCashAmount:
        formData.dealType === "hybrid" ? Number(formData.hybridCashAmount || 0) : undefined,
      hybridBarterValue:
        formData.dealType === "hybrid" ? Number(formData.minimumBarterValue || 0) : undefined,
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
      tiers: tiers.length > 0 ? tiers : undefined,
      packageType: formData.packageType,
      subscriptionInterval: formData.packageType === "SUBSCRIPTION" ? formData.subscriptionInterval : undefined,
      subscriptionDuration: formData.packageType === "SUBSCRIPTION" ? Number(formData.subscriptionDuration || 3) : undefined,
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
      if (mode === "edit" && initialPackage) {
        await updatePackage(initialPackage.id, packagePayload);
      } else {
        await createPackage(packagePayload);
      }

      if (mode === "create") {
        localStorage.removeItem(DRAFT_KEY);
        setHasSavedDraft(false);
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
    <div className="container mx-auto p-4 pb-6 md:p-6">

      {/* Step progress */}
      <div className={`sticky top-16 z-20 mb-6 ${panelClass} p-3`}>
        {mode === "create" && hasSavedDraft && !showDraftModal && (
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
                  setCurrentStep(step.id);
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
                onClick={() => setShowDraftModal(false)}
                className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex gap-2 p-5">
              <button
                type="button"
                onClick={() => { restoreDraft(); setShowDraftModal(false); }}
                className="flex-1 rounded-full bg-[#2d6b4e] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
              >
                Restore Draft
              </button>
              <button
                type="button"
                onClick={() => { clearDraft(); setShowDraftModal(false); }}
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
                            toast.info(`Connect ${platform.label} in Settings → Connected Accounts to enable.`);
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
                          <platform.icon className="size-4" />
                          {platform.label}
                        </div>
                        <p className="mt-1 text-center text-[10px] font-medium text-[#a0b4aa]">
                          {isConnected ? "Connected" : "Connect to enable"}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#dce6df] bg-[#f4f7f5] px-4 py-3">
                  <p className="text-xs text-[#6b7870]">
                    {connectedPlatforms.length}/{platforms.length} platforms connected
                  </p>
                  <Link
                    href="/creator/settings?tab=social"
                    className="text-xs font-bold text-[#2d6b4e] hover:underline"
                  >
                    Manage accounts
                  </Link>
                </div>
              </div>

              {/* Category / Niche / Tags */}
              <div className="grid gap-5 sm:grid-cols-3">
                {/* Category */}
                <div className="space-y-1.5">
                  <Label className={labelClass}>Category</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                    className="h-10 w-full rounded-xl border-2 border-[#dce6df] bg-white px-3 text-sm text-[#1e3d2e] transition-colors focus:border-[#2d6b4e] focus:outline-none focus:ring-4 focus:ring-[#2d6b4e]/8"
                  >
                    <option value="">Select a category</option>
                    <option value="FASHION_BEAUTY">Fashion &amp; Beauty</option>
                    <option value="FOOD_BEVERAGE">Food &amp; Beverage</option>
                    <option value="TECHNOLOGY_GADGETS">Technology &amp; Gadgets</option>
                    <option value="FITNESS_HEALTH">Fitness &amp; Health</option>
                    <option value="TRAVEL_LIFESTYLE">Travel &amp; Lifestyle</option>
                    <option value="ENTERTAINMENT_COMEDY">Entertainment &amp; Comedy</option>
                    <option value="EDUCATION_CAREER">Education &amp; Career</option>
                    <option value="BUSINESS_FINANCE">Business &amp; Finance</option>
                    <option value="HOME_DECOR">Home &amp; Decor</option>
                    <option value="GAMING">Gaming</option>
                    <option value="PARENTING_FAMILY">Parenting &amp; Family</option>
                    <option value="SPORTS">Sports</option>
                    <option value="AUTOMOTIVE">Automotive</option>
                    <option value="RELIGIOUS_SPIRITUAL">Religious &amp; Spiritual</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>

                {/* Niche */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className={labelClass}>Niche</Label>
                    <span className="text-[11px] text-[#a0b4aa]">{nichesList.length}/{MAX_NICHES}</span>
                  </div>
                  <div className="min-h-10 rounded-xl border-2 border-[#dce6df] bg-white px-3 py-2 transition-colors focus-within:border-[#2d6b4e] focus-within:ring-4 focus-within:ring-[#2d6b4e]/8">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {nichesList.map((niche) => (
                        <span key={niche} className="inline-flex items-center gap-1 rounded-full bg-[#e4f1e8] px-2.5 py-0.5 text-xs font-bold text-[#1e5c3e]">
                          {niche}
                          <button
                            type="button"
                            aria-label={`Remove ${niche}`}
                            onClick={() => removeNiche(niche)}
                            className="rounded-full p-0.5 text-[#1e5c3e]/60 transition-colors hover:text-[#1e5c3e]"
                          >
                            <X className="size-2.5" />
                          </button>
                        </span>
                      ))}
                      <input
                        value={nicheInput}
                        onChange={(e) => setNicheInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
                            if (!nicheInput.trim()) return;
                            e.preventDefault();
                            addNichesFromRawInput(nicheInput);
                            return;
                          }
                          if (e.key === "Backspace" && !nicheInput.trim() && nichesList.length) {
                            e.preventDefault();
                            removeNiche(nichesList[nichesList.length - 1]);
                          }
                        }}
                        onBlur={() => addNichesFromRawInput(nicheInput)}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData("text");
                          if (!pasted.includes(",") && !pasted.includes("\n")) return;
                          e.preventDefault();
                          addNichesFromRawInput(pasted);
                        }}
                        placeholder={nichesList.length ? "Add more…" : "e.g. Travel"}
                        className="min-w-[80px] flex-1 border-0 bg-transparent py-0.5 text-sm text-[#1e3d2e] outline-none placeholder:text-[#b0bfb8]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#a0b4aa]">Up to {MAX_NICHES}. Enter or comma to add.</p>
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

                {/* Add to deliverables bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#dce6df] bg-[#f4f7f5] px-4 py-3">
                  <p className="text-sm text-[#6b7870]">
                    {formData.selectedServiceKeys.length > 0
                      ? `${formData.selectedServiceKeys.length} service${formData.selectedServiceKeys.length > 1 ? "s" : ""} selected`
                      : "Select services above to add to your package"}
                  </p>
                  {formData.selectedServiceKeys.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={addSelectedServicesToDeliverables}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#2d6b4e] px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#1f5239]"
                      >
                        <Plus className="size-3.5" /> Add to deliverables
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, selectedServiceKeys: [] }))}
                        className="rounded-full border border-[#dce6df] px-3 py-1.5 text-xs font-bold text-[#6b7870] transition-colors hover:border-[#b0c5ba] hover:text-[#1e3d2e]"
                      >
                        Clear
                      </button>
                    </div>
                  )}
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
                      Nothing added yet. Select services above, then click "Add to deliverables".
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
          <div className={`${panelClass} p-6 md:p-8`}>
            <h2 className={`mb-6 ${sectionTitle}`}>Pricing &amp; Deal Type</h2>
            <div className="space-y-6">

              {/* Package type: One-time vs Subscription */}
              <div>
                <p className={labelClass + " mb-2"}>Package type</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: "ONE_TIME" as const, label: "One-time", desc: "Single purchase per order" },
                    { key: "SUBSCRIPTION" as const, label: "Recurring", desc: "Auto-renews each period" },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => updateField("packageType", opt.key)}
                      className={`rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                        formData.packageType === opt.key
                          ? "border-[#2d6b4e] bg-[#2d6b4e] text-white shadow-sm"
                          : "border-[#dce6df] text-[#496159] hover:border-[#2d6b4e] hover:text-[#1e3d2e]"
                      }`}
                    >
                      <p className="text-sm font-bold">{opt.label}</p>
                      <p className={`mt-0.5 text-[10px] ${formData.packageType === opt.key ? "text-white/70" : "text-[#a0b4aa]"}`}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscription configuration */}
              {formData.packageType === "SUBSCRIPTION" && (
                <div className="space-y-4 rounded-2xl border border-[#b7d4c6] bg-[#f0f8f4] p-5">
                  <p className={labelClass}>Subscription settings</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className={labelClass}>Billing interval</Label>
                      <Select
                        value={formData.subscriptionInterval}
                        onValueChange={(v) => updateField("subscriptionInterval", v)}
                      >
                        <SelectTrigger className="h-10 rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] focus:border-[#2d6b4e] focus:ring-4 focus:ring-[#2d6b4e]/8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sub-duration" className={labelClass}>
                        Duration (cycles, 0 = unlimited)
                      </Label>
                      <Input
                        id="sub-duration"
                        type="number"
                        min={0}
                        value={formData.subscriptionDuration}
                        onChange={(e) => updateField("subscriptionDuration", e.target.value)}
                        placeholder="3"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Deal type */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "paid", label: "Paid", icon: DollarSign, desc: "Cash only" },
                  { key: "barter", label: "Barter", icon: Gift, desc: "Products / services" },
                  { key: "hybrid", label: "Hybrid", icon: Sparkles, desc: "Cash + barter" },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => updateField("dealType", option.key)}
                    className={`rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                      formData.dealType === option.key
                        ? "border-[#2d6b4e] bg-[#2d6b4e] text-white shadow-sm"
                        : "border-[#dce6df] text-[#496159] hover:border-[#2d6b4e] hover:text-[#1e3d2e]"
                    }`}
                  >
                    <option.icon className={`mx-auto mb-1.5 size-5 ${formData.dealType === option.key ? "text-white" : "text-[#6b7870]"}`} />
                    <p className="text-sm font-bold">{option.label}</p>
                    <p className={`mt-0.5 text-[10px] ${formData.dealType === option.key ? "text-white/70" : "text-[#a0b4aa]"}`}>
                      {option.desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Paid/hybrid cash amount */}
              {(formData.dealType === "paid" || formData.dealType === "hybrid") && (
                <div className="space-y-1.5">
                  <Label htmlFor="pkg-price" className={labelClass}>
                    {formData.dealType === "hybrid" ? "Cash Amount (PKR)" : "Price (PKR)"}
                  </Label>
                  <Input
                    id="pkg-price"
                    type="number"
                    value={formData.dealType === "hybrid" ? formData.hybridCashAmount : formData.price}
                    onChange={(e) =>
                      formData.dealType === "hybrid"
                        ? updateField("hybridCashAmount", e.target.value)
                        : updateField("price", e.target.value)
                    }
                    placeholder="15000"
                    className={inputClass}
                  />
                </div>
              )}

              {/* Barter / hybrid details */}
              {(formData.dealType === "barter" || formData.dealType === "hybrid") && (
                <div className="space-y-4 rounded-2xl border border-[#d1ddd6] bg-[#f4f7f5] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a8f82]">Barter Details</p>

                  <div className="space-y-1.5">
                    <Label htmlFor="barter-exp" className={labelClass}>Barter Expectations</Label>
                    <Textarea
                      id="barter-exp"
                      rows={3}
                      value={formData.barterExpectations}
                      onChange={(e) => updateField("barterExpectations", e.target.value)}
                      placeholder="Hotel stay, salon service, product gifting, or event invite expectations"
                      className={textareaClass}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className={labelClass}>Acceptable Barter Category</Label>
                      <Select value={formData.barterCategory} onValueChange={(v) => updateField("barterCategory", v)}>
                        <SelectTrigger className="h-10 rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] focus:border-[#2d6b4e] focus:ring-4 focus:ring-[#2d6b4e]/8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Restaurant Meal</SelectItem>
                          <SelectItem value="hotel">Hotel Stay</SelectItem>
                          <SelectItem value="salon">Salon Service</SelectItem>
                          <SelectItem value="products">Clothing Products</SelectItem>
                          <SelectItem value="events">Event Invitations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="est-barter-val" className={labelClass}>Estimated Barter Value (PKR)</Label>
                      <Input
                        id="est-barter-val"
                        type="number"
                        value={formData.estimatedBarterValue}
                        onChange={(e) => updateField("estimatedBarterValue", e.target.value)}
                        placeholder="45000"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="pref-brands" className={labelClass}>Preferred Brands</Label>
                      <Input
                        id="pref-brands"
                        value={formData.preferredBrands}
                        onChange={(e) => updateField("preferredBrands", e.target.value)}
                        placeholder="Noon Food, Oud Royale, Noura Abaya House"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="min-barter-val" className={labelClass}>Minimum Barter Value (PKR)</Label>
                      <Input
                        id="min-barter-val"
                        type="number"
                        value={formData.minimumBarterValue}
                        onChange={(e) => updateField("minimumBarterValue", e.target.value)}
                        placeholder="20000"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery / revisions */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="delivery-days" className={labelClass}>Delivery Time (Days)</Label>
                  <Input
                    id="delivery-days"
                    type="number"
                    value={formData.deliveryDays}
                    onChange={(e) => updateField("deliveryDays", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="revisions" className={labelClass}>Revisions Included</Label>
                  <Input
                    id="revisions"
                    type="number"
                    value={formData.revisions}
                    onChange={(e) => updateField("revisions", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Package tiers */}
              <div className="rounded-2xl border border-[#d1ddd6] bg-[#f4f7f5] p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#1e3d2e]">Package Tiers</p>
                    <p className="mt-0.5 text-xs text-[#6b7870]">Optional — add Lite / Standard / Premium options</p>
                  </div>
                  {!showTierForm && (
                    <button
                      type="button"
                      onClick={() => setShowTierForm(true)}
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#dce6df] bg-white px-3.5 py-1.5 text-xs font-bold text-[#2d6b4e] transition-colors hover:border-[#2d6b4e]"
                    >
                      <Plus className="size-3.5" /> Add Tier
                    </button>
                  )}
                </div>

                {/* Add tier form */}
                {showTierForm && (
                  <div className="mb-4 space-y-4 rounded-2xl border border-[#d1ddd6] bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#7a8f82]">New Tier</p>

                    <div className="space-y-1.5">
                      <Label className={labelClass}>Tier Name</Label>
                      <Input
                        value={tierForm.name || ""}
                        onChange={(e) => setTierForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Lite, Standard, Premium"
                        className={inputClass}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className={labelClass}>Price (PKR)</Label>
                        <Input
                          type="number"
                          value={tierForm.price || ""}
                          onChange={(e) => setTierForm((prev) => ({ ...prev, price: Number(e.target.value) || undefined }))}
                          placeholder="15000"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelClass}>Position</Label>
                        <Input
                          type="number"
                          value={tierForm.position ?? tiers.length}
                          onChange={(e) => setTierForm((prev) => ({ ...prev, position: Number(e.target.value) }))}
                          placeholder="0"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className={labelClass}>Description</Label>
                      <Textarea
                        rows={2}
                        value={tierForm.description || ""}
                        onChange={(e) => setTierForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Best for small campaigns…"
                        className={textareaClass}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className={labelClass}>Deliverables for this Tier</Label>
                      {(tierForm.deliverables || []).map((del, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="size-4 shrink-0 text-[#2d6b4e]" />
                          <Input
                            value={del}
                            onChange={(e) =>
                              setTierForm((prev) => ({
                                ...prev,
                                deliverables: (prev.deliverables || []).map((d, i) => (i === idx ? e.target.value : d)),
                              }))
                            }
                            placeholder="1 Instagram Reel"
                            className={inputClass}
                          />
                          {(tierForm.deliverables?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setTierForm((prev) => ({
                                  ...prev,
                                  deliverables: (prev.deliverables || []).filter((_, i) => i !== idx),
                                }))
                              }
                              className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#b0bfb8] transition-colors hover:bg-[#ffe8e8] hover:text-[#c0392b]"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setTierForm((prev) => ({
                            ...prev,
                            deliverables: [...(prev.deliverables || []), ""],
                          }))
                        }
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#dce6df] px-3 py-1.5 text-xs font-bold text-[#496159] transition-colors hover:border-[#2d6b4e] hover:text-[#2d6b4e]"
                      >
                        <Plus className="size-3" /> Add Deliverable
                      </button>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={addTier}
                        className="flex-1 rounded-full bg-[#2d6b4e] py-2 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
                      >
                        Add Tier
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTierForm(false)}
                        className="flex-1 rounded-full border-2 border-[#dce6df] py-2 text-sm font-bold text-[#496159] transition-colors hover:border-[#2d6b4e]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Tiers list */}
                {tiers.length > 0 && (
                  <div className="space-y-2">
                    {tiers.map((tier, idx) => (
                      <div key={idx} className="overflow-hidden rounded-xl border border-[#d1ddd6] bg-white">
                        <button
                          type="button"
                          onClick={() => toggleTierExpand(idx)}
                          className="flex w-full items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-[#f4f7f5]"
                        >
                          <div className="text-left">
                            <p className="text-sm font-bold text-[#1e3d2e]">{tier.name}</p>
                            <p className="text-xs text-[#6b7870]">
                              PKR {Number(tier.price).toLocaleString()} · {tier.deliverables.length} deliverables
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {tier.isPrimary && (
                              <span className="rounded-full bg-[#e4f1e8] px-2 py-0.5 text-[10px] font-bold text-[#1e5c3e]">
                                Primary
                              </span>
                            )}
                            {expandedTiers.has(idx) ? (
                              <ChevronUp className="size-4 text-[#6b7870]" />
                            ) : (
                              <ChevronDown className="size-4 text-[#6b7870]" />
                            )}
                          </div>
                        </button>

                        {expandedTiers.has(idx) && (
                          <div className="space-y-2 border-t border-[#d1ddd6] px-4 py-3">
                            {tier.deliverables.map((del, delIdx) => (
                              <div key={delIdx} className="flex items-center gap-2 text-sm text-[#496159]">
                                <Check className="size-3.5 shrink-0 text-[#2d6b4e]" />
                                {del}
                              </div>
                            ))}
                            {tier.description && (
                              <p className="mt-1 text-xs text-[#6b7870]">{tier.description}</p>
                            )}
                            <button
                              type="button"
                              onClick={() => removeTier(idx)}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#ffe8e8] px-3 py-1.5 text-xs font-bold text-[#c0392b] transition-colors hover:bg-[#ffd0d0]"
                            >
                              <Trash2 className="size-3" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
                  {formData.dealType === "barter" && `Barter · Min PKR ${Number(formData.minimumBarterValue || 0).toLocaleString()}`}
                  {formData.dealType === "hybrid" &&
                    `PKR ${Number(formData.hybridCashAmount || 0).toLocaleString()} + barter (Min PKR ${Number(formData.minimumBarterValue || 0).toLocaleString()})`}
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
          onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}
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
              setCurrentStep((step) => Math.min(steps.length, step + 1));
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
