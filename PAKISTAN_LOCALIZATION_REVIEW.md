# Pakistan Localization Review

Date: May 30, 2026

## Completed Market Localization

- Currency formatting switched to PKR.
- Pakistan city defaults replaced across filters, creator data, and brand data.
- Phone flow localized to +92 and Pakistani mobile validation.
- Ambassador verification wording updated from Pakistan ID/CNIC to CNIC and tax profile checks.
- Major Pakistan-facing marketing copy replaced with Pakistan-focused copy.
- Legal and privacy pages updated to Pakistan jurisdiction and contact domains.

## Compliance Items Requiring Legal Sign-off

The following sections were localized but still require Pakistan legal counsel review before production launch:

1. `app/terms/page.tsx`
   - Governing law and jurisdiction text (currently set to Karachi, Pakistan).
   - Liability cap amount in PKR.
   - Tax references (GST/FBR/withholding tax).

2. `app/privacy/page.tsx`
   - Data transfer and protection wording.
   - Rights handling timelines and legal basis language.

3. Payment + taxation implementation
   - Ensure backend calculations for GST/withholding tax align with applicable rules.
   - Verify invoicing format for NTN/STRN workflows where applicable.

## Open Backend Dependencies

Frontend localization is complete for displayed behavior, but backend support is required for full rollout:

- Server-side phone validation/normalization for +92 numbers.
- Pakistan-specific tax fields (CNIC/NTN/STRN) in profile and verification APIs.
- Payment gateway/bank rails for Pakistan settlement.

