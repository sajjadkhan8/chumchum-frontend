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
  MessageCircle,
  Music2,
  Package,
  Plus,
  Sparkles,
  Trash2,
  Upload,
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
import { useCreatorPackagesStore } from "@/store/creator-packages-store";
import { uploadsService } from "@/services/uploads.service";

const DRAFT_KEY = "creator-package-draft-v2";

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

type ServiceGroupId = "content" | "promotion" | "live" | "story" | "production" | "custom";

interface ServiceOption {
  key: string;
  label: string;
  description: string;
  groups: ServiceGroupId[];
}

const serviceGroups: { id: ServiceGroupId; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "promotion", label: "Promotion" },
  { id: "story", label: "Story" },
  { id: "live", label: "Live" },
  { id: "production", label: "Production" },
  { id: "custom", label: "Custom" },
];

const serviceOptionsByPlatform: Record<Platform, ServiceOption[]> = {
  instagram: [
    { key: "insta_reel", label: "Instagram Reel", description: "Short-form vertical video post", groups: ["content", "promotion"] },
    { key: "insta_story_frames", label: "Story Frames", description: "Multi-frame story sequence with CTA", groups: ["story", "promotion"] },
    { key: "insta_photo_post", label: "Photo Post", description: "Single or carousel photo feed post", groups: ["content", "promotion"] },
    { key: "insta_live", label: "Instagram Live", description: "Live product showcase or Q&A", groups: ["live", "promotion"] },
    { key: "insta_ugc_creation", label: "UGC Content Creation", description: "Creator produces brand-owned content", groups: ["production"] },
    { key: "insta_custom", label: "Custom Campaign", description: "Flexible custom collaboration scope", groups: ["custom"] },
  ],
  youtube: [
    { key: "youtube_shorts", label: "YouTube Shorts", description: "Vertical short video placement", groups: ["content", "promotion"] },
    { key: "youtube_integration", label: "Long-Form Integration", description: "Brand segment in long-form video", groups: ["promotion", "content"] },
    { key: "youtube_dedicated_video", label: "Dedicated Video", description: "Full sponsored video campaign", groups: ["promotion"] },
    { key: "youtube_live", label: "YouTube Live", description: "Live stream mention or activation", groups: ["live"] },
    { key: "youtube_ugc_creation", label: "Video Production Only", description: "Produce content for brand channels", groups: ["production"] },
    { key: "youtube_custom", label: "Custom Campaign", description: "Flexible custom collaboration scope", groups: ["custom"] },
  ],
  tiktok: [
    { key: "tiktok_video", label: "TikTok Video", description: "Native short video post", groups: ["content", "promotion"] },
    { key: "tiktok_series", label: "Video Series", description: "Multi-video storytelling campaign", groups: ["content", "promotion"] },
    { key: "tiktok_live", label: "TikTok Live", description: "Live showcase and direct audience interaction", groups: ["live", "promotion"] },
    { key: "tiktok_ugc_creation", label: "TikTok UGC Creation", description: "Creator-made brand-owned content", groups: ["production"] },
    { key: "tiktok_custom", label: "Custom Campaign", description: "Flexible custom collaboration scope", groups: ["custom"] },
  ],
  facebook: [
    { key: "facebook_video_post", label: "Facebook Video Post", description: "Video post on creator page", groups: ["content", "promotion"] },
    { key: "facebook_photo_post", label: "Facebook Photo Post", description: "Single or carousel feed post", groups: ["content"] },
    { key: "facebook_story", label: "Facebook Story", description: "Story sequence with CTA", groups: ["story", "promotion"] },
    { key: "facebook_live", label: "Facebook Live", description: "Live session for product promotion", groups: ["live"] },
    { key: "facebook_custom", label: "Custom Campaign", description: "Flexible custom collaboration scope", groups: ["custom", "production"] },
  ],
  snapchat: [
    { key: "snapchat_story", label: "Snap Story", description: "Story frame sequence for launch or event", groups: ["story", "promotion"] },
    { key: "snapchat_spotlight", label: "Spotlight Video", description: "Short entertaining or promotional clip", groups: ["content", "promotion"] },
    { key: "snapchat_takeover", label: "Account Takeover", description: "Creator runs temporary branded takeover", groups: ["promotion"] },
    { key: "snapchat_custom", label: "Custom Campaign", description: "Flexible custom collaboration scope", groups: ["custom", "production"] },
  ],
};

