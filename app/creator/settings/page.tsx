"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  User,
  Bell,
  Lock,
  Link as LinkIcon,
  Globe,
  Camera,
  Instagram,
  Youtube,
  Music2,
  Plus,
  Save,
  Check,
  BarChart3,
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
import { creatorsService, type CreatorSocialAccountPayload } from "@/services/creators.service";
import { uploadsService } from "@/services/uploads.service";
import { usersService } from "@/services/users.service";
import type { Platform } from "@/types";
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

const languages = ["English", "Urdu"];

const cities = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
];

type EditableSocialAccount = CreatorSocialAccountPayload & {
  platform: Platform;
  verified?: boolean;
};

const defaultProfile = {
  name: "",
  handle: "",
  bio: "",
  email: "",
  phone: "",
  city: "Karachi",
  categories: [] as string[],
  languages: ["English", "Urdu"],
  website: "",
  niche: "",
  coverImage: "",
  availabilityStatus: "Available this week",
  responseTime: "Within 24 hours",
  collaborationPreferences: "",
  avatar: "",
};

const platformOrder: Platform[] = ["instagram", "youtube", "tiktok", "facebook", "snapchat"];

const buildSocialLinks = (accounts: EditableSocialAccount[]) => {
  const byPlatform = Object.fromEntries(accounts.map((account) => [account.platform, account.profileUrl || ""]));

  return {
    instagramUrl: byPlatform.instagram,
    youtubeUrl: byPlatform.youtube,
    tiktokUrl: byPlatform.tiktok,
    facebookUrl: byPlatform.facebook,
  };
};

