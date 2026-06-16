"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Camera,
  Save,
  Globe,
  Mail,
  Phone,
  User,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
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
import { getInitials } from "@/lib/utils";
import { brandsService } from "@/services/brands.service";
import { uploadsService } from "@/services/uploads.service";
import { toast } from "sonner";

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
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

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
        logo: brand.logo || "",
        city: brand.city || current.city,
      }));
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
        logoUrl: profile.logo,
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

  return (
    <div className="min-h-screen bg-[#f4f2e9]">
      {/* Hero */}
      <div className="bg-[#173b2a] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/brand/settings"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8fb09a] transition hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Back to Settings
          </Link>

          <div className="flex items-center gap-4">
            {/* Logo with upload trigger */}
            <div className="relative shrink-0">
              <Avatar className="size-16 ring-2 ring-white/20">
                <AvatarImage src={profile.logo} alt={profile.companyName} />
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
