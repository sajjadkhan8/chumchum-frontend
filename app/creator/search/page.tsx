'use client';

import { useEffect } from 'react';
import { CreatorGlobalSearchResults } from '@/components/search/creator-global-search-results';

export default function CreatorSearchPage() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('creator-search-layout-mode', {
      detail: { hideSidebar: true },
    }));

    return () => {
      window.dispatchEvent(new CustomEvent('creator-search-layout-mode', {
        detail: { hideSidebar: false },
      }));
    };
  }, []);

  return <CreatorGlobalSearchResults />;
}
