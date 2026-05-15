import { redirect } from 'next/navigation';

export default function CreatorSocialProfileSettingsPage() {
  redirect('/creator/settings?tab=social');
}

