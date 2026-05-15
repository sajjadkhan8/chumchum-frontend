import { redirect } from 'next/navigation';

export default function CreatorActiveOrdersPage() {
  redirect('/creator/orders?status=in_progress');
}

