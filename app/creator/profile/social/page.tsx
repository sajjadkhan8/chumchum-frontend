import { Suspense } from 'react';
import { CreatorSettingsPageContent } from '../../settings/page';

export default function CreatorSocialProfileSettingsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-6" />}>
      <CreatorSettingsPageContent section="social" />
    </Suspense>
  );
}

