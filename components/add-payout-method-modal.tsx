"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type PayoutMethodType } from "@/services/earnings.service";

const logoUrlForDomain = (domain: string) =>
  `https://logo.clearbit.com/${domain}`;

const faviconUrlForDomain = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

export const PAYOUT_METHOD_LOGOS: Record<
  string,
  { label: string; domain?: string; fallback: string }
> = {
  JAZZCASH: {
    label: "JazzCash",
    domain: "jazzcash.com.pk",
    fallback: "JC",
  },
  EASYPAISA: {
    label: "Easypaisa",
    domain: "easypaisa.com.pk",
    fallback: "EP",
  },
  BANK_TRANSFER: {
    label: "Bank Transfer",
    fallback: "PK",
  },
};

export const PAKISTANI_BANKS = [
  { value: "meezan", label: "Meezan Bank", domain: "meezanbank.com", fallback: "MB" },
  { value: "hbl", label: "HBL (Habib Bank Limited)", domain: "hbl.com", fallback: "HBL" },
  { value: "ubl", label: "UBL (United Bank Limited)", domain: "ubl.com.pk", fallback: "UBL" },
  { value: "mcb", label: "MCB Bank", domain: "mcb.com.pk", fallback: "MCB" },
  { value: "alfalah", label: "Bank Alfalah", domain: "bankalfalah.com", fallback: "BA" },
  { value: "nbp", label: "NBP (National Bank of Pakistan)", domain: "nbp.com.pk", fallback: "NBP" },
  { value: "abl", label: "ABL (Allied Bank Limited)", domain: "abl.com", fallback: "ABL" },
  { value: "faysal", label: "Faysal Bank", domain: "faysalbank.com", fallback: "FBL" },
  { value: "standard_chartered", label: "Standard Chartered Pakistan", domain: "sc.com", fallback: "SC" },
  { value: "habib_metro", label: "HabibMetro Bank", domain: "habibmetro.com", fallback: "HM" },
  { value: "bank_al_habib", label: "Bank AL Habib", domain: "bankalhabib.com", fallback: "BAH" },
  { value: "askari", label: "Askari Bank", domain: "askaribank.com", fallback: "AKBL" },
  { value: "js", label: "JS Bank", domain: "jsbl.com", fallback: "JS" },
  { value: "soneri", label: "Soneri Bank", domain: "soneribank.com", fallback: "SB" },
  { value: "silk", label: "Silkbank", domain: "silkbank.com.pk", fallback: "SB" },
  { value: "summit", label: "Summit Bank", domain: "summitbank.com.pk", fallback: "SMB" },
  { value: "samba", label: "Samba Bank", domain: "samba.com.pk", fallback: "SAM" },
  { value: "albaraka", label: "Al Baraka Bank Pakistan", domain: "albaraka.com.pk", fallback: "AB" },
  { value: "dubai_islamic", label: "Dubai Islamic Bank Pakistan", domain: "dibpak.com", fallback: "DIB" },
  { value: "bankislami", label: "BankIslami", domain: "bankislami.com.pk", fallback: "BI" },
  { value: "ztbl", label: "ZTBL (Zarai Taraqiati Bank Limited)", domain: "ztbl.com.pk", fallback: "ZTBL" },
  { value: "khushhali", label: "Khushhali Microfinance Bank", domain: "khushhalibank.com.pk", fallback: "KMBL" },
  { value: "mobilink_microfinance", label: "Mobilink Microfinance Bank", domain: "mobilinkbank.com", fallback: "MMBL" },
  { value: "telenor_microfinance", label: "Telenor Microfinance Bank", domain: "telenorbank.pk", fallback: "TMB" },
];

export function BrandLogo({
  alt,
  domain,
  fallback,
}: {
  alt: string;
  domain?: string;
  fallback: string;
}) {
  const [source, setSource] = useState<"logo" | "favicon" | "initials">(
    domain ? "logo" : "initials"
  );

  if (!domain || source === "initials") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
        {fallback}
      </span>
    );
  }

  return (
    <img
      src={
        source === "logo" ? logoUrlForDomain(domain) : faviconUrlForDomain(domain)
      }
      alt={alt}
      className="h-6 w-6 shrink-0 rounded bg-white object-contain p-0.5"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setSource(source === "logo" ? "favicon" : "initials")}
    />
  );
}

interface AddPayoutMethodModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMethod: (method: {
    type: PayoutMethodType;
    name: string;
    accountDetails: string;
    bankName?: string;
  }) => Promise<void>;
  isLoading?: boolean;
  triggerButtonVariant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "ghost"
    | "link";
  showTriggerButton?: boolean;
}

