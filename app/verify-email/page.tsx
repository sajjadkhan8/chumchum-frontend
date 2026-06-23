'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, MailWarning } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { authService } from '@/services/auth.service';

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }
    authService.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email is verified.');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Could not verify this email link.');
      });
  }, [token]);

  return (
    <AuthShell eyebrow="Email verification" title="Confirm your email." description="This keeps account recovery and trust signals tied to a verified inbox.">
      <div className="text-center">
        {status === 'loading' ? (
          <Loader2 className="mx-auto size-10 animate-spin text-[#2d6b4e]" />
        ) : status === 'success' ? (
          <CheckCircle className="mx-auto size-12 text-[#2d6b4e]" />
        ) : (
          <MailWarning className="mx-auto size-12 text-[#b45309]" />
        )}
        <h2 className="mt-4 text-2xl font-extrabold text-[#1e3d2e]">{message || 'Verifying...'}</h2>
        <Link href="/login" className="mt-5 inline-flex rounded-full bg-[#2d6b4e] px-5 py-2.5 text-sm font-bold text-white">
          Continue to login
        </Link>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfaf5]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
