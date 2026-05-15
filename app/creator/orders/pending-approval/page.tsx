import { redirect } from 'next/navigation';

export default function CreatorPendingApprovalOrdersPage() {
  redirect('/creator/orders?status=pending');
}