export function AddPayoutMethodModal({
  isOpen,
  onOpenChange,
  onAddMethod,
  isLoading = false,
  triggerButtonVariant = "default",
  showTriggerButton = true,
}: AddPayoutMethodModalProps) {
  const [methodType, setMethodType] = useState<PayoutMethodType>(
    "BANK_TRANSFER"
  );
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountDetails, setAccountDetails] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState<"iban" | "number">("iban");

  const resetForm = () => {
    setMethodType("BANK_TRANSFER");
    setAccountHolderName("");
    setAccountDetails("");
    setBankName("");
    setAccountType("iban");
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    const validation = validateForm();
    if (validation) {
      toast.error(validation);
      return;
    }

    try {
      await onAddMethod({
        type: methodType,
        name: accountHolderName,
        accountDetails,
        bankName: methodType === "BANK_TRANSFER" ? bankName : undefined,
      });
      handleClose(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add payout method";
      toast.error(message);
    }
  };

  const validateForm = (): string | null => {
    if (!accountHolderName.trim()) {
      return "Account holder name is required";
    }
    if (!accountDetails.trim()) {
      return "Account details are required";
    }
    if (methodType === "BANK_TRANSFER" && !bankName) {
      return "Please select a bank";
    }

    const normalizedType = String(methodType).toUpperCase();

    if (normalizedType === "BANK_TRANSFER") {
      if (accountType === "iban") {
        if (!/^PK\d{2}[A-Z0-9]{20,30}$/i.test(accountDetails.trim())) {
          return "Use a valid Pakistani IBAN (example: PK36ABCD0123456789012345)";
        }
      } else {
        if (!/^\d{16,18}$/.test(accountDetails.trim())) {
          return "Bank account number should be 16-18 digits";
        }
      }
    } else {
      if (!/^\+?\d{10,15}$/.test(accountDetails.replaceAll("-", ""))) {
        return "Use a valid wallet number (10 to 15 digits)";
      }
    }

    return null;
  };

  const isBankTransfer = methodType === "BANK_TRANSFER";
  const selectedMethod = PAYOUT_METHOD_LOGOS[methodType];
  const selectedBank = PAKISTANI_BANKS.find((bank) => bank.value === bankName);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {showTriggerButton && (
        <DialogTrigger asChild>
          <Button size="sm" variant={triggerButtonVariant}>
            <Plus className="mr-2 h-4 w-4" />
            Add Method
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payout Method</DialogTitle>
          <DialogDescription>
            Add a new payout method to receive your earnings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Payment Method Type */}
          <div className="space-y-2">
            <Label>Payment Method Type *</Label>
            <Select
              value={methodType}
              onValueChange={(v) => {
                setMethodType(v as PayoutMethodType);
                setAccountDetails("");
                setBankName("");
              }}
            >
              <SelectTrigger>
                {selectedMethod ? (
                  <div className="flex items-center gap-2">
                    <BrandLogo
                      alt={`${selectedMethod.label} logo`}
                      domain={selectedMethod.domain}
                      fallback={selectedMethod.fallback}
                    />
                    <span>{selectedMethod.label}</span>
                  </div>
                ) : (
                  <SelectValue />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JAZZCASH">
                  <div className="flex items-center gap-2">
                    <BrandLogo
                      alt="JazzCash logo"
                      domain={PAYOUT_METHOD_LOGOS.JAZZCASH.domain}
                      fallback={PAYOUT_METHOD_LOGOS.JAZZCASH.fallback}
                    />
                    <span>JazzCash</span>
                  </div>
                </SelectItem>
                <SelectItem value="EASYPAISA">
                  <div className="flex items-center gap-2">
                    <BrandLogo
                      alt="Easypaisa logo"
                      domain={PAYOUT_METHOD_LOGOS.EASYPAISA.domain}
                      fallback={PAYOUT_METHOD_LOGOS.EASYPAISA.fallback}
                    />
                    <span>Easypaisa</span>
                  </div>
                </SelectItem>
                <SelectItem value="BANK_TRANSFER">
                  <div className="flex items-center gap-2">
                    <BrandLogo
                      alt="Bank transfer icon"
                      fallback={PAYOUT_METHOD_LOGOS.BANK_TRANSFER.fallback}
                    />
                    <span>Bank Transfer</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Selection (Only for Bank Transfer) */}
          {isBankTransfer && (
            <div className="space-y-2">
              <Label>Select Bank *</Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger>
                  {selectedBank ? (
                    <div className="flex items-center gap-2">
                      <BrandLogo
                        alt={`${selectedBank.label} logo`}
                        domain={selectedBank.domain}
                        fallback={selectedBank.fallback}
                      />
                      <span>{selectedBank.label}</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Choose your bank" />
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {PAKISTANI_BANKS.map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      <div className="flex items-center gap-2">
                        <BrandLogo
                          alt={`${bank.label} logo`}
                          domain={bank.domain}
                          fallback={bank.fallback}
                        />
                        <span>{bank.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Account Holder Name */}
          <div className="space-y-2">
            <Label>Account Holder Name *</Label>
            <Input
              placeholder="Full name (exactly as shown in bank records)"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
            />
          </div>

          {/* Account Details */}
          {isBankTransfer ? (
            <div className="space-y-3">
              {/* Account Type Toggle */}
              <div className="space-y-2">
                <Label>Account Type *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={accountType === "iban" ? "default" : "outline"}
                    onClick={() => {
                      setAccountType("iban");
                      setAccountDetails("");
                    }}
                    className="w-full"
                  >
                    IBAN (Preferred)
                  </Button>
                  <Button
                    type="button"
                    variant={accountType === "number" ? "default" : "outline"}
                    onClick={() => {
                      setAccountType("number");
                      setAccountDetails("");
                    }}
                    className="w-full"
                  >
                    Account Number
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  {accountType === "iban" ? "IBAN Number" : "Account Number"} *
                </Label>
                <Input
                  placeholder={
                    accountType === "iban"
                      ? "PK36ABCD0123456789012345"
                      : "Account number (16-18 digits)"
                  }
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Mobile/Wallet Number *</Label>
              <Input
                placeholder="03001234567 or +923001234567"
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Method"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

