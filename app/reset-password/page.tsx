'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    router.replace(token ? `/forgot-password?token=${token}` : '/forgot-password');
  }, [router, searchParams]);

  return null;
}

export default function ResetPasswordRedirect() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordRedirectInner />
    </Suspense>
  );
}
