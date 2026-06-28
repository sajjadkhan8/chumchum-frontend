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
  Upload,
  FileCheck,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { categoryOptions, normalizeCategories } from "@/lib/categories";
import { authService } from "@/services/auth.service";
import { brandsService, type VerificationDocument, type VerificationEvent } from "@/services/brands.service";
import { usersService } from "@/services/users.service";
import { uploadsService } from "@/services/uploads.service";
import { useAuthStore } from "@/store/auth-store";
import type { Brand, BrandVerificationStatus } from "@/types";
import { isPasswordStrong, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/password-validation";
import { toast } from "sonner";
import { brandVerificationStatusMeta } from "../brand-verification-status";

const TABS = [
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "campaigns", label: "Campaigns", icon: Layers },
  { id: "verification", label: "Verification", icon: CheckCircle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
] as const;

type TabId = typeof TABS[number]["id"];

const inputCls =
  "h-9 rounded-xl border-[#d9e0d8] bg-[#f4f2e9] text-[#1a2e22] placeholder:text-[#8fa098] focus-visible:border-[#2d6b4e] focus-visible:ring-2 focus-visible:ring-[#2d6b4e]/15 focus-visible:bg-white";
const labelCls = "text-xs font-bold text-[#526259]";
const requiredVerificationDocuments = [
  { type: "tax_id" as const, label: "Tax ID / NTN Certificate", description: "National Tax Number certificate or proof of registration with FBR." },
  { type: "business_registration" as const, label: "Business Registration", description: "SECP certificate of incorporation or partnership deed." },
  { type: "bank_details" as const, label: "Bank Account Details", description: "Cancelled cheque or bank statement showing account holder name and IBAN." },
] as const;
const verificationEventLabels: Record<string, string> = {
  DOCUMENT_UPLOADED: "Document uploaded",
  SUBMITTED_FOR_REVIEW: "Submitted for review",
  DOCUMENT_APPROVED: "Document approved",
  DOCUMENT_REJECTED: "Document rejected",
  VERIFICATION_APPROVED: "Verification approved",
  VERIFICATION_REJECTED: "Verification rejected",
};
type SavingAction = "billing" | "campaigns" | "verification" | "notifications" | "password" | "delete" | null;

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

function BrandSettingsPageContent() {
  const searchParams = useSearchParams();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("billing");
  const [savingAction, setSavingAction] = useState<SavingAction>(null);
  const [hasLoadedBrandProfile, setHasLoadedBrandProfile] = useState(false);
  const [brandProfileLoadError, setBrandProfileLoadError] = useState<string | null>(null);

  const [billing, setBilling] = useState<{ plan: Brand["planTier"]; monthlyBudget: string }>({ plan: "STARTER", monthlyBudget: "" });

  const [campaignPreferences, setCampaignPreferences] = useState({
    preferredCreatorCategories: "",
  });

  const [verification, setVerification] = useState({
    businessStatus: "unverified" as BrandVerificationStatus,
    contactEmail: "",
    phoneNumber: "",
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

  const [verificationDocs, setVerificationDocs] = useState<VerificationDocument[]>([]);
  const [verificationEvents, setVerificationEvents] = useState<VerificationEvent[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  const loadBrandProfile = useCallback(async () => {
    setBrandProfileLoadError(null);
    try {
      const brand = await brandsService.getMe();
      if (!brand) throw new Error("Brand profile not found");
      setBilling((current) => ({
        ...current,
        plan: brand.planTier || "STARTER",
        monthlyBudget: brand.monthlyBudget ? String(brand.monthlyBudget) : "",
      }));
      setCampaignPreferences({
        preferredCreatorCategories: normalizeCategories(brand.preferredCreatorCategories?.split(",")).join(", "),
      });
      setVerification({
        businessStatus: brand.businessVerificationStatus || "unverified",
        contactEmail: brand.verificationContactEmail || brand.contactEmail || "",
        phoneNumber: brand.verificationPhoneNumber || brand.contactPhone || "",
      });
      setHasLoadedBrandProfile(true);
    } catch (error) {
      setHasLoadedBrandProfile(false);
      setBrandProfileLoadError(error instanceof Error ? error.message : "Could not load brand profile");
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
    const monthlyBudget = Number(billing.monthlyBudget);
    if (billing.monthlyBudget.trim() && (!Number.isFinite(monthlyBudget) || monthlyBudget < 0)) {
      toast.error("Enter a valid monthly budget");
      return;
    }
    setSavingAction("billing");
    try {
      const saved = await brandsService.updateMe({ monthlyBudget: billing.monthlyBudget.trim() ? monthlyBudget : undefined });
      setBilling((current) => ({ ...current, monthlyBudget: saved.monthlyBudget ? String(saved.monthlyBudget) : "" }));
      toast.success("Billing settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save billing settings");
    } finally {
      setSavingAction(null);
    }
  };

  const handleCampaignPreferencesSave = async () => {
    const categories = normalizeCategories(campaignPreferences.preferredCreatorCategories.split(","));
    if (!hasLoadedBrandProfile && categories.length === 0) {
      toast.error("Load your brand profile or select campaign preferences before saving");
      return;
    }
    setSavingAction("campaigns");
    try {
      const saved = await brandsService.updateMe({
        ...campaignPreferences,
        preferredCreatorCategories: categories.join(", "),
      });
      setCampaignPreferences({
        preferredCreatorCategories: normalizeCategories(saved.preferredCreatorCategories?.split(",")).join(", "),
      });
      toast.success("Campaign preferences saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save campaign preferences");
    } finally {
      setSavingAction(null);
    }
  };

  const togglePreferredCreatorCategory = (category: string) => {
    setCampaignPreferences((current) => {
      const categories = normalizeCategories(current.preferredCreatorCategories.split(","));
      const nextCategories = categories.includes(category)
        ? categories.filter((item) => item !== category)
        : [...categories, category];

      return {
        ...current,
        preferredCreatorCategories: nextCategories.join(", "),
      };
    });
  };

  const handleVerificationSave = async () => {
    if (!hasLoadedBrandProfile) {
      toast.error("Load your brand profile before saving verification settings");
      return;
    }
    setSavingAction("verification");
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
      setSavingAction(null);
    }
  };

  const handleNotificationSave = async () => {
    setSavingAction("notifications");
    try {
      const saved = await usersService.updateNotificationPreferences(notifications);
      setNotifications(saved);
      toast.success("Notification preferences saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save notification preferences");
    } finally {
      setSavingAction(null);
    }
  };

  const handlePasswordChange = async () => {
    if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
      toast.error("All password fields are required");
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
    setSavingAction("password");
    try {
      await usersService.changePassword({ currentPassword: security.currentPassword, newPassword: security.newPassword });
      setSecurity((current) => ({ ...current, currentPassword: "", newPassword: "", confirmPassword: "" }));
      toast.success("Password updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update password");
    } finally {
      setSavingAction(null);
    }
  };

  const handleSendEmailVerification = async () => {
    try {
      await authService.sendEmailVerification();
      toast.success("Verification email sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send verification email");
    }
  };

  const handleDeleteAccount = async () => {
    if (!security.deleteConfirmPassword) {
      toast.error("Enter your password to delete your account");
      return;
    }
    const confirmed = window.confirm("Permanently delete your account? This cannot be undone.");
    if (!confirmed) return;
    setSavingAction("delete");
    try {
      await usersService.deleteAccount({ confirmPassword: security.deleteConfirmPassword });
      toast.success("Account deleted");
      await logout();
      window.location.assign("/signup");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete account");
      setSavingAction(null);
    }
  };

  const handleDocUpload = async (type: VerificationDocument['type'], file: File) => {
    setUploadingDocType(type);
    try {
      const stored = await uploadsService.verificationDocument(file);
      const uploaded = await brandsService.submitVerificationDocument({ type, fileUrl: stored.url, fileName: file.name });
      setVerificationDocs((prev) => [...prev.filter((d) => d.type !== type), uploaded]);
      brandsService.getVerificationEvents().then(setVerificationEvents).catch(() => undefined);
      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleSubmitForReview = async () => {
    const uploadedTypes = new Set(verificationDocs.map((doc) => doc.type));
    if (!requiredVerificationDocuments.every((item) => uploadedTypes.has(item.type))) {
      toast.error("Upload all required verification documents before submitting");
      return;
    }
    setIsSubmittingReview(true);
    try {
      await brandsService.submitForReview();
      setVerification((prev) => ({ ...prev, businessStatus: "under_review" }));
      brandsService.getVerificationEvents().then(setVerificationEvents).catch(() => undefined);
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
    brandsService.getVerificationDocuments().then(setVerificationDocs).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Could not load verification documents");
    });
    brandsService.getVerificationEvents().then(setVerificationEvents).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Could not load verification history");
    });
  }, [loadBrandProfile, loadNotificationPreferences]);

  useEffect(() => {
    const tab = searchParams.get("tab") as TabId | null;
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab);
  }, [searchParams]);

  const selectedPreferredCreatorCategories = normalizeCategories(campaignPreferences.preferredCreatorCategories.split(","));
  const planLabel = billing.plan ? billing.plan.charAt(0) + billing.plan.slice(1).toLowerCase() : "Starter";
  const hasAllVerificationDocs = requiredVerificationDocuments.every((item) =>
    verificationDocs.some((doc) => doc.type === item.type)
  );
  const formatVerificationEvent = (eventType: string) =>
    verificationEventLabels[eventType] || eventType.replaceAll("_", " ").toLowerCase().replace(/^\w/, (match) => match.toUpperCase());

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

        {brandProfileLoadError && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#efcf83] bg-[#fff9e8] p-4 text-sm text-[#6f4a0f] sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">{brandProfileLoadError}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadBrandProfile()}
              className="h-8 self-start rounded-lg border-[#efcf83] bg-white px-3 text-xs font-extrabold text-[#6f4a0f] hover:bg-[#fff3c7] sm:self-auto"
            >
              Retry
            </Button>
          </div>
        )}

        {/* ── Billing ── */}
        {activeTab === "billing" && (
          <div className="space-y-3">
            <SectionCard title="Current Plan" icon={CreditCard}>
              <div className="flex items-center justify-between rounded-[1.15rem] border border-[#c8e0d0] bg-[#eef6f1] px-4 py-3">
                <div>
                  <p className="text-sm font-extrabold text-[#185c39]">{planLabel} Plan</p>
                  <p className="text-xs text-[#526259]">Unlimited creators · Priority support</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-lg border-[#d9e0d8] px-3 text-xs font-semibold text-[#526259] hover:bg-[#f4f2e9]"
                  asChild
                >
                  <Link href="/pricing">Upgrade</Link>
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

              <Button
                onClick={() => void handleBillingSave()}
                disabled={savingAction === "billing"}
                className="mt-4 h-9 w-full rounded-xl bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#185c39] disabled:opacity-50"
              >
                {savingAction === "billing" ? "Saving…" : <><Save className="mr-1.5 size-3.5" />Save Billing</>}
              </Button>
            </SectionCard>
          </div>
        )}

        {/* ── Campaigns ── */}
        {activeTab === "campaigns" && (
          <SectionCard title="Campaign Preferences" description="Default targeting for faster offer setup" icon={Layers}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>Preferred Creator Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((category) => {
                    const isSelected = selectedPreferredCreatorCategories.includes(category.value);

                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => togglePreferredCreatorCategory(category.value)}
                        className={cn(
                          "rounded-full border-2 px-4 py-2 text-sm transition-all",
                          isSelected
                            ? "border-[#2d6b4e] bg-[#e4f1e8] font-bold text-[#1e5c3e]"
                            : "border-[#d1ddd6] bg-white font-semibold text-[#496159] hover:border-[#b0c5ba]"
                        )}
                      >
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button
                onClick={() => void handleCampaignPreferencesSave()}
                disabled={savingAction === "campaigns"}
                className="h-9 w-full rounded-xl bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#185c39] disabled:opacity-50"
              >
                {savingAction === "campaigns" ? "Saving…" : <><Save className="mr-1.5 size-3.5" />Save Preferences</>}
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
                <div className={`flex h-9 items-center gap-2 rounded-xl border-2 px-3.5 text-sm font-bold ${brandVerificationStatusMeta[verification.businessStatus].className}`}>
                  {brandVerificationStatusMeta[verification.businessStatus].label}
                </div>
                <p className="text-[11px] text-[#8fa098]">Upload documents below and submit them for team review.</p>
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
                disabled={savingAction === "verification"}
                className="h-9 w-full rounded-xl bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#185c39] disabled:opacity-50"
              >
                {savingAction === "verification" ? "Saving…" : <><Save className="mr-1.5 size-3.5" />Save Verification</>}
              </Button>

              {/* Verification Checklist */}
              <div className="mt-6">
                <p className="mb-1 text-base font-extrabold text-[#173b2a]">Verification Checklist</p>
                <p className="mb-4 text-sm text-[#647168]">Upload the required documents to get verified. Our team reviews submissions within 2–3 business days.</p>
                <div className="space-y-3">
                  {requiredVerificationDocuments.map((item) => {
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
                      disabled={isSubmittingReview || !hasAllVerificationDocs}
                      onClick={() => void handleSubmitForReview()}
                      className="rounded-full bg-[#185c39] text-white hover:bg-[#12462b]"
                    >
                      {isSubmittingReview ? 'Submitting…' : 'Submit for Review'}
                    </Button>
                    <p className="mt-2 text-xs text-[#9ba8a1]">Our team will review your documents within 2–3 business days.</p>
                  </div>
                ) : null}
                {verificationEvents.length > 0 ? (
                  <div className="mt-5 rounded-2xl border border-[#d9e0d8] bg-[#fbfaf5] p-4">
                    <p className="text-sm font-extrabold text-[#173b2a]">Verification History</p>
                    <div className="mt-3 space-y-2">
                      {verificationEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="flex items-start justify-between gap-3 text-xs">
                          <div>
                            <p className="font-bold text-[#173b2a]">{formatVerificationEvent(event.eventType)}</p>
                            {event.details ? <p className="text-[#647168]">{event.details}</p> : null}
                          </div>
                          <span className="shrink-0 text-[#9ba8a1]">
                            {new Date(event.createdAt).toLocaleDateString('en-PK')}
                          </span>
                        </div>
                      ))}
                    </div>
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
            </SectionCard>
            <Button
              onClick={() => void handleNotificationSave()}
              disabled={savingAction === "notifications"}
              className="h-9 w-full rounded-xl bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#185c39] disabled:opacity-50"
            >
              {savingAction === "notifications" ? "Saving…" : <><Save className="mr-1.5 size-3.5" />Save Notifications</>}
            </Button>
          </div>
        )}

        {/* ── Security ── */}
        {activeTab === "security" && (
          <div className="space-y-3">
            <SectionCard title="Change Password" icon={Lock}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-[1.15rem] border border-[#e8ede8] bg-[#fbfaf5] px-3.5 py-3">
                  <div>
                    <p className="text-xs font-semibold text-[#1a2e22]">
                      Email: {user?.emailVerified ? "Verified" : "Not verified"}
                    </p>
                    <p className="text-[11px] text-[#8fa098]">{user?.email ?? "Account email"}</p>
                  </div>
                  {!user?.emailVerified && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 rounded-lg border-[#d9e0d8] px-3 text-xs font-semibold text-[#2d6b4e] hover:bg-[#f4f2e9]"
                      onClick={() => void handleSendEmailVerification()}
                    >
                      Send email
                    </Button>
                  )}
                </div>
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
                  disabled={savingAction === "password"}
                  className="h-9 w-full rounded-xl bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#185c39] disabled:opacity-50"
                >
                  {savingAction === "password" ? "Updating…" : "Update Password"}
                </Button>
              </div>
            </SectionCard>

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
                  disabled={savingAction === "delete"}
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
