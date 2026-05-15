import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, FolderOpen, Megaphone, ShieldCheck, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const featuredResources = [
  {
    icon: Megaphone,
    title: 'Campaign Brief Starter Kit',
    description: 'Use this structure to align goals, deliverables, budget, and timelines before outreach.',
    href: '/contact',
    cta: 'Request Sample Brief',
  },
  {
    icon: ShieldCheck,
    title: 'Content Compliance Checklist',
    description: 'A practical checklist for disclosures, approvals, and safe publishing across social platforms.',
    href: '/terms',
    cta: 'Review Policies',
  },
  {
    icon: BookOpen,
    title: 'Creator Pricing Playbook',
    description: 'Learn how to package paid, barter, and hybrid offers with clear scope and revision rules.',
    href: '/about',
    cta: 'See Workflow',
  },
];

const resourceGroups = [
  {
    title: 'For Brands',
    icon: FolderOpen,
    items: [
      {
        title: 'Brand Campaign Brief Template',
        description: 'A concise brief format that helps creators reply faster and with accurate pricing.',
      },
      {
        title: 'Influencer Vetting Scorecard',
        description: 'Evaluate fit by niche alignment, engagement quality, audience geography, and content style.',
      },
      {
        title: 'Post-Campaign Performance Review',
        description: 'Track campaign ROI with a repeatable report for reach, conversions, and content reuse.',
      },
    ],
  },
  {
    title: 'For Creators',
    icon: Sparkles,
    items: [
      {
        title: 'Creator Rate Card Guide',
        description: 'How to structure deliverables, platform-specific rates, and usage rights pricing.',
      },
      {
        title: 'Client Discovery Questionnaire',
        description: 'Ask the right questions before accepting a collaboration to avoid scope creep.',
      },
      {
        title: 'Content Handover Checklist',
        description: 'Share draft files, final exports, captions, and posting schedule in one clean package.',
      },
    ],
  },
  {
    title: 'Trust & Legal',
    icon: FileText,
    items: [
      {
        title: 'Pakistan Content Compliance Tips',
        description: 'Best practices for clear sponsorship disclosures and campaign safety requirements.',
      },
      {
        title: 'Dispute Prevention Playbook',
        description: 'Set acceptance criteria and revision limits early to prevent delivery disputes.',
      },
      {
        title: 'Data Protection Request Template',
        description: 'A ready-to-use format for account deletion and privacy-related data requests.',
      },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
            <Badge variant="secondary" className="rounded-full text-xs font-medium">
              Resource Library
            </Badge>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Templates and playbooks for better campaigns</h1>
            <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">
              Practical resources for brands and creators to plan faster, negotiate clearly,
              and run higher-quality collaborations on ChamCham.
            </p>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Featured toolkits</h2>
          <p className="mt-2 text-sm text-muted-foreground">Start here if you are setting up a new campaign workflow.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featuredResources.map((resource) => (
              <Card key={resource.title} className="border-border/70">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <resource.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{resource.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>{resource.description}</p>
                  <Link href={resource.href} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                    {resource.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Resource collections</h2>
          <p className="mt-2 text-sm text-muted-foreground">Organized by workflow so each team can find what they need quickly.</p>

          <div className="mt-8 space-y-6">
            {resourceGroups.map((group) => (
              <Card key={group.title} className="border-border/70">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <group.icon className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{group.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  {group.items.map((item) => (
                    <div key={item.title} className="rounded-xl border border-border/70 bg-muted/30 p-4">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 pb-14">
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">Need help applying these resources?</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Visit support or contact the team to adapt these templates to your campaign goals.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/help">Help Center</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/contact" className="flex items-center gap-1.5">
                  Contact Support <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

