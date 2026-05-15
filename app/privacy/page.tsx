import { Navbar } from '@/components/navbar';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
        <h1 className="text-3xl font-bold md:text-4xl">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
          <p>ChamCham stores profile, campaign, and message data to enable creator-brand collaboration workflows.</p>
          <p>We do not sell personal user data. Data is used to improve matching, messaging, and marketplace safety.</p>
          <p>You can request account data removal by contacting support@chamcham.pk from your registered email.</p>
        </div>
      </main>
    </div>
  );
}

