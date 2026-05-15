import { redirect } from 'next/navigation';

export default function CreatorDraftPackagesPage() {
  redirect('/creator/packages?status=draft');
}

