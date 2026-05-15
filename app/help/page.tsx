"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronDown, LifeBuoy, MessageCircleQuestion, Search } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const faqs = [
  {
    category: 'Deals',
    q: 'How do barter deals work on ChamCham?',
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
    a: 'Use the in-app report option or contact support@chamcham.pk immediately. Include screenshots and relevant message links where possible.',
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
            <Badge variant="secondary" className="rounded-full text-xs font-medium">Support</Badge>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Help Center</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
              Answers to common questions about campaigns, offers, payments, and account safety.
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
                New to ChamCham? Learn how to create your profile, find matches, and start your first collaboration.
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
                Resolve issues with offers, deliverables, disputes, and communication between brands and creators.
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
                  How ChamCham Works <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

