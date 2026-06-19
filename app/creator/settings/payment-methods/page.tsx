import { redirect } from 'next/navigation';

export default function CreatorPaymentMethodsSettingsPage() {
  redirect('/creator/payments?tab=methods');
}

