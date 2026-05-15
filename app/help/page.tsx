import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const faqs = [
  {
    q: 'How do barter deals work on ChamCham?',
    a: 'Brands define the offer details and estimated value, and creators can accept or negotiate in chat.',
  },
  {
    q: 'Can I run hybrid campaigns?',
    a: 'Yes, hybrid deals combine a cash amount with a barter item or service in one offer.',
  },
  {
    q: 'How quickly do creators respond?',
    a: 'Response time varies by creator; each profile shows their expected response speed.',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-10 md:py-14">
        <h1 className="text-3xl font-bold md:text-4xl">Help Center</h1>
        <p className="mt-2 text-muted-foreground">Answers to common product and campaign questions.</p>
        <div className="mt-8 space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.q}>
              <CardHeader>
                <CardTitle className="text-base">{faq.q}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{faq.a}</CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

