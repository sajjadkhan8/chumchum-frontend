import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const LAST_UPDATED = 'May 15, 2026';
const EFFECTIVE_DATE = 'May 15, 2026';

const sections = [
  { id: 'acceptance',      icon: Handshake,    title: 'Acceptance of Terms' },
  { id: 'platform',        icon: Globe,         title: 'Platform Description' },
  { id: 'accounts',        icon: Users,         title: 'Accounts & Registration' },
  { id: 'creator-brand',   icon: Megaphone,     title: 'Creator & Brand Obligations' },
  { id: 'payments',        icon: CreditCard,    title: 'Payments & Barter Deals' },
  { id: 'content',         icon: FileText,      title: 'Content & Intellectual Property' },
  { id: 'privacy',         icon: Lock,          title: 'Privacy & Data' },
  { id: 'prohibited',      icon: Ban,           title: 'Prohibited Conduct' },
  { id: 'disclaimers',     icon: AlertTriangle, title: 'Disclaimers & Liability' },
  { id: 'governing-law',   icon: Scale,         title: 'Governing Law' },
  { id: 'changes',         icon: RefreshCw,     title: 'Changes to Terms' },
  { id: 'contact',         icon: Mail,          title: 'Contact Us' },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero Banner ── */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full text-xs font-medium">
                Legal
              </Badge>
              <Badge variant="outline" className="rounded-full text-xs text-muted-foreground">
                Effective {EFFECTIVE_DATE}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Terms of Service
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              Please read these terms carefully before using ChamCham. By accessing or using
              our platform, you agree to be bound by the conditions set out below.
            </p>
            <p className="text-xs text-muted-foreground">
              Last updated: <span className="font-medium text-foreground">{LAST_UPDATED}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Body: sidebar TOC + content ── */}
      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">

          {/* Sticky TOC – desktop only */}
          <aside className="hidden lg:block lg:w-64 xl:w-72">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                On this page
              </p>
              <nav className="space-y-1">
                {sections.map(({ id, icon: Icon, title }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-primary/70 group-hover:text-primary" />
                    {title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <article className="min-w-0 flex-1 space-y-12">

            {/* 1. Acceptance */}
            <Section id="acceptance" icon={Handshake} title="Acceptance of Terms">
              <p>
                By creating an account, browsing, or otherwise using the ChamCham platform
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

            {/* 2. Platform Description */}
            <Section id="platform" icon={Globe} title="Platform Description">
              <p>
                ChamCham is an influencer-marketing marketplace that connects Pakistani brands
                with content creators for paid, barter, and hybrid collaboration campaigns.
                ChamCham acts solely as an intermediary and technology facilitator — we are
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

            {/* 3. Accounts */}
            <Section id="accounts" icon={Users} title="Accounts & Registration">
              <p>
                You must provide accurate, current, and complete information when registering.
                You are responsible for maintaining the confidentiality of your login
                credentials and for all activities that occur under your account.
              </p>
              <InfoList items={[
                'Notify support@chamcham.pk immediately of any unauthorised use.',
                'Do not share your credentials with third parties.',
                'One individual or company may only hold one active account per role (brand / creator).',
                'ChamCham reserves the right to suspend or terminate accounts that violate these Terms.',
              ]} />
            </Section>

            {/* 4. Creator & Brand Obligations */}
            <Section id="creator-brand" icon={Megaphone} title="Creator & Brand Obligations">
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Brands
              </h3>
              <InfoList items={[
                'Provide accurate campaign briefs and clear deliverable expectations.',
                'Respond to creator inquiries in a timely manner.',
                'Honour agreed payment or barter terms upon campaign completion.',
                'Comply with PEMRA, FBR, and all other applicable Pakistani advertising laws.',
              ]} />
              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Creators
              </h3>
              <InfoList items={[
                'Only accept campaigns you can deliver on time and to the agreed standard.',
                'Disclose paid or barter partnerships in all published content (#ad, #sponsored).',
                'Maintain accurate audience and analytics data on your profile.',
                'Do not plagiarise, infringe IP, or publish prohibited content.',
              ]} />
            </Section>

            {/* 5. Payments */}
            <Section id="payments" icon={CreditCard} title="Payments & Barter Deals">
              <p>
                All monetary transactions are conducted directly between the brand and the
                creator outside the Platform unless ChamCham&apos;s escrow service (where
                available) is explicitly selected. ChamCham charges a service fee, which will
                be disclosed at the time of transaction.
              </p>
              <InfoList items={[
                'Barter deal terms (product value, delivery timeline) must be agreed in writing via Platform messages before campaign start.',
                'Refund or dispute requests for escrow-managed payments are handled by ChamCham Support within 7 business days.',
                'ChamCham is not liable for non-payment or unfulfilled barter obligations between parties.',
                'Applicable taxes (e.g., WHT, GST) are the responsibility of the respective party.',
              ]} />
            </Section>

            {/* 6. Content & IP */}
            <Section id="content" icon={FileText} title="Content & Intellectual Property">
              <p>
                You retain ownership of content you create. By posting content on the
                Platform (profile photos, portfolio samples, campaign deliverables), you grant
                ChamCham a worldwide, royalty-free, non-exclusive licence to display, reproduce,
                and promote that content solely for Platform operations and marketing.
              </p>
              <p>
                ChamCham&apos;s own trademarks, logos, UI designs, and proprietary technology
                are protected by intellectual property law. You may not reproduce, distribute,
                or create derivative works without prior written consent.
              </p>
            </Section>

            {/* 7. Privacy */}
            <Section id="privacy" icon={Lock} title="Privacy & Data">
              <p>
                Your use of the Platform is also governed by our{' '}
                <Link href="/privacy" className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary">
                  Privacy Policy
                </Link>
                , which is incorporated into these Terms by reference. We collect and process
                personal data only as described therein and in compliance with applicable
                Pakistani data-protection requirements.
              </p>
            </Section>

            {/* 8. Prohibited Conduct */}
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

            {/* 9. Disclaimers */}
            <Section id="disclaimers" icon={AlertTriangle} title="Disclaimers & Liability">
              <p>
                The Platform is provided &quot;as is&quot; and &quot;as available&quot; without
                warranties of any kind, express or implied. ChamCham does not warrant that
                the Platform will be error-free, uninterrupted, or free of harmful components.
              </p>
              <p>
                To the maximum extent permitted by law, ChamCham&apos;s total aggregate
                liability for any claim arising out of or relating to these Terms or your use
                of the Platform shall not exceed the greater of PKR 10,000 or the total fees
                paid by you to ChamCham in the three months preceding the claim.
              </p>
            </Section>

            {/* 10. Governing Law */}
            <Section id="governing-law" icon={Scale} title="Governing Law">
              <p>
                These Terms are governed by and construed in accordance with the laws of
                the Islamic Republic of Pakistan. Any dispute arising out of or relating to
                these Terms shall be subject to the exclusive jurisdiction of the courts of
                Karachi, Pakistan, unless resolved through mutual good-faith negotiation
                or binding arbitration as agreed by both parties.
              </p>
            </Section>

            {/* 11. Changes */}
            <Section id="changes" icon={RefreshCw} title="Changes to Terms">
              <p>
                ChamCham may revise these Terms at any time. Material changes will be
                communicated via email or a prominent in-app notice at least 14 days before
                taking effect. Continued use of the Platform after the effective date of
                revised Terms constitutes your acceptance of those changes.
              </p>
            </Section>

            {/* 12. Contact */}
            <Section id="contact" icon={Mail} title="Contact Us">
              <p>
                If you have questions, concerns, or feedback about these Terms, please reach
                out to our Legal &amp; Trust team:
              </p>
              <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-5 text-sm">
                <p className="font-semibold text-foreground">ChamCham — Legal &amp; Trust</p>
                <p className="mt-1 text-muted-foreground">
                  Email:{' '}
                  <a href="mailto:legal@chamcham.pk" className="font-medium text-primary hover:underline">
                    legal@chamcham.pk
                  </a>
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  Support:{' '}
                  <a href="mailto:support@chamcham.pk" className="font-medium text-primary hover:underline">
                    support@chamcham.pk
                  </a>
                </p>
                <p className="mt-0.5 text-muted-foreground">Karachi, Pakistan</p>
              </div>
            </Section>

            <Separator />

            {/* Footer CTA */}
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">Ready to get started?</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Join thousands of brands and creators already collaborating on ChamCham.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/privacy">Privacy Policy</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup" className="flex items-center gap-1.5">
                    Get Started <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

          </article>
        </div>
      </div>
    </div>
  );
}

/* ── Helper components ── */

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
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </span>
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
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
              variant === 'warn' ? 'bg-destructive/70' : 'bg-primary/70'
            }`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
