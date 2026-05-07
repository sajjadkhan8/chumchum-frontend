"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Instagram,
  Youtube,
  Music2,
  Clock,
  RefreshCw,
  DollarSign,
  Package,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const platforms = [
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "youtube", name: "YouTube", icon: Youtube },
  { id: "tiktok", name: "TikTok", icon: Music2 },
];

const contentTypes = {
  instagram: [
    { id: "story", name: "Story" },
    { id: "reel", name: "Reel" },
    { id: "post", name: "Feed Post" },
    { id: "carousel", name: "Carousel" },
    { id: "live", name: "Live" },
  ],
  youtube: [
    { id: "video", name: "Video" },
    { id: "short", name: "YouTube Short" },
    { id: "live", name: "Live Stream" },
  ],
  tiktok: [
    { id: "video", name: "Video" },
    { id: "live", name: "Live" },
  ],
};

export default function CreatePackagePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platform: "",
    contentType: "",
    price: "",
    deliveryTime: "3",
    revisions: "2",
    deliverables: [""],
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "platform" ? { contentType: "" } : {}),
    }));
  };

  const handleDeliverableChange = (index: number, value: string) => {
    const newDeliverables = [...formData.deliverables];
    newDeliverables[index] = value;
    setFormData((prev) => ({ ...prev, deliverables: newDeliverables }));
  };

  const addDeliverable = () => {
    setFormData((prev) => ({
      ...prev,
      deliverables: [...prev.deliverables, ""],
    }));
  };

  const removeDeliverable = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the package to the database
    router.push("/creator/packages");
  };

  const selectedPlatform = platforms.find((p) => p.id === formData.platform);
  const availableContentTypes = formData.platform
    ? contentTypes[formData.platform as keyof typeof contentTypes]
    : [];

  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/creator/packages">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Create Package
          </h1>
          <p className="text-muted-foreground">
            Set up a new service package for brands
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name</Label>
              <Input
                id="name"
                placeholder="e.g., Instagram Story Pack"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what brands will get with this package..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Platform & Content Type */}
        <Card>
          <CardHeader>
            <CardTitle>Platform & Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <div className="grid grid-cols-3 gap-3">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handleChange("platform", platform.id)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                      formData.platform === platform.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <platform.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {formData.platform && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <Label>Content Type</Label>
                <div className="flex flex-wrap gap-2">
                  {availableContentTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleChange("contentType", type.id)}
                      className={`rounded-full px-4 py-2 text-sm transition-all ${
                        formData.contentType === type.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Pricing & Delivery */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">Price (PKR)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    placeholder="15000"
                    className="pl-9"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryTime">Delivery (Days)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Select
                    value={formData.deliveryTime}
                    onValueChange={(v) => handleChange("deliveryTime", v)}
                  >
                    <SelectTrigger className="pl-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5, 7, 10, 14, 21, 30].map((days) => (
                        <SelectItem key={days} value={days.toString()}>
                          {days} {days === 1 ? "day" : "days"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="revisions">Revisions</Label>
                <div className="relative">
                  <RefreshCw className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Select
                    value={formData.revisions}
                    onValueChange={(v) => handleChange("revisions", v)}
                  >
                    <SelectTrigger className="pl-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 5, "unlimited"].map((rev) => (
                        <SelectItem key={rev} value={rev.toString()}>
                          {rev === "unlimited"
                            ? "Unlimited"
                            : `${rev} revision${rev !== 1 ? "s" : ""}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deliverables */}
        <Card>
          <CardHeader>
            <CardTitle>Deliverables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              List what brands will receive with this package
            </p>

            <div className="space-y-3">
              {formData.deliverables.map((deliverable, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4 text-primary" />
                  <Input
                    placeholder="e.g., 3 Instagram Stories"
                    value={deliverable}
                    onChange={(e) =>
                      handleDeliverableChange(index, e.target.value)
                    }
                    className="flex-1"
                  />
                  {formData.deliverables.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeliverable(index)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addDeliverable}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Deliverable
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="mb-3 flex items-center gap-3">
                {selectedPlatform && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <selectedPlatform.icon className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">
                    {formData.name || "Package Name"}
                  </h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {formData.platform || "Platform"} •{" "}
                    {formData.contentType || "Content Type"}
                  </p>
                </div>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                {formData.description || "Package description will appear here"}
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <Clock className="mr-1 h-3 w-3" />
                  {formData.deliveryTime} days
                </Badge>
                <Badge variant="secondary">
                  {formData.revisions} revisions
                </Badge>
              </div>
              {formData.deliverables.filter(Boolean).length > 0 && (
                <div className="mb-3 space-y-1">
                  {formData.deliverables
                    .filter(Boolean)
                    .map((d, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="h-3 w-3 text-primary" />
                        {d}
                      </div>
                    ))}
                </div>
              )}
              <Separator className="my-3" />
              <p className="text-xl font-bold text-primary">
                {formData.price
                  ? `PKR ${parseInt(formData.price).toLocaleString()}`
                  : "PKR 0"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" asChild>
            <Link href="/creator/packages">Cancel</Link>
          </Button>
          <Button type="submit" className="flex-1">
            <Package className="mr-2 h-4 w-4" />
            Create Package
          </Button>
        </div>
      </form>
    </div>
  );
}
