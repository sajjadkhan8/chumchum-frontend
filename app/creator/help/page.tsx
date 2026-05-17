import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CreatorHelpPage() {
  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Help & Support</h1>
        <p className="text-muted-foreground">Get package optimization help and payout support for your creator business.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Package Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Learn how to price paid, barter, and hybrid packages.</p>
            <p>Improve conversion rates with stronger deliverables and thumbnails.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account & Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Configure STC Pay, Mada, Apple Pay, and Bank Transfer withdrawal settings.</p>
            <p>Review payout statuses and processing timelines.</p>
          </CardContent>
        </Card>
      </div>

      <Button asChild>
        <Link href="/contact">Contact Support</Link>
      </Button>
    </div>
  );
}

