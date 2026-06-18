"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
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
  Trash2,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn, getInitials } from "@/lib/utils";
import { pakistanCities, pakistanLanguages } from "@/lib/localization";
import { useAuthStore } from "@/store/auth-store";
import { creatorsService, type CreatorSocialAccountPayload } from "@/services/creators.service";
import { uploadsService } from "@/services/uploads.service";
import { usersService } from "@/services/users.service";
import type { Platform } from "@/types";
import { toast } from "sonner";

// ─── Design-system constants ─────────────────────────────────────────────────

const panelClass =
  "rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)] p-5 sm:p-6";

const inputClass =
  "h-10 w-full rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] shadow-none outline-none transition-colors focus:border-[#2d6b4e] focus:ring-4 focus:ring-[#2d6b4e]/8";

const textareaClass =
  "w-full rounded-xl border-2 border-[#dce6df] bg-white px-3.5 py-3 text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] shadow-none outline-none transition-colors resize-none focus:border-[#2d6b4e] focus:ring-4 focus:ring-[#2d6b4e]/8";

const labelClass = "text-[10px] font-bold uppercase tracking-widest text-[#7a8f82]";

// ─── Static data ──────────────────────────────────────────────────────────────

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

const responseTimes = [
  'Within 1 hour',
  'Within 6 hours',
  'Within 12 hours',
  'Within 24 hours',
  'Within 48 hours',
  'Within 3 days',
  'Within 1 week',
];

const languages = [...pakistanLanguages];

const cities = [...pakistanCities];

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
  availabilityStatus: "AVAILABLE",
  isFiler: false,
  responseTime: "Within 24 hours",
  collaborationPreferences: "",
  avatar: "",
  rateCardReel: undefined as number | undefined,
  rateCardStory: undefined as number | undefined,
  rateCardPost: undefined as number | undefined,
  rateCardVideo: undefined as number | undefined,
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

export type CreatorSettingsSection = "profile" | "social" | "settings";

// ─── Radix Select wrapper ─────────────────────────────────────────────────────

