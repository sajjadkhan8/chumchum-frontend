import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-10 md:py-14">
        <h1 className="text-3xl font-bold md:text-4xl">How ChamCham Works</h1>
        <p className="mt-3 text-muted-foreground">
          ChamCham connects Pakistani brands with verified creators for paid, barter, and hybrid deals.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>1. Discover</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Filter by city, niche, platform, and budget to find the right match.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>2. Deal</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Send a quick offer and negotiate paid, barter, or hybrid terms in one place.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>3. Deliver</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Track order progress, review deliverables, and complete campaigns smoothly.
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

