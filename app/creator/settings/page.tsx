"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Lock,
  CreditCard,
  Link as LinkIcon,
  Globe,
  Camera,
  Instagram,
  Youtube,
  Music2,
  Plus,
  Trash2,
  Save,
  Check,
  X,
  Wallet,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

const categories = [
  "Fashion",
  "Beauty",
  "Tech",
  "Food",
  "Travel",
  "Fitness",
  "Lifestyle",
  "Gaming",
  "Education",
  "Entertainment",
];

const languages = ["English", "Arabic"];

const cities = [
  "Jeddah",
  "Riyadh",
  "Dammam",
  "Mecca",
  "Medina",
  "Khobar",
  "Tabuk",
];

function CreatorSettingsPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: "Reem Al Otaibi",
    handle: "reemwellness",
    bio: "Fashion & lifestyle content creator based in Riyadh. Passionate about sustainable fashion and empowering women.",
    email: "reem@zingzing.sa",
    phone: "+966 55 123 4567",
    city: "Riyadh",
    categories: ["Fashion", "Lifestyle"],
    languages: ["English", "Arabic"],
    website: "https://reemwellness.sa",
    niche: "Fashion & Lifestyle",
    coverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200",
    availabilityStatus: "Available this week",
    responseTime: "Within 2 hours",
    collaborationPreferences: "Fashion hauls, skincare tutorials, unboxing, and hybrid product campaigns",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
  });

  const [socialAccounts, setSocialAccounts] = useState([
    { platform: "instagram", username: "reemwellness", profileUrl: "https://instagram.com/reemwellness", followers: 125000, avgViews: 48000, engagementRate: 5.6, verified: true },
    { platform: "youtube", username: "ReemWellness", profileUrl: "https://youtube.com/@ReemWellness", followers: 45000, avgViews: 18000, engagementRate: 4.8, verified: true },
    { platform: "tiktok", username: "reemwellness", profileUrl: "https://tiktok.com/@reemwellness", followers: 89000, avgViews: 62000, engagementRate: 7.1, verified: false },
    { platform: "facebook", username: "ReemWellnessOfficial", profileUrl: "https://facebook.com/reemwellnessofficial", followers: 38000, avgViews: 12000, engagementRate: 3.9, verified: false },
    { platform: "snapchat", username: "reemwellness.snap", profileUrl: "https://snapchat.com/add/reemwellness.snap", followers: 21000, avgViews: 9000, engagementRate: 4.2, verified: false },
  ]);

  const [paymentSettings, setPaymentSettings] = useState({
    stcPayNumber: "+966551234567",
    madaCard: "Mada **** 4582",
    accountTitle: "Reem Al Otaibi",
    ibanOrAccount: "SA0380000000608010167519",
    applePayNumber: "+966551234567",
    bankTransferIban: "SA0380000000608010167519",
  });

  const [creatorPreferences, setCreatorPreferences] = useState({
    acceptsBarter: true,
    acceptsHybridDeals: true,
    preferredIndustries: "Fashion, Beauty, Wellness, E-commerce",
    minimumBudget: "25000",
  });

  const analyticsData = {
    engagementTrend: "+8.4% MoM",
    topPlatform: "Instagram",
    monthlyEarnings: "SAR 145,000",
    profileViews: "3,240",
    packagePerformance: "Top package conversion: 18%",
  };

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

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Settings saved");
  };

  const handleCategoryToggle = (category: string) => {
    setProfile((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setProfile((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  const platformIcons: Record<string, React.ElementType> = {
    instagram: Instagram,
    youtube: Youtube,
    tiktok: Music2,
    facebook: LinkIcon,
    snapchat: LinkIcon,
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) return;

    const allowedTabs = new Set([
      'profile',
      'social',
      'payments',
      'preferences',
      'analytics',
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
          Manage your profile and account preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <LinkIcon className="h-4 w-4" />
            Social
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <Wallet className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Check className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
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
          {/* Avatar Section */}
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold">{profile.name}</h3>
                <p className="text-muted-foreground">@{profile.handle}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => toast.info("Profile image upload will be enabled with backend storage.")}
                >
                  Change Photo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handle">Username</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      @
                    </span>
                    <Input
                      id="handle"
                      className="pl-7"
                      value={profile.handle}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, handle: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, bio: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {profile.bio.length}/300 characters
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="niche">Niche / Category</Label>
                  <Input
                    id="niche"
                    value={profile.niche}
                    onChange={(e) => setProfile((p) => ({ ...p, niche: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responseTime">Response Time</Label>
                  <Input
                    id="responseTime"
                    value={profile.responseTime}
                    onChange={(e) => setProfile((p) => ({ ...p, responseTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="availabilityStatus">Availability Status</Label>
                  <Input
                    id="availabilityStatus"
                    value={profile.availabilityStatus}
                    onChange={(e) => setProfile((p) => ({ ...p, availabilityStatus: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverImage">Cover/Banner Image URL</Label>
                  <Input
                    id="coverImage"
                    value={profile.coverImage}
                    onChange={(e) => setProfile((p) => ({ ...p, coverImage: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="collaborationPreferences">Collaboration Preferences</Label>
                <Textarea
                  id="collaborationPreferences"
                  rows={3}
                  value={profile.collaborationPreferences}
                  onChange={(e) => setProfile((p) => ({ ...p, collaborationPreferences: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Select the niches you create content for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryToggle(category)}
                    className={`rounded-full px-4 py-2 text-sm transition-all ${
                      profile.categories.includes(category)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
              <CardDescription>
                Languages you can create content in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {languages.map((language) => (
                  <button
                    key={language}
                    onClick={() => handleLanguageToggle(language)}
                    className={`rounded-full px-4 py-2 text-sm transition-all ${
                      profile.languages.includes(language)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {language}
                  </button>
                ))}
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

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage your social media accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialAccounts.map((account) => {
                const Icon = platformIcons[account.platform] || LinkIcon;
                return (
                  <div
                    key={account.platform}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {account.platform}
                          </span>
                          {account.verified && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info(`${account.platform} disconnection is disabled in demo mode.`)}
                      >
                        Disconnect
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input value={account.username} readOnly />
                      <Input value={account.profileUrl} readOnly />
                      <Input value={`${account.followers.toLocaleString()} followers`} readOnly />
                      <Input value={`${account.avgViews.toLocaleString()} avg views`} readOnly />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Engagement rate: {account.engagementRate}%</p>
                  </div>
                );
              })}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => toast.info("Add account flow is coming soon.")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Connect Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure your payout channels for withdrawals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>STC Pay</Label>
                  <Input
                    value={paymentSettings.stcPayNumber}
                    onChange={(e) => setPaymentSettings((p) => ({ ...p, stcPayNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mada</Label>
                  <Input
                    value={paymentSettings.madaCard}
                    onChange={(e) => setPaymentSettings((p) => ({ ...p, madaCard: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Apple Pay</Label>
                  <Input
                    value={paymentSettings.applePayNumber}
                    onChange={(e) => setPaymentSettings((p) => ({ ...p, applePayNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank Transfer</Label>
                  <Input
                    value={paymentSettings.bankTransferIban}
                    onChange={(e) => setPaymentSettings((p) => ({ ...p, bankTransferIban: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account Title</Label>
                  <Input
                    value={paymentSettings.accountTitle}
                    onChange={(e) => setPaymentSettings((p) => ({ ...p, accountTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IBAN / Account Number</Label>
                  <Input
                    value={paymentSettings.ibanOrAccount}
                    onChange={(e) => setPaymentSettings((p) => ({ ...p, ibanOrAccount: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Creator Preferences</CardTitle>
              <CardDescription>Control what collaborations you receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">Accept barter deals</p>
                  <p className="text-xs text-muted-foreground">Receive non-cash exchange offers</p>
                </div>
                <Switch
                  checked={creatorPreferences.acceptsBarter}
                  onCheckedChange={(checked) => setCreatorPreferences((p) => ({ ...p, acceptsBarter: checked }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">Accept hybrid deals</p>
                  <p className="text-xs text-muted-foreground">Combine cash + barter in offers</p>
                </div>
                <Switch
                  checked={creatorPreferences.acceptsHybridDeals}
                  onCheckedChange={(checked) => setCreatorPreferences((p) => ({ ...p, acceptsHybridDeals: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Industries</Label>
                <Input
                  value={creatorPreferences.preferredIndustries}
                  onChange={(e) => setCreatorPreferences((p) => ({ ...p, preferredIndustries: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Collaboration Budget (SAR)</Label>
                <Input
                  type="number"
                  value={creatorPreferences.minimumBudget}
                  onChange={(e) => setCreatorPreferences((p) => ({ ...p, minimumBudget: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Creator Insights</CardTitle>
              <CardDescription>Performance snapshot for your profile and packages.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Engagement Trend</p>
                <p className="font-semibold">{analyticsData.engagementTrend}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Top Performing Platform</p>
                <p className="font-semibold">{analyticsData.topPlatform}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Monthly Earnings</p>
                <p className="font-semibold">{analyticsData.monthlyEarnings}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Profile Views</p>
                <p className="font-semibold">{analyticsData.profileViews}</p>
              </div>
              <div className="rounded-lg border border-border p-3 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Package Performance</p>
                <p className="font-semibold">{analyticsData.packagePerformance}</p>
              </div>
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
                { key: "newOrders", label: "New order requests", description: "Get notified when brands send you offers" },
                { key: "messages", label: "Messages", description: "Receive notifications for new messages" },
                { key: "reviews", label: "Reviews", description: "Get notified when brands leave reviews" },
                { key: "marketing", label: "Marketing", description: "Receive tips and promotional content" },
                { key: "weeklyDigest", label: "Weekly digest", description: "Summary of your weekly performance" },
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
                    checked={notifications[item.key as keyof typeof notifications] as boolean}
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
                    checked={notifications[item.key as keyof typeof notifications] as boolean}
                    onCheckedChange={(checked) =>
                      setNotifications((n) => ({ ...n, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
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
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button onClick={() => toast.success("Password update request captured.")}>Update Password</Button>
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
                <Button variant="outline" onClick={() => toast.info("2FA setup wizard is planned for next iteration.")}>Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" onClick={() => toast.error("Account deletion is disabled in demo mode.")}>Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CreatorSettingsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-6" />}>
      <CreatorSettingsPageContent />
    </Suspense>
  );
}

