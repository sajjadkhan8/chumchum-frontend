'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { creatorsService } from '@/services/creators.service';

type Phase = 'loading' | 'success' | 'error';

function OAuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [platformName, setPlatformName] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = params.get('code');
    const state = params.get('state');
    const platform = params.get('platform') ?? state?.split(':')[0] ?? 'social';
    const error = params.get('error');

    setPlatformName(platform.charAt(0).toUpperCase() + platform.slice(1));

    if (error || !code) {
      setErrorMessage(
        error === 'access_denied'
          ? 'You denied access. No account was connected.'
          : error
            ? `OAuth error: ${error}`
            : 'No authorization code received. Please try again.',
      );
      setPhase('error');
      return;
    }

    creatorsService
      .completeSocialOAuthConnect(platform, code, state ?? undefined)
      .then(() => {
        setPhase('success');
        setTimeout(() => {
          router.replace('/creator/profile/social');
        }, 2000);
      })
      .catch((err: unknown) => {
        setErrorMessage(err instanceof Error ? err.message : 'Could not complete connection. Please try again.');
        setPhase('error');
      });
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbfaf5] px-4">
      <div className="w-full max-w-sm rounded-[1.6rem] border border-[#d1ddd6] bg-white p-8 shadow-[0_18px_55px_rgba(38,70,50,0.07)] text-center">
        {phase === 'loading' && (
          <>
            <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-[#e4f1e8]">
              <Loader2 className="size-8 animate-spin text-[#2d6b4e]" />
            </div>
            <h1 className="text-lg font-extrabold tracking-[-0.03em] text-[#1e3d2e]">
              Connecting {platformName}…
            </h1>
            <p className="mt-2 text-sm text-[#87938b]">
              Verifying your account with {platformName}. This only takes a moment.
            </p>
          </>
        )}

        {phase === 'success' && (
          <>
            <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-[#e4f1e8]">
              <CheckCircle className="size-8 text-[#2d6b4e]" />
            </div>
            <h1 className="text-lg font-extrabold tracking-[-0.03em] text-[#1e3d2e]">
              {platformName} connected!
            </h1>
            <p className="mt-2 text-sm text-[#87938b]">
              Your {platformName} account is now API-verified. Redirecting to your social accounts…
            </p>
          </>
        )}

        {phase === 'error' && (
          <>
            <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-[#fce8e6]">
              <AlertCircle className="size-8 text-[#c0392b]" />
            </div>
            <h1 className="text-lg font-extrabold tracking-[-0.03em] text-[#1e3d2e]">
              Connection failed
            </h1>
            <p className="mt-2 text-sm text-[#87938b]">{errorMessage}</p>
            <button
              onClick={() => router.replace('/creator/profile/social')}
              className="mt-6 w-full rounded-full bg-[#2d6b4e] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
            >
              Back to social accounts
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaf5]">
        <Loader2 className="size-8 animate-spin text-[#2d6b4e]" />
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
