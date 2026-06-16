import { redirect } from 'next/navigation';

export default function BrandOfferEditRedirect({ params }: { params: { id: string } }) {
  redirect(`/brand/campaigns/${params.id}/edit`);
}
