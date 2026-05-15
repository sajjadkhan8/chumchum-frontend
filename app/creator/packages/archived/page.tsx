import { redirect } from 'next/navigation';

export default function CreatorArchivedPackagesPage() {
  redirect('/creator/packages?status=archived');
}

