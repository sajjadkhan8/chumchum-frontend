"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Award,
  BadgeCheck,
  Bell,
  ChevronDown,
  ChevronUp,
  Check,
  Camera,
  Clock,
  ExternalLink,
  FileText,
  GripVertical,
  Globe,
  Info,
  Image as ImageIcon,
  Lock,
  Link as LinkIcon,
  Package,
  Plus,
  Save,
  Share2,
  Trash2,
  Upload,
  Video,
  XCircle,
} from "lucide-react";
import { Reorder } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn, getInitials } from "@/lib/utils";
import { categoryOptions, getCategoryLabel, normalizeCategories } from "@/lib/categories";
import { pakistanCities, pakistanLanguages } from "@/lib/localization";
import { useAuthStore } from "@/store/auth-store";
import { ambassadorService } from "@/services/ambassador.service";
import { authService } from "@/services/auth.service";
import { creatorsService, type CreatorSocialAccountPayload, type CreatorVerificationDocument, type CreatorVerificationEvent } from "@/services/creators.service";
import { packagesService } from "@/services/packages.service";
import { uploadsService } from "@/services/uploads.service";
import { usersService } from "@/services/users.service";
import { isPasswordStrong, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/password-validation";
import { AMBASSADOR_TIERS } from "@/lib/ambassador-scoring";
import type { Creator, CreatorAmbassadorMetrics, DealType, BarterCategory, Platform, VerificationSource } from "@/types";
import { toast } from "sonner";
import { ShareProfileModal } from "@/components/share-profile-modal";
import { PlatformIconBadge } from "@/components/platform-icons";

// ─── Design-system constants ─────────────────────────────────────────────────

const panelClass =
  "rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)] p-5 sm:p-6";

const inputClass =
  "h-10 w-full rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] shadow-none outline-none transition-colors focus:border-[#2d6b4e] focus:ring-4 focus:ring-[#2d6b4e]/8";

const textareaClass =
  "w-full rounded-xl border-2 border-[#dce6df] bg-white px-3.5 py-3 text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] shadow-none outline-none transition-colors resize-none focus:border-[#2d6b4e] focus:ring-4 focus:ring-[#2d6b4e]/8";

const labelClass = "text-[10px] font-bold uppercase tracking-widest text-[#7a8f82]";

// ─── Static data ──────────────────────────────────────────────────────────────

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

const creatorVerificationTypes = [
  { type: "identity", label: "Identity" },
  { type: "social_profile", label: "Social profile" },
  { type: "portfolio_sample", label: "Portfolio sample" },
] as const;

type EditableSocialAccount = CreatorSocialAccountPayload & {
  platform: Platform;
  verified?: boolean;
  verifiedBy?: VerificationSource;
  oauthStatus?: string;
  lastSyncedAt?: string;
  syncError?: string;
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
  coverImage: "",
  availabilityStatus: "AVAILABLE",
  isFiler: false,
  responseTime: "Within 24 hours",
  avatar: "",
  rateCardReel: undefined as number | undefined,
  rateCardStory: undefined as number | undefined,
  rateCardPost: undefined as number | undefined,
  rateCardVideo: undefined as number | undefined,
};

const platformOrder: Platform[] = ["instagram", "youtube", "tiktok", "facebook", "snapchat"];
const platformLabels: Record<Platform, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  facebook: "Facebook",
  snapchat: "Snapchat",
};


export type CreatorSettingsSection = "profile" | "social" | "settings";

// ─── Radix Select wrapper ─────────────────────────────────────────────────────

