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
import { toast } from 'sonner';

const channels = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'For general questions, billing, and account issues.',
    value: 'support@zingzing.pk',
    href: 'mailto:support@zingzing.pk',
    badge: 'Replies within 24 hrs',
  },
  {
    icon: ShieldCheck,
    title: 'Legal & Trust',
    description: 'Privacy requests, term disputes, and compliance.',
    value: 'legal@zingzing.pk',
    href: 'mailto:legal@zingzing.pk',
    badge: 'Replies within 48 hrs',
  },
  {
    icon: Users,
    title: 'Creator Onboarding',
    description: 'Help getting your creator profile verified and live.',
    value: 'creators@zingzing.pk',
    href: 'mailto:creators@zingzing.pk',
    badge: 'Mon – Sat',
  },
  {
    icon: MessageCircle,
    title: 'Brand Partnerships',
    description: 'Enterprise deals, managed campaigns, and custom pricing.',
    value: 'brands@zingzing.pk',
    href: 'mailto:brands@zingzing.pk',
    badge: 'Priority response',
  },
];

const officeDetails = [
  { icon: MapPin, label: 'Address', value: 'Shahrah-e-Faisal, Karachi, Pakistan' },
  { icon: Phone, label: 'Phone', value: '+92 21 111 222 333' },
  { icon: Clock, label: 'Hours', value: 'Mon – Sat, 9:00 AM – 6:00 PM PKT' },
];

const faqs = [
  {
    q: 'How do I report a problem with a campaign or order?',
    a: "Email support@zingzing.pk with your order ID and a brief description. Our team will respond within 24 hours and escalate urgent cases same-day.",
  },
  {
    q: 'How long does creator verification take?',
    a: "Verification is typically completed within 2–3 business days after you submit your social-media handles and ID. You'll receive an in-app notification once approved.",
  },
  {
    q: 'Can I request a refund for an incomplete campaign?',
    a: "If you used ZingZing's escrow service and the deliverables were not met, raise a dispute via the Orders page. Disputes are reviewed within 7 business days.",
  },
  {
    q: 'How do I delete my account and personal data?',
    a: 'Send a deletion request from your registered email to legal@zingzing.pk with the subject "Account Deletion Request". We will process it within 30 days.',
  },
];

