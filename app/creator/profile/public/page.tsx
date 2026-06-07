import { Suspense } from 'react';
import { CreatorSettingsPageContent } from '../../settings/page';

export default function CreatorPublicProfileSettingsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-6" />}>
      <CreatorSettingsPageContent section="profile" />
    </Suspense>
  );
}