function CreatorSettingsPageContent() {
  const searchParams = useSearchParams();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [profile, setProfile] = useState(defaultProfile);
  const [socialAccounts, setSocialAccounts] = useState<EditableSocialAccount[]>([]);


  const [creatorPreferences, setCreatorPreferences] = useState({
    acceptsBarter: true,
    acceptsHybridDeals: true,
    preferredIndustries: "Fashion, Beauty, Wellness, E-commerce",
    minimumBudget: "25000",
  });

  const analyticsData = {
    engagementTrend: "+8.4% MoM",
    topPlatform: "Instagram",
    monthlyEarnings: "PKR 3,625,000",
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
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    deleteConfirmPassword: "",
  });

  const loadCreatorProfile = useCallback(async () => {
    const creator = await creatorsService.getMe();
    if (!creator) return;

    setProfile((current) => ({
      ...current,
      name: creator.name || user?.name || "",
      handle: creator.username || user?.email?.split("@")[0] || "",
      bio: creator.bio || "",
      email: creator.email || user?.email || "",
      phone: creator.phone || user?.phone || "",
      city: creator.city || "Karachi",
      categories: creator.categories || [],
      languages: creator.languages?.length ? creator.languages : current.languages,
      website: creator.website || "",
      niche: creator.niche || creator.categories?.[0] || "",
      availabilityStatus: creator.availabilityStatus || current.availabilityStatus,
      avatar: creator.avatar || "",
      coverImage: creator.coverImage || "",
      responseTime: creator.responseTime || "Within 24 hours",
      collaborationPreferences: creator.preferredIndustries || "",
    }));
    setCreatorPreferences({
      acceptsBarter: Boolean(creator.acceptsBarter),
      acceptsHybridDeals: Boolean(creator.acceptsHybridDeals),
      preferredIndustries: creator.preferredIndustries || "",
      minimumBudget: creator.minimumBudget ? String(creator.minimumBudget) : "",
    });

    setSocialAccounts(
      creator.platforms
        .filter((platform) => platform.profileUrl)
        .map((platform) => ({
          platform: platform.platform,
          username: platform.username,
          profileUrl: platform.profileUrl,
          followers: platform.followers,
          avgViews: platform.avgViews,
          engagementRate: platform.engagementRate,
          verified: false,
        })),
    );
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await creatorsService.updateMe({
        name: profile.name,
        username: profile.handle,
        email: profile.email,
        phone: profile.phone,
        city: profile.city,
        avatarUrl: profile.avatar,
        bio: profile.bio,
        category: profile.niche || profile.categories[0],
        coverImageUrl: profile.coverImage,
        website: profile.website,
        niche: profile.niche,
        availabilityStatus: profile.availabilityStatus,
        responseTime: profile.responseTime,
        preferredIndustries: profile.collaborationPreferences,
        languages: profile.languages,
        categories: profile.categories,
        ...buildSocialLinks(socialAccounts),
      });
      await loadCreatorProfile();
      toast.success("Profile saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save profile";
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

  const handleCreatorPreferencesSave = async () => {
    setIsSaving(true);
    try {
      const saved = await creatorsService.updatePreferences({
        acceptsBarter: creatorPreferences.acceptsBarter,
        acceptsHybridDeals: creatorPreferences.acceptsHybridDeals,
        preferredIndustries: creatorPreferences.preferredIndustries,
        minimumBudget: creatorPreferences.minimumBudget ? Number(creatorPreferences.minimumBudget) : undefined,
      });
      setCreatorPreferences({
        acceptsBarter: Boolean(saved.acceptsBarter),
        acceptsHybridDeals: Boolean(saved.acceptsHybridDeals),
        preferredIndustries: saved.preferredIndustries || "",
        minimumBudget: saved.minimumBudget ? String(saved.minimumBudget) : "",
      });
      setProfile((current) => ({
        ...current,
        collaborationPreferences: saved.preferredIndustries || "",
      }));
      toast.success("Creator preferences saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save creator preferences";
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

  const uploadAvatar = async (file?: File | null) => {
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const uploaded = await uploadsService.avatar(file);
      setProfile((current) => ({ ...current, avatar: uploaded.url }));
      toast.success("Profile photo uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload profile photo";
      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const uploadCoverImage = async (file?: File | null) => {
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const uploaded = await uploadsService.coverImage(file);
      setProfile((current) => ({ ...current, coverImage: uploaded.url }));
      toast.success("Cover image uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload cover image";
      toast.error(message);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSocialSave = async () => {
    setIsSaving(true);
    try {
      const accounts = socialAccounts
        .filter((account) => account.platform && (account.username || account.profileUrl))
        .map(({ platform, username, profileUrl, followers, avgViews, engagementRate }) => ({
          platform,
          username,
          profileUrl,
          followers: Number(followers) || 0,
          avgViews: Number(avgViews) || 0,
          engagementRate: Number(engagementRate) || 0,
        }));

      await creatorsService.updateSocialAccounts(accounts);
      await creatorsService.updateMe(buildSocialLinks(accounts as EditableSocialAccount[]));
      await loadCreatorProfile();
      toast.success("Social accounts saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save social accounts";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
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

  const updateSocialAccount = (index: number, updates: Partial<EditableSocialAccount>) => {
    setSocialAccounts((accounts) =>
      accounts.map((account, accountIndex) =>
        accountIndex === index ? { ...account, ...updates } : account,
      ),
    );
  };

  const addSocialAccount = () => {
    const nextPlatform = platformOrder.find((platform) => !socialAccounts.some((account) => account.platform === platform)) || "instagram";
    setSocialAccounts((accounts) => [
      ...accounts,
      {
        platform: nextPlatform,
        username: "",
        profileUrl: "",
        followers: 0,
        avgViews: 0,
        engagementRate: 0,
        verified: false,
      },
    ]);
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) return;

    const allowedTabs = new Set([
      'profile',
      'social',
      'preferences',
      'analytics',
      'notifications',
      'security',
    ]);

    if (allowedTabs.has(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user || user.role !== "creator") return;
    void loadCreatorProfile().catch((error) => {
      const message = error instanceof Error ? error.message : "Could not load creator profile";
      toast.error(message);
    });
    void loadNotificationPreferences().catch((error) => {
      const message = error instanceof Error ? error.message : "Could not load notification preferences";
      toast.error(message);
    });
  }, [loadCreatorProfile, loadNotificationPreferences, user]);

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
                <Label
                  htmlFor="creator-avatar-upload"
                  className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                </Label>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold">{profile.name}</h3>
                <p className="text-muted-foreground">@{profile.handle}</p>
                <Button variant="outline" size="sm" className="mt-2" disabled={isUploadingAvatar} asChild>
                  <Label htmlFor="creator-avatar-upload" className="cursor-pointer">
                    {isUploadingAvatar ? "Uploading..." : "Change Photo"}
                  </Label>
                </Button>
                <Input
                  id="creator-avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={isUploadingAvatar}
                  onChange={(event) => void uploadAvatar(event.target.files?.[0])}
                />
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
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="coverImage"
                      value={profile.coverImage}
                      onChange={(e) => setProfile((p) => ({ ...p, coverImage: e.target.value }))}
                    />
                    <Button variant="outline" className="shrink-0" disabled={isUploadingCover} asChild>
                      <Label htmlFor="creator-cover-upload" className="cursor-pointer">
                        <Camera className="mr-2 h-4 w-4" />
                        {isUploadingCover ? "Uploading..." : "Upload"}
                      </Label>
                    </Button>
                    <Input
                      id="creator-cover-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={isUploadingCover}
                      onChange={(event) => void uploadCoverImage(event.target.files?.[0])}
                    />
                  </div>
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
              {socialAccounts.map((account, index) => {
                const Icon = platformIcons[account.platform] || LinkIcon;
                return (
                  <div
                    key={`${account.platform}-${index}`}
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
                        onClick={() => setSocialAccounts((accounts) => accounts.filter((_, accountIndex) => accountIndex !== index))}
                      >
                        Disconnect
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select
                        value={account.platform}
                        onValueChange={(value) => updateSocialAccount(index, { platform: value as Platform })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {platformOrder.map((platform) => (
                            <SelectItem key={platform} value={platform}>
                              {platform}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={account.username}
                        placeholder="Username"
                        onChange={(event) => updateSocialAccount(index, { username: event.target.value })}
                      />
                      <Input
                        value={account.profileUrl || ""}
                        placeholder="Profile URL"
                        onChange={(event) => updateSocialAccount(index, { profileUrl: event.target.value })}
                      />
                      <Input
                        type="number"
                        value={account.followers ?? 0}
                        placeholder="Followers"
                        onChange={(event) => updateSocialAccount(index, { followers: Number(event.target.value) })}
                      />
                      <Input
                        type="number"
                        value={account.avgViews ?? 0}
                        placeholder="Average views"
                        onChange={(event) => updateSocialAccount(index, { avgViews: Number(event.target.value) })}
                      />
                      <Input
                        type="number"
                        step="0.1"
                        value={account.engagementRate ?? 0}
                        placeholder="Engagement rate"
                        onChange={(event) => updateSocialAccount(index, { engagementRate: Number(event.target.value) })}
                      />
                    </div>
                  </div>
                );
              })}

              <Button
                variant="outline"
                className="w-full"
                onClick={addSocialAccount}
              >
                <Plus className="mr-2 h-4 w-4" />
                Connect Account
              </Button>
              <Button onClick={handleSocialSave} disabled={isSaving} className="w-full">
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Social Accounts
                  </>
                )}
              </Button>
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
                  <Label>Minimum Collaboration Budget (PKR)</Label>
                <Input
                  type="number"
                  value={creatorPreferences.minimumBudget}
                  onChange={(e) => setCreatorPreferences((p) => ({ ...p, minimumBudget: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
          <Button onClick={handleCreatorPreferencesSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Creator Preferences
              </>
            )}
          </Button>
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
                <Button variant="outline" onClick={() => toast.info("2FA setup wizard is planned for next iteration.")}>Enable 2FA</Button>
              </div>
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

export default function CreatorSettingsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-6" />}>
      <CreatorSettingsPageContent />
    </Suspense>
  );
}
