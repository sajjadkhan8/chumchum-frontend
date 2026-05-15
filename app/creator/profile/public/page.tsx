import { redirect } from 'next/navigation';

export default function CreatorPublicProfileSettingsPage() {
  redirect('/creator/settings?tab=profile');
}

