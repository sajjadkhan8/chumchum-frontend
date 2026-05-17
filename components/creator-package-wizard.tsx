"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  DollarSign,
  Gift,
  Instagram,
  Music2,
  Package,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Youtube,
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
import type { CreatorPackage } from "@/types";
import { useCreatorPackagesStore } from "@/store/creator-packages-store";

const DRAFT_KEY = "creator-package-draft-v1";

const steps = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Deliverables" },
  { id: 3, label: "Pricing" },
  { id: 4, label: "Media" },
  { id: 5, label: "Publish" },
];

const platforms = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "tiktok", label: "TikTok", icon: Music2 },
];

interface WizardFormData {
  title: string;
  category: string;
  platform: string;
  niche: string;
  shortDescription: string;
  fullDescription: string;
  tags: string;
  responseTime: string;
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
      previousWorkUrls: [""],
      visibility: initialPackage.visibility,
      status: initialPackage.status === "draft" ? "draft" : initialPackage.status === "under_review" ? "under_review" : "active",
    };
  }, [initialPackage]);

  const [formData, setFormData] = useState<WizardFormData>(initialForm);
  const [deliverables, setDeliverables] = useState<string[]>(initialPackage?.deliverables || [""]);

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
      deliverables,
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  }, [mode, currentStep, formData, deliverables]);

  const restoreDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as {
        currentStep: number;
        formData: WizardFormData;
        deliverables: string[];
      };

      setCurrentStep(draft.currentStep || 1);
      setFormData(draft.formData || defaultForm);
      setDeliverables(draft.deliverables?.length ? draft.deliverables : [""]);
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
      return deliverables.some((item) => item.trim().length > 0);
    }

    if (currentStep === 3) {
      if (formData.dealType === "paid") return Boolean(formData.price);
      if (formData.dealType === "barter") return Boolean(formData.barterExpectations && formData.minimumBarterValue);
      return Boolean(formData.hybridCashAmount && formData.minimumBarterValue);
    }

    return true;
  }, [currentStep, formData, deliverables]);

  const updateField = (field: keyof WizardFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onAddDeliverable = () => setDeliverables((prev) => [...prev, ""]);

  const onUpdateDeliverable = (index: number, value: string) => {
    setDeliverables((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const onRemoveDeliverable = (index: number) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
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

  const submitPackage = () => {
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
      deliverables: deliverables.filter((item) => item.trim().length > 0),
      deliveryDays: Number(formData.deliveryDays || 0),
      revisions: Number(formData.revisions || 0),
      responseTime: formData.responseTime,
      price:
        formData.dealType === "barter"
          ? 0
          : Number(formData.dealType === "hybrid" ? formData.hybridCashAmount || 0 : formData.price || 0),
      dealType: formData.dealType,
      barterValue:
        formData.dealType === "barter" || formData.dealType === "hybrid"
          ? `Min SAR ${Number(formData.minimumBarterValue || 0).toLocaleString()}`
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

    if (mode === "edit" && initialPackage) {
      updatePackage(initialPackage.id, packagePayload);
    } else {
      createPackage(packagePayload);
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
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => updateField("platform", platform.id)}
                      className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm ${
                        formData.platform === platform.id ? "border-primary bg-primary/10 text-primary" : "border-primary/10"
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
                <Input value={formData.tags} onChange={(e) => updateField("tags", e.target.value)} placeholder="Riyadh, Restaurant, Reel, Conversion" />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2 - Deliverables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <p className="text-sm text-muted-foreground">
                Add each deliverable clearly (reels, stories, posts, YouTube integrations, appearances).
              </p>
              <div className="space-y-2">
                {deliverables.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <Input value={item} onChange={(e) => onUpdateDeliverable(index, e.target.value)} placeholder="1 Instagram Reel + 3 Story Frames" />
                    {deliverables.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => onRemoveDeliverable(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={onAddDeliverable}>
                <Plus className="mr-2 h-4 w-4" /> Add Deliverable
              </Button>
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
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm ${
                      formData.dealType === option.key ? "border-primary bg-primary/10 text-primary" : "border-border"
                    }`}
                  >
                    <option.icon className="h-4 w-4" /> {option.label}
                  </button>
                ))}
              </div>

              {(formData.dealType === "paid" || formData.dealType === "hybrid") && (
                <div className="space-y-2">
                  <Label>{formData.dealType === "hybrid" ? "Cash Amount (SAR)" : "Price (SAR)"}</Label>
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
                <div className="space-y-3 rounded-2xl border border-primary/10 p-3">
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
                      <Label>Estimated Barter Value (SAR)</Label>
                      <Input type="number" value={formData.estimatedBarterValue} onChange={(e) => updateField("estimatedBarterValue", e.target.value)} placeholder="45000" />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Preferred Brands</Label>
                      <Input value={formData.preferredBrands} onChange={(e) => updateField("preferredBrands", e.target.value)} placeholder="Noon Food, Oud Royale, Noura Abaya House" />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Barter Value (SAR)</Label>
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
                <Input value={formData.thumbnailUrl} onChange={(e) => updateField("thumbnailUrl", e.target.value)} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label>Previous Work / Preview Gallery URLs</Label>
                {formData.previousWorkUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={url} onChange={(e) => updateWorkSample(index, e.target.value)} placeholder="https://..." />
                    {formData.previousWorkUrls.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeWorkSample(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={addWorkSample}><Plus className="mr-2 h-4 w-4" />Add Sample</Button>
              </div>

              <Button variant="ghost" onClick={() => toast.info("Upload flow can be plugged into storage in the next phase.")}>
                <Upload className="mr-2 h-4 w-4" /> Upload Media
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 5 - Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="rounded-2xl border border-primary/10 p-4">
                <p className="font-semibold">{formData.title || "Untitled Package"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formData.shortDescription || "No short description yet"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">{formData.platform || "platform"}</Badge>
                  <Badge variant="outline" className="capitalize">{formData.dealType}</Badge>
                  <Badge variant="outline">{deliverables.filter(Boolean).length} deliverables</Badge>
                </div>
                <p className="mt-3 font-semibold text-primary">
                  {formData.dealType === "paid" && (formData.price ? `SAR ${Number(formData.price).toLocaleString()}` : "SAR 0")}
                  {formData.dealType === "barter" && `Barter (Min SAR ${Number(formData.minimumBarterValue || 0).toLocaleString()})`}
                  {formData.dealType === "hybrid" &&
                    `SAR ${Number(formData.hybridCashAmount || 0).toLocaleString()} + barter (Min SAR ${Number(formData.minimumBarterValue || 0).toLocaleString()})`}
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

      <div className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-20 flex gap-2 rounded-2xl border border-primary/10 bg-background/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
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

