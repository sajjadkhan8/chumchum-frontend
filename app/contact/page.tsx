import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
        <h1 className="text-3xl font-bold md:text-4xl">Contact Us</h1>
        <p className="mt-2 text-muted-foreground">We are here to help with campaigns, creator onboarding, and verification.</p>
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Support Channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Email: support@chamcham.pk</p>
            <p>Phone: +92 42 111 224 226</p>
            <p>Office: Gulberg III, Lahore, Pakistan</p>
            <p>Hours: Mon-Sat, 10:00 AM - 7:00 PM PKT</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

