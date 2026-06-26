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

const LAST_UPDATED = 'May 15, 2026';

const sections = [
  { id: 'overview',   icon: ShieldCheck, title: 'Overview' },
  { id: 'collection', icon: Database,    title: 'Data We Collect' },
  { id: 'usage',      icon: Eye,         title: 'How We Use Your Data' },
  { id: 'sharing',    icon: Share2,      title: 'Sharing & Disclosure' },
  { id: 'cookies',    icon: Cookie,      title: 'Cookies & Tracking' },
  { id: 'retention',  icon: Bell,        title: 'Data Retention' },
  { id: 'rights',     icon: UserX,       title: 'Your Rights' },
  { id: 'transfers',  icon: Globe,       title: 'International Transfers' },
  { id: 'changes',    icon: RefreshCw,   title: 'Policy Changes' },
  { id: 'contact',    icon: Mail,        title: 'Contact Us' },
];

export default function PrivacyPage() {
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
              Effective {LAST_UPDATED}
            </div>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] text-white md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[#c2d8cb] md:text-lg">
            Your privacy matters. This policy explains what data we collect, how we use
            it, and the controls you have over your information on ZingZing.
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

                <Section id="overview" icon={ShieldCheck} title="Overview">
                  <p>
                    ZingZing (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the ZingZing
                    influencer-marketing platform at zingzing.pk. This Privacy Policy describes how
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
                    'Profile photo, bio, social-media handles, and content categories.',
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
                    Public profile information (name, photo, content categories, follower counts) is visible to all
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
                    <a href="mailto:legal@zingzing.pk" className="font-semibold text-[#2d6b4e] underline decoration-[#2d6b4e]/30 underline-offset-2 hover:decoration-[#2d6b4e]">
                      legal@zingzing.pk
                    </a>{' '}
                    from your registered address. We will respond within 30 days.
                  </p>
                </Section>

                <Section id="transfers" icon={Globe} title="International Transfers">
                  <p>
                    ZingZing is headquartered in Pakistan. Our infrastructure uses cloud providers
                    whose servers may be located in other countries. Where data is transferred outside
                    Pakistan, we ensure appropriate safeguards are in place through contractual
                    obligations aligned with international data-protection best practices and applicable
                    Pakistan data-protection requirements.
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
                  <div className="mt-4 rounded-2xl border border-[#d9e0d8] bg-[#f4f2e9] p-5 text-sm">
                    <p className="font-bold text-[#1e3d2e]">ZingZing — Data Protection</p>
                    <p className="mt-1 text-[#526259]">
                      Email:{' '}
                      <a href="mailto:legal@zingzing.pk" className="font-semibold text-[#2d6b4e] hover:underline">
                        legal@zingzing.pk
                      </a>
                    </p>
                    <p className="mt-0.5 text-[#526259]">
                      General support:{' '}
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
                    <p className="font-extrabold text-white">Questions about your data?</p>
                    <p className="mt-0.5 text-sm text-[#8fa098]">
                      Our team is happy to walk you through your rights and how we protect your information.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2.5">
                    <Link
                      href="/terms"
                      className="inline-flex h-9 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15"
                    >
                      Terms of Service
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#e6aa38] px-4 text-sm font-bold text-[#1e3d2e] transition hover:bg-[#d49a28]"
                    >
                      Contact Us <ChevronRight className="h-3.5 w-3.5" />
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
      <div className="space-y-3 text-sm leading-relaxed text-[#526259]">{children}</div>
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

function InfoList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2d6b4e]/70" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function HighlightBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#d9e0d8] bg-[#e7f0ea] px-4 py-3 text-sm text-[#1e3d2e]">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#2d6b4e]" />
      <span>{children}</span>
    </div>
  );
}
