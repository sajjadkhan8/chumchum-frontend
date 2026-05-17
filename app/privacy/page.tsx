import Link from 'next/link';
import {
  Lock,
  Database,
  Eye,
  Share2,
  Cookie,
  ShieldCheck,
  UserX,
  RefreshCw,
  Mail,
  ChevronRight,
  Globe,
  Bell,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const LAST_UPDATED = 'May 15, 2026';

const sections = [
  { id: 'overview',    icon: ShieldCheck, title: 'Overview' },
  { id: 'collection',  icon: Database,    title: 'Data We Collect' },
  { id: 'usage',       icon: Eye,         title: 'How We Use Your Data' },
  { id: 'sharing',     icon: Share2,      title: 'Sharing & Disclosure' },
  { id: 'cookies',     icon: Cookie,      title: 'Cookies & Tracking' },
  { id: 'retention',   icon: Bell,        title: 'Data Retention' },
  { id: 'rights',      icon: UserX,       title: 'Your Rights' },
  { id: 'transfers',   icon: Globe,       title: 'International Transfers' },
  { id: 'changes',     icon: RefreshCw,   title: 'Policy Changes' },
  { id: 'contact',     icon: Mail,        title: 'Contact Us' },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full text-xs font-medium">
                Legal
              </Badge>
              <Badge variant="outline" className="rounded-full text-xs text-muted-foreground">
                Effective {LAST_UPDATED}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Privacy Policy
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              Your privacy matters. This policy explains what data we collect, how we use
              it, and the controls you have over your information on ZingZing.
            </p>
            <p className="text-xs text-muted-foreground">
              Last updated: <span className="font-medium text-foreground">{LAST_UPDATED}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">

          {/* Sticky TOC */}
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

            <Section id="overview" icon={ShieldCheck} title="Overview">
              <p>
                ZingZing (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the ZingZing
                influencer-marketing platform at zingzing.sa. This Privacy Policy describes how
                we collect, use, store, and protect personal information when you use our platform
                as a brand, creator, or visitor.
              </p>
              <p>
                By using ZingZing you agree to the practices described in this policy. If you do
                not agree, please discontinue use of the platform.
              </p>
              <HighlightBox>
                We do <strong>not</strong> sell, rent, or trade your personal data to third parties
                for their own marketing purposes — ever.
              </HighlightBox>
            </Section>

            <Section id="collection" icon={Database} title="Data We Collect">
              <p>We collect data you provide directly and data generated through your use of the platform.</p>
              <SubHeading>Account &amp; Profile Data</SubHeading>
              <InfoList items={[
                'Name, email address, phone number, and password (hashed).',
                'Profile photo, bio, social-media handles, and niche categories.',
                'Business name, logo, and industry (brands).',
                'Bank or payment details for payout processing (creators).',
              ]} />
              <SubHeading>Campaign &amp; Transaction Data</SubHeading>
              <InfoList items={[
                'Campaign briefs, deliverables, offer amounts, and order statuses.',
                'In-platform messages and deal-offer content.',
                'Reviews, ratings, and dispute records.',
              ]} />
              <SubHeading>Usage &amp; Technical Data</SubHeading>
              <InfoList items={[
                'IP address, browser type, device identifiers, and OS.',
                'Pages visited, features used, and session duration.',
                'Error logs and performance diagnostics.',
              ]} />
            </Section>

            <Section id="usage" icon={Eye} title="How We Use Your Data">
              <InfoList items={[
                'Authenticate your account and maintain platform security.',
                'Match brands with relevant creators through search and filters.',
                'Facilitate campaign negotiations, order management, and payments.',
                'Send transactional emails (order updates, notifications, OTPs).',
                'Analyse aggregate usage patterns to improve platform features.',
                'Detect and prevent fraud, abuse, and policy violations.',
                'Comply with legal obligations and respond to lawful requests.',
              ]} />
              <p>
                We will never use your data to send unsolicited marketing without your explicit
                opt-in consent. You can manage notification preferences from your account settings.
              </p>
            </Section>

            <Section id="sharing" icon={Share2} title="Sharing & Disclosure">
              <p>We share your data only in the following limited circumstances:</p>
              <SubHeading>With other platform users</SubHeading>
              <p>
                Public profile information (name, photo, niche, follower counts) is visible to all
                users. Campaign messages and offer details are visible only to the parties involved in
                that conversation.
              </p>
              <SubHeading>With trusted service providers</SubHeading>
              <InfoList items={[
                'Cloud infrastructure providers (storage and hosting).',
                'Payment processors for payout and escrow services.',
                'Analytics tools (aggregate, anonymised data only).',
                'Email and notification delivery services.',
              ]} />
              <SubHeading>For legal reasons</SubHeading>
              <p>
                We may disclose data if required to do so by law, court order, or to protect the
                rights, property, or safety of ZingZing, its users, or the public.
              </p>
            </Section>

            <Section id="cookies" icon={Cookie} title="Cookies & Tracking">
              <p>
                We use cookies and similar technologies to keep you signed in, remember your
                preferences, and understand how the platform is used. Strictly necessary cookies
                cannot be disabled as they are required for core functionality.
              </p>
              <InfoList items={[
                'Session cookies — maintain your login state during a browser session.',
                'Preference cookies — store UI settings like dark mode.',
                'Analytics cookies — anonymised usage data (can be opted out in settings).',
              ]} />
              <p>
                You can control cookies through your browser settings; disabling certain cookies
                may limit platform functionality.
              </p>
            </Section>

            <Section id="retention" icon={Bell} title="Data Retention">
              <p>
                We retain your personal data for as long as your account is active or as necessary
                to provide services. Specific retention periods:
              </p>
              <InfoList items={[
                'Account data — retained until account deletion plus a 30-day grace period.',
                'Campaign and transaction records — 5 years for financial and legal compliance.',
                'Message content — 2 years from the date of the conversation.',
                'Usage/log data — 90 days on a rolling basis.',
              ]} />
            </Section>

            <Section id="rights" icon={UserX} title="Your Rights">
              <p>
                In accordance with applicable law you have the following rights regarding your
                personal data:
              </p>
              <InfoList items={[
                'Access — request a copy of the personal data we hold about you.',
                'Rectification — correct inaccurate or incomplete data.',
                'Erasure — request deletion of your data (subject to legal retention obligations).',
                'Portability — receive your data in a machine-readable format.',
                'Objection — object to processing for direct marketing or profiling.',
                'Withdrawal of consent — withdraw consent at any time without affecting prior processing.',
              ]} />
              <p>
                To exercise any of these rights, email{' '}
                <a href="mailto:legal@zingzing.sa" className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary">
                  legal@zingzing.sa
                </a>{' '}
                from your registered address. We will respond within 30 days.
              </p>
            </Section>

            <Section id="transfers" icon={Globe} title="International Transfers">
              <p>
                ZingZing is headquartered in Saudi Arabia. Our infrastructure uses cloud providers
                whose servers may be located in other countries. Where data is transferred outside
                Saudi Arabia, we ensure appropriate safeguards are in place through contractual
                obligations aligned with international data-protection best practices and Saudi PDPL requirements.
              </p>
            </Section>

            <Section id="changes" icon={RefreshCw} title="Policy Changes">
              <p>
                We may update this Privacy Policy from time to time. Material changes will be
                communicated via email or an in-app notice at least 14 days before they take effect.
                The &quot;Last updated&quot; date at the top of this page always reflects the current version.
              </p>
              <p>
                Continued use of the platform after a policy update constitutes acceptance of the
                revised terms.
              </p>
            </Section>

            <Section id="contact" icon={Mail} title="Contact Us">
              <p>
                For any privacy-related questions, data requests, or complaints, please contact our
                Data Protection team:
              </p>
              <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-5 text-sm">
                <p className="font-semibold text-foreground">ZingZing — Data Protection</p>
                <p className="mt-1 text-muted-foreground">
                  Email:{' '}
                  <a href="mailto:legal@zingzing.sa" className="font-medium text-primary hover:underline">
                    legal@zingzing.sa
                  </a>
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  General support:{' '}
                  <a href="mailto:support@zingzing.sa" className="font-medium text-primary hover:underline">
                    support@zingzing.sa
                  </a>
                </p>
                <p className="mt-0.5 text-muted-foreground">Riyadh, Saudi Arabia</p>
              </div>
            </Section>

            <Separator />

            {/* Footer CTA */}
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">Questions about your data?</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Our team is happy to walk you through your rights and how we protect your information.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/terms">Terms of Service</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/contact" className="flex items-center gap-1.5">
                    Contact Us <ChevronRight className="h-4 w-4" />
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

/* ── Helpers ── */

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
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

function InfoList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function HighlightBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>{children}</span>
    </div>
  );
}