function DesignSelect({
  value,
  onValueChange,
  options,
  disabledOptions = [],
  capitalize,
  placeholder,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: string[];
  disabledOptions?: string[];
  capitalize?: boolean;
  placeholder?: string;
}) {
  const disabledSet = new Set(disabledOptions);

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
            {options.map((option) => {
              const disabled = disabledSet.has(option);
              return (
                <SelectPrimitive.Item
                  key={option}
                  value={option}
                  disabled={disabled}
                  className="relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm text-[#1e3d2e] outline-none data-[disabled]:pointer-events-none data-[disabled]:text-[#a8b5ad] data-[highlighted]:bg-[#f4f7f5]"
                >
                  <SelectPrimitive.ItemText>
                    {capitalize
                      ? option.charAt(0).toUpperCase() + option.slice(1)
                      : option}
                    {disabled ? " (already added)" : ""}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2">
                    <Check className="size-3.5 text-[#2d6b4e]" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              );
            })}
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
  const [shareOpen, setShareOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isOAuthConnecting, setIsOAuthConnecting] = useState<string | null>(null);
  const [coverCropState, setCoverCropState] = useState<{
    file: File;
    previewUrl: string;
    croppedUrl: string;
  } | null>(null);

  const [profile, setProfile] = useState(defaultProfile);
  const [socialAccounts, setSocialAccounts] = useState<EditableSocialAccount[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<Array<{
    id: string; type: string; thumbnailUrl: string; mediaUrl: string; platform: string; views?: number; likes?: number;
  }>>([]);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    type: 'image' as 'image' | 'video',
    thumbnailUrl: '',
    mediaUrl: '',
    platform: 'instagram',
    views: '',
    likes: '',
  });
  const [isAddingPortfolioItem, setIsAddingPortfolioItem] = useState(false);
  const [portfolioErrors, setPortfolioErrors] = useState<{ mediaUrl?: string; thumbnailUrl?: string }>({});

  const [creatorPreferences, setCreatorPreferences] = useState({
    acceptsBarter: true,
    acceptsHybridDeals: true,
    minimumBudget: "25000",
    dealTypes: [] as string[],
    barterTypes: [] as string[],
  });
  const [loadedCreator, setLoadedCreator] = useState<Creator | null>(null);
  const [ambassadorMetrics, setAmbassadorMetrics] = useState<CreatorAmbassadorMetrics | null>(null);
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [contactChangedBanner, setContactChangedBanner] = useState<"email" | "phone" | "both" | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activePackageCount, setActivePackageCount] = useState<number | null>(null);
  const [creatorVerified, setCreatorVerified] = useState<{ isVerified: boolean; badgeLevel?: string; verificationStatus?: string } | null>(null);
  const [verificationDocuments, setVerificationDocuments] = useState<CreatorVerificationDocument[]>([]);
  const [verificationEvents, setVerificationEvents] = useState<CreatorVerificationEvent[]>([]);
  const [uploadingVerificationType, setUploadingVerificationType] = useState<string | null>(null);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [showBadgeExplainer, setShowBadgeExplainer] = useState(false);
  const [showFilerInfo, setShowFilerInfo] = useState(false);
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileSnapshotRef = useRef<typeof defaultProfile | null>(null);
  const socialAccountsSnapshotRef = useRef<EditableSocialAccount[] | null>(null);
  const creatorPreferencesSnapshotRef = useRef<typeof creatorPreferences | null>(null);

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
    const [creator, packages, docs, events] = await Promise.all([
      creatorsService.getMe(),
      packagesService.getMine().catch(() => [] as Awaited<ReturnType<typeof packagesService.getMine>>),
      creatorsService.getVerificationDocuments().catch(() => [] as CreatorVerificationDocument[]),
      creatorsService.getVerificationEvents().catch(() => [] as CreatorVerificationEvent[]),
    ]);
    if (!creator) return;

    setLoadedCreator(creator);
    setCreatorVerified({ isVerified: Boolean(creator.isVerified), badgeLevel: creator.badgeLevel, verificationStatus: creator.verificationStatus });
    setVerificationDocuments(docs);
    setVerificationEvents(events);
    setActivePackageCount(packages.filter((p) => p.status === 'active').length);

    const email = creator.email || user?.email || "";
    const phone = creator.phone || user?.phone || "";
    setOriginalEmail(email);
    setOriginalPhone(phone);

    const nextProfile: typeof defaultProfile = {
      name: creator.name || user?.name || "",
      handle: creator.username || user?.email?.split("@")[0] || "",
      bio: creator.bio || "",
      email,
      phone,
      city: creator.city || "Karachi",
      categories: normalizeCategories(creator.categories),
      languages: creator.languages?.length ? creator.languages : defaultProfile.languages,
      website: creator.website || "",
      availabilityStatus: creator.availabilityStatus || defaultProfile.availabilityStatus,
      isFiler: Boolean(creator.isFiler),
      avatar: creator.avatar || "",
      coverImage: creator.coverImage || "",
      responseTime: creator.responseTime || "Within 24 hours",
      rateCardReel: creator.rateCardReel,
      rateCardStory: creator.rateCardStory,
      rateCardPost: creator.rateCardPost,
      rateCardVideo: creator.rateCardVideo,
    };
    profileSnapshotRef.current = nextProfile;
    setProfile(nextProfile);
    const nextCreatorPreferences = {
      acceptsBarter: Boolean(creator.acceptsBarter),
      acceptsHybridDeals: Boolean(creator.acceptsHybridDeals),
      minimumBudget: creator.minimumBudget ? String(creator.minimumBudget) : "",
      dealTypes: creator.dealTypes || [],
      barterTypes: (creator.barterTypes as string[]) || [],
    };
    creatorPreferencesSnapshotRef.current = nextCreatorPreferences;
    setCreatorPreferences(nextCreatorPreferences);

    const nextSocialAccounts = creator.platforms
      .filter((platform) => platform.profileUrl)
      .map((platform) => ({
        platform: platform.platform,
        username: platform.username,
        profileUrl: platform.profileUrl,
        followers: platform.followers,
        avgViews: platform.avgViews,
        engagementRate: platform.engagementRate,
        verified: false,
        verifiedBy: platform.verified_by,
        oauthStatus: platform.oauth_status,
        lastSyncedAt: platform.last_synced_at,
        syncError: platform.sync_error,
      }));
    socialAccountsSnapshotRef.current = nextSocialAccounts;
    setSocialAccounts(nextSocialAccounts);
    setPortfolioItems(creator.contentPreviews.map((p) => ({
      id: p.id,
      type: p.type,
      thumbnailUrl: p.thumbnail,
      mediaUrl: p.url,
      platform: p.platform,
      views: p.views,
      likes: p.likes,
    })));
    setIsDirty(false);
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

    // Validate pending portfolio item if the user typed a media URL but didn't click "Add to portfolio"
    const pendingMedia = newPortfolioItem.mediaUrl.trim();
    const pendingThumb = newPortfolioItem.thumbnailUrl.trim();
    if (pendingMedia) {
      if (!isValidUrl(pendingMedia)) {
        setPortfolioErrors((prev) => ({ ...prev, mediaUrl: 'Enter a valid URL starting with https://' }));
        toast.error('Media URL is not valid');
        return;
      }
      if (pendingThumb && !isValidUrl(pendingThumb)) {
        setPortfolioErrors((prev) => ({ ...prev, thumbnailUrl: 'Enter a valid URL starting with https://' }));
        toast.error('Thumbnail URL is not valid');
        return;
      }
    }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        toast.error(Object.values(errors)[0]);
        return;
      }
      if (profile.categories.length === 0) {
        toast.error("Select at least one content category for your public profile");
        return;
      }

    setFieldErrors({});
    setPortfolioErrors({});
    setIsSaving(true);
    try {
      const emailChanged = profile.email !== originalEmail && originalEmail !== "";
      const phoneChanged = profile.phone !== originalPhone && originalPhone !== "";

      const snap = profileSnapshotRef.current;
      const changed = (key: keyof typeof defaultProfile) => {
        if (!snap) return true;
        const a = profile[key];
        const b = snap[key];
        if (Array.isArray(a) && Array.isArray(b)) {
          return JSON.stringify([...(a as string[]).sort()]) !== JSON.stringify([...(b as string[]).sort()]);
        }
        return a !== b;
      };

      const patch: Parameters<typeof creatorsService.updateMe>[0] = {};
      if (changed('name')) patch.name = profile.name;
      if (changed('handle')) patch.username = profile.handle;
      if (changed('email')) patch.email = profile.email;
      if (changed('phone')) patch.phone = profile.phone;
      if (changed('city')) patch.city = profile.city;
      if (changed('avatar')) patch.avatarUrl = profile.avatar;
      if (changed('bio')) patch.bio = profile.bio;
      if (changed('coverImage')) patch.coverImageUrl = profile.coverImage;
      if (changed('website')) patch.website = profile.website;
      if (changed('availabilityStatus')) patch.availabilityStatus = profile.availabilityStatus;
      if (changed('isFiler')) patch.isFiler = profile.isFiler;
      if (changed('responseTime')) patch.responseTime = profile.responseTime;
      if (changed('languages')) patch.languages = profile.languages;
      if (changed('categories')) patch.categories = profile.categories;
      if (changed('rateCardReel')) patch.rateCardReel = profile.rateCardReel;
      if (changed('rateCardStory')) patch.rateCardStory = profile.rateCardStory;
      if (changed('rateCardPost')) patch.rateCardPost = profile.rateCardPost;
      if (changed('rateCardVideo')) patch.rateCardVideo = profile.rateCardVideo;

      if (Object.keys(patch).length > 0) {
        await creatorsService.updateMe(patch);
      }

      // Save pending portfolio item if the user filled in the form but didn't click "Add to portfolio"
      if (pendingMedia) {
        await creatorsService.addPortfolioItem({
          type: newPortfolioItem.type,
          thumbnailUrl: pendingThumb || pendingMedia,
          mediaUrl: pendingMedia,
          platform: newPortfolioItem.platform,
          views: newPortfolioItem.views ? Number(newPortfolioItem.views) : undefined,
          likes: newPortfolioItem.likes ? Number(newPortfolioItem.likes) : undefined,
        });
        setNewPortfolioItem({ type: 'image', thumbnailUrl: '', mediaUrl: '', platform: 'instagram', views: '', likes: '' });
      }

      setIsDirty(false);
      await loadCreatorProfile();

      if (emailChanged || phoneChanged) {
        setContactChangedBanner(emailChanged && phoneChanged ? "both" : emailChanged ? "email" : "phone");
      }

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
    const budget = creatorPreferences.minimumBudget ? Number(creatorPreferences.minimumBudget) : undefined;
    if (budget !== undefined && budget < 5000) {
      toast.error("Minimum budget must be at least PKR 5,000");
      return;
    }

    setIsSaving(true);
    try {
      const [saved] = await Promise.all([
        creatorsService.updatePreferences({
          acceptsBarter: creatorPreferences.acceptsBarter,
          acceptsHybridDeals: creatorPreferences.acceptsHybridDeals,
          minimumBudget: budget,
        }),
        creatorsService.updateMe({
          dealTypes: creatorPreferences.dealTypes as DealType[],
          barterTypes: creatorPreferences.barterTypes as BarterCategory[],
        }),
      ]);
      setIsDirty(false);
      const nextCreatorPreferences = {
        ...creatorPreferences,
        acceptsBarter: Boolean(saved.acceptsBarter),
        acceptsHybridDeals: Boolean(saved.acceptsHybridDeals),
        minimumBudget: saved.minimumBudget ? String(saved.minimumBudget) : "",
      };
      creatorPreferencesSnapshotRef.current = nextCreatorPreferences;
      setCreatorPreferences((p) => ({
        ...p,
        acceptsBarter: Boolean(saved.acceptsBarter),
        acceptsHybridDeals: Boolean(saved.acceptsHybridDeals),
        minimumBudget: saved.minimumBudget ? String(saved.minimumBudget) : "",
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

    if (!isPasswordStrong(security.newPassword)) {
      toast.error(PASSWORD_REQUIREMENTS_MESSAGE);
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

  const handleSendEmailVerification = async () => {
    try {
      await authService.sendEmailVerification();
      toast.success("Verification email sent");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send verification email";
      toast.error(message);
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

  const refreshVerificationEvidence = async () => {
    const [docs, events, creator] = await Promise.all([
      creatorsService.getVerificationDocuments(),
      creatorsService.getVerificationEvents(),
      creatorsService.getMe(),
    ]);
    setVerificationDocuments(docs);
    setVerificationEvents(events);
    if (creator) {
      setCreatorVerified({ isVerified: Boolean(creator.isVerified), badgeLevel: creator.badgeLevel, verificationStatus: creator.verificationStatus });
    }
  };

  const uploadVerificationDocument = async (type: string, file?: File | null) => {
    if (!file) return;
    setUploadingVerificationType(type);
    try {
      const uploaded = await uploadsService.verificationDocument(file);
      await creatorsService.uploadVerificationDocument({ type, fileName: file.name, fileUrl: uploaded.url });
      await refreshVerificationEvidence();
      toast.success("Verification document uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload verification document";
      toast.error(message);
    } finally {
      setUploadingVerificationType(null);
    }
  };

  const submitVerificationReview = async () => {
    if (verificationDocuments.length === 0) {
      toast.error("Upload at least one verification document first");
      return;
    }
    setSubmittingVerification(true);
    try {
      await creatorsService.submitVerificationForReview();
      await refreshVerificationEvidence();
      toast.success("Verification submitted for review");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not submit verification";
      toast.error(message);
    } finally {
      setSubmittingVerification(false);
    }
  };

  const cropImageToAspectRatio = (source: HTMLImageElement, targetWidth = 1500): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const TARGET_RATIO = 3;
      const targetHeight = Math.round(targetWidth / TARGET_RATIO);
      const srcW = source.naturalWidth;
      const srcH = source.naturalHeight;
      const srcRatio = srcW / srcH;
      let sx: number, sy: number, sw: number, sh: number;
      if (srcRatio >= TARGET_RATIO) {
        sh = srcH;
        sw = Math.round(srcH * TARGET_RATIO);
        sx = Math.round((srcW - sw) / 2);
        sy = 0;
      } else {
        sw = srcW;
        sh = Math.round(srcW / TARGET_RATIO);
        sx = 0;
        sy = Math.round((srcH - sh) / 2);
      }
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(source, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      }, 'image/jpeg', 0.92);
    });

  const handleCoverFileSelected = (file?: File | null) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const TARGET_RATIO = 3;
      const targetWidth = Math.min(img.naturalWidth, 1500);
      const targetHeight = Math.round(targetWidth / TARGET_RATIO);
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      const srcRatio = srcW / srcH;
      let sx: number, sy: number, sw: number, sh: number;
      if (srcRatio >= TARGET_RATIO) {
        sh = srcH;
        sw = Math.round(srcH * TARGET_RATIO);
        sx = Math.round((srcW - sw) / 2);
        sy = 0;
      } else {
        sw = srcW;
        sh = Math.round(srcW / TARGET_RATIO);
        sx = 0;
        sy = Math.round((srcH - sh) / 2);
      }
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
      const croppedUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCoverCropState({ file, previewUrl, croppedUrl });
    };
    img.onerror = () => { URL.revokeObjectURL(previewUrl); toast.error('Could not read image file'); };
    img.src = previewUrl;
  };

  const confirmCoverCrop = async () => {
    if (!coverCropState) return;
    setCoverCropState(null);
    setIsUploadingCover(true);
    try {
      const img = document.createElement('img');
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = coverCropState.previewUrl;
      });
      const blob = await cropImageToAspectRatio(img);
      URL.revokeObjectURL(coverCropState.previewUrl);
      const croppedFile = new File([blob], coverCropState.file.name, { type: 'image/jpeg' });
      const uploaded = await uploadsService.coverImage(croppedFile);
      setProfile((current) => ({ ...current, coverImage: uploaded.url }));
      toast.success("Cover image uploaded");
    } catch (error) {
      URL.revokeObjectURL(coverCropState.previewUrl);
      const message = error instanceof Error ? error.message : "Could not upload cover image";
      toast.error(message);
    } finally {
      setIsUploadingCover(false);
    }
  };


  const handleSocialSave = async () => {
    setIsSaving(true);
    try {
      const filtered = socialAccounts.filter(
        (account) => account.platform && (account.username || account.profileUrl),
      );
      const duplicatePlatform = filtered.find((account, accountIndex) =>
        filtered.some((other, otherIndex) => otherIndex !== accountIndex && other.platform === account.platform),
      )?.platform;

      if (duplicatePlatform) {
        toast.error(`${platformLabels[duplicatePlatform]} is already connected. Each platform can only be added once.`);
        return;
      }

      const savedPlatforms = new Set(filtered.map((account) => account.platform));
      const removedPlatforms = (socialAccountsSnapshotRef.current || [])
        .map((account) => account.platform)
        .filter((platform) => !savedPlatforms.has(platform));

      if (removedPlatforms.length > 0) {
        await Promise.all(
          removedPlatforms.map((platform) => creatorsService.deleteSocialAccount(platform)),
        );
      }

      const patchResults = await Promise.allSettled(
        filtered.map((account) =>
          creatorsService.patchSocialAccount(account.platform, {
            username: account.username,
            profileUrl: account.profileUrl,
            followers: Number(account.followers) || 0,
            avgViews: Number(account.avgViews) || 0,
            engagementRate: Number(account.engagementRate) || 0,
            verifiedBy: account.verifiedBy,
          }),
        ),
      );

      const allPatched = patchResults.every((r) => r.status === 'fulfilled');
      if (!allPatched) {
        const accounts = filtered.map(({ platform, username, profileUrl, followers, avgViews, engagementRate, verifiedBy }) => ({
          platform,
          username,
          profileUrl,
          followers: Number(followers) || 0,
          avgViews: Number(avgViews) || 0,
          engagementRate: Number(engagementRate) || 0,
          verifiedBy,
        }));
        await creatorsService.updateSocialAccounts(accounts);
      }

      setIsDirty(false);
      await loadCreatorProfile();
      toast.success("Social accounts saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save social accounts";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOAuthConnect = async (platform: string) => {
    setIsOAuthConnecting(platform);
    try {
      const { redirectUrl } = await creatorsService.initiateOAuthConnect(platform);
      window.location.assign(redirectUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Could not connect ${platform}`;
      toast.error(message);
      setIsOAuthConnecting(null);
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
        views: newPortfolioItem.views ? Number(newPortfolioItem.views) : undefined,
        likes: newPortfolioItem.likes ? Number(newPortfolioItem.likes) : undefined,
      });
      setNewPortfolioItem({ type: 'image', thumbnailUrl: '', mediaUrl: '', platform: 'instagram', views: '', likes: '' });
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

  const updateSocialAccount = (index: number, updates: Partial<EditableSocialAccount>) => {
    setSocialAccounts((accounts) =>
      accounts.map((account, accountIndex) =>
        accountIndex === index ? { ...account, ...updates } : account,
      ),
    );
  };

  const addSocialAccount = () => {
    const nextPlatform = platformOrder.find((platform) => !socialAccounts.some((account) => account.platform === platform));
    if (!nextPlatform) {
      toast.info("All supported platforms are already added");
      return;
    }

    setSocialAccounts((accounts) => [
      ...accounts,
      {
        platform: nextPlatform,
        username: "",
        profileUrl: "",
        followers: undefined,
        avgViews: undefined,
        engagementRate: undefined,
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

  useEffect(() => {
    if (!loadedCreator) return;
    ambassadorService
      .getScore()
      .then(setAmbassadorMetrics)
      .catch(() => setAmbassadorMetrics(null));
  }, [loadedCreator]);

  // Dirty tracking compares against the last loaded/saved state so hydration is not treated as user input.
  useEffect(() => {
    const profileSnapshot = profileSnapshotRef.current;
    const socialAccountsSnapshot = socialAccountsSnapshotRef.current;
    const creatorPreferencesSnapshot = creatorPreferencesSnapshotRef.current;

    if (!profileSnapshot || !socialAccountsSnapshot || !creatorPreferencesSnapshot) {
      return;
    }

    setIsDirty(
      JSON.stringify(profile) !== JSON.stringify(profileSnapshot) ||
      JSON.stringify(socialAccounts) !== JSON.stringify(socialAccountsSnapshot) ||
      JSON.stringify(creatorPreferences) !== JSON.stringify(creatorPreferencesSnapshot),
    );
  }, [profile, socialAccounts, creatorPreferences]);

  // Browser navigation guard when there are unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const profileCompleteness = useMemo(() => {
    let score = 0;
    if (profile.bio && profile.bio.length > 20) score += 3;
    if (profile.coverImage) score += 3;
    if (socialAccounts.length >= 2) score += 2;
    if (portfolioItems.length >= 6) score += 2;
    const pct = Math.round((score / 10) * 100);
    const missing: string[] = [];
    if (!profile.bio || profile.bio.length <= 20) missing.push("Add a bio (20+ characters)");
    if (!profile.coverImage) missing.push("Upload a cover image");
    if (socialAccounts.length < 2) missing.push("Connect 2+ social platforms");
    if (portfolioItems.length < 6) {
      const need = 6 - portfolioItems.length;
      missing.push(`Add ${need} more portfolio item${need > 1 ? "s" : ""}`);
    }
    return { pct, missing };
  }, [profile.bio, profile.coverImage, socialAccounts.length, portfolioItems.length]);

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
        <div className="flex items-start justify-between gap-4 pb-2 pt-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">
              {pageEyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.035em] text-[#1e3d2e] md:text-3xl">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-[#496159]">{pageSubtitle}</p>
          </div>
          {section === "profile" && (
            <div className="mt-4 flex shrink-0 gap-2">
              {profile.handle && (
                <Link
                  href={`/p/${profile.handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-full border-2 border-[#2d6b4e] bg-white px-4 py-2 text-sm font-bold text-[#2d6b4e] shadow-sm transition-colors hover:bg-[#e4f1e8]"
                >
                  <ExternalLink className="size-4" />
                  Preview
                </Link>
              )}
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-2 rounded-full border-2 border-[#2d6b4e] bg-[#2d6b4e] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1f5239]"
              >
                <Share2 className="size-4" />
                Share
              </button>
            </div>
          )}
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

              {/* Email / phone change banner */}
              {contactChangedBanner && (
                <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                  <div className="flex gap-2.5">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">
                        {contactChangedBanner === "both"
                          ? "Email and phone changed — verify both to keep your account secure"
                          : contactChangedBanner === "email"
                          ? "Email changed — check your inbox to verify your new address"
                          : "Phone number changed — you may need to re-verify via SMS"}
                      </p>
                      <p className="mt-0.5 text-xs text-amber-700">Some features may be limited until verification is complete.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setContactChangedBanner(null)}
                    className="shrink-0 rounded-full p-1 text-amber-500 hover:bg-amber-100 hover:text-amber-700"
                    aria-label="Dismiss"
                  >
                    <Check className="size-3.5" />
                  </button>
                </div>
              )}

              {/* Profile completeness */}
              <div className={panelClass}>
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Profile Health</p>
                    <h2 className="mt-0.5 text-lg font-extrabold tracking-[-0.025em] text-[#1e3d2e]">
                      {profileCompleteness.pct}% complete
                    </h2>
                  </div>
                  <div className="flex size-14 items-center justify-center rounded-full border-4 border-[#e5eae4]"
                    style={{ background: `conic-gradient(#2d6b4e ${profileCompleteness.pct}%, transparent 0)` }}>
                    <div className="flex size-10 items-center justify-center rounded-full bg-white">
                      <span className="text-[11px] font-extrabold text-[#1e3d2e]">{profileCompleteness.pct}%</span>
                    </div>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#e5eae4] mb-3">
                  <div
                    className="h-full rounded-full bg-[#2d6b4e] transition-all duration-700"
                    style={{ width: `${profileCompleteness.pct}%` }}
                  />
                </div>
                {profileCompleteness.missing.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a8f82]">To improve your profile</p>
                    {profileCompleteness.missing.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-[#496159]">
                        <div className="size-1.5 shrink-0 rounded-full bg-[#b77a12]" />
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-[#2d6b4e]">Your profile is fully complete.</p>
                )}
              </div>

              {/* Verification status */}
              {creatorVerified && (
                <div className={panelClass}>
                  <PanelHeader eyebrow="Account" title="Verification Status" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl",
                        creatorVerified.isVerified ? "bg-[#e4f1e8]" : "bg-[#f4f7f5]"
                      )}>
                        <BadgeCheck className={cn("size-5", creatorVerified.isVerified ? "text-[#2d6b4e]" : "text-[#87938b]")} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1e3d2e]">
                          {creatorVerified.isVerified ? "Verified" : "Not verified"}
                        </p>
                        <p className="text-xs text-[#87938b]">
                          {creatorVerified.isVerified
                            ? `Badge level: ${(creatorVerified.badgeLevel ?? 'verified').replace(/_/g, ' ')}`
                            : `Status: ${(creatorVerified.verificationStatus ?? 'unverified').replace(/_/g, ' ')}`}
                        </p>
                      </div>
                    </div>
                    <button
                      disabled={creatorVerified.isVerified || submittingVerification || verificationDocuments.length === 0}
                      onClick={() => void submitVerificationReview()}
                      className="shrink-0 rounded-full border-2 border-[#d1ddd6] bg-white px-3.5 py-1.5 text-xs font-bold text-[#496159] transition-colors hover:border-[#b0c5ba] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingVerification ? "Submitting..." : creatorVerified.isVerified ? "Verified" : "Submit"}
                    </button>
                  </div>
                  {!creatorVerified.isVerified ? (
                    <div className="mt-4 grid gap-2.5">
                      {creatorVerificationTypes.map((item) => {
                        const doc = verificationDocuments.find((candidate) => candidate.type === item.type);
                        return (
                          <div key={item.type} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e3e9e5] bg-[#fbfcfb] px-3.5 py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className={cn(
                                "grid size-9 shrink-0 place-items-center rounded-xl",
                                doc?.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                                doc?.status === "rejected" ? "bg-red-50 text-red-700" :
                                doc ? "bg-[#fff1cd] text-[#8b5e12]" : "bg-white text-[#87938b]"
                              )}>
                                {doc?.status === "approved" ? <Check className="size-4" /> : doc?.status === "rejected" ? <XCircle className="size-4" /> : <FileText className="size-4" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-[#1e3d2e]">{item.label}</p>
                                <p className="truncate text-[11px] text-[#87938b]">
                                  {doc ? `${doc.fileName} · ${doc.status}` : "Upload a document for review"}
                                </p>
                                {doc?.rejectionReason ? <p className="mt-1 text-[11px] text-red-600">{doc.rejectionReason}</p> : null}
                              </div>
                            </div>
                            <label className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#d1ddd6] bg-white px-3 text-[11px] font-bold text-[#2d6b4e] hover:bg-[#e8f0ec]">
                              <Upload className="size-3.5" />
                              {uploadingVerificationType === item.type ? "Uploading" : doc ? "Replace" : "Upload"}
                              <input
                                type="file"
                                className="sr-only"
                                accept="image/*,.pdf"
                                disabled={uploadingVerificationType === item.type}
                                onChange={(event) => void uploadVerificationDocument(item.type, event.target.files?.[0])}
                              />
                            </label>
                          </div>
                        );
                      })}
                      {verificationEvents.length > 0 ? (
                        <div className="rounded-2xl border border-[#e3e9e5] bg-white px-3.5 py-3">
                          <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-[#7a8f82]">
                            <Clock className="size-3.5" /> Recent activity
                          </div>
                          <div className="space-y-1.5">
                            {verificationEvents.slice(0, 3).map((event) => (
                              <div key={event.id} className="flex items-start justify-between gap-3 text-[11px]">
                                <span className="font-semibold text-[#496159]">{event.eventType.replaceAll("_", " ").toLowerCase()}</span>
                                <span className="shrink-0 text-[#9ba8a1]">{new Date(event.createdAt).toLocaleDateString("en-PK")}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Active packages indicator */}
              <div className={panelClass}>
                <PanelHeader eyebrow="Marketplace" title="Package Visibility" />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl",
                      activePackageCount ? "bg-[#e4f1e8]" : "bg-amber-50"
                    )}>
                      <Package className={cn("size-5", activePackageCount ? "text-[#2d6b4e]" : "text-amber-600")} />
                    </div>
                    <div>
                      {activePackageCount === null ? (
                        <p className="text-sm text-[#87938b]">Loading…</p>
                      ) : activePackageCount > 0 ? (
                        <>
                          <p className="text-sm font-bold text-[#1e3d2e]">{activePackageCount} active package{activePackageCount !== 1 ? 's' : ''}</p>
                          <p className="text-xs text-[#496159]">Brands can find and book you in the marketplace</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-amber-700">No active packages</p>
                          <p className="text-xs text-amber-600">You are not currently visible in the marketplace</p>
                        </>
                      )}
                    </div>
                  </div>
                  <Link
                    href={activePackageCount === 0 ? "/creator/packages/new" : "/creator/packages"}
                    className="shrink-0 rounded-full border-2 border-[#d1ddd6] bg-white px-3.5 py-1.5 text-xs font-bold text-[#496159] transition-colors hover:border-[#b0c5ba]"
                  >
                    {activePackageCount === 0 ? "Create package" : "Manage"}
                  </Link>
                </div>
              </div>

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
                          onWheel={(event) => event.currentTarget.blur()}
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
                          onWheel={(event) => event.currentTarget.blur()}
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
                          onWheel={(event) => event.currentTarget.blur()}
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
                          onWheel={(event) => event.currentTarget.blur()}
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
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={isUploadingCover}
                          onChange={(event) => {
                            handleCoverFileSelected(event.target.files?.[0]);
                            event.target.value = '';
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <ToggleRow
                    label="FBR Filer Status"
                    description="Indicate that you are a registered FBR tax filer"
                    checked={profile.isFiler}
                    onCheckedChange={(checked) => setProfile((p) => ({ ...p, isFiler: checked }))}
                  />
                  <div className="mt-1 pl-0.5">
                    <button
                      type="button"
                      onClick={() => setShowFilerInfo((s) => !s)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-[#87938b] transition-colors hover:text-[#1e3d2e]"
                    >
                      <Info className="size-3.5" />
                      {showFilerInfo ? "Hide tax details" : "What does this affect?"}
                      {showFilerInfo ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    </button>
                    {showFilerInfo && (
                      <div className="mt-2 rounded-xl bg-[#f4f7f5] p-3 text-xs text-[#496159] space-y-1.5">
                        <p><strong className="font-bold text-[#1e3d2e]">Filer (12.5% WHT):</strong> Your earnings will have 12.5% withholding tax deducted at source by ZingZing.</p>
                        <p><strong className="font-bold text-[#1e3d2e]">Non-filer (15% WHT):</strong> A higher 15% withholding tax applies. Registering with FBR as a filer reduces this to 12.5%.</p>
                        <p className="text-[#87938b]">WHT is deducted from each payout. Your annual tax certificate is available from FBR&apos;s IRIS portal at iris.fbr.gov.pk.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className={panelClass}>
                <PanelHeader eyebrow="Content" title="Categories" />
                <p className="mb-3 text-sm text-[#496159]">Select the content categories you create in</p>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => handleCategoryToggle(category.value)}
                      className={
                        profile.categories.includes(category.value)
                          ? "rounded-full border-2 border-[#2d6b4e] bg-[#e4f1e8] px-4 py-2 text-sm font-bold text-[#1e5c3e] transition-all"
                          : "rounded-full border-2 border-[#d1ddd6] bg-white px-4 py-2 text-sm font-semibold text-[#496159] transition-all hover:border-[#b0c5ba]"
                      }
                    >
                      {category.label}
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

              {/* How badges work */}
              <div className={panelClass}>
                <button
                  type="button"
                  onClick={() => setShowBadgeExplainer((s) => !s)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Info className="size-4 text-[#87938b]" />
                    <span className="text-sm font-bold text-[#1e3d2e]">How badges work</span>
                  </div>
                  {showBadgeExplainer ? <ChevronUp className="size-4 text-[#87938b]" /> : <ChevronDown className="size-4 text-[#87938b]" />}
                </button>
                {showBadgeExplainer && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-1 rounded-xl bg-[#f4f7f5] p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7a8f82]">Fast Responder</p>
                      <p className="text-xs text-[#496159]">Earned automatically when your average response time to brand messages is under 1 hour. Tracked from your message history — no action needed.</p>
                    </div>
                    <div className="space-y-1 rounded-xl bg-[#f4f7f5] p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7a8f82]">Trending</p>
                      <p className="text-xs text-[#496159]">Awarded to creators with strong recent activity — high order volume, positive reviews, and follower growth over the past 30 days.</p>
                    </div>
                    <div className="space-y-1 rounded-xl bg-[#f4f7f5] p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7a8f82]">Verified</p>
                      <p className="text-xs text-[#496159]">Applied for manually. ZingZing reviews your identity and social profiles before issuing a verified badge. Use the Apply button above or email support@zingzing.pk.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Portfolio */}
              <div className={panelClass}>
                <PanelHeader eyebrow="Work Samples" title="Portfolio" />
                <p className="mb-4 text-sm text-[#496159]">Showcase your best content. Brands browse these before reaching out.</p>

                {portfolioItems.length > 0 && (
                  <Reorder.Group
                    axis="y"
                    values={portfolioItems}
                    onReorder={(newOrder) => {
                      setPortfolioItems(newOrder);
                      if (reorderTimer.current) clearTimeout(reorderTimer.current);
                      reorderTimer.current = setTimeout(() => {
                        void creatorsService.reorderPortfolio(newOrder.map((i) => i.id)).catch((error) => {
                          const message = error instanceof Error ? error.message : "Could not save portfolio order";
                          toast.error(message);
                        });
                      }, 600);
                    }}
                    className="mb-4 space-y-2"
                    as="div"
                  >
                    {portfolioItems.map((item) => (
                      <Reorder.Item
                        key={item.id}
                        value={item}
                        as="div"
                        className="group flex items-center gap-3 rounded-2xl border border-[#d1ddd6] bg-[#f4f7f5] p-3 select-none"
                      >
                        <span className="shrink-0 cursor-grab touch-none text-[#c0cfc7] hover:text-[#496159] active:cursor-grabbing">
                          <GripVertical className="size-4" />
                        </span>
                        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e6eceb] text-[#2d6b4e]">
                          {item.type === 'video' ? <Video className="size-4" /> : <ImageIcon className="size-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-extrabold capitalize text-[#1e3d2e]">{item.platform}</p>
                          <p className="truncate text-[11px] text-[#87938b]">{item.type}</p>
                          {(item.views != null || item.likes != null) && (
                            <p className="mt-0.5 text-[10px] text-[#87938b]">
                              {item.views != null && `${item.views.toLocaleString()} views`}
                              {item.views != null && item.likes != null && ' · '}
                              {item.likes != null && `${item.likes.toLocaleString()} likes`}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => void handleDeletePortfolioItem(item.id)}
                          className="shrink-0 rounded-full border border-[#d1ddd6] bg-white p-1.5 text-[#87938b] opacity-0 transition-opacity group-hover:opacity-100 hover:border-[#c0392b] hover:text-[#c0392b]"
                          aria-label="Remove item"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className={labelClass}>Views <span className="normal-case font-normal text-[#b0bfb8]">(optional)</span></p>
                      <input
                        type="number"
                        onWheel={(event) => event.currentTarget.blur()}
                        min="0"
                        className={inputClass}
                        placeholder="e.g. 12500"
                        value={newPortfolioItem.views}
                        onChange={(e) => setNewPortfolioItem((p) => ({ ...p, views: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className={labelClass}>Likes <span className="normal-case font-normal text-[#b0bfb8]">(optional)</span></p>
                      <input
                        type="number"
                        onWheel={(event) => event.currentTarget.blur()}
                        min="0"
                        className={inputClass}
                        placeholder="e.g. 890"
                        value={newPortfolioItem.likes}
                        onChange={(e) => setNewPortfolioItem((p) => ({ ...p, likes: e.target.value }))}
                      />
                    </div>
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

              {/* Ambassador status */}
              {ambassadorMetrics && (
                <div className={panelClass}>
                  <PanelHeader eyebrow="Ambassador" title="Program Status" />
                  <div className="mb-4 flex items-center gap-4">
                    <div className="relative shrink-0">
                      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }} aria-hidden>
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#e5eae4" strokeWidth="5" />
                        <circle
                          cx="32" cy="32" r="28" fill="none"
                          stroke={AMBASSADOR_TIERS[ambassadorMetrics.tier].color}
                          strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${(ambassadorMetrics.score.total / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-extrabold leading-none text-[#1e3d2e]">{ambassadorMetrics.score.total}</span>
                        <span className="text-[9px] text-[#87938b]">/100</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Award className="size-4 text-[#b77a12]" />
                        <p className="text-sm font-extrabold text-[#1e3d2e]">{AMBASSADOR_TIERS[ambassadorMetrics.tier].name}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-[#87938b]">
                        Top {Math.max(1, 100 - ambassadorMetrics.percentileRank)}% of creators
                      </p>
                    </div>
                  </div>
                  <div className="mb-4 space-y-2">
                    {[
                      { label: "Delivery",    val: ambassadorMetrics.score.deliveryScore,            max: 25 },
                      { label: "Rating",      val: ambassadorMetrics.score.ratingScore,              max: 25 },
                      { label: "Profile",     val: ambassadorMetrics.score.profileCompletenessScore, max: 10 },
                      { label: "Consistency", val: ambassadorMetrics.score.consistencyScore,         max: 5  },
                    ].map(({ label, val, max }) => (
                      <div key={label}>
                        <div className="mb-0.5 flex justify-between text-[10px]">
                          <span className="text-[#7a8f82]">{label}</span>
                          <span className="font-bold text-[#1e3d2e]">{val}/{max}</span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-[#e5eae4]">
                          <div className="h-full rounded-full bg-[#2d6b4e]" style={{ width: `${(val / max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {ambassadorMetrics.improvements.length > 0 && (
                    <div className="mb-4 space-y-1.5 rounded-xl bg-[#f4f7f5] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a8f82]">Next steps</p>
                      {ambassadorMetrics.improvements.slice(0, 2).map((imp) => (
                        <div key={imp} className="flex items-start gap-2 text-xs text-[#496159]">
                          <div className="mt-1 size-1.5 shrink-0 rounded-full bg-[#b77a12]" />
                          {imp}
                        </div>
                      ))}
                    </div>
                  )}
                  <Link
                    href="/creator/ambassador-program"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#2d6b4e] bg-white text-sm font-bold text-[#2d6b4e] transition-colors hover:bg-[#e4f1e8]"
                  >
                    View Full Program <ExternalLink className="size-3.5" />
                  </Link>
                </div>
              )}

              <SaveButton isSaving={isSaving} onClick={handleSave} />
            </TabsPrimitive.Content>
          )}

          {/* ── Social Tab ────────────────────────────────────────────────────── */}
          {section === "social" && (
            <TabsPrimitive.Content value="social" className="space-y-5">
              {/* OAuth quick-connect */}
              <div className={panelClass}>
                <PanelHeader eyebrow="Quick Connect" title="Link via OAuth" />
                <p className="mb-4 text-sm text-[#496159]">
                  Connect directly to verify follower counts and engagement automatically.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {platformOrder.map((platform) => {
                    const label = platformLabels[platform];
                    const alreadyConnected = socialAccounts.some(
                      (a) => a.platform === platform && a.verifiedBy === 'API_CONNECTED',
                    );
                    const isConnecting = isOAuthConnecting === platform;
                    return (
                      <button
                        key={platform}
                        disabled={isConnecting || alreadyConnected}
                        onClick={() => void handleOAuthConnect(platform)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-colors",
                          alreadyConnected
                            ? "border-[#2d6b4e] bg-[#e4f1e8] text-[#1e5c3e] cursor-default"
                            : "border-[#dce6df] bg-white text-[#2d6b4e] hover:border-[#2d6b4e] hover:bg-[#e4f1e8] disabled:opacity-50",
                        )}
                      >
                        <PlatformIconBadge platform={platform} size="sm" fallbackIcon={LinkIcon} />
                        {isConnecting ? 'Redirecting…' : alreadyConnected ? `${label} connected` : `Connect ${label}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={panelClass}>
                <PanelHeader eyebrow="Social" title="Connected Accounts" />
                <div className="space-y-4">
                  {socialAccounts.map((account, index) => {
                    const isSavedAccount = Boolean(
                      socialAccountsSnapshotRef.current?.some((savedAccount) => savedAccount.platform === account.platform),
                    );
                    return (
                      <div
                        key={`${account.platform}-${index}`}
                        className="rounded-2xl border border-[#d1ddd6] bg-[#f4f7f5] p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <PlatformIconBadge platform={account.platform} fallbackIcon={LinkIcon} />
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold capitalize text-[#1e3d2e]">
                                {account.platform}
                              </span>
                              {account.verified && <Check className="size-3.5 text-[#2d6b4e]" />}
                              {account.verifiedBy && (
                                <span className={cn(
                                  "rounded-full px-2 py-0.5 text-[9px] font-bold",
                                  account.verifiedBy === "API_CONNECTED"     ? "bg-sky-50 text-sky-700"         :
                                  account.verifiedBy === "PLATFORM_REVIEWED" ? "bg-[#e4f1e8] text-[#1e5c3e]"   :
                                                                                "bg-[#f4f7f5] text-[#87938b]"
                                )}>
                                  {account.verifiedBy === "API_CONNECTED"     ? "API-connected"  :
                                   account.verifiedBy === "PLATFORM_REVIEWED" ? "Team-verified"  :
                                                                                 "Self-reported"}
                                </span>
                              )}
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
                          {!isSavedAccount && (
                            <div className="space-y-1.5">
                              <p className={labelClass}>Platform</p>
                              <DesignSelect
                                value={account.platform}
                                onValueChange={(value) =>
                                  updateSocialAccount(index, { platform: value as Platform })
                                }
                                options={platformOrder}
                                disabledOptions={socialAccounts
                                  .filter((_, accountIndex) => accountIndex !== index)
                                  .map((socialAccount) => socialAccount.platform)}
                                capitalize
                              />
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <p className={labelClass}>Username</p>
                            <input
                              className={inputClass}
                              value={account.username}
                              placeholder="e.g. aamna.eats"
                              onChange={(event) =>
                                updateSocialAccount(index, { username: event.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1.5 sm:col-span-2">
                            <p className={labelClass}>Profile URL</p>
                            <input
                              className={inputClass}
                              value={account.profileUrl || ""}
                              placeholder="https://..."
                              onChange={(event) =>
                                updateSocialAccount(index, { profileUrl: event.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <p className={labelClass}>Follower count</p>
                            <input
                              type="number"
                              onWheel={(event) => event.currentTarget.blur()}
                              className={inputClass}
                              value={account.followers ? String(account.followers) : ""}
                              placeholder="e.g. 125000"
                              onChange={(event) =>
                                updateSocialAccount(index, {
                                  followers: event.target.value === "" ? undefined : Number(event.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <p className={labelClass}>Average views</p>
                            <input
                              type="number"
                              onWheel={(event) => event.currentTarget.blur()}
                              className={inputClass}
                              value={account.avgViews ? String(account.avgViews) : ""}
                              placeholder="e.g. 18000"
                              onChange={(event) =>
                                updateSocialAccount(index, {
                                  avgViews: event.target.value === "" ? undefined : Number(event.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1.5 sm:col-span-2">
                            <p className={labelClass}>Engagement rate (%)</p>
                            <input
                              type="number"
                              onWheel={(event) => event.currentTarget.blur()}
                              step="0.1"
                              className={inputClass}
                              value={account.engagementRate ? String(account.engagementRate) : ""}
                              placeholder="e.g. 4.8"
                              onChange={(event) =>
                                updateSocialAccount(index, {
                                  engagementRate: event.target.value === "" ? undefined : Number(event.target.value),
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={addSocialAccount}
                    disabled={socialAccounts.length >= platformOrder.length}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#cddad1] bg-white text-sm font-bold text-[#2d6b4e] transition-colors hover:border-[#2d6b4e] hover:bg-[#e4f1e8] disabled:cursor-not-allowed disabled:border-[#dce6df] disabled:text-[#87938b] disabled:hover:bg-white"
                  >
                    <Plus className="size-4" />
                    {socialAccounts.length >= platformOrder.length ? "All Platforms Added" : "Connect Account"}
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
                    <p className={labelClass}>Minimum Collaboration Budget (PKR)</p>
                    <input
                      type="number"
                      onWheel={(event) => event.currentTarget.blur()}
                      min="5000"
                      className={inputClass}
                      placeholder="e.g. 25000"
                      value={creatorPreferences.minimumBudget}
                      onChange={(e) =>
                        setCreatorPreferences((p) => ({ ...p, minimumBudget: e.target.value }))
                      }
                    />
                    <p className="text-[11px] text-[#87938b]">Minimum PKR 5,000. Brands below this threshold won&apos;t see you in filtered searches.</p>
                  </div>
                </div>
              </div>

              {/* Deal types */}
              <div className={panelClass}>
                <PanelHeader eyebrow="Marketplace" title="Deal Types" />
                <p className="mb-4 text-sm text-[#496159]">
                  Brands filter the marketplace by deal type. Keep this up to date — it directly affects your discoverability.
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["paid", "barter", "hybrid"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setCreatorPreferences((p) => ({
                          ...p,
                          dealTypes: p.dealTypes.includes(type)
                            ? p.dealTypes.filter((t) => t !== type)
                            : [...p.dealTypes, type],
                        }))
                      }
                      className={
                        creatorPreferences.dealTypes.includes(type)
                          ? "rounded-full border-2 border-[#2d6b4e] bg-[#e4f1e8] px-5 py-2 text-sm font-bold capitalize text-[#1e5c3e] transition-all"
                          : "rounded-full border-2 border-[#d1ddd6] bg-white px-5 py-2 text-sm font-semibold capitalize text-[#496159] transition-all hover:border-[#b0c5ba]"
                      }
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barter categories — conditional */}
              {creatorPreferences.acceptsBarter && (
                <div className={panelClass}>
                  <PanelHeader eyebrow="Barter" title="Barter Categories" />
                  <p className="mb-4 text-sm text-[#496159]">
                    What kinds of barter products do you accept? Brands search by category to find the right match.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["food", "hotel", "salon", "events", "products", "services", "travel", "education"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setCreatorPreferences((p) => ({
                            ...p,
                            barterTypes: p.barterTypes.includes(type)
                              ? p.barterTypes.filter((t) => t !== type)
                              : [...p.barterTypes, type],
                          }))
                        }
                        className={
                          creatorPreferences.barterTypes.includes(type)
                            ? "rounded-full border-2 border-[#b77a12] bg-[#fdf4e1] px-5 py-2 text-sm font-bold capitalize text-[#9a6b00] transition-all"
                            : "rounded-full border-2 border-[#d1ddd6] bg-white px-5 py-2 text-sm font-semibold capitalize text-[#496159] transition-all hover:border-[#b0c5ba]"
                        }
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#d1ddd6] bg-[#f4f7f5] p-3.5">
                    <div>
                      <p className="text-sm font-extrabold text-[#1e3d2e]">
                        Email: {user?.emailVerified ? "Verified" : "Not verified"}
                      </p>
                      <p className="mt-0.5 text-xs text-[#87938b]">{user?.email ?? "Account email"}</p>
                    </div>
                    {!user?.emailVerified && (
                      <button
                        type="button"
                        onClick={handleSendEmailVerification}
                        className="rounded-full border border-[#b8c9bf] bg-white px-3 py-1.5 text-xs font-bold text-[#2d6b4e] transition-colors hover:bg-[#e8f0ec]"
                      >
                        Send email
                      </button>
                    )}
                  </div>
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
                    <p className="text-sm font-extrabold text-[#1e3d2e]">Status: Not available yet</p>
                    <p className="mt-0.5 text-xs text-[#87938b]">Self-service 2FA is being prepared for creator accounts.</p>
                  </div>
                  <button
                    onClick={() => toast.info("Self-service two-factor authentication is not available yet.")}
                    className="rounded-full border-2 border-[#d1ddd6] bg-white px-4 py-2 text-xs font-bold text-[#496159] hover:border-[#b0c5ba]"
                  >
                    Not available
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

      {/* Unsaved-changes banner */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-xl">
            <AlertCircle className="size-4 shrink-0 text-amber-600" />
            <p className="whitespace-nowrap text-sm font-semibold text-amber-800">Unsaved changes</p>
            <button
              onClick={() => {
                if (section === "profile") void handleSave();
                else if (section === "social") void handleSocialSave();
                else void handleCreatorPreferencesSave();
              }}
              className="rounded-full bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700"
            >
              Save now
            </button>
            <button
              onClick={() => {
                setIsDirty(false);
                void loadCreatorProfile();
              }}
              className="rounded-full border border-amber-200 bg-white px-3.5 py-1.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Cover crop preview modal */}
      {coverCropState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-[1.6rem] bg-white p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-extrabold tracking-[-0.03em] text-[#1e3d2e]">
              Crop cover image
            </h2>
            <p className="mb-4 text-sm text-[#87938b]">
              Your image will be center-cropped to a 3:1 banner ratio.
            </p>
            {/* Cropped preview at 3:1 */}
            <div className="overflow-hidden rounded-xl" style={{ aspectRatio: '3/1' }}>
                {/* Using img tag intentionally for canvas dataURL blob preview */}
              <img
                src={coverCropState.croppedUrl}
                alt="Cover crop preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  URL.revokeObjectURL(coverCropState.previewUrl);
                  setCoverCropState(null);
                }}
                className="flex-1 rounded-full border border-[#d1ddd6] py-2.5 text-sm font-bold text-[#496159] transition-colors hover:border-[#c0392b] hover:text-[#c0392b]"
              >
                Cancel
              </button>
              <button
                onClick={() => void confirmCoverCrop()}
                className="flex-1 rounded-full bg-[#2d6b4e] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
              >
                Use this crop
              </button>
            </div>
          </div>
        </div>
      )}

      {section === "profile" && shareOpen && (
        <ShareProfileModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          creator={{
            id: user?.id ?? "",
            userId: user?.id ?? "",
            username: profile.handle || "",
            name: profile.name || user?.name || "",
            avatar: profile.avatar || user?.avatar || "",
            coverImage: profile.coverImage,
            bio: profile.bio,
            city: (profile.city as Creator["city"]) ?? "Karachi",
            categories: normalizeCategories(profile.categories).map(getCategoryLabel),
            languages: profile.languages,
            website: profile.website,
            availabilityStatus: profile.availabilityStatus,
            isFiler: profile.isFiler,
            responseTime: profile.responseTime,
            rateCardReel: profile.rateCardReel,
            rateCardStory: profile.rateCardStory,
            rateCardPost: profile.rateCardPost,
            rateCardVideo: profile.rateCardVideo,
            platforms: [],
            totalFollowers: 0,
            avgEngagementRate: 0,
            dealTypes: [],
            isVerified: false,
            isTrending: false,
            isFastResponder: false,
            rating: 0,
            totalReviews: 0,
            completedDeals: 0,
            contentPreviews: [],
            createdAt: new Date(),
          }}
        />
      )}
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
