import { Navbar } from '@/components/navbar';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
        <h1 className="text-3xl font-bold md:text-4xl">Terms of Service</h1>
        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
          <p>By using ChamCham, you agree to use the platform for lawful collaborations and transparent campaign communication.</p>
          <p>Brands and creators are responsible for accurate deliverables, timely responses, and compliant content disclosures.</p>
          <p>Payment and barter terms are agreed between both parties before campaign execution. Platform misuse may result in account restrictions.</p>
        </div>
      </main>
    </div>
  );
}

