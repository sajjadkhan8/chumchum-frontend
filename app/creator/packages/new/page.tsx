"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  DollarSign,
  Gift,
  ImageIcon,
  Music2,
  Package,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  Youtube,
  Instagram,
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

export default function CreatePackagePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
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
  });
  const [deliverables, setDeliverables] = useState<string[]>([""]);

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

  const updateField = (field: keyof typeof formData, value: string) => {
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
    toast.success(formData.status === "draft" ? "Package saved as draft" : "Package published");
    router.push("/creator/packages");
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-1">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/creator/packages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Create Package</h1>
            <p className="text-muted-foreground">Build a conversion-ready package in five guided steps.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 overflow-x-auto">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all ${
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
            <CardContent className="space-y-4">
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
                <div className="grid grid-cols-3 gap-2">
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
                <Input value={formData.tags} onChange={(e) => updateField("tags", e.target.value)} placeholder="Lahore, Restaurant, Reel, Conversion" />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2 - Deliverables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
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
                      <Input value={formData.preferredBrands} onChange={(e) => updateField("preferredBrands", e.target.value)} placeholder="Pearl Continental, Khaadi, Nishat" />
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
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4 - Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/60 p-4">
                <p className="font-semibold">{formData.title || "Untitled Package"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formData.shortDescription || "No short description yet"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">{formData.platform || "platform"}</Badge>
                  <Badge variant="outline" className="capitalize">{formData.dealType}</Badge>
                  <Badge variant="outline">{deliverables.filter(Boolean).length} deliverables</Badge>
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
                  <Select value={formData.visibility} onValueChange={(value) => updateField("visibility", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Publish Status</Label>
                  <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
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
                {formData.status === "draft" ? "Save Draft" : "Publish Package"}
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <div className="sticky bottom-16 z-20 flex gap-2 rounded-xl border border-border bg-background/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
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
