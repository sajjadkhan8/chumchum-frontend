# Payment Settings - API Integration Guide for Backend

## 📋 API Endpoints Required

### 1. Earnings Summary Endpoint
```http
GET /api/v1/earnings/summary
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "totalEarned": 186500,
  "availableBalance": 47200,
  "pendingBalance": 14000,
  "totalWithdrawn": 45200,
  "platformFees": 2500
}
```

**Error Response (401/403):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

### 2. Get All Payout Methods
```http
GET /api/v1/payout-methods
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "id": "pm_123abc",
    "type": "JAZZCASH",
    "name": "My JazzCash Account",
    "accountDetails": "03123456789",
    "isDefault": true,
    "createdAt": "2026-05-15T10:30:00Z"
  },
  {
    "id": "pm_456def",
    "type": "BANK_TRANSFER",
    "name": "Meezan Bank",
    "accountDetails": "PK36MEZN0001200001234567",
    "isDefault": false,
    "createdAt": "2026-06-01T14:45:00Z"
  }
]
```

---

### 3. Create Payout Method
```http
POST /api/v1/payout-methods
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "JAZZCASH",
  "name": "My JazzCash Account",
  "accountDetails": "03123456789",
  "isDefault": false
}
```

**Payment Method Types:**
- `JAZZCASH` - Mobile wallet
- `EASYPAISA` - Mobile wallet
- `SADAPAY` - Mobile wallet
- `NAYAPAY` - Mobile wallet
- `BANK_TRANSFER` - IBAN-based

**Response (201 Created):**
```json
{
  "id": "pm_new789",
  "type": "JAZZCASH",
  "name": "My JazzCash Account",
  "accountDetails": "03123456789",
  "isDefault": false,
  "createdAt": "2026-06-06T12:00:00Z"
}
```

**Validation Errors (400):**
```json
{
  "success": false,
  "error": "Invalid IBAN format",
  "field": "accountDetails"
}
```

---

