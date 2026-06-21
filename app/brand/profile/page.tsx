"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Camera,
  Save,
  Globe,
  Mail,
  Phone,
  Star,
  Target,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { brandsService } from "@/services/brands.service";
import { reviewsService } from "@/services/reviews.service";
import { uploadsService } from "@/services/uploads.service";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import type { BrandVerificationStatus, Review } from "@/types";

const industries = [
  "Fashion & Apparel",
  "Beauty & Cosmetics",
  "Technology",
  "Food & Beverage",
  "Health & Fitness",
  "Travel & Hospitality",
  "Entertainment",
  "Education",
  "Finance",
  "E-commerce",
  "Other",
];

const verificationStatusMeta: Record<BrandVerificationStatus, { label: string; className: string }> = {
  verified: { label: "✓ Verified", className: "border-[#bcd3c5] bg-[#e7f0ea] text-[#185c39]" },
  pending: { label: "⏳ Verification pending", className: "border-[#efcf83] bg-[#fff1cd] text-[#8b5e12]" },
  under_review: { label: "⏳ Under review", className: "border-[#efcf83] bg-[#fff1cd] text-[#8b5e12]" },
  rejected: { label: "✗ Verification rejected", className: "border-[#f5c2c2] bg-[#fce8e6] text-[#c0392b]" },
  unverified: { label: "Unverified", className: "border-white/15 bg-white/10 text-[#8fb09a]" },
};

const companySizes = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "500+ employees",
];

const cities = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
];

const inputCls =
  "h-9 rounded-xl border-[#d9e0d8] bg-[#f4f2e9] text-[#1a2e22] placeholder:text-[#8fa098] focus-visible:border-[#2d6b4e] focus-visible:ring-2 focus-visible:ring-[#2d6b4e]/15 focus-visible:bg-white";
const labelCls = "text-xs font-bold text-[#526259]";

