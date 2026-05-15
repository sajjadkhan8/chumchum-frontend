'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-md px-4 py-10 md:py-16">
        <Card>
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSubmitted(true);
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Account email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      className="pl-9"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Send reset link</Button>
              </form>
            ) : (
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>If an account exists for <span className="font-medium text-foreground">{email}</span>, a reset link has been sent.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Back to login</Link>
                </Button>
              </div>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-4 w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

