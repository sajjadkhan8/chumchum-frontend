import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandBanner } from '@/components/brand-banner';

const plans = [
  {
    name: 'Starter',
    price: 'SAR 0',
    description: 'Perfect for first-time collaborations in Saudi Arabia.',
    features: ['Browse creators', 'Send 5 offers/month', 'Basic campaign tracking'],
  },
  {
    name: 'Growth',
    price: 'SAR 19,500/mo',
    description: 'For scaling brands running multiple influencer campaigns.',
    features: ['Unlimited offers', 'Priority chat support', 'Performance insights'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For teams managing regional creator programs.',
    features: ['Dedicated manager', 'Team permissions', 'Verification workflow'],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        <BrandBanner variant="light" className="mb-8 h-28 w-full md:h-36" />
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Pricing</h1>
          <p className="mt-2 text-muted-foreground">
            Simple plans designed for Saudi Arabia-first influencer campaigns.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-2xl font-bold text-primary">{plan.price}</p>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

