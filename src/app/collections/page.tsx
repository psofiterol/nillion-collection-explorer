'use client';

import { useState } from 'react';
import CollectionList from '@/components/CollectionList';

export default function CollectionsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 pt-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <CollectionList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
