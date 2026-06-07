import { Suspense } from 'react';
import { CreatorSettingsPageContent } from '../page';

export default function CreatorPreferencesSettingsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-6" />}>
      <CreatorSettingsPageContent section="settings" />
    </Suspense>
  );
}

