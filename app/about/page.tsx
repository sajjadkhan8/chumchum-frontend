import Link from 'next/link';
import { ArrowRight, CheckCircle2, Handshake, Rocket, Shield, Users, Zap } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function AboutPage() {
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
      title: 'Send and negotiate offers',
      description: 'Use paid, barter, or hybrid offers with clear deliverables and timelines.',
    },
    {
      step: '03',
      icon: CheckCircle2,
      title: 'Deliver and scale',
      description: 'Track submissions, approve outcomes, and repeat top-performing collaborations.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
            <Badge variant="secondary" className="rounded-full text-xs font-medium">
              About ZingZing
            </Badge>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Built for modern creator-brand partnerships</h1>
            <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
              ZingZing is Saudi Arabia&apos;s collaboration platform where brands discover the right creators,
              negotiate clear deals, and manage campaign execution with confidence.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span><strong className="text-foreground">5,000+</strong> Active creators</span>
              <span><strong className="text-foreground">25,000+</strong> Campaigns completed</span>
              <span><strong className="text-foreground">500+</strong> Trusted brands</span>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Why teams choose ZingZing</h2>
          <p className="mt-2 text-muted-foreground">Everything needed to run influencer campaigns without scattered tools or guesswork.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="border-border/70">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <pillar.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{pillar.description}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">How ZingZing works</h2>
          <p className="mt-2 text-muted-foreground">A simple three-step workflow to launch and scale collaborations.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((item) => (
              <Card key={item.step} className="relative overflow-hidden border-border/70">
                <CardHeader>
                  <span className="absolute -right-4 -top-4 text-7xl font-bold text-primary/5">{item.step}</span>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{item.description}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 pb-14">
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">Ready to launch your next campaign?</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Create your account and start collaborating in minutes.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/help">Visit Help Center</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup" className="flex items-center gap-1.5">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

