"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronDown, LifeBuoy, MessageCircleQuestion, Search } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { ZingZingLogo } from '@/src/components/ZingZingLogo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

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
    a: 'The brand sets the estimated retail value of the product or service being offered. Creators can see this value before accepting. If you feel the valuation is inaccurate, discuss it with the brand in chat before accepting the deal.',
  },
  {
    category: 'Deals',
    q: 'What should I expect when receiving products for a barter deal?',
    a: 'After accepting a barter offer, the brand arranges delivery directly. Once you receive the product, update the order status in your dashboard and begin creating content as agreed. If a product does not arrive within the expected window, contact the brand first and then reach out to our support team.',
  },
  {
    category: 'Orders',
    q: 'Who can cancel an order, and when?',
    a: 'Either party can request a cancellation before content delivery begins. Once a creator marks an order as In Progress, cancellations require mutual agreement. For paid orders, cancellations after work has started may result in partial deductions depending on the stage of completion.',
  },
  {
    category: 'Orders',
    q: 'Are there any fees for cancelling an order?',
    a: 'There are no cancellation fees for orders cancelled before work begins. If a paid order is cancelled mid-delivery, the platform fee (10%) is non-refundable on any portion of funds already released from escrow. Brands receive a refund of the remaining escrowed amount.',
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
    a: 'If a creator misses an agreed deadline without prior communication, brands can open a dispute or request a cancellation. ZingZing may flag repeated deadline misses on a creator\'s profile during review. We encourage creators to communicate early if they need an extension — brands are often willing to accommodate with advance notice.',
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

export default function HelpPage() {
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return faqs;
    return faqs.filter((faq) => {
      return (
        faq.q.toLowerCase().includes(term) ||
        faq.a.toLowerCase().includes(term) ||
        faq.category.toLowerCase().includes(term)
      );
    });
  }, [query]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
            <Link href="/" aria-label="ZingZing home" className="mb-4 inline-flex items-center">
              <ZingZingLogo variant="light" className="h-9 w-[180px]" aria-hidden="true" />
            </Link>
            <Badge variant="secondary" className="rounded-full text-xs font-medium">Support</Badge>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Help Center</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
              Answers to common questions about campaigns, payments, and account safety.
            </p>

            <div className="mt-6 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search help articles, e.g. escrow, barter, verification..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/70">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                New to ZingZing? Learn how to create your profile, find matches, and start your first collaboration.
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <MessageCircleQuestion className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Campaign Support</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Resolve issues with campaigns, deliverables, disputes, and communication between brands and creators.
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <LifeBuoy className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Account & Safety</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Get help with verification, account access, suspicious activity, and privacy-related requests.
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        <section className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Frequently Asked Questions</h2>
            <Badge variant="outline" className="rounded-full text-xs text-muted-foreground">
              {filteredFaqs.length} result{filteredFaqs.length === 1 ? '' : 's'}
            </Badge>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => (
              <Card key={faq.q} className="overflow-hidden border-border/70">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div>
                    <Badge variant="secondary" className="mb-2 rounded-full text-[10px] uppercase tracking-wide">{faq.category}</Badge>
                    <p className="text-base font-semibold text-foreground">{faq.q}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <CardContent className="border-t border-border px-5 pb-5 pt-4 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </CardContent>
                )}
              </Card>
            ))}

            {filteredFaqs.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No matching help articles found. Try another keyword or contact support.
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 pb-14">
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">Still need help?</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Our support team is available Monday to Saturday, 10:00 AM to 7:00 PM PKT.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/contact">Contact Support</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/about" className="flex items-center gap-1.5">
                  How ZingZing Works <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
