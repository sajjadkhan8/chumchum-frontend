import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const resources = [
  { title: 'Creator Rate Card Guide', description: 'How to structure paid, barter, and hybrid packages.' },
  { title: 'Brand Campaign Brief Template', description: 'A practical brief format for faster creator responses.' },
  { title: 'Pakistan Content Compliance Tips', description: 'Best practices for disclosures and campaign clarity.' },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-10 md:py-14">
        <h1 className="text-3xl font-bold md:text-4xl">Resources</h1>
        <p className="mt-2 text-muted-foreground">
          Practical templates and playbooks to run better influencer collaborations.
        </p>
        <div className="mt-8 grid gap-4">
          {resources.map((resource) => (
            <Card key={resource.title}>
              <CardHeader>
                <CardTitle>{resource.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{resource.description}</CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Need help applying these? Visit <Link href="/help" className="text-primary hover:underline">Help Center</Link>.
        </p>
      </main>
    </div>
  );
}

