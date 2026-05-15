import { redirect } from 'next/navigation';

export default function CreatorPreferencesSettingsPage() {
  redirect('/creator/settings?tab=preferences');
}

