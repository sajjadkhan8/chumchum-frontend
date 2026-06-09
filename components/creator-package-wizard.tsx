"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  DollarSign,
  Gift,
  Instagram,
  Lock,
  MessageCircle,
  Music2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
  Youtube,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

const DRAFT_KEY = "creator-package-draft-v3";

const steps = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Services" },
  { id: 3, label: "Pricing" },
  { id: 4, label: "Media" },
  { id: 5, label: "Publish" },
];

const platforms = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "tiktok", label: "TikTok", icon: Music2 },
  { id: "facebook", label: "Facebook", icon: MessageCircle },
  { id: "snapchat", label: "Snapchat", icon: Camera },
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

const MAX_CATEGORIES = 5;
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

export function CreatorPackageWizard({ mode, initialPackage }: CreatorPackageWizardProps) {
  const router = useRouter();
  const creatorProfile = useAuthStore((state) => state.creatorProfile);
  const setCreatorProfile = useAuthStore((state) => state.setCreatorProfile);
  const createPackage = useCreatorPackagesStore((state) => state.createPackage);
  const updatePackage = useCreatorPackagesStore((state) => state.updatePackage);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [showTierForm, setShowTierForm] = useState(false);
  const [expandedTiers, setExpandedTiers] = useState<Set<number>>(new Set());

  // Tier management state
  const [tiers, setTiers] = useState<PackageTier[]>(initialPackage?.tiers || []);
  const [tierForm, setTierForm] = useState<Partial<PackageTier>>({
    name: "",
    price: undefined,
    deliverables: [""],
    description: "",
    position: 0,
    isPrimary: tiers.length === 0, // First tier is primary by default
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
    };
  }, [initialPackage]);

  const [formData, setFormData] = useState<WizardFormData>(initialForm);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [uploadingSampleIndex, setUploadingSampleIndex] = useState<number | null>(null);
  const [isLoadingPlatformOptions, setIsLoadingPlatformOptions] = useState(true);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
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
  const categoriesList = useMemo(() => parseTags(formData.category), [formData.category]);
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
  }, [mode]);

  useEffect(() => {
    if (mode !== "create") return;

    const payload = {
      currentStep,
      formData,
      tiers,  // Include tiers in draft
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

  const addCategoriesFromRawInput = (rawInput: string) => {
    const rawPieces = rawInput
      .split(/[,\n]/)
      .map((part) => normalizeTag(part))
      .filter(Boolean);

    if (!rawPieces.length) return;

    let reachedLimit = false;

    setFormData((prev) => {
      const existing = parseTags(prev.category);
      const seen = new Set(existing.map((item) => item.toLowerCase()));
      const next = [...existing];

      rawPieces.forEach((piece) => {
        if (next.length >= MAX_CATEGORIES) {
          reachedLimit = true;
          return;
        }

        const key = piece.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          next.push(piece);
        }
      });

      return { ...prev, category: next.join(", ") };
    });

    if (reachedLimit) {
      toast.error(`You can add up to ${MAX_CATEGORIES} categories only.`);
    }

    setCategoryInput("");
  };

  const removeCategory = (categoryToRemove: string) => {
    setFormData((prev) => {
      const next = parseTags(prev.category).filter((item) => item !== categoryToRemove);
      return { ...prev, category: next.join(", ") };
    });
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

  // Tier management functions
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
      currency: "PKR", // V1: Always PKR
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
      creatorId: initialPackage?.creatorId || "1",
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
      currency: "PKR",  // V1: PKR only
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
      tiers: tiers.length > 0 ? tiers : undefined,  // V1: Include tiers in payload
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
      const message = error instanceof Error ? error.message : 'Failed to save package';
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-1 pb-6 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/creator/packages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{mode === "edit" ? "Edit Package" : "Create Package"}</h1>
            <p className="text-muted-foreground">Build a conversion-ready package in five guided steps.</p>
          </div>
        </div>
      </div>

      {mode === "create" && hasSavedDraft && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
            <p className="text-sm text-muted-foreground">A local draft is available for this package form.</p>
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
            {steps.map((step) => (
              (() => {
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
                    className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isUnlocked
                          ? "bg-muted text-muted-foreground hover:text-foreground"
                          : "cursor-not-allowed bg-muted/60 text-muted-foreground/60"
                    }`}
                  >
                    <span>{step.id}. {step.label}</span>
                    {isCompleted && <Check className="h-3.5 w-3.5" />}
                    {!isUnlocked && <Lock className="h-3.5 w-3.5" />}
                  </button>
                );
              })()
            ))}
          </div>
        </CardContent>
      </Card>

      <motion.div key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1 - Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-4 sm:p-6">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Title</Label>
                  <span className="text-xs text-muted-foreground">{formData.title.length}/100</span>
                </div>
                <Input
                  maxLength={100}
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Ramzan Food Reel Bundle"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <span className="text-xs text-muted-foreground">{formData.fullDescription.length} chars</span>
                </div>
                <Textarea
                  rows={4}
                  value={formData.fullDescription}
                  onChange={(e) => updateField("fullDescription", e.target.value)}
                  placeholder="Add complete package details and collaboration scope"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Platform</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.platform ? "1/1 selected" : "0/1 selected"}
                  </span>
                </div>

                {isLoadingPlatformOptions && (
                  <p className="rounded-lg border border-border/60 p-3 text-sm text-muted-foreground">
                    Loading connected platforms...
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                  {platforms.map((platform) => {
                    const isConnected = connectedPlatformSet.has(platform.id as Platform);
                    const isDisabled = isLoadingPlatformOptions || !isConnected;

                    return (
                      <button
                        key={platform.id}
                        type="button"
                        aria-disabled={isDisabled}
                        onClick={() => {
                          if (isDisabled) {
                            toast.info(`Connect ${platform.label} in Settings -> Connected Accounts to enable.`);
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
                        className={`rounded-lg border p-3 text-sm transition-colors ${
                          formData.platform === platform.id
                            ? "border-primary bg-primary/10 text-primary"
                            : isDisabled
                              ? "cursor-not-allowed border-border/60 bg-muted/40 text-muted-foreground"
                              : "border-border hover:border-border/80"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <platform.icon className="h-4 w-4" />
                          {platform.label}
                        </div>
                        <p className="mt-1 text-center text-[11px] text-muted-foreground">
                          {isConnected ? "Connected" : "Connect to enable"}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground">Only connected accounts are selectable.</p>

                <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm">
                  <p className="text-muted-foreground">
                    Connected accounts: {connectedPlatforms.length}/{platforms.length}. Connect more platforms to unlock package creation for them.
                  </p>
                  <Button asChild variant="link" className="h-auto px-0 py-1 text-sm">
                    <Link href="/creator/settings?tab=social">Manage Connected Accounts</Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Category</Label>
                    <span className="text-xs text-muted-foreground">{categoriesList.length}/{MAX_CATEGORIES}</span>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background px-3 py-2 focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/30">
                    <div className="flex flex-wrap items-center gap-2">
                      {categoriesList.map((category) => (
                        <Badge key={category} variant="secondary" className="gap-1 pr-1">
                          <span>{category}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${category}`}
                            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                            onClick={() => removeCategory(category)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <input
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
                            if (!categoryInput.trim()) return;
                            e.preventDefault();
                            addCategoriesFromRawInput(categoryInput);
                            return;
                          }

                          if (e.key === "Backspace" && !categoryInput.trim() && categoriesList.length) {
                            e.preventDefault();
                            removeCategory(categoriesList[categoriesList.length - 1]);
                          }
                        }}
                        onBlur={() => addCategoriesFromRawInput(categoryInput)}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData("text");
                          if (!pasted.includes(",") && !pasted.includes("\n")) return;
                          e.preventDefault();
                          addCategoriesFromRawInput(pasted);
                        }}
                        placeholder={categoriesList.length ? "Add another category" : "Type category and press Enter"}
                        className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground" aria-live="polite">Add up to {MAX_CATEGORIES}. Enter, comma, or Tab.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Niche</Label>
                    <span className="text-xs text-muted-foreground">{nichesList.length}/{MAX_NICHES}</span>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background px-3 py-2 focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/30">
                    <div className="flex flex-wrap items-center gap-2">
                      {nichesList.map((niche) => (
                        <Badge key={niche} variant="secondary" className="gap-1 pr-1">
                          <span>{niche}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${niche}`}
                            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                            onClick={() => removeNiche(niche)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
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
                        placeholder={nichesList.length ? "Add another niche" : "Type niche and press Enter"}
                        className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground" aria-live="polite">Add up to {MAX_NICHES}. Enter, comma, or Tab.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Tags</Label>
                    <span className="text-xs text-muted-foreground">{tagsList.length}/{MAX_TAGS}</span>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background px-3 py-2 focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/30">
                    <div className="flex flex-wrap items-center gap-2">
                      {tagsList.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                          <span>{tag}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${tag}`}
                            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
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
                        placeholder={tagsList.length ? "Add another tag" : "Type a tag and press Enter"}
                        className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground" aria-live="polite">Add up to {MAX_TAGS}. Enter, comma, or Tab.</p>
                </div>
              </div>

            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2 - Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              {!formData.platform && (
                <p className="rounded-lg border border-border/60 p-3 text-sm text-muted-foreground">
                  Select a platform in Step 1 first to unlock service options.
                </p>
              )}

              {formData.platform && (
                <>
                  {serviceSections.map((section) => (
                    <div key={section.label} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                              className={`rounded-lg border p-3 text-left transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-border/80 hover:bg-muted/40"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{option.label}</p>
                                <span
                                  className={`ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                                    isSelected
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border text-transparent"
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

                  <div className="space-y-2">
                    <Label>Service Notes (Optional)</Label>
                    <Textarea
                      rows={3}
                      value={formData.serviceNotes}
                      onChange={(e) => updateField("serviceNotes", e.target.value)}
                      placeholder="Example: 2 hooks for approval, Urdu voiceover, include campaign hashtag"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-sm">
                    <p className="text-muted-foreground">
                      {formData.selectedServiceKeys.length > 0
                        ? `${formData.selectedServiceKeys.length} selected (ready to add)`
                        : "Select one or more deliverables for this package"}
                    </p>
                    <div className="flex items-center gap-2">
                      {formData.selectedServiceKeys.length > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addSelectedServicesToDeliverables}
                        >
                          <Plus className="mr-1 h-4 w-4" /> Add to deliverables
                        </Button>
                      )}
                      {formData.selectedServiceKeys.length > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setFormData((prev) => ({ ...prev, selectedServiceKeys: [] }))}
                        >
                          Clear selection
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Package Deliverables</p>
                      <Badge variant="outline">
                        {formData.deliverableItems.reduce((total, item) => total + item.quantity, 0)} total
                      </Badge>
                    </div>

                    {formData.deliverableItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nothing added yet. Select services above, then click "Add to deliverables".
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {formData.deliverableItems.map((item) => (
                          <div
                            key={item.serviceKey}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 bg-muted/20 p-2"
                          >
                            <p className="text-sm font-medium">{item.label}</p>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateDeliverableQuantity(item.serviceKey, -1)}
                              >
                                -
                              </Button>
                              <Badge variant="secondary">Qty {item.quantity}</Badge>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateDeliverableQuantity(item.serviceKey, 1)}
                              >
                                +
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => removeDeliverableItem(item.serviceKey)}
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
                  {resolvedDeliverables.map((item, index) => (
                    <p key={`${item}-${index}`}>- {item}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3 - Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { key: "paid", label: "Paid", icon: DollarSign },
                  { key: "barter", label: "Barter", icon: Gift },
                  { key: "hybrid", label: "Hybrid", icon: Sparkles },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => updateField("dealType", option.key)}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm ${
                      formData.dealType === option.key ? "border-primary bg-primary/10 text-primary" : "border-border"
                    }`}
                  >
                    <option.icon className="h-4 w-4" /> {option.label}
                  </button>
                ))}
              </div>

              {(formData.dealType === "paid" || formData.dealType === "hybrid") && (
                <div className="space-y-2">
                  <Label>{formData.dealType === "hybrid" ? "Cash Amount (PKR)" : "Price (PKR)"}</Label>
                  <Input
                    type="number"
                    value={formData.dealType === "hybrid" ? formData.hybridCashAmount : formData.price}
                    onChange={(e) =>
                      formData.dealType === "hybrid"
                        ? updateField("hybridCashAmount", e.target.value)
                        : updateField("price", e.target.value)
                    }
                    placeholder="15000"
                  />
                </div>
              )}

              {(formData.dealType === "barter" || formData.dealType === "hybrid") && (
                <div className="space-y-3 rounded-lg border border-border/60 p-3">
                  <div className="space-y-2">
                    <Label>Barter Expectations</Label>
                    <Textarea rows={3} value={formData.barterExpectations} onChange={(e) => updateField("barterExpectations", e.target.value)} placeholder="Hotel stay, salon service, product gifting, or event invite expectations" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Acceptable Barter Category</Label>
                      <Select value={formData.barterCategory} onValueChange={(value) => updateField("barterCategory", value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Restaurant Meal</SelectItem>
                          <SelectItem value="hotel">Hotel Stay</SelectItem>
                          <SelectItem value="salon">Salon Service</SelectItem>
                          <SelectItem value="products">Clothing Products</SelectItem>
                          <SelectItem value="events">Event Invitations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Barter Value (PKR)</Label>
                      <Input type="number" value={formData.estimatedBarterValue} onChange={(e) => updateField("estimatedBarterValue", e.target.value)} placeholder="45000" />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Preferred Brands</Label>
                      <Input value={formData.preferredBrands} onChange={(e) => updateField("preferredBrands", e.target.value)} placeholder="Noon Food, Oud Royale, Noura Abaya House" />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Barter Value (PKR)</Label>
                      <Input type="number" value={formData.minimumBarterValue} onChange={(e) => updateField("minimumBarterValue", e.target.value)} placeholder="20000" />
                    </div>
                  </div>
                </div>
              )}

               <div className="grid gap-3 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label>Delivery Time (Days)</Label>
                   <Input value={formData.deliveryDays} onChange={(e) => updateField("deliveryDays", e.target.value)} />
                 </div>
                 <div className="space-y-2">
                   <Label>Revisions</Label>
                   <Input value={formData.revisions} onChange={(e) => updateField("revisions", e.target.value)} />
                 </div>
               </div>

               {/* V1: Package Tiers Section */}
               <div className="space-y-3 rounded-lg border border-border/60 p-4">
                 <div className="flex items-center justify-between">
                   <div>
                     <h3 className="font-semibold">Package Tiers (Optional)</h3>
                     <p className="text-sm text-muted-foreground">Add Lite/Standard/Premium options or other variants for your package</p>
                   </div>
                   {!showTierForm && (
                     <Button size="sm" variant="outline" onClick={() => setShowTierForm(true)}>
                       <Plus className="mr-2 h-4 w-4" /> Add Tier
                     </Button>
                   )}
                 </div>

                 {/* Add Tier Form */}
                 {showTierForm && (
                   <Card className="bg-muted/30">
                     <CardContent className="space-y-3 p-3">
                       <div className="space-y-2">
                         <Label className="text-sm">Tier Name</Label>
                         <Input
                           value={tierForm.name || ""}
                           onChange={(e) => setTierForm((prev) => ({ ...prev, name: e.target.value }))}
                           placeholder="e.g., Lite, Standard, Premium"
                         />
                       </div>

                       <div className="grid gap-3 md:grid-cols-2">
                         <div className="space-y-2">
                           <Label className="text-sm">Price (PKR)</Label>
                           <Input
                             type="number"
                             value={tierForm.price || ""}
                             onChange={(e) => setTierForm((prev) => ({ ...prev, price: Number(e.target.value) || undefined }))}
                             placeholder="15000"
                           />
                         </div>
                         <div className="space-y-2">
                           <Label className="text-sm">Position</Label>
                           <Input
                             type="number"
                             value={tierForm.position || tiers.length}
                             onChange={(e) => setTierForm((prev) => ({ ...prev, position: Number(e.target.value) }))}
                             placeholder="0"
                           />
                         </div>
                       </div>

                       <div className="space-y-2">
                         <Label className="text-sm">Description</Label>
                         <Textarea
                           rows={2}
                           value={tierForm.description || ""}
                           onChange={(e) => setTierForm((prev) => ({ ...prev, description: e.target.value }))}
                           placeholder="Best for small campaigns..."
                         />
                       </div>

                       <div className="space-y-2">
                         <Label className="text-sm">Deliverables for this Tier</Label>
                         {(tierForm.deliverables || []).map((del, idx) => (
                           <div key={idx} className="flex items-center gap-2">
                             <Check className="h-4 w-4 text-primary flex-shrink-0" />
                             <Input
                               value={del}
                               onChange={(e) =>
                                 setTierForm((prev) => ({
                                   ...prev,
                                   deliverables: (prev.deliverables || []).map((d, i) => (i === idx ? e.target.value : d)),
                                 }))
                               }
                               placeholder="1 Instagram Reel"
                             />
                             {(tierForm.deliverables?.length || 0) > 1 && (
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 onClick={() =>
                                   setTierForm((prev) => ({
                                     ...prev,
                                     deliverables: (prev.deliverables || []).filter((_, i) => i !== idx),
                                   }))
                                 }
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             )}
                           </div>
                         ))}
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() =>
                             setTierForm((prev) => ({
                               ...prev,
                               deliverables: [...(prev.deliverables || []), ""],
                             }))
                           }
                         >
                           <Plus className="mr-1 h-3 w-3" /> Add Deliverable
                         </Button>
                       </div>

                       <div className="flex gap-2">
                         <Button size="sm" onClick={addTier} className="flex-1">
                           Add Tier
                         </Button>
                         <Button size="sm" variant="outline" onClick={() => setShowTierForm(false)} className="flex-1">
                           Cancel
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 )}

                 {/* Tiers List */}
                 {tiers.length > 0 && (
                   <div className="space-y-2">
                     {tiers.map((tier, idx) => (
                       <Card key={idx} className="bg-muted/20">
                         <CardContent className="p-0">
                           <button
                             type="button"
                             onClick={() => toggleTierExpand(idx)}
                             className="flex w-full items-center justify-between gap-2 p-3 hover:bg-muted/30"
                           >
                             <div className="text-left">
                               <p className="font-semibold">{tier.name}</p>
                               <p className="text-sm text-muted-foreground">PKR {Number(tier.price).toLocaleString()} • {tier.deliverables.length} deliverables</p>
                             </div>
                             <div className="flex items-center gap-2">
                               {tier.isPrimary && <Badge variant="outline" className="text-xs">Primary</Badge>}
                               {expandedTiers.has(idx) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                             </div>
                           </button>

                           {expandedTiers.has(idx) && (
                             <div className="space-y-2 border-t border-border/20 p-3">
                               {tier.deliverables.map((del, delIdx) => (
                                 <div key={delIdx} className="flex items-center gap-2 text-sm">
                                   <Check className="h-3 w-3 text-muted-foreground" />
                                   <span>{del}</span>
                                 </div>
                               ))}
                               {tier.description && (
                                 <p className="text-sm text-muted-foreground">{tier.description}</p>
                               )}
                               <Button size="sm" variant="destructive" onClick={() => removeTier(idx)}>
                                 <Trash2 className="mr-1 h-3 w-3" /> Remove
                               </Button>
                             </div>
                           )}
                         </CardContent>
                       </Card>
                     ))}
                   </div>
                 )}
               </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4 - Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="space-y-2">
                <Label>Package Thumbnail URL</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input value={formData.thumbnailUrl} onChange={(e) => updateField("thumbnailUrl", e.target.value)} placeholder="https://..." />
                  <Button variant="outline" className="shrink-0" disabled={isUploadingThumbnail} asChild>
                    <Label htmlFor="package-thumbnail-upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploadingThumbnail ? "Uploading..." : "Upload"}
                    </Label>
                  </Button>
                  <Input
                    id="package-thumbnail-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={isUploadingThumbnail}
                    onChange={(event) => void uploadThumbnail(event.target.files?.[0])}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Previous Work / Preview Gallery URLs</Label>
                {formData.previousWorkUrls.map((url, index) => (
                  <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input value={url} onChange={(e) => updateWorkSample(index, e.target.value)} placeholder="https://..." />
                    <Button variant="outline" className="shrink-0" disabled={uploadingSampleIndex !== null} asChild>
                      <Label htmlFor={`work-sample-upload-${index}`} className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadingSampleIndex === index ? "Uploading..." : "Upload"}
                      </Label>
                    </Button>
                    <Input
                      id={`work-sample-upload-${index}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/x-msvideo"
                      className="hidden"
                      disabled={uploadingSampleIndex !== null}
                      onChange={(event) => void uploadWorkSample(index, event.target.files?.[0])}
                    />
                    {formData.previousWorkUrls.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeWorkSample(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={addWorkSample}><Plus className="mr-2 h-4 w-4" />Add Sample</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 5 - Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="rounded-lg border border-border/60 p-4">
                <p className="font-semibold">{formData.title || "Untitled Package"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formData.fullDescription || "No description yet"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">{formData.platform || "platform"}</Badge>
                  <Badge variant="outline" className="capitalize">{formData.dealType}</Badge>
                  <Badge variant="outline">{resolvedDeliverables.length} deliverables</Badge>
                </div>
                <p className="mt-3 font-semibold text-primary">
                  {formData.dealType === "paid" && (formData.price ? `PKR ${Number(formData.price).toLocaleString()}` : "PKR 0")}
                  {formData.dealType === "barter" && `Barter (Min PKR ${Number(formData.minimumBarterValue || 0).toLocaleString()})`}
                  {formData.dealType === "hybrid" &&
                    `PKR ${Number(formData.hybridCashAmount || 0).toLocaleString()} + barter (Min PKR ${Number(formData.minimumBarterValue || 0).toLocaleString()})`}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={formData.visibility} onValueChange={(value) => updateField("visibility", value as "public" | "private")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Publish Status</Label>
                  <Select value={formData.status} onValueChange={(value) => updateField("status", value as "active" | "draft" | "under_review")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Publish Active</SelectItem>
                      <SelectItem value="draft">Save Draft</SelectItem>
                      <SelectItem value="under_review">Submit for Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Response Time</Label>
                  <Input
                    value={formData.responseTime}
                    onChange={(e) => updateField("responseTime", e.target.value)}
                    placeholder="Within 3 hours"
                  />
                </div>
              </div>

            </CardContent>
          </Card>
        )}
      </motion.div>

      <div className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-20 flex gap-2 rounded-xl border border-border bg-background/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}
        >
          Back
        </Button>
        {currentStep < steps.length ? (
          <Button
            type="button"
            className="flex-1"
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
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" className="flex-1" onClick={submitPackage}>
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
