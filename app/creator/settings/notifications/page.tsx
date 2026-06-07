import { redirect } from 'next/navigation';

export default function CreatorNotificationsSettingsPage() {
  redirect('/creator/settings/preferences?tab=notifications');
}

