'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Search, HelpCircle, Package, Wallet, ShieldCheck, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FAQ {
  question: string;
  answer: string;
}

interface Category {
  icon: React.ElementType;
  label: string;
  color: string;
  faqs: FAQ[];
}

const categories: Category[] = [
  {
    icon: Package,
    label: 'Packages & Deals',
    color: 'text-[#2d6b4e] bg-[#e7f0ea]',
    faqs: [
      {
        question: 'How do I price my packages?',
        answer: 'Set your paid package price based on your engagement rate, niche, and the deliverables included. For barter packages, describe the exact in-kind product/service you expect. Hybrid packages combine a cash component with in-kind benefits. Go to Creator → Packages → New Package to get started.',
      },
      {
        question: 'What is a barter deal and how does valuation work?',
        answer: 'A barter deal replaces cash payment with products or services of agreed value. You set a minimum estimated barter value and describe exactly what you expect (e.g. "Hotel stay for 2 nights, min PKR 30,000 value"). The brand sees this in your package details before placing an order. There is no escrow hold for pure barter deals — delivery confirmation is done manually after you receive the product.',
      },
      {
        question: 'Can I offer a Quick Deal directly from a conversation?',
        answer: 'Yes. Open any conversation with a brand and click the Quick Deal button to propose a one-off paid, barter, or hybrid deal without needing a published package. The brand can accept or decline.',
      },
      {
        question: 'What happens after a brand orders my package?',
        answer: 'For paid/hybrid orders the brand\'s wallet is debited immediately when the order is placed (escrow hold). The order appears in Creator → Orders with PENDING status. Accept it to start working, then mark deliverables submitted when done. Once the brand approves all deliverables and the order reaches COMPLETED, earnings (minus the platform fee) are credited to your wallet.',
      },
    ],
  },
  {
    icon: Wallet,
    label: 'Payments & Withdrawals',
    color: 'text-[#8b5e12] bg-[#fff1cd]',
    faqs: [
      {
        question: 'When are my earnings available to withdraw?',
        answer: 'Earnings become available in your wallet once an order reaches COMPLETED status. The platform fee (10% by default) is deducted at that point and the net amount appears in your Available Balance. Pure barter orders do not generate wallet credits.',
      },
      {
        question: 'What are the payout timelines?',
        answer: 'Once you request a withdrawal it enters PENDING status. An admin reviews and processes it within 2–3 business days. JazzCash and Easypaisa are typically fastest. Bank transfers may take 1–2 additional business days. You will receive an in-app notification when the status changes.',
      },
      {
        question: 'How do I set up my withdrawal method?',
        answer: 'Go to Creator → Payments → Payout Methods and add your bank account, JazzCash, or Easypaisa number. You must add at least one method before requesting a withdrawal. A minimum withdrawal amount of PKR 1,000 applies.',
      },
      {
        question: 'My withdrawal is stuck in PENDING — what do I do?',
        answer: 'Contact support via the button below and include your withdrawal ID (visible in your Payments history). Processing times can extend during high-volume periods.',
      },
    ],
  },
  {
    icon: MessageSquare,
    label: 'Orders & Deliverables',
    color: 'text-[#1e3d2e] bg-[#e6eceb]',
    faqs: [
      {
        question: 'How do I submit a deliverable?',
        answer: 'In Creator → Orders, open your in-progress order and click Submit on each deliverable. Upload the file and add a note if needed. Once all deliverables are submitted the order moves to DELIVERED status and the brand is notified to review.',
      },
      {
        question: 'The brand requested a revision — what happens?',
        answer: 'When a brand requests a revision they must provide a comment explaining what needs to change. The deliverable moves back to REVISION status. Re-upload the corrected file and resubmit. You can request a revision rework up to the number of revisions specified in your package.',
      },
      {
        question: 'Can I cancel an order?',
        answer: 'Creators cannot cancel orders after they have been accepted. If both parties agree, the brand can cancel a PENDING order and their escrow funds are returned. For disputes after work has started, contact support.',
      },
    ],
  },
  {
    icon: ShieldCheck,
    label: 'Account & Safety',
    color: 'text-[#4a3a9e] bg-[#e8e4ff]',
    faqs: [
      {
        question: 'How do I get verified?',
        answer: 'Platform verification is reviewed by admins after you complete your profile (bio, city, social links, portfolio). A verified badge appears on your public profile and improves your search ranking. Ambassador status requires a separate application with identity and engagement verification.',
      },
      {
        question: 'What is 2FA and should I enable it?',
        answer: 'Two-factor authentication adds a second verification step when logging in. Creator self-service 2FA is not available yet; keep your email verified and use a strong unique password until it is added to account security settings.',
      },
      {
        question: 'How is my personal data protected?',
        answer: 'Your phone number, email, and bank account details are never shared with brands. Brands only see your public profile data (name, social stats, packages). Payment processing uses encrypted connections and credentials are stored in a secure vault, not in application code.',
      },
    ],
  },
  {
    icon: AlertCircle,
    label: 'Disputes & Support',
    color: 'text-[#9e3a3a] bg-[#fce8e8]',
    faqs: [
      {
        question: 'How do I raise a dispute with a brand?',
        answer: 'If a brand is unresponsive or the order stalls, use the in-app message thread to document the issue first. If unresolved, contact support (link below) with your Order ID and a description. Admins can intervene and, if necessary, initiate a refund.',
      },
      {
        question: 'Can I get paid if the brand never responds after I submit?',
        answer: 'If deliverables are submitted but the brand does not respond within 14 days, contact support. Admins can move the order to COMPLETED on your behalf after reviewing the submission.',
      },
    ],
  },
];

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#f0f3f0] last:border-0">
      <button
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold text-[#1e3d2e]">{faq.question}</span>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-[#496159]" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-[#496159]" />
        )}
      </button>
      {open && (
        <p className="pb-4 text-[13px] leading-6 text-[#496159]">{faq.answer}</p>
      )}
    </div>
  );
}

