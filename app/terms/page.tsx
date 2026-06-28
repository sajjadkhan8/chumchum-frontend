import Link from 'next/link';
import {
  FileText,
  Users,
  CreditCard,
  AlertTriangle,
  Globe,
  RefreshCw,
  Mail,
  ChevronRight,
  Scale,
  Lock,
  Handshake,
  Megaphone,
  Ban,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';

const LAST_UPDATED = 'May 15, 2026';
const EFFECTIVE_DATE = 'May 15, 2026';

const sections = [
  { id: 'acceptance',    icon: Handshake,    title: 'Acceptance of Terms' },
  { id: 'platform',     icon: Globe,         title: 'Platform Description' },
  { id: 'accounts',     icon: Users,         title: 'Accounts & Registration' },
  { id: 'creator-brand',icon: Megaphone,     title: 'Creator & Brand Obligations' },
  { id: 'payments',     icon: CreditCard,    title: 'Payments & Barter Deals' },
  { id: 'content',      icon: FileText,      title: 'Content & Intellectual Property' },
  { id: 'privacy',      icon: Lock,          title: 'Privacy & Data' },
  { id: 'prohibited',   icon: Ban,           title: 'Prohibited Conduct' },
  { id: 'disclaimers',  icon: AlertTriangle, title: 'Disclaimers & Liability' },
  { id: 'governing-law',icon: Scale,         title: 'Governing Law' },
  { id: 'changes',      icon: RefreshCw,     title: 'Changes to Terms' },
  { id: 'contact',      icon: Mail,          title: 'Contact Us' },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fbfaf5]">
      <Navbar />

      {/* Hero */}
      <div className="bg-[#1e3d2e] px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#f0c56e]">
              Legal
            </div>
            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-[#8fa098]">
              Effective {EFFECTIVE_DATE}
            </div>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] text-white md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[#c2d8cb] md:text-lg">
            Please read these terms carefully before using ZingZing. By accessing or using
            our platform, you agree to be bound by the conditions set out below.
          </p>
          <p className="mt-3 text-xs text-[#8fa098]">
            Last updated: <span className="font-semibold text-[#c2d8cb]">{LAST_UPDATED}</span>
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto -mt-8 max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">

          {/* Sticky TOC */}
          <aside className="hidden lg:block lg:w-64 xl:w-72">
            <div className="sticky top-24 overflow-hidden rounded-[1.75rem] border border-[#d9e0d8] bg-white p-5 shadow-[0_18px_60px_rgba(38,70,50,0.07)]">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8fa098]">
                On this page
              </p>
              <nav className="space-y-0.5">
                {sections.map(({ id, icon: Icon, title }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="group flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm text-[#526259] transition-colors hover:bg-[#f4f2e9] hover:text-[#1e3d2e]"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-[#8fa098] group-hover:text-[#2d6b4e]" />
                    {title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <article className="min-w-0 flex-1">
            <div className="overflow-hidden rounded-[1.75rem] border border-[#d9e0d8] bg-white p-6 shadow-[0_18px_60px_rgba(38,70,50,0.07)] sm:p-8">
              <div className="space-y-10">

                <Section id="acceptance" icon={Handshake} title="Acceptance of Terms">
                  <p>
                    By creating an account, browsing, or otherwise using the ZingZing platform
                    (&quot;Platform&quot;), you confirm that you are at least 18 years old and have
                    the legal capacity to enter into a binding agreement. If you are accessing the
                    Platform on behalf of a company or other legal entity, you represent that you
                    have the authority to bind that entity to these Terms.
                  </p>
                  <p>
                    If you do not agree with any part of these Terms, you must discontinue use of
                    the Platform immediately.
                  </p>
                </Section>

                <Section id="platform" icon={Globe} title="Platform Description">
                  <p>
                    ZingZing is an influencer-marketing marketplace that connects Pakistani brands
                    with content creators for paid, barter, and hybrid collaboration campaigns.
                    ZingZing acts solely as an intermediary and technology facilitator — we are
                    not a party to any deal, contract, or arrangement entered into between a brand
                    and a creator.
                  </p>
                  <InfoList items={[
                    'Discovery and search tools for brands to find creators.',
                    'Messaging and deal-offer workflows for negotiating campaigns.',
                    'Order management and deliverable tracking dashboards.',
                    'Analytics and performance reporting for active collaborations.',
                  ]} />
                </Section>

                <Section id="accounts" icon={Users} title="Accounts & Registration">
                  <p>
                    You must provide accurate, current, and complete information when registering.
                    You are responsible for maintaining the confidentiality of your login
                    credentials and for all activities that occur under your account.
                  </p>
                  <InfoList items={[
                    'Notify support@zingzing.pk immediately of any unauthorised use.',
                    'Do not share your credentials with third parties.',
                    'One individual or company may only hold one active account per role (brand / creator).',
                    'ZingZing reserves the right to suspend or terminate accounts that violate these Terms.',
                  ]} />
                </Section>

                <Section id="creator-brand" icon={Megaphone} title="Creator & Brand Obligations">
                  <SubHeading>Brands</SubHeading>
                  <InfoList items={[
                    'Provide accurate campaign briefs and clear deliverable expectations.',
                    'Respond to creator inquiries in a timely manner.',
                    'Honour agreed payment or barter terms upon campaign completion.',
                    'Comply with all applicable Pakistan advertising, e-commerce, and consumer-protection laws, including disclosure obligations set by relevant authorities.',
                  ]} />
                  <SubHeading>Creators</SubHeading>
                  <InfoList items={[
                    'Only accept campaigns you can deliver on time and to the agreed standard.',
                    'Disclose paid or barter partnerships in all published content (#ad, #sponsored).',
                    'Maintain accurate audience and analytics data on your profile.',
                    'Do not plagiarise, infringe IP, or publish prohibited content.',
                  ]} />
                </Section>

                <Section id="payments" icon={CreditCard} title="Payments & Barter Deals">
                  <p>
                    All monetary transactions are conducted directly between the brand and the
                    creator outside the Platform unless ZingZing&apos;s escrow service (where
                    available) is explicitly selected. ZingZing charges a service fee, which will
                    be disclosed at the time of transaction.
                  </p>
                  <InfoList items={[
                    'Barter deal terms (product value, delivery timeline) must be agreed in writing via Platform messages before campaign start.',
                    'Refund or dispute requests for escrow-managed payments are handled by ZingZing Support within 7 business days.',
                    'Refunds to a brand wallet may return the full available escrow balance, while refunds back to the original payment method may deduct non-refundable Safepay processing costs plus a 1% ZingZing recovery fee when the brand chooses to cancel.',
                    'ZingZing is not liable for non-payment or unfulfilled barter obligations between parties.',
                    'Applicable taxes (including GST, withholding tax, and FBR requirements) are the responsibility of the respective party.',
                  ]} />
                </Section>

                <Section id="content" icon={FileText} title="Content & Intellectual Property">
                  <p>
                    You retain ownership of content you create. By posting content on the
                    Platform (profile photos, portfolio samples, campaign deliverables), you grant
                    ZingZing a worldwide, royalty-free, non-exclusive licence to display, reproduce,
                    and promote that content solely for Platform operations and marketing.
                  </p>
                  <p>
                    ZingZing&apos;s own trademarks, logos, UI designs, and proprietary technology
                    are protected by intellectual property law. You may not reproduce, distribute,
                    or create derivative works without prior written consent.
                  </p>
                </Section>

                <Section id="privacy" icon={Lock} title="Privacy & Data">
                  <p>
                    Your use of the Platform is also governed by our{' '}
                    <Link href="/privacy" className="font-semibold text-[#2d6b4e] underline decoration-[#2d6b4e]/30 underline-offset-2 hover:decoration-[#2d6b4e]">
                      Privacy Policy
                    </Link>
                    , which is incorporated into these Terms by reference. We collect and process
                    personal data only as described therein and in compliance with applicable
                    Pakistan data-protection requirements.
                  </p>
                </Section>

                <Section id="prohibited" icon={Ban} title="Prohibited Conduct">
                  <p>You agree not to:</p>
                  <InfoList variant="warn" items={[
                    'Submit false, misleading, or fraudulent campaign briefs or analytics.',
                    'Circumvent Platform fees by transacting off-platform after initial contact.',
                    'Harass, threaten, or discriminate against other users.',
                    'Distribute malware, spam, or any unauthorized automated scripts.',
                    'Impersonate any person, brand, or organisation.',
                    'Post content that is defamatory, obscene, or violates third-party rights.',
                  ]} />
                </Section>

                <Section id="disclaimers" icon={AlertTriangle} title="Disclaimers & Liability">
                  <p>
                    The Platform is provided &quot;as is&quot; and &quot;as available&quot; without
                    warranties of any kind, express or implied. ZingZing does not warrant that
                    the Platform will be error-free, uninterrupted, or free of harmful components.
                  </p>
                  <p>
                    To the maximum extent permitted by law, ZingZing&apos;s total aggregate
                    liability for any claim arising out of or relating to these Terms or your use
                    of the Platform shall not exceed the greater of PKR 250,000 or the total fees
                    paid by you to ZingZing in the three months preceding the claim.
                  </p>
                </Section>

                <Section id="governing-law" icon={Scale} title="Governing Law">
                  <p>
                    These Terms are governed by and construed in accordance with the laws of
                    Pakistan. Any dispute arising out of or relating to these Terms shall be
                    subject to the exclusive jurisdiction of the courts of Karachi, Pakistan,
                    unless resolved through mutual good-faith negotiation or binding arbitration
                    as agreed by both parties.
                  </p>
                </Section>

                <Section id="changes" icon={RefreshCw} title="Changes to Terms">
                  <p>
                    ZingZing may revise these Terms at any time. Material changes will be
                    communicated via email or a prominent in-app notice at least 14 days before
                    taking effect. Continued use of the Platform after the effective date of
                    revised Terms constitutes your acceptance of those changes.
                  </p>
                </Section>

                <Section id="contact" icon={Mail} title="Contact Us">
                  <p>
                    If you have questions, concerns, or feedback about these Terms, please reach
                    out to our Legal &amp; Trust team:
                  </p>
                  <div className="mt-4 rounded-2xl border border-[#d9e0d8] bg-[#f4f2e9] p-5 text-sm">
                    <p className="font-bold text-[#1e3d2e]">ZingZing — Legal &amp; Trust</p>
                    <p className="mt-1 text-[#526259]">
                      Email:{' '}
                      <a href="mailto:legal@zingzing.pk" className="font-semibold text-[#2d6b4e] hover:underline">
                        legal@zingzing.pk
                      </a>
                    </p>
                    <p className="mt-0.5 text-[#526259]">
                      Support:{' '}
                      <a href="mailto:support@zingzing.pk" className="font-semibold text-[#2d6b4e] hover:underline">
                        support@zingzing.pk
                      </a>
                    </p>
                    <p className="mt-0.5 text-[#526259]">Karachi, Pakistan</p>
                  </div>
                </Section>

                <div className="h-px bg-[#d9e0d8]" />

                {/* Footer CTA */}
                <div className="flex flex-col items-start gap-4 rounded-2xl bg-[#1e3d2e] p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-extrabold text-white">Ready to get started?</p>
                    <p className="mt-0.5 text-sm text-[#8fa098]">
                      Join thousands of brands and creators already collaborating on ZingZing.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2.5">
                    <Link
                      href="/privacy"
                      className="inline-flex h-9 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15"
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      href="/signup"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#e6aa38] px-4 text-sm font-bold text-[#1e3d2e] transition hover:bg-[#d49a28]"
                    >
                      Get Started <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </article>

        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e7f0ea]">
          <Icon className="h-4 w-4 text-[#2d6b4e]" />
        </span>
        <h2 className="text-xl font-extrabold tracking-[-0.025em] text-[#1e3d2e] md:text-2xl">{title}</h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-[#526259]">
        {children}
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8fa098]">
      {children}
    </h3>
  );
}

function InfoList({
  items,
  variant = 'default',
}: {
  items: string[];
  variant?: 'default' | 'warn';
}) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span
            className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
              variant === 'warn' ? 'bg-[#c13a3a]/70' : 'bg-[#2d6b4e]/70'
            }`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
