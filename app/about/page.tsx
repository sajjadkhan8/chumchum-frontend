import Link from 'next/link';
import { ArrowRight, CheckCircle2, Handshake, Rocket, Shield, Users, Zap } from 'lucide-react';
import { Navbar } from '@/components/navbar';

const pillars = [
  {
    icon: Users,
    title: 'Creator-first marketplace',
    description:
      'Creators own their profiles, define packages, and collaborate with brands that align with their niche and audience.',
  },
  {
    icon: Shield,
    title: 'Trust and transparency',
    description:
      'Verified profiles, clear brief requirements, and structured deal flows reduce confusion and protect both sides.',
  },
  {
    icon: Zap,
    title: 'Fast campaign execution',
    description:
      'Messaging, offer negotiation, and order tracking happen in one place so campaigns move from idea to delivery faster.',
  },
];

const steps = [
  {
    step: '01',
    icon: Rocket,
    title: 'Discover creators',
    description: 'Search by city, niche, platform, and budget to shortlist ideal creator partners.',
  },
  {
    step: '02',
    icon: Handshake,
    title: 'Send and manage campaigns',
    description: 'Use paid, barter, or hybrid campaigns with clear deliverables and timelines.',
  },
  {
    step: '03',
    icon: CheckCircle2,
    title: 'Deliver and scale',
    description: 'Track submissions, approve outcomes, and repeat top-performing collaborations.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fbfaf5]">
      <Navbar />

      <main>
        {/* Hero */}
        <div className="bg-[#1e3d2e] px-4 pt-8 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#f0c56e]">
              About ZingZing
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] text-white md:text-5xl">
              Built for modern creator&#8209;brand partnerships
            </h1>
            <p className="mt-3 max-w-3xl text-base text-[#c2d8cb] md:text-lg">
              ZingZing is Pakistan&apos;s collaboration platform where brands discover the right creators,
              negotiate clear deals, and manage campaign execution with confidence.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-6 text-sm text-[#8fa098]">
              <span><strong className="font-extrabold text-white">5,000+</strong> Active creators</span>
              <span><strong className="font-extrabold text-white">25,000+</strong> Campaigns completed</span>
              <span><strong className="font-extrabold text-white">500+</strong> Trusted brands</span>
            </div>
          </div>
        </div>

        <div className="mx-auto -mt-8 max-w-7xl space-y-3 px-4 pb-24 sm:px-6 lg:px-8">

          {/* Pillars */}
          <div className="overflow-hidden rounded-[1.75rem] border border-[#d9e0d8] bg-white p-6 shadow-[0_18px_60px_rgba(38,70,50,0.07)] sm:p-8">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-[#1e3d2e] md:text-3xl">
              Why teams choose ZingZing
            </h2>
            <p className="mt-2 text-sm text-[#526259]">
              Everything needed to run influencer campaigns without scattered tools or guesswork.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="rounded-2xl border border-[#d9e0d8] bg-[#fbfaf5] p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f0ea]">
                    <pillar.icon className="h-5 w-5 text-[#2d6b4e]" />
                  </div>
                  <h3 className="font-extrabold text-[#1e3d2e]">{pillar.title}</h3>
                  <p className="mt-1.5 text-sm text-[#526259]">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="overflow-hidden rounded-[1.75rem] border border-[#d9e0d8] bg-white p-6 shadow-[0_18px_60px_rgba(38,70,50,0.07)] sm:p-8">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-[#1e3d2e] md:text-3xl">
              How ZingZing works
            </h2>
            <p className="mt-2 text-sm text-[#526259]">
              A simple three-step workflow to launch and scale collaborations.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {steps.map((item) => (
                <div key={item.step} className="relative overflow-hidden rounded-2xl border border-[#d9e0d8] bg-[#fbfaf5] p-5">
                  <span className="absolute -right-3 -top-3 select-none text-7xl font-black text-[#d9e0d8]">
                    {item.step}
                  </span>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f0ea]">
                    <item.icon className="h-5 w-5 text-[#2d6b4e]" />
                  </div>
                  <h3 className="font-extrabold text-[#1e3d2e]">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-[#526259]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-start gap-4 rounded-[1.75rem] bg-[#1e3d2e] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-extrabold text-white">Ready to launch your next campaign?</p>
              <p className="mt-0.5 text-sm text-[#8fa098]">Create your account and start collaborating in minutes.</p>
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
