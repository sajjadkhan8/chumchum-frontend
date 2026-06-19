"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Lock,
  CreditCard,
  Save,
  Mail,
  Phone,
  CheckCircle,
  Settings,
  ShieldCheck,
  Layers,
  UserCircle2,
  History,
  CalendarClock,
  RefreshCw,
  Upload,
  FileCheck,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { brandsService, type VerificationDocument } from "@/services/brands.service";
import { apiClient } from "@/lib/api/client";
import { usersService } from "@/services/users.service";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

const TABS = [
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "subscriptions", label: "Subscriptions", icon: History },
  { id: "campaigns", label: "Campaigns", icon: Layers },
  { id: "verification", label: "Verification", icon: CheckCircle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
] as const;

type TabId = typeof TABS[number]["id"];

const inputCls =
  "h-9 rounded-xl border-[#d9e0d8] bg-[#f4f2e9] text-[#1a2e22] placeholder:text-[#8fa098] focus-visible:border-[#2d6b4e] focus-visible:ring-2 focus-visible:ring-[#2d6b4e]/15 focus-visible:bg-white";
const labelCls = "text-xs font-bold text-[#526259]";

const cardStyle = {
  "--background": "oklch(1 0 0)",
  "--foreground": "oklch(0.1 0 0)",
  "--card": "oklch(1 0 0)",
  "--card-foreground": "oklch(0.1 0 0)",
  "--muted": "oklch(0.96 0 0)",
  "--muted-foreground": "oklch(0.45 0 0)",
  "--border": "oklch(0.91 0 0)",
  "--input": "oklch(0.91 0 0)",
  "--ring": "oklch(0.55 0.17 145)",
} as React.CSSProperties;

