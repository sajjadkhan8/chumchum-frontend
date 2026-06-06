# Payment Settings - Quick Reference

## 📍 Location
- **URL**: `/creator/payments`
- **File**: `app/creator/payments/page.tsx`

## 🎯 Key Features at a Glance

### Tab 1: Payout Methods
```
┌─────────────────────────────────┐
│ Connected Methods               │
├─────────────────────────────────┤
│ 📱 JazzCash (Default)           │
│ 0312-3456789 · Instant payout   │
│                                 │
│ [Expand to edit/remove]         │
└─────────────────────────────────┘
```

### Tab 2: Schedule & Preferences
```
Withdrawal Schedule:
  • Manual — withdraw anytime ✓
  • Weekly — every Monday
  • Bi-weekly
  • Monthly — 1st of month

Minimum Threshold:
  • PKR 1,000
  • PKR 2,500
  • PKR 5,000 ✓
  • PKR 10,000

Tax & Compliance:
  • CNIC Last 4 Digits
  • NTN (Optional)

Preferences:
  • Instant withdrawal [Toggle]
  • Earnings notifications [Toggle]
  • Weekly digest [Toggle]
```

### Tab 3: History
```
Recent Transactions:
• ✅ JazzCash withdrawal - +PKR 22,000
• ⏳ Pending clearance - PKR 14,000
• ✅ Meezan Bank IBFT - +PKR 35,000
• ❌ Dispute held - PKR 8,500
```

## 💰 Earnings Overview
```
Available to Withdraw: PKR 47,200 (green)
Pending Clearance: PKR 14,000 (amber)
Total Earned: PKR 1,86,500
Total Withdrawn: PKR 45,200
Platform Fees: -PKR 2,500 (red)
```

## 🔧 Supported Payment Methods

| Method | Icon | Speed | Supported |
|--------|------|-------|-----------|
| JazzCash | 📱 | Instant | ✓ |
| Easypaisa | 📱 | Instant | ✓ |
| SadaPay | 📱 | Instant | ✓ |
| NayaPay | 📱 | Instant | ✓ |
| Bank Transfer (IBFT) | 🏦 | 1-2 days | ✓ |

## 📝 Account Details Format

### Mobile Wallets
```
Format: 03XX-XXXXXXX or +923XX-XXXXXXX
Example: 0312-3456789
```

### Bank Transfer  
```
Format: PKXX[20-30 alphanumeric]
Example: PK36MEZN0001200001234567
Bank: Meezan, HBL, UBL, MCB, Alfalah, NBP
```

## 🎯 Tax Information

### FBR Withholding Tax (WHT)
- **Filers** (with NTN): 10% WHT
- **Non-Filers** (without NTN): 15% WHT
- **Savings**: 5% by adding NTN

### CNIC & NTN
- **CNIC**: Last 4 digits (required)
- **NTN**: Optional but recommended

## ⚡ Actions & Shortcuts

| Action | Steps |
|--------|-------|
| Add Method | Settings → "Add" button → Select Type → Enter Details → Save |
| Set Default | Expand Method → "Set as Default" |
| Remove Method | Expand Method → "Remove" → Confirm |
| Update Schedule | Schedule tab → Select → Save Preferences |
| View History | History tab → Scroll through transactions |
| Copy IBAN | History tab → Copy button near account number |

## 🚀 Common Workflows

### First Time Setup (Creator)
1. Navigate to Settings → Payment Settings
2. Click "Add Payout Method"
3. Select payment method type
4. Enter account holder name
5. Enter account/wallet details
6. Verify details are correct
7. Click "Add Method"
8. Set as Default (auto-selected if first method)
9. Fill in Tax & Compliance info
10. Save Preferences

### Updating Payout Details  
1. Go to Payment Settings
2. Click on payout method to expand
3. Review current details
4. Remove old method
5. Add new method with updated details
6. Set as default if needed

### Scheduling Automatic Payouts
1. Go to Schedule & Preferences tab
2. Change "Withdrawal Schedule" from "Manual"
3. Select preferred schedule (Weekly/Monthly)
4. Set minimum threshold
5. Save Preferences
6. Future payouts will auto-process

## ✅ Validation Rules

| Field | Validation |
|-------|-----------|
| Mobile Wallet | 10-15 digits, +92 or 0 prefix |
| IBAN | PK + 34 chars, exact format |
| CNIC | Last 4 digits only |
| NTN | Optional, numeric |
| Account Name | Free text field |

## 🔒 Security Notes

- Account details are **masked** (first 3 + last 4 chars shown)
- Confirmation required for **deleting methods**
- Only authenticated creators can view/edit
- All data encrypted in transit (HTTPS)
- No credentials stored locally

## 📊 Fee Structure

- Platform takes 5-10% commission on earnings
- WHT deducted at source (10-15%)
- No additional fees for withdrawals
- Instant methods may have daily limits
- Bank transfers standard 1-2 business days

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| Method won't save | Verify IBAN format or phone number |
| Missing NTN field | It's optional; skip if you don't have it |
| Can't delete method | Must have another method set as default first |
| Payment delayed | Check "Pending Clearance" - clears 3-5 days |
| Dispute blocking funds | Contact support; resolves when dispute closed |

## 📞 Support Channels

- Email: support@chamcham.com
- Help Center: /creator/help
- In-app Chat: Messages section
- Status: Payment methods available 24/7

## 🔄 Related Pages

- **Earnings**: `/creator/earnings` - View transaction history
- **Account Settings**: `/creator/settings` - Update profile
- **Help Center**: `/creator/help` - Support & FAQ
- **Performance**: `/creator/performance` - Analytics & insights

