import { redirect } from 'next/navigation';

export default function CreatorNotificationsSettingsPage() {
  redirect('/creator/settings?tab=notifications');
}

