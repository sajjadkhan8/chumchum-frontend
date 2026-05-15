import { redirect } from 'next/navigation';

export default function CreatorVerificationProfileSettingsPage() {
  redirect('/creator/settings?tab=security');
}

