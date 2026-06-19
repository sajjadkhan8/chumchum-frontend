'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BrandOfferWizard } from '@/components/brand-offer-wizard';

export default function BrandCampaignEditPage() {
  const params = useParams<{ id: string }>();

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  return <BrandOfferWizard offerId={params.id} />;
}
