import { redirect } from 'next/navigation';

export default function CreatorCompletedOrdersPage() {
  redirect('/creator/orders?status=completed');
}