### 4. Update Payout Method
```http
PATCH /api/v1/payout-methods/{methodId}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body (partial update):**
```json
{
  "name": "Updated JazzCash Account",
  "accountDetails": "03129876543",
  "isDefault": true
}
```

**Response (200 OK):**
```json
{
  "id": "pm_123abc",
  "type": "JAZZCASH",
  "name": "Updated JazzCash Account",
  "accountDetails": "03129876543",
  "isDefault": true,
  "createdAt": "2026-05-15T10:30:00Z"
}
```

**When Setting as Default:**
- Previously default method should be updated to `isDefault: false`
- Only ONE method can be default at a time
- If updating isDefault to true, all other methods become false

---

### 5. Delete Payout Method
```http
DELETE /api/v1/payout-methods/{methodId}
Authorization: Bearer {token}
```

**Validation Rules:**
- Cannot delete the only remaining method
- If deleting default method, next method becomes default
- User must have at least ONE payout method

**Response (204 No Content):**
```
(Empty body)
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Cannot delete the only remaining payout method"
}
```

---

### 6. Get Withdrawal History
```http
GET /api/v1/earnings/withdrawals?page=0&limit=100
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "withdrawals": [
    {
      "id": "wd_001",
      "amount": 22000,
      "status": "completed",
      "payoutMethodId": "pm_123abc",
      "processedAt": "2026-06-03T09:15:00Z",
      "createdAt": "2026-06-03T08:00:00Z"
    },
    {
      "id": "wd_002",
      "amount": 14000,
      "status": "pending",
      "payoutMethodId": "pm_456def",
      "processedAt": null,
      "createdAt": "2026-06-04T16:30:00Z"
    }
  ],
  "total": 2,
  "page": 0,
  "limit": 100
}
```

**Withdrawal Status Types:**
- `pending` - Awaiting processing
- `processing` - Currently processing
- `completed` - Successfully withdrawn
- `failed` - Withdrawal failed

---

### 7. Get Creator Payout Preferences
```http
GET /api/v1/creators/me/payout-preferences
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "autoWithdrawEnabled": false,
  "payoutSchedule": "manual",
  "minimumPayoutAmount": 5000,
  "accountHolderName": "Sajjad Hussain",
  "ntnNumber": "123456-7890123-1",
  "cnicLast4": "1234"
}
```

**Payout Schedule Options:**
- `manual` - Withdraw anytime
- `weekly` - Every Monday
- `biweekly` - Every two weeks
- `monthly` - 1st of month

---

### 8. Update Creator Payout Preferences
```http
PATCH /api/v1/creators/me/payout-preferences
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "autoWithdrawEnabled": true,
  "payoutSchedule": "weekly",
  "minimumPayoutAmount": 10000,
  "accountHolderName": "Sajjad Hussain",
  "ntnNumber": "123456-7890123-1",
  "cnicLast4": "1234"
}
```

**Validation Rules:**
- minimumPayoutAmount: 1000 - 1000000
- payoutSchedule: One of [manual, weekly, biweekly, monthly]
- cnicLast4: Must be exactly 4 digits if provided
- ntnNumber: Optional, numeric format

**Response (200 OK):**
```json
{
  "autoWithdrawEnabled": true,
  "payoutSchedule": "weekly",
  "minimumPayoutAmount": 10000,
  "accountHolderName": "Sajjad Hussain",
  "ntnNumber": "123456-7890123-1",
  "cnicLast4": "1234"
}
```

---

## 🔐 Authentication & Authorization

All endpoints require:
- Valid Bearer token in Authorization header
- Creator role (not brand, not admin)
- Must be accessing own data (no cross-user access)

**Example Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ Validation Rules

### Mobile Wallet Numbers
```regex
"type": "JAZZCASH|EASYPAISA|SADAPAY|NAYAPAY"
"accountDetails": "^(\+92|0)[0-9]{10}$" (10-15 digits total)
```

### Bank Transfer IBAN
```regex
"type": "BANK_TRANSFER"
"accountDetails": "^PK\d{2}[A-Z0-9]{20,30}$"
```

### Tax Information
```
"cnicLast4": "^\d{4}$" or null (exactly 4 digits)
"ntnNumber": "^\d+-\d+-\d+$" or null (e.g., 123456-7890123-1)
```

---

## 💳 Payout Method Type Details

### JAZZCASH
- Provider: Jazz (Pakistan Telecom)
- Format: 03xx-xxxxxxx
- Limit: Daily PKR 25,000
- Settlement: Immediate
- Fees: None

### EASYPAISA
- Provider: Telenor
- Format: 03xx-xxxxxxx  
- Limit: Daily PKR 20,000
- Settlement: 5-10 minutes
- Fees: Standard (varies)

### SADAPAY
- Provider: SadaPay
- Format: 03xx-xxxxxxx
- Limit: Daily limit as per SadaPay
- Settlement: Immediate
- Fees: None

### NAYAPAY
- Provider: NayaPay
- Format: 03xx-xxxxxxx
- Limit: Daily as per NayaPay
- Settlement: Immediate
- Fees: Minimal

### BANK_TRANSFER
- Format: PK36ABCD0123456789012345 (IBAN)
- Settlement: 1-2 business days
- Fees: Standard bank fees
- Banks Supported: HBL, UBL, MCB, Meezan, Alfalah, NBP, Faysal, etc.

---

## 📊 Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "fieldName",
    "reason": "Additional validation info"
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - Deleted
- `400` - Bad request / Validation error
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (e.g., duplicate)
- `500` - Server error

---

## 🔄 Business Logic Notes

### Auto-Withdrawal Process
1. Check if `autoWithdrawEnabled` is true
2. Check if available balance meets `minimumPayoutAmount`
3. On scheduled time, create withdrawal request
4. Use default payout method (`isDefault: true`)
5. Process after 3-5 days clearing period
6. Calculate WHT tax (10% filers, 15% non-filers)

### Tax Calculation
```
subtotal = withdrawal_amount
wht_rate = (ntnNumber ? 0.10 : 0.15)
wht_amount = subtotal * wht_rate
net_amount = subtotal - wht_amount
```

### Default Method Selection
- When creating first method: Automatically set as default
- When changing default: Update isDefault for both old and new
- When deleting default: Next method becomes default
- Cannot have zero default methods

---

## 🧪 Testing Scenarios

### Test Case 1: Create Method & Set Default
```
POST /payout-methods → {type: JAZZCASH, ...}
PATCH /payout-methods/{id} → {isDefault: true}
GET /payout-methods → Verify isDefault flags
```

### Test Case 2: Delete Method with Fallback
```
GET /payout-methods → Multiple methods
DELETE /payout-methods/{default-id}
GET /payout-methods → Next should be default
```

### Test Case 3: Auto-Withdrawal Scheduling
```
PATCH /preferences → {autoWithdrawEnabled: true, payoutSchedule: weekly}
Wait for scheduled time → Withdrawal should auto-process
GET /withdrawals → Verify status changes
```

---

## 📈 Performance Considerations

- Index on `userId` and `createdAt` for fast queries
- Paginate withdrawal history (default 100 per page)
- Cache payout preferences in memory
- Use database transactions for default method updates
- Consider rate limiting on withdrawal creation

---

## 🔐 Security Checklist

- [x] All endpoints require authentication
- [x] Validate all incoming data
- [x] Sanitize sensitive data (account numbers)
- [x] Log all payout method modifications
- [x] Verify creator owns the data being modified
- [x] Hash/encrypt account details at rest
- [x] Use HTTPS for all transmission
- [x] Implement CORS properly
- [x] Rate limit API endpoints
- [x] Audit trail for changes

---

## 📝 Logging Recommendations

Log the following events:
```
- Payout method created: {userId, methodType, timestamp}
- Payout method updated: {userId, methodId, changes, timestamp}
- Payout method deleted: {userId, methodId, timestamp}
- Preference updated: {userId, changes, timestamp}
- Withdrawal processed: {userId, amount, method, status, timestamp}
- Failed withdrawal: {userId, amount, method, reason, timestamp}
```

---

## 🚀 Database Schema Suggestions

```sql
-- Payout Methods Table
CREATE TABLE payout_methods (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES creators(id),
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  account_details TEXT NOT NULL (encrypted),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP NULL,
  CONSTRAINT unique_default PER creator_id
);

-- Payout Preferences Table
CREATE TABLE payout_preferences (
  creator_id UUID PRIMARY KEY REFERENCES creators(id),
  auto_withdraw_enabled BOOLEAN DEFAULT false,
  payout_schedule VARCHAR(50) DEFAULT 'manual',
  minimum_payout_amount INTEGER DEFAULT 5000,
  account_holder_name VARCHAR(255),
  ntn_number VARCHAR(20),
  cnic_last4 CHAR(4),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Withdrawal Requests Table
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES creators(id),
  payout_method_id UUID NOT NULL REFERENCES payout_methods(id),
  amount INTEGER NOT NULL,
  status VARCHAR(50),
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT amount_positive CHECK (amount > 0)
);
```

