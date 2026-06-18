'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronDown, LifeBuoy, MessageCircleQuestion, Search } from 'lucide-react';
import { Navbar } from '@/components/navbar';

const faqs = [
  {
    category: 'Deals',
    q: 'How do barter deals work on ZingZing?',
    a: 'Brands define the offer details and estimated value, and creators can accept or negotiate in chat.',
  },
  {
    category: 'Deals',
    q: 'Can I run hybrid campaigns?',
    a: 'Yes, hybrid deals combine a cash amount with a barter item or service in one offer.',
  },
  {
    category: 'Messaging',
    q: 'How quickly do creators respond?',
    a: 'Response time varies by creator; each profile shows their expected response speed.',
  },
  {
    category: 'Accounts',
    q: 'How can I verify my creator profile?',
    a: 'Go to creator settings, complete your profile details, connect social handles, and submit verification documents. Reviews are usually completed in 2-3 business days.',
  },
  {
    category: 'Payments',
    q: 'When do creators receive campaign payments?',
    a: 'For escrow-enabled deals, payouts are released once the brand approves final deliverables. Standard processing takes 2-5 business days.',
  },
  {
    category: 'Security',
    q: 'How do I report suspicious activity?',
    a: 'Use the in-app report option or contact support@zingzing.pk immediately. Include screenshots and relevant message links where possible.',
  },
  {
    category: 'Deals',
    q: 'How is product value calculated in a barter deal?',
    a: "The brand sets the estimated retail value of the product or service being offered. Creators can see this value before accepting. If you feel the valuation is inaccurate, discuss it with the brand in chat before accepting the deal.",
  },
  {
    category: 'Deals',
    q: 'What should I expect when receiving products for a barter deal?',
    a: "After accepting a barter offer, the brand arranges delivery directly. Once you receive the product, update the order status in your dashboard and begin creating content as agreed. If a product does not arrive within the expected window, contact the brand first and then reach out to our support team.",
  },
  {
    category: 'Orders',
    q: 'Who can cancel an order, and when?',
    a: "Either party can request a cancellation before content delivery begins. Once a creator marks an order as In Progress, cancellations require mutual agreement. For paid orders, cancellations after work has started may result in partial deductions depending on the stage of completion.",
  },
  {
    category: 'Orders',
    q: 'Are there any fees for cancelling an order?',
    a: "There are no cancellation fees for orders cancelled before work begins. If a paid order is cancelled mid-delivery, the platform fee (10%) is non-refundable on any portion of funds already released from escrow. Brands receive a refund of the remaining escrowed amount.",
  },
  {
    category: 'Orders',
    q: 'How do I open a dispute?',
    a: 'Go to the relevant order in your dashboard and select "Open Dispute." Describe the issue clearly and attach any supporting evidence such as screenshots or message excerpts. Both parties will be notified and given an opportunity to respond before the ZingZing team makes a decision.',
  },
  {
    category: 'Orders',
    q: 'What happens during a dispute investigation?',
    a: 'Our support team reviews all submitted evidence from both sides. We typically aim to resolve disputes within 3–5 business days. During the investigation, any pending escrow funds are held. The outcome may result in a full payout to the creator, a refund to the brand, or a split resolution based on deliverables completed.',
  },
  {
    category: 'Payments',
    q: 'How long does a withdrawal take to process?',
    a: 'Withdrawal requests are processed within 2–5 business days after submission. Processing times may vary slightly depending on your bank. You will receive a notification once the transfer is initiated.',
  },
  {
    category: 'Payments',
    q: 'What platform fee does ZingZing charge?',
    a: 'ZingZing charges a 10% platform fee on the total order value for paid and hybrid deals. This fee is deducted automatically when funds are released from escrow upon brand approval of the final deliverable. There are no upfront charges or monthly fees for creators.',
  },
  {
    category: 'Payments',
    q: 'How does the escrow system protect brands?',
    a: 'When a brand places a paid or hybrid order, the campaign payment is held in escrow by ZingZing. Funds are only released to the creator once the brand reviews and approves the submitted deliverables. If the deliverable is not approved or a dispute is raised, the escrowed funds remain held until the matter is resolved.',
  },
  {
    category: 'Deals',
    q: 'What happens if a creator misses the campaign deadline?',
    a: "If a creator misses an agreed deadline without prior communication, brands can open a dispute or request a cancellation. ZingZing may flag repeated deadline misses on a creator's profile during review. We encourage creators to communicate early if they need an extension — brands are often willing to accommodate with advance notice.",
  },
  {
    category: 'Security',
    q: 'Is two-factor authentication (2FA) available?',
    a: 'Yes, ZingZing supports two-factor authentication for added account security. You can enable 2FA from your account security settings. We strongly recommend turning it on, especially if you have earnings or active campaigns.',
  },
  {
    category: 'Security',
    q: 'How can I keep my account secure?',
    a: 'Use a strong, unique password and enable two-factor authentication. Never share your login credentials or OTP codes with anyone, including people claiming to be from ZingZing support. We will never ask for your password via chat or email. If you suspect your account has been compromised, change your password immediately and contact support.',
  },
  {
    category: 'Accounts',
    q: 'Can I have both a creator and a brand account?',
    a: 'Currently each registered account is tied to a single role — either creator or brand. If you need both, you will need to register with a separate email address for each role. Contact support if you need help managing multiple accounts.',
  },
];

