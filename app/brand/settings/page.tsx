"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Bell,
  Lock,
  CreditCard,
  Building2,
  Camera,
  Save,
  Globe,
  Users,
  Mail,
  Phone,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { brandsService } from "@/services/brands.service";
import { uploadsService } from "@/services/uploads.service";
import { usersService } from "@/services/users.service";
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

function BrandSettingsPageContent() {
  const searchParams = useSearchParams();
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [profile, setProfile] = useState({
    companyName: "Karachi Gourmet Group",
    email: "marketing@karachigourmet.pk",
    phone: "+92 21 1234 5678",
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

  const [notifications, setNotifications] = useState({
    newOrders: true,
    messages: true,
    reviews: true,
    marketing: false,
    weeklyDigest: true,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
  });
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    deleteConfirmPassword: "",
  });

  const [billing, setBilling] = useState({
    plan: "Business",
    monthlyBudget: "500000",
  });

  const [campaignPreferences, setCampaignPreferences] = useState({
    preferredCreatorCategories: "Food, Lifestyle, Beauty",
    targetCities: "Karachi, Lahore, Islamabad",
    targetPlatforms: "Instagram, TikTok, YouTube",
    campaignBudgetRange: "PKR 3,750,000 - PKR 20,000,000",
  });

  const [verification, setVerification] = useState({
    businessStatus: "Verified",
    contactEmail: "verification@karachigourmet.pk",
    phoneNumber: "+92 300 778 8899",
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
      setBilling((current) => ({
        ...current,
        monthlyBudget: brand.monthlyBudget ? String(brand.monthlyBudget) : "",
      }));
      setCampaignPreferences({
        preferredCreatorCategories: brand.preferredCreatorCategories || "",
        targetCities: brand.targetCities || "",
        targetPlatforms: brand.targetPlatforms || "",
        campaignBudgetRange: brand.campaignBudgetRange || "",
      });
      setVerification({
        businessStatus: brand.businessVerificationStatus || "Pending",
        contactEmail: brand.verificationContactEmail || "",
        phoneNumber: brand.verificationPhoneNumber || "",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load brand profile";
      toast.error(message);
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
        monthlyBudget: Number(billing.monthlyBudget) || undefined,
      });
      await loadBrandProfile();
      toast.success("Brand settings saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save brand settings";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBillingSave = async () => {
    setIsSaving(true);
    try {
      const saved = await brandsService.updateMe({
        monthlyBudget: Number(billing.monthlyBudget) || undefined,
      });
      setBilling((current) => ({
        ...current,
        monthlyBudget: saved.monthlyBudget ? String(saved.monthlyBudget) : "",
      }));
      toast.success("Billing settings saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save billing settings";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCampaignPreferencesSave = async () => {
    setIsSaving(true);
    try {
      const saved = await brandsService.updateMe({
        preferredCreatorCategories: campaignPreferences.preferredCreatorCategories,
        targetCities: campaignPreferences.targetCities,
        targetPlatforms: campaignPreferences.targetPlatforms,
        campaignBudgetRange: campaignPreferences.campaignBudgetRange,
      });
      setCampaignPreferences({
        preferredCreatorCategories: saved.preferredCreatorCategories || "",
        targetCities: saved.targetCities || "",
        targetPlatforms: saved.targetPlatforms || "",
        campaignBudgetRange: saved.campaignBudgetRange || "",
      });
      toast.success("Campaign preferences saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save campaign preferences";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerificationSave = async () => {
    setIsSaving(true);
    try {
      const saved = await brandsService.updateMe({
        businessVerificationStatus: verification.businessStatus,
        verificationContactEmail: verification.contactEmail,
        verificationPhoneNumber: verification.phoneNumber,
      });
      setVerification({
        businessStatus: saved.businessVerificationStatus || "Pending",
        contactEmail: saved.verificationContactEmail || "",
        phoneNumber: saved.verificationPhoneNumber || "",
      });
      toast.success("Verification settings saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save verification settings";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const loadNotificationPreferences = useCallback(async () => {
    const preferences = await usersService.getNotificationPreferences();
    setNotifications(preferences);
  }, []);

  const handleNotificationSave = async () => {
    setIsSaving(true);
    try {
      const saved = await usersService.updateNotificationPreferences(notifications);
      setNotifications(saved);
      toast.success("Notification preferences saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save notification preferences";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
      toast.error("Current password, new password, and confirmation are required");
      return;
    }

    if (security.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (security.newPassword !== security.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setIsSaving(true);
    try {
      await usersService.changePassword({
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
      });
      setSecurity((current) => ({
        ...current,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      toast.success("Password updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update password";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!security.deleteConfirmPassword) {
      toast.error("Enter your password to delete your account");
      return;
    }

    const confirmed = window.confirm("Permanently delete your account? This cannot be undone.");
    if (!confirmed) return;

    setIsSaving(true);
    try {
      await usersService.deleteAccount({ confirmPassword: security.deleteConfirmPassword });
      toast.success("Account deleted");
      await logout();
      window.location.assign("/signup");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete account";
      toast.error(message);
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
    void loadNotificationPreferences();
  }, [loadBrandProfile, loadNotificationPreferences]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) return;

    const allowedTabs = new Set([
      'profile',
      'billing',
      'campaigns',
      'verification',
      'notifications',
      'security',
    ]);

    if (allowedTabs.has(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
      <div className="container mx-auto max-w-4xl p-4 pb-24 md:p-6 md:pb-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your company profile and preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full justify-start gap-1 overflow-x-auto">
            <TabsTrigger value="profile" className="gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Users className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="verification" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Logo Section */}
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.logo} alt={profile.companyName} />
                    <AvatarFallback className="text-2xl">
                      {getInitials(profile.companyName)}
                    </AvatarFallback>
                  </Avatar>
                  <Label
                    htmlFor="brand-logo-upload"
                    className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                  </Label>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold">{profile.companyName}</h3>
                  <p className="text-muted-foreground">{profile.industry}</p>
                  <Button variant="outline" size="sm" className="mt-2" disabled={isUploadingLogo} asChild>
                    <Label htmlFor="brand-logo-upload" className="cursor-pointer">
                      {isUploadingLogo ? "Uploading..." : "Change Logo"}
                    </Label>
                  </Button>
                  <Input
                    id="brand-logo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={isUploadingLogo}
                    onChange={(event) => void uploadLogo(event.target.files?.[0])}
                  />
	                </div>
                  <Button onClick={handleBillingSave} disabled={isSaving} className="w-full">
                    {isSaving ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Billing Settings
                      </>
                    )}
                  </Button>
	              </CardContent>
	            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={profile.companyName}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, companyName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={profile.industry}
                      onValueChange={(v) =>
                        setProfile((p) => ({ ...p, industry: v }))
                      }
                    >
                      <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={profile.description}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="website"
                        className="pl-9"
                        value={profile.website}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, website: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Select
                      value={profile.city}
                      onValueChange={(v) =>
                        setProfile((p) => ({ ...p, city: v }))
                      }
                    >
                      <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select
                    value={profile.companySize}
                    onValueChange={(v) =>
                      setProfile((p) => ({ ...p, companySize: v }))
                    }
                  >
                    <SelectTrigger>
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
              </CardContent>
            </Card>

            {/* Contact Person */}
            <Card>
              <CardHeader>
                <CardTitle>Primary Contact</CardTitle>
                <CardDescription>
                  Person responsible for creator communications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="contactName"
                      className="pl-9"
                      value={profile.contactName}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, contactName: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="contactEmail"
                        type="email"
                        className="pl-9"
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
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="contactPhone"
                        type="tel"
                        className="pl-9"
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
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </TabsContent>

          {/* Campaign Preferences Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Preferences</CardTitle>
                <CardDescription>
                  Define your default targeting for faster campaign setup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Preferred Creator Categories</Label>
                  <Input
                    value={campaignPreferences.preferredCreatorCategories}
                    onChange={(e) =>
                      setCampaignPreferences((prev) => ({
                        ...prev,
                        preferredCreatorCategories: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Target Cities</Label>
                    <Input
                      value={campaignPreferences.targetCities}
                      onChange={(e) =>
                        setCampaignPreferences((prev) => ({
                          ...prev,
                          targetCities: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Platforms</Label>
                    <Input
                      value={campaignPreferences.targetPlatforms}
                      onChange={(e) =>
                        setCampaignPreferences((prev) => ({
                          ...prev,
                          targetPlatforms: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Campaign Budgets</Label>
                  <Input
                    value={campaignPreferences.campaignBudgetRange}
                    onChange={(e) =>
                      setCampaignPreferences((prev) => ({
                        ...prev,
                        campaignBudgetRange: e.target.value,
                      }))
                    }
                  />
                </div>
	              </CardContent>
	            </Card>
              <Button onClick={handleCampaignPreferencesSave} disabled={isSaving} className="w-full">
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Campaign Preferences
                  </>
                )}
              </Button>
	          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Verification</CardTitle>
                <CardDescription>
                  Keep legal and contact details up to date for trust badges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Business Verification Status</Label>
                  <Select
                    value={verification.businessStatus}
                    onValueChange={(value) =>
                      setVerification((prev) => ({ ...prev, businessStatus: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Verified">Verified</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Needs Review">Needs Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input
                      value={verification.contactEmail}
                      onChange={(e) =>
                        setVerification((prev) => ({ ...prev, contactEmail: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={verification.phoneNumber}
                      onChange={(e) =>
                        setVerification((prev) => ({ ...prev, phoneNumber: e.target.value }))
                      }
                    />
                  </div>
                </div>
	              </CardContent>
	            </Card>
              <Button onClick={handleVerificationSave} disabled={isSaving} className="w-full">
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Verification Settings
                  </>
                )}
              </Button>
	          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-primary bg-primary/5 p-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">
                      {billing.plan} Plan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Unlimited creators, priority support
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => toast.info("Plan upgrade flow is coming soon.")}>Upgrade</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Budget</CardTitle>
                <CardDescription>
                  Set a monthly spending limit for campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (PKR)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={billing.monthlyBudget}
                    onChange={(e) =>
                      setBilling((b) => ({ ...b, monthlyBudget: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    You&apos;ll receive a notification when you reach 80% of your budget
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Use the dedicated Payments workspace for funding, payout controls, and invoices.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Visa ending in 4242</p>
                      <p className="text-sm text-muted-foreground">
                        Expires 12/2025
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/brand/payments">Manage</Link>
                  </Button>
                </div>
                <Button className="mt-4 w-full" asChild>
                  <Link href="/brand/payments">Open Payments Workspace</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    key: "messages",
                    label: "New messages",
                    description: "Get notified when creators message you",
                  },
                  {
                    key: "newOrders",
                    label: "Order updates",
                    description: "Receive updates on your campaign progress",
                  },
                  {
                    key: "reviews",
                    label: "Creator responses",
                    description: "Get notified when creators respond to offers",
                  },
                  {
                    key: "marketing",
                    label: "Marketing",
                    description: "Receive tips and promotional content",
                  },
                  {
                    key: "weeklyDigest",
                    label: "Weekly report",
                    description: "Summary of your weekly campaign performance",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Switch
                      checked={
                        notifications[
                          item.key as keyof typeof notifications
                        ] as boolean
                      }
                      onCheckedChange={(checked) =>
                        setNotifications((n) => ({ ...n, [item.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "pushNotifications", label: "Push notifications", description: "Receive push notifications on your device" },
                  { key: "emailNotifications", label: "Email", description: "Receive notifications via email" },
                  { key: "smsNotifications", label: "SMS", description: "Receive notifications via SMS" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications] as boolean}
                      onCheckedChange={(checked) =>
                        setNotifications((n) => ({ ...n, [item.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Button onClick={handleNotificationSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Preferences
                </>
              )}
            </Button>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={security.currentPassword}
                    onChange={(event) => setSecurity((current) => ({ ...current, currentPassword: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={security.newPassword}
                    onChange={(event) => setSecurity((current) => ({ ...current, newPassword: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={security.confirmPassword}
                    onChange={(event) => setSecurity((current) => ({ ...current, confirmPassword: event.target.value }))}
                  />
                </div>
                <Button onClick={handlePasswordChange} disabled={isSaving}>Update Password</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Status: Disabled</p>
                    <p className="text-sm text-muted-foreground">
                      Protect your account with 2FA
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => toast.info("2FA setup wizard is planned for next release.")}>Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage who has access to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>AH</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Ali Raza</p>
                        <p className="text-sm text-muted-foreground">
                          ali@karachigourmet.pk • Owner
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>SK</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Hina Tariq</p>
                        <p className="text-sm text-muted-foreground">
                          hina@karachigourmet.pk • Admin
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toast.info("Team member removal is disabled in demo mode.")}>
                      Remove
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="mt-4 w-full" onClick={() => toast.info("Invite team flow is coming soon.")}>
                  <Users className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Input
                      type="password"
                      placeholder="Confirm with your password"
                      value={security.deleteConfirmPassword}
                      onChange={(event) => setSecurity((current) => ({ ...current, deleteConfirmPassword: event.target.value }))}
                    />
                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={isSaving}>
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}

export default function BrandSettingsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-6" />}>
      <BrandSettingsPageContent />
    </Suspense>
  );
}
