import { redirect } from 'next/navigation';

export default function CreatorCancelledOrdersPage() {
  redirect('/creator/orders?status=cancelled');
}

