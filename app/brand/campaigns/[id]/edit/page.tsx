'use client';

import { useParams } from 'next/navigation';
import { BrandOfferWizard } from '@/components/brand-offer-wizard';

export default function BrandCampaignEditPage() {
  const params = useParams<{ id: string }>();
  return <BrandOfferWizard offerId={params.id} />;
}