const inputCls = 'h-10 w-full rounded-xl border border-[#d9e0d8] bg-[#f4f2e9] px-3 text-sm text-[#1e3d2e] placeholder:text-[#8fa098] focus:border-[#2d6b4e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6b4e]/15';
const labelCls = 'mb-1.5 block text-xs font-bold text-[#526259]';

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
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setForm({ name: '', email: '', subject: '', message: '' });
  };

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
            <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] text-white md:text-5xl">
              We&apos;re here to help
            </h1>
            <p className="mt-3 max-w-2xl text-base text-[#c2d8cb] md:text-lg">
              Whether you&apos;re a brand launching your first campaign or a creator optimising
              your profile, our team is ready to help you get the most out of ZingZing.
            </p>
          </div>
        </div>

        <div className="mx-auto -mt-8 max-w-7xl space-y-3 px-4 pb-24 sm:px-6 lg:px-8">

          {/* Channel cards */}
          <div className="overflow-hidden rounded-[1.75rem] border border-[#d9e0d8] bg-white p-6 shadow-[0_18px_60px_rgba(38,70,50,0.07)]">
            <h2 className="mb-1 text-lg font-extrabold text-[#1e3d2e]">Contact channels</h2>
            <p className="mb-5 text-sm text-[#526259]">Pick the team that best fits your query.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {channels.map(({ icon: Icon, title, description, value, href, badge }) => (
                <a
                  key={title}
                  href={href}
                  className="group flex flex-col gap-3 rounded-2xl border border-[#d9e0d8] bg-[#fbfaf5] p-5 transition-all hover:border-[#2d6b4e] hover:shadow-[0_8px_24px_rgba(38,70,50,0.08)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f0ea] transition-colors group-hover:bg-[#d1e8d4]">
                    <Icon className="h-5 w-5 text-[#2d6b4e]" />
                  </span>
                  <div className="flex-1">
                    <p className="font-extrabold text-[#1e3d2e]">{title}</p>
                    <p className="mt-0.5 text-xs text-[#526259]">{description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-[#2d6b4e]">{value}</span>
                    <span className="shrink-0 rounded-full bg-[#e7f0ea] px-2 py-0.5 text-[10px] font-bold text-[#185c39]">
                      {badge}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Form + office */}
          <div className="overflow-hidden rounded-[1.75rem] border border-[#d9e0d8] bg-white p-6 shadow-[0_18px_60px_rgba(38,70,50,0.07)] sm:p-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">

              {/* Contact form */}
              <div>
                <h2 className="text-lg font-extrabold text-[#1e3d2e]">Send us a message</h2>
                <p className="mt-1 mb-5 text-sm text-[#526259]">
                  Prefer to write to us directly? Fill in the form and we&apos;ll reply within 24 hours.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className={labelCls}>
                        Full name <span className="text-[#c13a3a]">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        placeholder="Ali Hassan Khan"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className={labelCls}>
                        Email <span className="text-[#c13a3a]">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="ali@example.com"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className={labelCls}>Subject</label>
                    <input
                      id="subject"
                      type="text"
                      placeholder="Campaign issue, verification, billing…"
                      value={form.subject}
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className={labelCls}>
                      Message <span className="text-[#c13a3a]">*</span>
                    </label>
                    <textarea
                      id="message"
                      placeholder="Describe your issue or question in detail…"
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      className={`${inputCls} h-auto resize-none py-2.5`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2d6b4e] px-5 text-sm font-bold text-white transition hover:bg-[#1f5239] disabled:opacity-60"
                  >
                    {sending ? 'Sending…' : <><Send className="h-4 w-4" /> Send Message</>}
                  </button>
                </form>
              </div>

              {/* Office info + FAQ */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#1e3d2e]">Our office</h2>
                  <p className="mt-1 mb-4 text-sm text-[#526259]">Come say hi or just give us a call.</p>
                  <div className="rounded-2xl border border-[#d9e0d8] bg-[#fbfaf5] p-5">
                    <ul className="space-y-4">
                      {officeDetails.map(({ icon: Icon, label, value }) => (
                        <li key={label} className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e7f0ea]">
                            <Icon className="h-4 w-4 text-[#2d6b4e]" />
                          </span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-[#8fa098]">{label}</p>
                            <p className="mt-0.5 text-sm font-semibold text-[#1e3d2e]">{value}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-extrabold text-[#1e3d2e]">Frequently asked questions</h3>
                  <div className="space-y-2">
                    {faqs.map((faq, i) => (
                      <div key={i} className="overflow-hidden rounded-2xl border border-[#d9e0d8] bg-[#fbfaf5]">
                        <button
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-[#1e3d2e] transition-colors hover:bg-[#f4f2e9]"
                        >
                          {faq.q}
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-[#8fa098] transition-transform duration-200 ${
                              openFaq === i ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {openFaq === i && (
                          <div className="border-t border-[#d9e0d8] px-4 pb-4 pt-3 text-sm leading-relaxed text-[#526259]">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-start gap-4 rounded-[1.75rem] bg-[#1e3d2e] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-extrabold text-white">New to ZingZing?</p>
              <p className="mt-0.5 text-sm text-[#8fa098]">
                Create your free account and start connecting with brands or creators today.
              </p>
            </div>
            <div className="flex shrink-0 gap-2.5">
              <Link
                href="/help"
                className="inline-flex h-9 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Help Center
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#e6aa38] px-4 text-sm font-bold text-[#1e3d2e] transition hover:bg-[#d49a28]"
              >
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