interface WizardFormData {
  title: string;
  category: string;
  platform: string;
  niche: string;
  shortDescription: string;
  fullDescription: string;
  tags: string;
  responseTime: string;
  serviceGroup: ServiceGroupId | "";
  primaryServiceKey: string;
  addonServiceKeys: string[];
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
  shortDescription: "",
  fullDescription: "",
  tags: "",
  responseTime: "Within 3 hours",
  serviceGroup: "",
  primaryServiceKey: "",
  addonServiceKeys: [],
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

interface CreatorPackageWizardProps {
  mode: "create" | "edit";
  initialPackage?: CreatorPackage;
}

export function CreatorPackageWizard({ mode, initialPackage }: CreatorPackageWizardProps) {
  const router = useRouter();
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
      shortDescription: initialPackage.shortDescription,
      fullDescription: initialPackage.fullDescription,
      tags: initialPackage.tags.join(", "),
      responseTime: initialPackage.responseTime,
      serviceGroup: "",
      primaryServiceKey: "",
      addonServiceKeys: [],
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

  const serviceOptions = useMemo(() => {
    const platform = formData.platform as Platform;
    return serviceOptionsByPlatform[platform] || [];
  }, [formData.platform]);

  const filteredPrimaryOptions = useMemo(() => {
    if (!formData.serviceGroup) return serviceOptions;
    return serviceOptions.filter((option) => option.groups.includes(formData.serviceGroup as ServiceGroupId));
  }, [serviceOptions, formData.serviceGroup]);

  const resolvedDeliverables = useMemo(() => {
    const optionMap = new Map(serviceOptions.map((option) => [option.key, option.label]));
    const items = [
      optionMap.get(formData.primaryServiceKey),
      ...formData.addonServiceKeys.map((key) => optionMap.get(key)),
      formData.serviceNotes?.trim() ? `Notes: ${formData.serviceNotes.trim()}` : undefined,
    ].filter((item): item is string => Boolean(item));

    if (items.length > 0) return items;
    if (initialPackage?.deliverables?.length) return initialPackage.deliverables;
    return ["Custom deliverable - confirm scope in chat"];
  }, [serviceOptions, formData.primaryServiceKey, formData.addonServiceKeys, formData.serviceNotes, initialPackage?.deliverables]);

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
        formData: WizardFormData;
        tiers?: PackageTier[];
      };

      setCurrentStep(draft.currentStep || 1);
      setFormData(draft.formData || defaultForm);
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

  const canMoveNext = useMemo(() => {
    if (currentStep === 1) {
      return Boolean(formData.title && formData.category && formData.platform && formData.niche);
    }

    if (currentStep === 2) {
      return Boolean(formData.primaryServiceKey);
    }

    if (currentStep === 3) {
      if (formData.dealType === "paid") return Boolean(formData.price);
      if (formData.dealType === "barter") return Boolean(formData.barterExpectations && formData.minimumBarterValue);
      return Boolean(formData.hybridCashAmount && formData.minimumBarterValue);
    }

    return true;
  }, [currentStep, formData]);