function SectionCard({
  title,
  description,
  icon: Icon,
  danger,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border bg-white p-5 shadow-[0_18px_60px_rgba(38,70,50,0.07)]",
        danger ? "border-[#f5c2c2]" : "border-[#d9e0d8]"
      )}
      style={cardStyle}
    >
      <div className="mb-4 flex items-center gap-2">
        {Icon && (
          <span className={cn("grid size-7 place-items-center rounded-lg", danger ? "bg-[#fce4e4]" : "bg-[#e7f0ea]")}>
            <Icon className={cn("size-3.5", danger ? "text-[#c13a3a]" : "text-[#185c39]")} />
          </span>
        )}
        <div>
          <p className={cn("text-sm font-extrabold", danger ? "text-[#c13a3a]" : "text-[#1a2e22]")}>{title}</p>
          {description && <p className="text-[11px] text-[#8fa098]">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <div>
        <p className="text-xs font-semibold text-[#1a2e22]">{label}</p>
        <p className="text-[11px] text-[#8fa098]">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

interface SubscriptionRecord {
  id: string;
  packageTitle: string;
  status: string;
  interval: string;
  duration: number;
  cyclesCompleted: number;
  nextRenewalAt?: string;
  cancelledAt?: string;
  createdAt?: string;
}

function BrandSettingsPageContent() {
  const searchParams = useSearchParams();
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("billing");
  const [isSaving, setIsSaving] = useState(false);

  const [billing, setBilling] = useState({ plan: "Business", monthlyBudget: "500000" });

  const [campaignPreferences, setCampaignPreferences] = useState({
    preferredCreatorCategories: "Food, Lifestyle, Beauty",
    targetCities: "Karachi, Lahore, Islamabad",
    targetPlatforms: "Instagram, TikTok, YouTube",
    campaignBudgetRange: "PKR 3,750,000 - PKR 20,000,000",
  });

  const [verification, setVerification] = useState({
    businessStatus: "UNVERIFIED",
    contactEmail: "verification@karachigourmet.pk",
    phoneNumber: "+92 300 778 8899",
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

  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [verificationDocs, setVerificationDocs] = useState<VerificationDocument[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  const loadBrandProfile = useCallback(async () => {
    try {
      const brand = await brandsService.getMe();
      if (!brand) return;
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
        businessStatus: brand.businessVerificationStatus || "UNVERIFIED",
        contactEmail: brand.verificationContactEmail || "",
        phoneNumber: brand.verificationPhoneNumber || "",
      });
    } catch {
      // Silently fall back to defaults
    }
  }, []);

  const loadNotificationPreferences = useCallback(async () => {
    try {
      const prefs = await usersService.getNotificationPreferences();
      setNotifications(prefs);
    } catch {
      // Silently fall back to defaults
    }
  }, []);

  const handleBillingSave = async () => {
    setIsSaving(true);
    try {
      const saved = await brandsService.updateMe({ monthlyBudget: Number(billing.monthlyBudget) || undefined });
      setBilling((current) => ({ ...current, monthlyBudget: saved.monthlyBudget ? String(saved.monthlyBudget) : "" }));
      toast.success("Billing settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save billing settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCampaignPreferencesSave = async () => {
    setIsSaving(true);
    try {
      const saved = await brandsService.updateMe({ ...campaignPreferences });
      setCampaignPreferences({
        preferredCreatorCategories: saved.preferredCreatorCategories || "",
        targetCities: saved.targetCities || "",
        targetPlatforms: saved.targetPlatforms || "",
        campaignBudgetRange: saved.campaignBudgetRange || "",
      });
      toast.success("Campaign preferences saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save campaign preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerificationSave = async () => {
    setIsSaving(true);
    try {
      const saved = await brandsService.updateMe({
        verificationContactEmail: verification.contactEmail,
        verificationPhoneNumber: verification.phoneNumber,
      });
      setVerification((prev) => ({
        ...prev,
        contactEmail: saved.verificationContactEmail || '',
        phoneNumber: saved.verificationPhoneNumber || '',
      }));
      toast.success("Verification settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save verification settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationSave = async () => {
    setIsSaving(true);
    try {
      const saved = await usersService.updateNotificationPreferences(notifications);
      setNotifications(saved);
      toast.success("Notification preferences saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save notification preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const loadSubscriptions = useCallback(async () => {
    setSubscriptionsLoading(true);
    try {
      const data = await apiClient.get<SubscriptionRecord[]>("/api/v1/subscriptions");
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch {
      // silently fall back
    } finally {
      setSubscriptionsLoading(false);
    }
  }, []);

  const handlePasswordChange = async () => {
    if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
      toast.error("All password fields are required");
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
      await usersService.changePassword({ currentPassword: security.currentPassword, newPassword: security.newPassword });
      setSecurity((current) => ({ ...current, currentPassword: "", newPassword: "", confirmPassword: "" }));
      toast.success("Password updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update password");
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
      toast.error(error instanceof Error ? error.message : "Could not delete account");
      setIsSaving(false);
    }
  };

  const handleDocUpload = async (type: VerificationDocument['type'], file: File) => {
    setUploadingDocType(type);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileUrl = reader.result as string;
          const uploaded = await brandsService.submitVerificationDocument({ type, fileUrl, fileName: file.name });
          setVerificationDocs((prev) => [...prev.filter((d) => d.type !== type), uploaded]);
          toast.success(`${file.name} uploaded successfully`);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Upload failed');
        } finally {
          setUploadingDocType(null);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingDocType(null);
    }
  };

  const handleSubmitForReview = async () => {
    setIsSubmittingReview(true);
    try {
      await brandsService.submitForReview();
      toast.success('Submitted for review. Our team will verify within 2–3 business days.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    void loadBrandProfile();
    void loadNotificationPreferences();
    brandsService.getVerificationDocuments().then(setVerificationDocs).catch(() => {});
  }, [loadBrandProfile, loadNotificationPreferences]);

  useEffect(() => {
    if (activeTab === "subscriptions" && subscriptions.length === 0 && !subscriptionsLoading) {
      void loadSubscriptions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    const tab = searchParams.get("tab") as TabId | null;
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#f4f2e9]">
      {/* Hero */}
      <div className="bg-[#173b2a] px-4 pt-7 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#f0c56e]">
            <Settings className="size-3.5" />
            Account settings
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-7xl space-y-3 px-4 pb-24 sm:px-6 lg:px-8">
        {/* Tab strip */}
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-[#e8ede9] p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-all duration-200",
                activeTab === id
                  ? "bg-[#2d6b4e] text-white shadow-sm"
                  : "text-[#6b7c72] hover:text-[#2e5440]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Billing ── */}
        {activeTab === "billing" && (
          <div className="space-y-3">
            <SectionCard title="Current Plan" icon={CreditCard}>
              <div className="flex items-center justify-between rounded-[1.15rem] border border-[#c8e0d0] bg-[#eef6f1] px-4 py-3">
                <div>
                  <p className="text-sm font-extrabold text-[#185c39]">{billing.plan} Plan</p>
                  <p className="text-xs text-[#526259]">Unlimited creators · Priority support</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-lg border-[#d9e0d8] px-3 text-xs font-semibold text-[#526259] hover:bg-[#f4f2e9]"
                  onClick={() => toast.info("Plan changes are handled by ZingZing support.")}
                >
                  Upgrade
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Monthly Budget" description="Campaign spending ceiling" icon={CreditCard}>
              <div className="space-y-1.5">
                <Label className={labelCls}>Budget (PKR)</Label>
                <Input
                  type="number"
                  value={billing.monthlyBudget}
                  onChange={(e) => setBilling((b) => ({ ...b, monthlyBudget: e.target.value }))}
                  className={inputCls}
                />
                <p className="text-[11px] text-[#8fa098]">You&apos;ll be notified when you hit 80% of this limit.</p>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-[1.15rem] border border-[#e8ede8] bg-[#fbfaf5] px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-[#1a2e22]">Payment Methods</p>
                  <p className="text-[11px] text-[#8fa098]">Funding rails and invoices</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 rounded-lg border-[#d9e0d8] px-3 text-xs font-semibold text-[#526259] hover:bg-[#f4f2e9]" asChild>
                  <Link href="/brand/payments">Manage</Link>
                </Button>
              </div>

              <Button
                onClick={() => void handleBillingSave()}
                disabled={isSaving}
                className="mt-4 h-9 w-full rounded-xl bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#185c39] disabled:opacity-50"
              >
                {isSaving ? "Saving…" : <><Save className="mr-1.5 size-3.5" />Save Billing</>}
              </Button>
            </SectionCard>
          </div>
        )}

        {/* ── Subscriptions ── */}
        {activeTab === "subscriptions" && (
          <SectionCard title="Subscription History" description="Past and active platform subscriptions" icon={History}>
            {subscriptionsLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-[#8fa098]">
                <RefreshCw className="mr-2 size-4 animate-spin" />
                Loading subscriptions…
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="rounded-[1.15rem] border border-dashed border-[#d9e0d8] p-6 text-center">
                <History className="mx-auto size-8 text-[#b77a12] opacity-60" />
                <p className="mt-3 text-sm font-semibold text-[#526259]">No subscriptions yet</p>
                <p className="mt-1 text-[11px] text-[#8fa098]">Your plan history will appear here once you subscribe.</p>
                <Button asChild size="sm" className="mt-4 rounded-full bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#185c39]">
                  <Link href="/pricing">View Plans</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f4f0]">
                {subscriptions.map((sub) => {
                  const statusColor: Record<string, string> = {
                    ACTIVE: "bg-[#e7f0ea] text-[#185c39]",
                    CANCELLED: "bg-[#f9ebe8] text-[#9d3c36]",
                    EXPIRED: "bg-[#f0f0f0] text-[#6b7c72]",
                    TRIAL: "bg-[#fff1cd] text-[#8b5e12]",
                  };
                  const badge = statusColor[sub.status] ?? "bg-[#f0f0f0] text-[#526259]";
                  return (
                    <div key={sub.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-bold text-[#1a2e22]">{sub.packageTitle}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8fa098]">
                          <span className="capitalize">{sub.interval.toLowerCase()} · {sub.duration} {sub.interval.toLowerCase() === "monthly" ? "mo" : "yr"}</span>
                          <span>·</span>
                          <span>{sub.cyclesCompleted} cycle{sub.cyclesCompleted !== 1 ? "s" : ""} completed</span>
                          {sub.nextRenewalAt && sub.status === "ACTIVE" && (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <CalendarClock className="size-3" />
                                Renews {new Date(sub.nextRenewalAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </>
                          )}
                          {sub.cancelledAt && (
                            <>
                              <span>·</span>
                              <span>Cancelled {new Date(sub.cancelledAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold", badge)}>
                        {sub.status.charAt(0) + sub.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* ── Campaigns ── */}
        {activeTab === "campaigns" && (
          <SectionCard title="Campaign Preferences" description="Default targeting for faster offer setup" icon={Layers}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>Preferred Creator Categories</Label>
                <Input
                  value={campaignPreferences.preferredCreatorCategories}
                  onChange={(e) => setCampaignPreferences((p) => ({ ...p, preferredCreatorCategories: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Target Cities</Label>
                  <Input
                    value={campaignPreferences.targetCities}
                    onChange={(e) => setCampaignPreferences((p) => ({ ...p, targetCities: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Target Platforms</Label>
                  <Input
                    value={campaignPreferences.targetPlatforms}
                    onChange={(e) => setCampaignPreferences((p) => ({ ...p, targetPlatforms: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Campaign Budget Range</Label>
                <Input
                  value={campaignPreferences.campaignBudgetRange}
                  onChange={(e) => setCampaignPreferences((p) => ({ ...p, campaignBudgetRange: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <Button
                onClick={() => void handleCampaignPreferencesSave()}
                disabled={isSaving}
                className="h-9 w-full rounded-xl bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#185c39] disabled:opacity-50"
              >
                {isSaving ? "Saving…" : <><Save className="mr-1.5 size-3.5" />Save Preferences</>}
              </Button>
            </div>
          </SectionCard>
        )}

        {/* ── Verification ── */}
        {activeTab === "verification" && (
          <SectionCard title="Brand Verification" description="Keep legal and contact details current for trust badges" icon={ShieldCheck}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>Verification Status</Label>
                <div className={`flex h-9 items-center gap-2 rounded-xl border-2 px-3.5 text-sm font-bold ${
                  verification.businessStatus === 'VERIFIED'
                    ? 'border-[#bcd3c5] bg-[#eef6f1] text-[#185c39]'
                    : verification.businessStatus === 'PENDING'
                    ? 'border-[#efcf83] bg-[#fffbf0] text-[#8b5e12]'
                    : verification.businessStatus === 'REJECTED'
                    ? 'border-[#f5c2c2] bg-[#fff5f5] text-[#c13a3a]'
                    : 'border-[#d9e0d8] bg-[#f4f2e9] text-[#8fa098]'
                }`}>
                  {verification.businessStatus === 'VERIFIED' ? '✓ Verified' :
                   verification.businessStatus === 'PENDING' ? '⏳ Pending review' :
                   verification.businessStatus === 'REJECTED' ? '✗ Verification rejected — contact support' :
                   'Unverified'}
                </div>
                <p className="text-[11px] text-[#8fa098]">Managed by the ZingZing team. Contact support to start verification.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Contact Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8fa098]" />
                    <Input
                      value={verification.contactEmail}
                      onChange={(e) => setVerification((p) => ({ ...p, contactEmail: e.target.value }))}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8fa098]" />
                    <Input
                      value={verification.phoneNumber}
                      onChange={(e) => setVerification((p) => ({ ...p, phoneNumber: e.target.value }))}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-[1.15rem] border border-[#c8e0d0] bg-[#eef6f1] px-3.5 py-3 text-xs text-[#185c39]">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                <p><span className="font-bold">Verification badge</span> is shown to creators when your status is set to Verified.</p>
              </div>
              <Button
                onClick={() => void handleVerificationSave()}
                disabled={isSaving}
                className="h-9 w-full rounded-xl bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#185c39] disabled:opacity-50"
              >
                {isSaving ? "Saving…" : <><Save className="mr-1.5 size-3.5" />Save Verification</>}
              </Button>

              {/* Verification Checklist */}
              <div className="mt-6">
                <p className="mb-1 text-base font-extrabold text-[#173b2a]">Verification Checklist</p>
                <p className="mb-4 text-sm text-[#647168]">Upload the required documents to get verified. Our team reviews submissions within 2–3 business days.</p>
                <div className="space-y-3">
                  {([
                    { type: 'tax_id' as const, label: 'Tax ID / NTN Certificate', description: 'National Tax Number certificate or proof of registration with FBR.' },
                    { type: 'business_registration' as const, label: 'Business Registration', description: 'SECP certificate of incorporation or partnership deed.' },
                    { type: 'bank_details' as const, label: 'Bank Account Details', description: 'Cancelled cheque or bank statement showing account holder name and IBAN.' },
                  ] as const).map((item) => {
                    const doc = verificationDocs.find((d) => d.type === item.type);
                    return (
                      <div key={item.type} className="flex flex-col gap-3 rounded-2xl border border-[#d9e0d8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                            doc?.status === 'approved' ? 'bg-[#e7f0ea]' :
                            doc?.status === 'rejected' ? 'bg-red-50' :
                            doc?.status === 'pending' ? 'bg-[#fff1cd]' : 'bg-[#f4f2e9]'
                          }`}>
                            {doc?.status === 'approved' ? <FileCheck className="size-4 text-[#185c39]" /> :
                             doc?.status === 'rejected' ? <XCircle className="size-4 text-red-500" /> :
                             doc?.status === 'pending' ? <Clock className="size-4 text-[#8b5e12]" /> :
                             <Upload className="size-4 text-[#b77a12]" />}
                          </div>
                          <div>
                            <p className="font-extrabold text-[#173b2a]">{item.label}</p>
                            <p className="text-sm text-[#647168]">{item.description}</p>
                            {doc ? (
                              <p className="mt-1 text-xs font-bold">
                                {doc.status === 'approved' && <span className="text-[#185c39]">✓ Approved</span>}
                                {doc.status === 'pending' && <span className="text-[#8b5e12]">Under review — {doc.fileName}</span>}
                                {doc.status === 'rejected' && <span className="text-red-600">Rejected: {doc.rejectionReason ?? 'See email for details'}</span>}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                            uploadingDocType === item.type ? 'opacity-60' : 'hover:bg-[#f4f2e9]'
                          } ${doc?.status === 'approved' ? 'border-[#185c39] text-[#185c39]' : 'border-[#d9e0d8] text-[#173b2a]'}`}>
                            <Upload className="size-4" />
                            {uploadingDocType === item.type ? 'Uploading…' : doc ? 'Replace' : 'Upload'}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="sr-only"
                              disabled={uploadingDocType !== null}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handleDocUpload(item.type, file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {verificationDocs.length > 0 ? (
                  <div className="mt-4">
                    <Button
                      disabled={isSubmittingReview}
                      onClick={() => void handleSubmitForReview()}
                      className="rounded-full bg-[#185c39] text-white hover:bg-[#12462b]"
                    >
                      {isSubmittingReview ? 'Submitting…' : 'Submit for Review'}
                    </Button>
                    <p className="mt-2 text-xs text-[#9ba8a1]">Our team will review your documents within 2–3 business days.</p>
                  </div>
                ) : null}
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── Notifications ── */}
        {activeTab === "notifications" && (
          <div className="space-y-3">
            <SectionCard title="Email Notifications" icon={Bell}>
              <div className="divide-y divide-[#f0f4f0]">
                {[
                  { key: "messages", label: "New messages", desc: "When creators message you" },
                  { key: "newOrders", label: "Order updates", desc: "Campaign progress changes" },
                  { key: "reviews", label: "Creator responses", desc: "When creators respond to campaigns" },
                  { key: "marketing", label: "Marketing", desc: "Tips and promotional content" },
                  { key: "weeklyDigest", label: "Weekly report", desc: "Weekly campaign performance summary" },
                ].map((item) => (
                  <ToggleRow
                    key={item.key}
                    label={item.label}
                    desc={item.desc}
                    checked={notifications[item.key as keyof typeof notifications] as boolean}
                    onChange={(checked) => setNotifications((n) => ({ ...n, [item.key]: checked }))}
                  />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Notification Channels" icon={Bell}>
              <div className="divide-y divide-[#f0f4f0]">
                {[
                  { key: "pushNotifications", label: "Push notifications", desc: "On-device push" },
                  { key: "emailNotifications", label: "Email", desc: "Delivered to your inbox" },
                  { key: "smsNotifications", label: "SMS", desc: "Text message alerts" },
                ].map((item) => (
                  <ToggleRow
                    key={item.key}
                    label={item.label}
                    desc={item.desc}
                    checked={notifications[item.key as keyof typeof notifications] as boolean}
                    onChange={(checked) => setNotifications((n) => ({ ...n, [item.key]: checked }))}
                  />
                ))}
              </div>
              <Button
                onClick={() => void handleNotificationSave()}
                disabled={isSaving}
                className="mt-4 h-9 w-full rounded-xl bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#185c39] disabled:opacity-50"
              >
                {isSaving ? "Saving…" : <><Save className="mr-1.5 size-3.5" />Save Notifications</>}
              </Button>
            </SectionCard>
          </div>
        )}

        {/* ── Security ── */}
        {activeTab === "security" && (
          <div className="space-y-3">
            <SectionCard title="Change Password" icon={Lock}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Current Password</Label>
                  <Input
                    type="password"
                    value={security.currentPassword}
                    onChange={(e) => setSecurity((s) => ({ ...s, currentPassword: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>New Password</Label>
                    <Input
                      type="password"
                      value={security.newPassword}
                      onChange={(e) => setSecurity((s) => ({ ...s, newPassword: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity((s) => ({ ...s, confirmPassword: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => void handlePasswordChange()}
                  disabled={isSaving}
                  className="h-9 w-full rounded-xl bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#185c39] disabled:opacity-50"
                >
                  {isSaving ? "Updating…" : "Update Password"}
                </Button>
              </div>
            </SectionCard>

            <div className="grid gap-3 md:grid-cols-2">
              <SectionCard title="Two-Factor Authentication" icon={ShieldCheck}>
                <div className="flex items-center justify-between gap-3 rounded-[1.15rem] border border-[#e8ede8] bg-[#fbfaf5] px-3.5 py-3">
                  <div>
                    <p className="text-xs font-semibold text-[#1a2e22]">Status: Disabled</p>
                    <p className="text-[11px] text-[#8fa098]">Adds an extra layer of security</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 rounded-lg border-[#d9e0d8] px-3 text-xs font-semibold text-[#526259] hover:bg-[#f4f2e9]"
                    onClick={() => toast.info("Two-factor authentication for brand accounts is coming soon.")}
                  >
                    Coming soon
                  </Button>
                </div>
              </SectionCard>

              <SectionCard title="Team Members" description="Who has access to your account" icon={UserCircle2}>
                <div className="flex items-start gap-3 rounded-[1.15rem] border border-[#e8ede8] bg-[#fbfaf5] px-3.5 py-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-[#e7f0ea] text-xs font-bold text-[#185c39]">
                      <UserCircle2 className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1a2e22]">Team access is owner-managed</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-[#8fa098]">
                      Invite and removal controls are not enabled for this workspace yet. Contact ZingZing support for role changes.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Danger Zone" description="Irreversible account actions" icon={Lock} danger>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  type="password"
                  placeholder="Confirm with your password"
                  value={security.deleteConfirmPassword}
                  onChange={(e) => setSecurity((s) => ({ ...s, deleteConfirmPassword: e.target.value }))}
                  className="h-9 rounded-xl border-[#f5c2c2] bg-[#fff5f5] text-[#1a2e22] placeholder:text-[#c8a0a0] focus-visible:border-[#d94f4f] focus-visible:ring-2 focus-visible:ring-[#d94f4f]/15"
                />
                <Button
                  onClick={() => void handleDeleteAccount()}
                  disabled={isSaving}
                  className="h-9 shrink-0 rounded-xl bg-[#d94f4f] px-4 text-xs font-bold text-white hover:bg-[#c13a3a] disabled:opacity-50"
                >
                  Delete Account
                </Button>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrandSettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f2e9]" />}>
      <BrandSettingsPageContent />
    </Suspense>
  );
}