const categoryColors: Record<string, string> = {
  Deals: 'bg-[#e7f0ea] text-[#185c39]',
  Messaging: 'bg-[#e8f0fb] text-[#2563b0]',
  Accounts: 'bg-[#f4f2e9] text-[#8b5e12]',
  Payments: 'bg-[#fef9ec] text-[#8b5e12]',
  Security: 'bg-[#fce4e4] text-[#c13a3a]',
  Orders: 'bg-[#f0f4f0] text-[#526259]',
};

export default function HelpPage() {
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return faqs;
    return faqs.filter((faq) =>
      faq.q.toLowerCase().includes(term) ||
      faq.a.toLowerCase().includes(term) ||
      faq.category.toLowerCase().includes(term)
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-[#fbfaf5]">
      <Navbar />

      <main>
        {/* Hero */}
        <div className="bg-[#1e3d2e] px-4 pt-8 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#f0c56e]">
              Support
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] text-white md:text-5xl">Help Center</h1>
            <p className="mt-3 max-w-2xl text-base text-[#c2d8cb] md:text-lg">
              Answers to common questions about campaigns, payments, and account safety.
            </p>
            <div className="mt-5 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8fa098]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search help articles, e.g. escrow, barter, verification..."
                  className="h-11 w-full rounded-full border border-white/20 bg-white/10 pl-10 pr-4 text-sm font-medium text-white placeholder:text-[#8fa098] focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto -mt-8 max-w-7xl space-y-3 px-4 pb-24 sm:px-6 lg:px-8">

          {/* Category cards */}
          <div className="overflow-hidden rounded-[1.75rem] border border-[#d9e0d8] bg-white p-6 shadow-[0_18px_60px_rgba(38,70,50,0.07)]">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: BookOpen, title: 'Getting Started', body: 'New to ZingZing? Learn how to create your profile, find matches, and start your first collaboration.' },
                { icon: MessageCircleQuestion, title: 'Campaign Support', body: 'Resolve issues with campaigns, deliverables, disputes, and communication between brands and creators.' },
                { icon: LifeBuoy, title: 'Account & Safety', body: 'Get help with verification, account access, suspicious activity, and privacy-related requests.' },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-[#d9e0d8] bg-[#fbfaf5] p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f0ea]">
                    <Icon className="h-5 w-5 text-[#2d6b4e]" />
                  </div>
                  <h3 className="font-extrabold text-[#1e3d2e]">{title}</h3>
                  <p className="mt-1.5 text-sm text-[#526259]">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ accordion */}
          <div className="overflow-hidden rounded-[1.75rem] border border-[#d9e0d8] bg-white shadow-[0_18px_60px_rgba(38,70,50,0.07)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#f0f4f0] px-6 py-4">
              <h2 className="text-lg font-extrabold text-[#1e3d2e]">Frequently Asked Questions</h2>
              <span className="rounded-full bg-[#e7f0ea] px-2.5 py-1 text-xs font-bold text-[#2d6b4e]">
                {filteredFaqs.length} result{filteredFaqs.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="divide-y divide-[#f0f4f0]">
              {filteredFaqs.map((faq, index) => (
                <div key={faq.q}>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-[#fbfaf5]"
                  >
                    <div>
                      <span className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${categoryColors[faq.category] ?? 'bg-[#f0f4f0] text-[#526259]'}`}>
                        {faq.category}
                      </span>
                      <p className="text-sm font-semibold text-[#1e3d2e]">{faq.q}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#8fa098] transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === index && (
                    <div className="border-t border-[#f0f4f0] px-6 pb-5 pt-4 text-sm leading-relaxed text-[#526259]">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}

              {filteredFaqs.length === 0 && (
                <div className="py-10 text-center text-sm text-[#8fa098]">
                  No matching help articles found. Try another keyword or contact support.
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-start gap-4 rounded-[1.75rem] bg-[#1e3d2e] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-extrabold text-white">Still need help?</p>
              <p className="mt-0.5 text-sm text-[#8fa098]">Our support team is available Monday to Saturday, 10:00 AM to 7:00 PM PKT.</p>
            </div>
            <div className="flex shrink-0 gap-2.5">
              <Link
                href="/contact"
                className="inline-flex h-9 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Contact Support
              </Link>
              <Link
                href="/about"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#e6aa38] px-4 text-sm font-bold text-[#1e3d2e] transition hover:bg-[#d49a28]"
              >
                How It Works <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