export default function BrandProfilePage() {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [brandReviews, setBrandReviews] = useState<Review[]>([]);

  const [brandRating, setBrandRating] = useState(0);
  const [brandTotalReviews, setBrandTotalReviews] = useState(0);

  const [profile, setProfile] = useState({
    companyName: "Karachi Gourmet Group",
    website: "https://karachigourmet.pk",
    industry: "Food & Beverage",
    companySize: "51-200 employees",
    city: "Karachi",
    description:
      "Leading organic food retailer in Pakistan, committed to bringing fresh and healthy products to every home.",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400",
    contactName: "Ali Raza",
    contactEmail: "ali@karachigourmet.pk",
    contactPhone: "+92 300 987 6543",
    verificationStatus: 'unverified' as BrandVerificationStatus,
    monthlyBudget: '' as string,
    targetPlatforms: '' as string,
    targetCities: '' as string,
  });

  const loadBrandProfile = useCallback(async () => {
    try {
      const brand = await brandsService.getMe();
      if (!brand) return;
      setProfile((current) => ({
        ...current,
        companyName: brand.name || current.companyName,
        website: brand.website || "",
        industry: brand.industry || current.industry,
        description: brand.description || "",
        logo: brand.logo || current.logo,
        city: brand.city || current.city,
        companySize: brand.companySize || current.companySize,
        contactName: brand.contactName || current.contactName,
        contactEmail: brand.contactEmail || current.contactEmail,
        contactPhone: brand.contactPhone || current.contactPhone,
        verificationStatus: brand.businessVerificationStatus || 'unverified',
        monthlyBudget: brand.monthlyBudget ? String(brand.monthlyBudget) : '',
        targetPlatforms: brand.targetPlatforms || '',
        targetCities: brand.targetCities || '',
      }));
      setBrandRating(brand.brandRating ?? 0);
      setBrandTotalReviews(brand.brandTotalReviews ?? 0);
    } catch {
      // Silently fall back to defaults on load failure
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await brandsService.updateMe({
        companyName: profile.companyName,
        website: profile.website,
        industry: profile.industry,
        description: profile.description,
        logoUrl: profile.logo || undefined,
        city: profile.city,
        companySize: profile.companySize,
        contactName: profile.contactName,
        contactEmail: profile.contactEmail,
        contactPhone: profile.contactPhone,
        monthlyBudget: profile.monthlyBudget ? Number(profile.monthlyBudget) : undefined,
        targetPlatforms: profile.targetPlatforms || undefined,
        targetCities: profile.targetCities || undefined,
      });
      await loadBrandProfile();
      toast.success("Company profile saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save company profile";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadLogo = async (file?: File | null) => {
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const uploaded = await uploadsService.brandLogo(file);
      setProfile((current) => ({ ...current, logo: uploaded.url }));
      toast.success("Brand logo uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload brand logo";
      toast.error(message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  useEffect(() => {
    void loadBrandProfile();
  }, [loadBrandProfile]);

  useEffect(() => {
    if (!user?.id) return;
    void reviewsService.getByBrandId(user.id).then(setBrandReviews).catch(() => null);
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-[#f4f2e9]">
      {/* Hero */}
      <div className="bg-[#173b2a] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            {/* Logo with upload trigger */}
            <div className="relative shrink-0">
              <Avatar className="size-16 ring-2 ring-white/20">
                <AvatarImage src={profile.logo || undefined} alt={profile.companyName} />
                <AvatarFallback className="bg-[#2d6b4e] text-lg font-extrabold text-white">
                  {getInitials(profile.companyName)}
                </AvatarFallback>
              </Avatar>
              <Label
                htmlFor="brand-logo-upload"
                className="absolute bottom-0 right-0 flex size-6 cursor-pointer items-center justify-center rounded-full bg-[#e6aa38] text-[#173b2a] shadow-lg transition hover:bg-[#f0bb55]"
              >
                <Camera className="size-3" />
              </Label>
              <Input
                id="brand-logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={isUploadingLogo}
                onChange={(e) => void uploadLogo(e.target.files?.[0])}
              />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold tracking-tight text-white">
                {profile.companyName}
              </h1>
              <p className="mt-0.5 text-sm font-medium text-[#8fb09a]">
                {profile.industry}
              </p>
              {brandTotalReviews > 0 && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
                  <Star className="size-3 fill-[#e6aa38] text-[#e6aa38]" />
                  <span className="text-xs font-bold text-white">{brandRating.toFixed(1)}</span>
                  <span className="text-xs text-[#8fb09a]">({brandTotalReviews})</span>
                </div>
              )}
              {profile.verificationStatus && (
                <div className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${verificationStatusMeta[profile.verificationStatus].className}`}>
                  {verificationStatusMeta[profile.verificationStatus].label}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-1.5 h-7 rounded-lg border border-white/15 px-3 text-[11px] font-bold text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white disabled:opacity-50"
                disabled={isUploadingLogo}
                asChild
              >
                <Label htmlFor="brand-logo-upload" className="cursor-pointer">
                  {isUploadingLogo ? "Uploading…" : "Change Logo"}
                </Label>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="mx-auto -mt-8 max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div
          className="rounded-[1.75rem] border border-[#d9e0d8] bg-white p-6 shadow-[0_18px_60px_rgba(38,70,50,0.07)]"
          style={
            {
              "--background": "oklch(1 0 0)",
              "--foreground": "oklch(0.1 0 0)",
              "--card": "oklch(1 0 0)",
              "--card-foreground": "oklch(0.1 0 0)",
              "--muted": "oklch(0.96 0 0)",
              "--muted-foreground": "oklch(0.45 0 0)",
              "--border": "oklch(0.91 0 0)",
              "--input": "oklch(0.91 0 0)",
              "--ring": "oklch(0.55 0.17 145)",
            } as React.CSSProperties
          }
        >
          {/* Company Information */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-[#e7f0ea]">
                <Building2 className="size-3.5 text-[#185c39]" />
              </span>
              <h2 className="text-sm font-extrabold text-[#1a2e22]">Company Information</h2>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className={labelCls}>
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    className={inputCls}
                    value={profile.companyName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, companyName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="industry" className={labelCls}>
                    Industry
                  </Label>
                  <Select
                    value={profile.industry}
                    onValueChange={(v) =>
                      setProfile((p) => ({ ...p, industry: v }))
                    }
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className={labelCls}>
                  Description
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  className="rounded-xl border-[#d9e0d8] bg-[#f4f2e9] text-[#1a2e22] placeholder:text-[#8fa098] focus-visible:border-[#2d6b4e] focus-visible:ring-2 focus-visible:ring-[#2d6b4e]/15 focus-visible:bg-white"
                  value={profile.description}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="website" className={labelCls}>
                    Website
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8fa098]" />
                    <Input
                      id="website"
                      className={`${inputCls} pl-9`}
                      value={profile.website}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, website: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city" className={labelCls}>
                    City
                  </Label>
                  <Select
                    value={profile.city}
                    onValueChange={(v) =>
                      setProfile((p) => ({ ...p, city: v }))
                    }
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companySize" className={labelCls}>
                  Company Size
                </Label>
                <Select
                  value={profile.companySize}
                  onValueChange={(v) =>
                    setProfile((p) => ({ ...p, companySize: v }))
                  }
                >
                  <SelectTrigger className={inputCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <div className="my-6 border-t border-[#e8ede9]" />

          {/* Primary Contact */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-[#e7f0ea]">
                <User className="size-3.5 text-[#185c39]" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-[#1a2e22]">Primary Contact</h2>
                <p className="text-[11px] text-[#8fa098]">Person responsible for creator communications</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactName" className={labelCls}>
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8fa098]" />
                  <Input
                    id="contactName"
                    className={`${inputCls} pl-9`}
                    value={profile.contactName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, contactName: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail" className={labelCls}>
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8fa098]" />
                    <Input
                      id="contactEmail"
                      type="email"
                      className={`${inputCls} pl-9`}
                      value={profile.contactEmail}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          contactEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone" className={labelCls}>
                    Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8fa098]" />
                    <Input
                      id="contactPhone"
                      type="tel"
                      className={`${inputCls} pl-9`}
                      value={profile.contactPhone}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          contactPhone: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="my-6 border-t border-[#e8ede9]" />

          {/* Targeting & Budget */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-[#e7f0ea]">
                <Target className="size-3.5 text-[#185c39]" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-[#1a2e22]">Targeting & Budget</h2>
                <p className="text-[11px] text-[#8fa098]">Influences creator recommendations and campaign defaults</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="monthlyBudget" className={labelCls}>Monthly Budget (PKR)</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  className={inputCls}
                  value={profile.monthlyBudget}
                  placeholder="e.g. 500000"
                  onChange={(e) => setProfile((p) => ({ ...p, monthlyBudget: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="targetPlatforms" className={labelCls}>Target Platforms</Label>
                  <Input
                    id="targetPlatforms"
                    className={inputCls}
                    value={profile.targetPlatforms}
                    placeholder="Instagram, TikTok, YouTube"
                    onChange={(e) => setProfile((p) => ({ ...p, targetPlatforms: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="targetCities" className={labelCls}>Target Cities</Label>
                  <Input
                    id="targetCities"
                    className={inputCls}
                    value={profile.targetCities}
                    placeholder="Karachi, Lahore, Islamabad"
                    onChange={(e) => setProfile((p) => ({ ...p, targetCities: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-[1.4rem] border border-[#d9e0d8] bg-[#f4f2e9] p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Reputation</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <h3 className="text-lg font-extrabold tracking-[-0.03em] text-[#1a2e22]">
                Creator Reviews
              </h3>
              {brandTotalReviews > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="size-4 fill-[#e6aa38] text-[#e6aa38]" />
                  <span className="text-sm font-extrabold text-[#1a2e22]">{brandRating.toFixed(1)}</span>
                  <span className="text-xs text-[#8fa098]">({brandTotalReviews})</span>
                </div>
              )}
            </div>
            {brandReviews.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[#cdd4cf] bg-white p-6 text-center">
                <Star className="mx-auto size-8 text-[#d4c89a]" />
                <p className="mt-2 text-sm font-bold text-[#526259]">No reviews yet</p>
                <p className="mt-1 text-xs text-[#8fa098]">Creator reviews from completed orders appear here.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {brandReviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-[#d9e0d8] bg-white p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e7f0ea] text-xs font-extrabold text-[#185c39]">
                        {getInitials(review.creatorId.slice(0, 6))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'fill-[#e6aa38] text-[#e6aa38]' : 'text-[#cdd4cf]'}`} />
                            ))}
                          </div>
                          <span className="shrink-0 text-xs text-[#87938b]">{formatRelativeTime(review.createdAt)}</span>
                        </div>
                        {review.comment && (
                          <p className="mt-2 text-sm leading-relaxed text-[#3a5244]">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="mt-6">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 w-full gap-2 rounded-xl bg-[#2d6b4e] text-sm font-bold text-white shadow-sm hover:bg-[#185c39] disabled:opacity-50"
            >
              {isSaving ? (
                "Saving…"
              ) : (
                <>
                  <Save className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