  const updateField = (field: keyof WizardFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSelectPrimaryService = (serviceKey: string) => {
    setFormData((prev) => {
      const nextAddons = prev.addonServiceKeys.filter((key) => key !== serviceKey);
      return { ...prev, primaryServiceKey: serviceKey, addonServiceKeys: nextAddons };
    });
  };

  const onToggleAddon = (serviceKey: string) => {
    setFormData((prev) => {
      const exists = prev.addonServiceKeys.includes(serviceKey);
      return {
        ...prev,
        addonServiceKeys: exists
          ? prev.addonServiceKeys.filter((key) => key !== serviceKey)
          : [...prev.addonServiceKeys, serviceKey],
      };
    });
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
      shortDescription: formData.shortDescription || formData.title,
      description: formData.shortDescription || formData.fullDescription,
      fullDescription: formData.fullDescription || formData.shortDescription,
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
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`min-h-10 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all ${
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {step.id}. {step.label}
              </button>
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
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={formData.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Ramzan Food Reel Bundle" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={formData.category} onChange={(e) => updateField("category", e.target.value)} placeholder="Food, Beauty, Tech" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Platform</Label>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => updateField("platform", platform.id)}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm ${
                        formData.platform === platform.id ? "border-primary bg-primary/10 text-primary" : "border-border"
                      }`}
                    >
                      <platform.icon className="h-4 w-4" />
                      {platform.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Niche</Label>
                  <Input value={formData.niche} onChange={(e) => updateField("niche", e.target.value)} placeholder="Street food and family dining" />
                </div>
                <div className="space-y-2">
                  <Label>Response Time</Label>
                  <Input value={formData.responseTime} onChange={(e) => updateField("responseTime", e.target.value)} placeholder="Within 3 hours" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input value={formData.shortDescription} onChange={(e) => updateField("shortDescription", e.target.value)} placeholder="One-line offer summary for listing cards" />
              </div>

              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea rows={4} value={formData.fullDescription} onChange={(e) => updateField("fullDescription", e.target.value)} placeholder="Add complete package details and collaboration scope" />
              </div>

              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input value={formData.tags} onChange={(e) => updateField("tags", e.target.value)} placeholder="Karachi, Restaurant, Reel, Conversion" />
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
                  <div className="space-y-2">
                    <Label>Service Group</Label>
                    <div className="flex flex-wrap gap-2">
                      {serviceGroups.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              serviceGroup: group.id,
                              primaryServiceKey: "",
                              addonServiceKeys: [],
                            }))
                          }
                          className={`rounded-full border px-3 py-1 text-sm ${
                            formData.serviceGroup === group.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {group.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Primary Service</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {filteredPrimaryOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => onSelectPrimaryService(option.key)}
                          className={`rounded-lg border p-3 text-left ${
                            formData.primaryServiceKey === option.key
                              ? "border-primary bg-primary/10"
                              : "border-border"
                          }`}
                        >
                          <p className="font-medium">{option.label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Add-ons (Optional)</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {serviceOptions
                        .filter((option) => option.key !== formData.primaryServiceKey)
                        .map((option) => {
                          const selected = formData.addonServiceKeys.includes(option.key);
                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => onToggleAddon(option.key)}
                              className={`rounded-lg border px-3 py-2 text-left text-sm ${
                                selected ? "border-primary bg-primary/10 text-primary" : "border-border"
                              }`}
                            >
                              {selected ? "+ " : ""}
                              {option.label}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Service Notes (Optional)</Label>
                    <Textarea
                      rows={3}
                      value={formData.serviceNotes}
                      onChange={(e) => updateField("serviceNotes", e.target.value)}
                      placeholder="Example: 2 hooks for approval, Urdu voiceover, include campaign hashtag"
                    />
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
                <p className="mt-1 text-sm text-muted-foreground">{formData.shortDescription || "No short description yet"}</p>
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

              <div className="grid gap-3 md:grid-cols-2">
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
              </div>

              <Button className="w-full" onClick={submitPackage}>
                <Package className="mr-2 h-4 w-4" />
                {mode === "edit" ? "Update Package" : formData.status === "draft" ? "Save Draft" : "Publish Package"}
              </Button>
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
                toast.error("Please complete required fields in this step.");
                return;
              }
              setCurrentStep((step) => Math.min(steps.length, step + 1));
            }}
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" className="flex-1" onClick={submitPackage}>
            Finish
          </Button>
        )}
      </div>
    </div>
  );
}