function DesignSelect({
  value,
  onValueChange,
  options,
  capitalize,
  placeholder,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: string[];
  capitalize?: boolean;
  placeholder?: string;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] outline-none transition-colors focus:border-[#2d6b4e] data-[placeholder]:text-[#b0bfb8]">
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-[#87938b]" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[#d1ddd6] bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option}
                value={option}
                className="relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm text-[#1e3d2e] outline-none data-[highlighted]:bg-[#f4f7f5]"
              >
                <SelectPrimitive.ItemText>
                  {capitalize
                    ? option.charAt(0).toUpperCase() + option.slice(1)
                    : option}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2">
                  <Check className="size-3.5 text-[#2d6b4e]" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

// ─── Save button ──────────────────────────────────────────────────────────────

function SaveButton({ isSaving, onClick }: { isSaving: boolean; onClick: () => void }) {
  return (
    <button
      disabled={isSaving}
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2d6b4e] font-extrabold text-white transition-colors hover:bg-[#1f5239] disabled:opacity-60"
    >
      <Save className="size-4" />
      {isSaving ? "Saving…" : "Save Changes"}
    </button>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#d1ddd6] bg-[#f4f7f5] p-3.5">
      <div>
        <p className="text-sm font-extrabold text-[#1e3d2e]">{label}</p>
        <p className="mt-0.5 text-xs text-[#87938b]">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ─── Panel header ─────────────────────────────────────────────────────────────

function PanelHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-extrabold tracking-[-0.035em] text-[#1e3d2e]">{title}</h2>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CreatorSettingsPageContent({ section = "settings" }: { section?: CreatorSettingsSection }) {
  const searchParams = useSearchParams();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState(
    section === "profile" ? "profile" : section === "social" ? "social" : "preferences",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [profile, setProfile] = useState(defaultProfile);
  const [socialAccounts, setSocialAccounts] = useState<EditableSocialAccount[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<Array<{
    id: string; type: string; thumbnailUrl: string; mediaUrl: string; platform: string;
  }>>([]);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    type: 'image' as 'image' | 'video',
    thumbnailUrl: '',
    mediaUrl: '',
    platform: 'instagram',
  });
  const [isAddingPortfolioItem, setIsAddingPortfolioItem] = useState(false);
  const [portfolioErrors, setPortfolioErrors] = useState<{ mediaUrl?: string; thumbnailUrl?: string }>({});

  const [creatorPreferences, setCreatorPreferences] = useState({
    acceptsBarter: true,
    acceptsHybridDeals: true,
    preferredIndustries: "Fashion, Beauty, Wellness, E-commerce",
    minimumBudget: "25000",
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
      isFiler: Boolean(creator.isFiler),
      avatar: creator.avatar || "",
      coverImage: creator.coverImage || "",
      responseTime: creator.responseTime || "Within 24 hours",
      collaborationPreferences: creator.preferredIndustries || "",
      rateCardReel: creator.rateCardReel,
      rateCardStory: creator.rateCardStory,
      rateCardPost: creator.rateCardPost,
      rateCardVideo: creator.rateCardVideo,
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
    setPortfolioItems(creator.contentPreviews.map((p) => ({
      id: p.id,
      type: p.type,
      thumbnailUrl: p.thumbnail,
      mediaUrl: p.url,
      platform: p.platform,
    })));
  }, [user]);

  const handleSave = async () => {
    const errors: Record<string, string> = {};

    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
      errors.email = 'Enter a valid email address — e.g. name@example.com';

    if (profile.phone && !/^\+?[\d\s\-(). ]{7,20}$/.test(profile.phone.trim()))
      errors.phone = 'Enter a valid phone number — e.g. 0312-1234567';

    if (profile.website) {
      try {
        const url = new URL(profile.website.trim());
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        errors.website = 'Enter a valid website URL starting with https://';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }

    setFieldErrors({});
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
        category: profile.categories[0],
        coverImageUrl: profile.coverImage,
        website: profile.website,
        niche: profile.categories[0],
        availabilityStatus: profile.availabilityStatus,
        isFiler: profile.isFiler,
        responseTime: profile.responseTime,
        preferredIndustries: profile.collaborationPreferences,
        languages: profile.languages,
        categories: profile.categories,
        rateCardReel: profile.rateCardReel,
        rateCardStory: profile.rateCardStory,
        rateCardPost: profile.rateCardPost,
        rateCardVideo: profile.rateCardVideo,
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

  const isValidUrl = (value: string) => {
    try {
      const url = new URL(value.trim());
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  };

  const handleAddPortfolioItem = async () => {
    const errs: { mediaUrl?: string; thumbnailUrl?: string } = {};
    if (!newPortfolioItem.mediaUrl.trim()) {
      errs.mediaUrl = 'Media URL is required';
    } else if (!isValidUrl(newPortfolioItem.mediaUrl)) {
      errs.mediaUrl = 'Enter a valid URL starting with https://';
    }
    if (newPortfolioItem.thumbnailUrl.trim() && !isValidUrl(newPortfolioItem.thumbnailUrl)) {
      errs.thumbnailUrl = 'Enter a valid URL starting with https://';
    }
    if (Object.keys(errs).length > 0) {
      setPortfolioErrors(errs);
      toast.error(Object.values(errs)[0]);
      return;
    }
    setPortfolioErrors({});
    setIsAddingPortfolioItem(true);
    try {
      await creatorsService.addPortfolioItem({
        type: newPortfolioItem.type,
        thumbnailUrl: newPortfolioItem.thumbnailUrl.trim() || newPortfolioItem.mediaUrl.trim(),
        mediaUrl: newPortfolioItem.mediaUrl.trim(),
        platform: newPortfolioItem.platform,
      });
      setNewPortfolioItem({ type: 'image', thumbnailUrl: '', mediaUrl: '', platform: 'instagram' });
      await loadCreatorProfile();
      toast.success("Portfolio item added");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add portfolio item";
      toast.error(message);
    } finally {
      setIsAddingPortfolioItem(false);
    }
  };

  const handleDeletePortfolioItem = async (id: string) => {
    try {
      await creatorsService.deletePortfolioItem(id);
      setPortfolioItems((items) => items.filter((item) => item.id !== id));
      toast.success("Portfolio item removed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not remove portfolio item";
      toast.error(message);
    }
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
    const nextPlatform =
      platformOrder.find((platform) => !socialAccounts.some((account) => account.platform === platform)) ||
      "instagram";
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
    if (section === "profile") {
      setActiveTab("profile");
      return;
    }

    if (section === "social") {
      setActiveTab("social");
      return;
    }

    const tab = searchParams.get("tab");
    if (!tab) {
      setActiveTab("preferences");
      return;
    }

    const allowedTabs = new Set(["preferences", "notifications", "security"]);

    if (allowedTabs.has(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, section]);

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

  // ─── Page header ────────────────────────────────────────────────────────────

  const pageEyebrow =
    section === "profile" ? "Creator" : section === "social" ? "Accounts" : "Configuration";
  const pageTitle =
    section === "profile" ? "Public Profile" : section === "social" ? "Social Accounts" : "Settings";
  const pageSubtitle =
    section === "profile"
      ? "Manage your creator profile details"
      : section === "social"
        ? "Connect and manage your social accounts"
        : "Manage creator preferences, notifications, and account security";

  return (
    <div className="min-h-full bg-[#fbfaf5] px-4 pb-8 pt-2 text-[#1e3d2e] sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-[1320px] space-y-5">

        {/* Page header */}
        <div className="pb-2 pt-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">
            {pageEyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.035em] text-[#1e3d2e] md:text-3xl">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-[#496159]">{pageSubtitle}</p>
        </div>

        <TabsPrimitive.Root value={activeTab} onValueChange={setActiveTab}>
          {/* Settings sub-tabs */}
          {section === "settings" && (
            <TabsPrimitive.List className="mb-5 flex w-full gap-1 rounded-xl bg-[#e8ede9] p-1">
              <TabsPrimitive.Trigger
                value="preferences"
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#6b7c72] transition-all duration-200 hover:text-[#2e5440] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <Check className="size-3.5" />
                Preferences
              </TabsPrimitive.Trigger>
              <TabsPrimitive.Trigger
                value="notifications"
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#6b7c72] transition-all duration-200 hover:text-[#2e5440] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <Bell className="size-3.5" />
                Notifications
              </TabsPrimitive.Trigger>
              <TabsPrimitive.Trigger
                value="security"
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#6b7c72] transition-all duration-200 hover:text-[#2e5440] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <Lock className="size-3.5" />
                Security
              </TabsPrimitive.Trigger>
            </TabsPrimitive.List>
          )}

          {/* ── Profile Tab ───────────────────────────────────────────────────── */}
          {section === "profile" && (
            <TabsPrimitive.Content value="profile" className="space-y-5">

              {/* Avatar section */}
              <div className={panelClass}>
                <div className="flex flex-col items-center gap-5 sm:flex-row">
                  <div className="relative shrink-0">
                    <Avatar className="size-24 rounded-full">
                      <AvatarImage src={profile.avatar} alt={profile.name} />
                      <AvatarFallback className="text-2xl">{getInitials(profile.name)}</AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="creator-avatar-upload"
                      className="absolute bottom-0 right-0 grid size-8 cursor-pointer place-items-center rounded-full bg-[#2d6b4e] text-white shadow-md"
                    >
                      <Camera className="size-3.5" />
                    </label>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-lg font-extrabold text-[#1e3d2e]">{profile.name || "Your Name"}</p>
                    <p className="mt-0.5 text-sm text-[#87938b]">@{profile.handle || "handle"}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <label
                        htmlFor="creator-avatar-upload"
                        className="cursor-pointer rounded-full border-2 border-[#d1ddd6] bg-white px-4 py-2 text-xs font-bold text-[#496159] hover:border-[#b0c5ba]"
                      >
                        {isUploadingAvatar ? "Uploading…" : "Change Photo"}
                      </label>
                    </div>
                  </div>
                </div>
                <input
                  id="creator-avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={isUploadingAvatar}
                  onChange={(event) => void uploadAvatar(event.target.files?.[0])}
                />
              </div>

              {/* Basic info */}
              <div className={panelClass}>
                <PanelHeader eyebrow="Profile" title="Basic Information" />
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className={labelClass}>Full Name</p>
                      <input
                        className={inputClass}
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className={labelClass}>Username</p>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#87938b]">@</span>
                        <input
                          className={inputClass + " pl-8"}
                          value={profile.handle}
                          onChange={(e) => setProfile((p) => ({ ...p, handle: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className={labelClass}>Bio</p>
                    <textarea
                      className={textareaClass}
                      rows={4}
                      value={profile.bio}
                      onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    />
                    <p className="text-xs text-[#87938b]">{profile.bio.length}/300 characters</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className={labelClass}>Email</p>
                      <input
                        type="email"
                        className={cn(inputClass, fieldErrors.email && 'border-[#c0392b] focus:border-[#c0392b] focus:ring-[#c0392b]/10')}
                        value={profile.email}
                        onChange={(e) => {
                          setProfile((p) => ({ ...p, email: e.target.value }));
                          if (fieldErrors.email) setFieldErrors((prev) => { const n = { ...prev }; delete n.email; return n; });
                        }}
                      />
                      {fieldErrors.email && <p className="text-xs text-[#c0392b]">{fieldErrors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <p className={labelClass}>Phone</p>
                      <input
                        type="tel"
                        className={cn(inputClass, fieldErrors.phone && 'border-[#c0392b] focus:border-[#c0392b] focus:ring-[#c0392b]/10')}
                        value={profile.phone}
                        onChange={(e) => {
                          setProfile((p) => ({ ...p, phone: e.target.value }));
                          if (fieldErrors.phone) setFieldErrors((prev) => { const n = { ...prev }; delete n.phone; return n; });
                        }}
                      />
                      {fieldErrors.phone && <p className="text-xs text-[#c0392b]">{fieldErrors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className={labelClass}>City</p>
                      <DesignSelect
                        value={profile.city}
                        onValueChange={(v) => setProfile((p) => ({ ...p, city: v }))}
                        options={cities}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className={labelClass}>Website</p>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#87938b]" />
                        <input
                          className={cn(inputClass, 'pl-8', fieldErrors.website && 'border-[#c0392b] focus:border-[#c0392b] focus:ring-[#c0392b]/10')}
                          value={profile.website}
                          onChange={(e) => {
                            setProfile((p) => ({ ...p, website: e.target.value }));
                            if (fieldErrors.website) setFieldErrors((prev) => { const n = { ...prev }; delete n.website; return n; });
                          }}
                        />
                      </div>
                      {fieldErrors.website && <p className="text-xs text-[#c0392b]">{fieldErrors.website}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className={labelClass}>Response Time</p>
                    <DesignSelect
                      value={profile.responseTime}
                      onValueChange={(v) => setProfile((p) => ({ ...p, responseTime: v }))}
                      options={responseTimes}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className={labelClass}>Availability Status</p>
                      <select
                        className={inputClass}
                        value={profile.availabilityStatus}
                        onChange={(e) => setProfile((p) => ({ ...p, availabilityStatus: e.target.value }))}
                      >
                        <option value="">Select status</option>
                        <option value="AVAILABLE">Available</option>
                        <option value="BUSY">Busy</option>
                        <option value="UNAVAILABLE">Unavailable</option>
                        <option value="ON_VACATION">On Vacation</option>
                      </select>
                    </div>
                    {/* Rate Card */}
                  <div className="rounded-2xl border border-[#dce6df] bg-[#f8faf8] p-4">
                    <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#b77a12]">Rate Card</p>
                    <p className="mb-3 text-xs text-[#87938b]">Set your starting rates per content format (PKR). Leave blank if not applicable.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <p className={labelClass}>Reel / Short Video (PKR)</p>
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          placeholder="e.g. 15000"
                          value={profile.rateCardReel ?? ""}
                          onChange={(e) => setProfile((p) => ({ ...p, rateCardReel: e.target.value ? Number(e.target.value) : undefined }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className={labelClass}>Story / Highlight (PKR)</p>
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          placeholder="e.g. 5000"
                          value={profile.rateCardStory ?? ""}
                          onChange={(e) => setProfile((p) => ({ ...p, rateCardStory: e.target.value ? Number(e.target.value) : undefined }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className={labelClass}>Static Post (PKR)</p>
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          placeholder="e.g. 8000"
                          value={profile.rateCardPost ?? ""}
                          onChange={(e) => setProfile((p) => ({ ...p, rateCardPost: e.target.value ? Number(e.target.value) : undefined }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className={labelClass}>YouTube / Long Video (PKR)</p>
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          placeholder="e.g. 40000"
                          value={profile.rateCardVideo ?? ""}
                          onChange={(e) => setProfile((p) => ({ ...p, rateCardVideo: e.target.value ? Number(e.target.value) : undefined }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                      <p className={labelClass}>Cover / Banner Image URL</p>
                      <div className="flex gap-2">
                        <input
                          className={inputClass + " flex-1"}
                          value={profile.coverImage}
                          onChange={(e) => setProfile((p) => ({ ...p, coverImage: e.target.value }))}
                        />
                        <label
                          htmlFor="creator-cover-upload"
                          className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#dce6df] bg-white px-4 text-sm font-bold text-[#496159] transition-colors hover:border-[#2d6b4e]"
                        >
                          <Camera className="size-4" />
                          {isUploadingCover ? "Uploading…" : "Upload"}
                        </label>
                        <input
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

                  <div className="space-y-1.5">
                    <p className={labelClass}>Collaboration Preferences</p>
                    <textarea
                      className={textareaClass}
                      rows={3}
                      value={profile.collaborationPreferences}
                      onChange={(e) => setProfile((p) => ({ ...p, collaborationPreferences: e.target.value }))}
                    />
                  </div>

                  <ToggleRow
                    label="FBR Filer Status"
                    description="Indicate that you are a registered FBR tax filer"
                    checked={profile.isFiler}
                    onCheckedChange={(checked) => setProfile((p) => ({ ...p, isFiler: checked }))}
                  />
                </div>
              </div>

              {/* Categories */}
              <div className={panelClass}>
                <PanelHeader eyebrow="Content" title="Categories" />
                <p className="mb-3 text-sm text-[#496159]">Select all the niches you create content in</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={
                        profile.categories.includes(category)
                          ? "rounded-full border-2 border-[#2d6b4e] bg-[#e4f1e8] px-4 py-2 text-sm font-bold text-[#1e5c3e] transition-all"
                          : "rounded-full border-2 border-[#d1ddd6] bg-white px-4 py-2 text-sm font-semibold text-[#496159] transition-all hover:border-[#b0c5ba]"
                      }
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className={panelClass}>
                <PanelHeader eyebrow="Content" title="Languages" />
                <p className="mb-3 text-sm text-[#496159]">Languages you can create content in</p>
                <div className="flex flex-wrap gap-2">
                  {languages.map((language) => (
                    <button
                      key={language}
                      onClick={() => handleLanguageToggle(language)}
                      className={
                        profile.languages.includes(language)
                          ? "rounded-full border-2 border-[#2d6b4e] bg-[#e4f1e8] px-4 py-2 text-sm font-bold text-[#1e5c3e] transition-all"
                          : "rounded-full border-2 border-[#d1ddd6] bg-white px-4 py-2 text-sm font-semibold text-[#496159] transition-all hover:border-[#b0c5ba]"
                      }
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>

              {/* Portfolio */}
              <div className={panelClass}>
                <PanelHeader eyebrow="Work Samples" title="Portfolio" />
                <p className="mb-4 text-sm text-[#496159]">Showcase your best content. Brands browse these before reaching out.</p>

                {portfolioItems.length > 0 && (
                  <div className="mb-4 grid gap-2 sm:grid-cols-2">
                    {portfolioItems.map((item) => (
                      <div
                        key={item.id}
                        className="group relative flex items-center gap-3 rounded-2xl border border-[#d1ddd6] bg-[#f4f7f5] p-3"
                      >
                        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e6eceb] text-[#2d6b4e]">
                          {item.type === 'video' ? <Video className="size-4" /> : <ImageIcon className="size-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-extrabold capitalize text-[#1e3d2e]">{item.platform}</p>
                          <p className="truncate text-[11px] text-[#87938b]">{item.type}</p>
                        </div>
                        <button
                          onClick={() => void handleDeletePortfolioItem(item.id)}
                          className="shrink-0 rounded-full border border-[#d1ddd6] bg-white p-1.5 text-[#87938b] opacity-0 transition-opacity group-hover:opacity-100 hover:border-[#c0392b] hover:text-[#c0392b]"
                          aria-label="Remove item"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 rounded-2xl border border-dashed border-[#cddad1] bg-white p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7a8f82]">Add item</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className={labelClass}>Type</p>
                      <div className="flex rounded-xl bg-[#e8ede9] p-1 gap-1">
                        {(['image', 'video'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setNewPortfolioItem((p) => ({ ...p, type: t }))}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg h-9 text-xs font-semibold transition-all duration-200 capitalize ${
                              newPortfolioItem.type === t
                                ? 'bg-[#2d6b4e] text-white shadow-sm'
                                : 'text-[#6b7c72] hover:text-[#2e5440]'
                            }`}
                          >
                            {t === 'video' ? <Video className="size-3.5" /> : <ImageIcon className="size-3.5" />}
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className={labelClass}>Platform</p>
                      <DesignSelect
                        value={newPortfolioItem.platform}
                        onValueChange={(v) => setNewPortfolioItem((p) => ({ ...p, platform: v }))}
                        options={['instagram', 'tiktok', 'youtube', 'facebook', 'snapchat']}
                        capitalize
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className={labelClass}>Media URL</p>
                    <input
                      className={cn(inputClass, portfolioErrors.mediaUrl && 'border-[#c0392b] focus:border-[#c0392b] focus:ring-[#c0392b]/10')}
                      placeholder="https://..."
                      value={newPortfolioItem.mediaUrl}
                      onChange={(e) => {
                        setNewPortfolioItem((p) => ({ ...p, mediaUrl: e.target.value }));
                        if (portfolioErrors.mediaUrl) setPortfolioErrors((prev) => ({ ...prev, mediaUrl: undefined }));
                      }}
                    />
                    {portfolioErrors.mediaUrl && <p className="text-xs text-[#c0392b]">{portfolioErrors.mediaUrl}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <p className={labelClass}>Thumbnail URL <span className="normal-case font-normal text-[#b0bfb8]">(optional — defaults to media URL)</span></p>
                    <input
                      className={cn(inputClass, portfolioErrors.thumbnailUrl && 'border-[#c0392b] focus:border-[#c0392b] focus:ring-[#c0392b]/10')}
                      placeholder="https://..."
                      value={newPortfolioItem.thumbnailUrl}
                      onChange={(e) => {
                        setNewPortfolioItem((p) => ({ ...p, thumbnailUrl: e.target.value }));
                        if (portfolioErrors.thumbnailUrl) setPortfolioErrors((prev) => ({ ...prev, thumbnailUrl: undefined }));
                      }}
                    />
                    {portfolioErrors.thumbnailUrl && <p className="text-xs text-[#c0392b]">{portfolioErrors.thumbnailUrl}</p>}
                  </div>
                  <button
                    type="button"
                    disabled={isAddingPortfolioItem || !newPortfolioItem.mediaUrl.trim()}
                    onClick={() => void handleAddPortfolioItem()}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#cddad1] bg-white text-sm font-bold text-[#2d6b4e] transition-colors hover:border-[#2d6b4e] hover:bg-[#e4f1e8] disabled:opacity-50"
                  >
                    <Plus className="size-4" />
                    {isAddingPortfolioItem ? "Adding…" : "Add to portfolio"}
                  </button>
                </div>
              </div>

              <SaveButton isSaving={isSaving} onClick={handleSave} />
            </TabsPrimitive.Content>
          )}

          {/* ── Social Tab ────────────────────────────────────────────────────── */}
          {section === "social" && (
            <TabsPrimitive.Content value="social" className="space-y-5">
              <div className={panelClass}>
                <PanelHeader eyebrow="Social" title="Connected Accounts" />
                <div className="space-y-4">
                  {socialAccounts.map((account, index) => {
                    const Icon = platformIcons[account.platform] || LinkIcon;
                    return (
                      <div
                        key={`${account.platform}-${index}`}
                        className="rounded-2xl border border-[#d1ddd6] bg-[#f4f7f5] p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="grid size-9 place-items-center rounded-xl bg-[#e6eceb] text-[#2d6b4e]">
                              <Icon className="size-4" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold capitalize text-[#1e3d2e]">
                                {account.platform}
                              </span>
                              {account.verified && <Check className="size-3.5 text-[#2d6b4e]" />}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setSocialAccounts((accounts) =>
                                accounts.filter((_, accountIndex) => accountIndex !== index),
                              )
                            }
                            className="rounded-full border border-[#d1ddd6] bg-white px-3 py-1.5 text-xs font-bold text-[#87938b] hover:border-[#c0392b] hover:text-[#c0392b]"
                          >
                            Disconnect
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <DesignSelect
                            value={account.platform}
                            onValueChange={(value) =>
                              updateSocialAccount(index, { platform: value as Platform })
                            }
                            options={platformOrder}
                            capitalize
                          />
                          <input
                            className={inputClass}
                            value={account.username}
                            placeholder="Username"
                            onChange={(event) =>
                              updateSocialAccount(index, { username: event.target.value })
                            }
                          />
                          <input
                            className={inputClass}
                            value={account.profileUrl || ""}
                            placeholder="Profile URL"
                            onChange={(event) =>
                              updateSocialAccount(index, { profileUrl: event.target.value })
                            }
                          />
                          <input
                            type="number"
                            className={inputClass}
                            value={account.followers ?? 0}
                            placeholder="Followers"
                            onChange={(event) =>
                              updateSocialAccount(index, { followers: Number(event.target.value) })
                            }
                          />
                          <input
                            type="number"
                            className={inputClass}
                            value={account.avgViews ?? 0}
                            placeholder="Average views"
                            onChange={(event) =>
                              updateSocialAccount(index, { avgViews: Number(event.target.value) })
                            }
                          />
                          <input
                            type="number"
                            step="0.1"
                            className={inputClass}
                            value={account.engagementRate ?? 0}
                            placeholder="Engagement rate"
                            onChange={(event) =>
                              updateSocialAccount(index, { engagementRate: Number(event.target.value) })
                            }
                          />
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={addSocialAccount}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#cddad1] bg-white text-sm font-bold text-[#2d6b4e] transition-colors hover:border-[#2d6b4e] hover:bg-[#e4f1e8]"
                  >
                    <Plus className="size-4" />
                    Connect Account
                  </button>
                </div>
              </div>

              <SaveButton isSaving={isSaving} onClick={handleSocialSave} />
            </TabsPrimitive.Content>
          )}

          {/* ── Preferences Tab ───────────────────────────────────────────────── */}
          {section === "settings" && (
            <TabsPrimitive.Content value="preferences" className="space-y-5">
              <div className={panelClass}>
                <PanelHeader eyebrow="Settings" title="Creator Preferences" />
                <p className="mb-4 text-sm text-[#496159]">Control what collaborations you receive.</p>
                <div className="space-y-3">
                  <ToggleRow
                    label="Accept barter deals"
                    description="Receive non-cash exchange campaigns"
                    checked={creatorPreferences.acceptsBarter}
                    onCheckedChange={(checked) =>
                      setCreatorPreferences((p) => ({ ...p, acceptsBarter: checked }))
                    }
                  />
                  <ToggleRow
                    label="Accept hybrid deals"
                    description="Combine cash + barter in campaigns"
                    checked={creatorPreferences.acceptsHybridDeals}
                    onCheckedChange={(checked) =>
                      setCreatorPreferences((p) => ({ ...p, acceptsHybridDeals: checked }))
                    }
                  />
                  <div className="space-y-1.5 pt-1">
                    <p className={labelClass}>Preferred Industries</p>
                    <input
                      className={inputClass}
                      value={creatorPreferences.preferredIndustries}
                      onChange={(e) =>
                        setCreatorPreferences((p) => ({ ...p, preferredIndustries: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className={labelClass}>Minimum Collaboration Budget (PKR)</p>
                    <input
                      type="number"
                      className={inputClass}
                      value={creatorPreferences.minimumBudget}
                      onChange={(e) =>
                        setCreatorPreferences((p) => ({ ...p, minimumBudget: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <SaveButton isSaving={isSaving} onClick={handleCreatorPreferencesSave} />
            </TabsPrimitive.Content>
          )}

          {/* ── Notifications Tab ─────────────────────────────────────────────── */}
          {section === "settings" && (
            <TabsPrimitive.Content value="notifications" className="space-y-5">
              <div className={panelClass}>
                <PanelHeader eyebrow="Notifications" title="Email Notifications" />
                <div className="space-y-3">
                  {[
                    {
                      key: "newOrders",
                      label: "New order requests",
                      description: "Get notified when brands send you campaigns",
                    },
                    {
                      key: "messages",
                      label: "Messages",
                      description: "Receive notifications for new messages",
                    },
                    {
                      key: "reviews",
                      label: "Reviews",
                      description: "Get notified when brands leave reviews",
                    },
                    {
                      key: "marketing",
                      label: "Marketing",
                      description: "Receive tips and promotional content",
                    },
                    {
                      key: "weeklyDigest",
                      label: "Weekly digest",
                      description: "Summary of your weekly performance",
                    },
                  ].map((item) => (
                    <ToggleRow
                      key={item.key}
                      label={item.label}
                      description={item.description}
                      checked={notifications[item.key as keyof typeof notifications] as boolean}
                      onCheckedChange={(checked) =>
                        setNotifications((n) => ({ ...n, [item.key]: checked }))
                      }
                    />
                  ))}
                </div>
              </div>

              <div className={panelClass}>
                <PanelHeader eyebrow="Channels" title="Notification Channels" />
                <div className="space-y-3">
                  {[
                    {
                      key: "pushNotifications",
                      label: "Push notifications",
                      description: "Receive push notifications on your device",
                    },
                    {
                      key: "emailNotifications",
                      label: "Email",
                      description: "Receive notifications via email",
                    },
                    {
                      key: "smsNotifications",
                      label: "SMS",
                      description: "Receive notifications via SMS",
                    },
                  ].map((item) => (
                    <ToggleRow
                      key={item.key}
                      label={item.label}
                      description={item.description}
                      checked={notifications[item.key as keyof typeof notifications] as boolean}
                      onCheckedChange={(checked) =>
                        setNotifications((n) => ({ ...n, [item.key]: checked }))
                      }
                    />
                  ))}
                </div>
              </div>

              <SaveButton isSaving={isSaving} onClick={handleNotificationSave} />
            </TabsPrimitive.Content>
          )}

          {/* ── Security Tab ──────────────────────────────────────────────────── */}
          {section === "settings" && (
            <TabsPrimitive.Content value="security" className="space-y-5">
              {/* Change password */}
              <div className={panelClass}>
                <PanelHeader eyebrow="Security" title="Change Password" />
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className={labelClass}>Current Password</p>
                    <input
                      type="password"
                      className={inputClass}
                      value={security.currentPassword}
                      onChange={(event) =>
                        setSecurity((current) => ({ ...current, currentPassword: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className={labelClass}>New Password</p>
                    <input
                      type="password"
                      className={inputClass}
                      value={security.newPassword}
                      onChange={(event) =>
                        setSecurity((current) => ({ ...current, newPassword: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className={labelClass}>Confirm New Password</p>
                    <input
                      type="password"
                      className={inputClass}
                      value={security.confirmPassword}
                      onChange={(event) =>
                        setSecurity((current) => ({ ...current, confirmPassword: event.target.value }))
                      }
                    />
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={handlePasswordChange}
                      disabled={isSaving}
                      className="rounded-full bg-[#2d6b4e] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1f5239] disabled:opacity-60"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </div>

              {/* 2FA */}
              <div className={panelClass}>
                <PanelHeader eyebrow="Security" title="Two-Factor Authentication" />
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#d1ddd6] bg-[#f4f7f5] p-3.5">
                  <div>
                    <p className="text-sm font-extrabold text-[#1e3d2e]">Status: Disabled</p>
                    <p className="mt-0.5 text-xs text-[#87938b]">Protect your account with 2FA</p>
                  </div>
                  <button
                    onClick={() => toast.info("Two-factor authentication for creators is coming soon.")}
                    className="rounded-full border-2 border-[#d1ddd6] bg-white px-4 py-2 text-xs font-bold text-[#496159] hover:border-[#b0c5ba]"
                  >
                    Coming soon
                  </button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="rounded-[1.6rem] border border-[#fce8e6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)] p-5 sm:p-6">
                <div className="mb-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#c0392b]">
                    Danger Zone
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold tracking-[-0.035em] text-[#c0392b]">
                    Delete Account
                  </h2>
                </div>
                <p className="mb-4 text-sm text-[#496159]">
                  Permanently delete your account and all data. This action cannot be undone.
                </p>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    type="password"
                    placeholder="Confirm with your password"
                    className={inputClass}
                    value={security.deleteConfirmPassword}
                    onChange={(event) =>
                      setSecurity((current) => ({
                        ...current,
                        deleteConfirmPassword: event.target.value,
                      }))
                    }
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isSaving}
                    className="rounded-full bg-[#c0392b] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#a93226]"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </TabsPrimitive.Content>
          )}
        </TabsPrimitive.Root>
      </div>
    </div>
  );
}

export default function CreatorSettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-full bg-[#fbfaf5] px-4 pb-8 pt-2 sm:px-6 lg:px-8 lg:pb-12" />}>
      <CreatorSettingsPageContent section="settings" />
    </Suspense>
  );
}
