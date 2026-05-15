'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Users,
  ShieldCheck,
  ChevronDown,
  Send,
  ArrowRight,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const channels = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'For general questions, billing, and account issues.',
    value: 'support@chamcham.pk',
    href: 'mailto:support@chamcham.pk',
    badge: 'Replies within 24 hrs',
    badgeVariant: 'secondary' as const,
  },
  {
    icon: ShieldCheck,
    title: 'Legal & Trust',
    description: 'Privacy requests, term disputes, and compliance.',
    value: 'legal@chamcham.pk',
    href: 'mailto:legal@chamcham.pk',
    badge: 'Replies within 48 hrs',
    badgeVariant: 'secondary' as const,
  },
  {
    icon: Users,
    title: 'Creator Onboarding',
    description: 'Help getting your creator profile verified and live.',
    value: 'creators@chamcham.pk',
    href: 'mailto:creators@chamcham.pk',
    badge: 'Mon – Sat',
    badgeVariant: 'secondary' as const,
  },
  {
    icon: MessageCircle,
    title: 'Brand Partnerships',
    description: 'Enterprise deals, managed campaigns, and custom pricing.',
    value: 'brands@chamcham.pk',
    href: 'mailto:brands@chamcham.pk',
    badge: 'Priority response',
    badgeVariant: 'default' as const,
  },
];

const officeDetails = [
  { icon: MapPin, label: 'Address', value: 'Gulberg III, Lahore, Pakistan' },
  { icon: Phone, label: 'Phone', value: '+92 42 111 224 226' },
  { icon: Clock, label: 'Hours', value: 'Mon – Sat, 10:00 AM – 7:00 PM PKT' },
];

const faqs = [
  {
    q: 'How do I report a problem with a campaign or order?',
    a: "Email support@chamcham.pk with your order ID and a brief description. Our team will respond within 24 hours and escalate urgent cases same-day.",
  },
  {
    q: 'How long does creator verification take?',
    a: 'Verification is typically completed within 2–3 business days after you submit your social-media handles and ID. You\'ll receive an in-app notification once approved.',
  },
  {
    q: 'Can I request a refund for an incomplete campaign?',
    a: 'If you used ChamCham\'s escrow service and the deliverables were not met, raise a dispute via the Orders page. Disputes are reviewed within 7 business days.',
  },
  {
    q: 'How do I delete my account and personal data?',
    a: 'Send a deletion request from your registered email to legal@chamcham.pk with the subject "Account Deletion Request". We will process it within 30 days.',
  },
];

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 900));
    setSending(false);
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit rounded-full text-xs font-medium">
              Support
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              We&apos;re here to help
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              Whether you&apos;re a brand launching your first campaign or a creator optimising
              your profile, our team is ready to help you get the most out of ChamCham.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">

        {/* ── Channel cards ── */}
        <section>
          <h2 className="mb-1 text-xl font-bold tracking-tight md:text-2xl">Contact channels</h2>
          <p className="mb-6 text-sm text-muted-foreground">Pick the team that best fits your query.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map(({ icon: Icon, title, description, value, href, badge, badgeVariant }) => (
              <a
                key={title}
                href={href}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <Icon className="h-5 w-5 text-primary" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="truncate text-xs font-medium text-primary">{value}</span>
                  <Badge variant={badgeVariant} className="ml-2 shrink-0 rounded-full text-[10px]">
                    {badge}
                  </Badge>
                </div>
              </a>
            ))}
          </div>
        </section>

        <Separator className="my-12" />

        {/* ── Two-column: form + office info ── */}
        <section className="grid gap-10 lg:grid-cols-2 lg:gap-16">

          {/* Contact form */}
          <div>
            <h2 className="mb-1 text-xl font-bold tracking-tight md:text-2xl">Send us a message</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Prefer to write to us directly? Fill in the form and we&apos;ll reply within 24 hours.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    placeholder="Ali Khan"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ali@example.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Campaign issue, verification, billing…"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue or question in detail…"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              </div>
              <Button type="submit" disabled={sending} className="w-full sm:w-auto">
                {sending ? 'Sending…' : (
                  <span className="flex items-center gap-2">
                    Send Message <Send className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>

          {/* Office info + FAQ */}
          <div className="space-y-8">
            <div>
              <h2 className="mb-1 text-xl font-bold tracking-tight md:text-2xl">Our office</h2>
              <p className="mb-5 text-sm text-muted-foreground">Come say hi or just give us a call.</p>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <ul className="space-y-4">
                  {officeDetails.map(({ icon: Icon, label, value }) => (
                    <li key={label} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-primary" />
                      </span>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* FAQ accordion */}
            <div>
              <h3 className="mb-4 font-semibold text-foreground">Frequently asked questions</h3>
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-foreground"
                    >
                      {faq.q}
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          openFaq === i ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openFaq === i && (
                      <div className="border-t border-border px-4 pb-4 pt-3 text-sm text-muted-foreground">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-12" />

        {/* Footer CTA */}
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">New to ChamCham?</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Create your free account and start connecting with brands or creators today.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/help">Help Center</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup" className="flex items-center gap-1.5">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
