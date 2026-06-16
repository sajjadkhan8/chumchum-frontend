import { redirect } from 'next/navigation';

export default function BrandOfferIdRedirect({ params }: { params: { id: string } }) {
  redirect(`/brand/campaigns/${params.id}`);
}
