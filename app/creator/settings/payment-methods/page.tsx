import { redirect } from 'next/navigation';

export default function CreatorPaymentMethodsSettingsPage() {
  redirect('/creator/settings?tab=payments');
}