export default function CreatorHelpPage() {
  const [search, setSearch] = useState('');

  const filtered = categories
    .map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter(
        (faq) =>
          !search ||
          faq.question.toLowerCase().includes(search.toLowerCase()) ||
          faq.answer.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.faqs.length > 0);

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e3d2e] md:text-3xl">Help &amp; Support</h1>
          <p className="mt-1 text-sm text-[#496159]">Answers to common questions about packages, payments, orders, and account safety.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#87938b]" />
        <Input
          placeholder="Search FAQs…"
          className="border-[#d1ddd6] pl-9 focus:border-[#2d6b4e] focus:ring-[#2d6b4e]/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <HelpCircle className="size-10 text-[#d1ddd6]" />
          <p className="text-sm font-semibold text-[#496159]">No FAQs match your search.</p>
          <Button asChild variant="link" size="sm" className="text-[#185c39]">
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      )}

      <div className="space-y-5">
        {filtered.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.label} className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-[#f0f3f0] px-5 py-3.5">
                <span className={cn('grid size-8 shrink-0 place-items-center rounded-xl text-sm', cat.color)}>
                  <Icon className="size-4" />
                </span>
                <h2 className="text-sm font-extrabold text-[#1e3d2e]">{cat.label}</h2>
              </div>
              <div className="px-5">
                {cat.faqs.map((faq) => (
                  <FAQItem key={faq.question} faq={faq} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#d1ddd6] bg-[#fbfaf5] p-5 text-center">
        <p className="text-sm font-semibold text-[#496159]">Didn&apos;t find what you need?</p>
        <p className="mt-1 text-xs text-[#87938b]">Our support team responds within 24 hours on weekdays.</p>
        <Button asChild className="mt-4 rounded-full bg-[#185c39] text-white hover:bg-[#12462b]" size="sm">
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
}
