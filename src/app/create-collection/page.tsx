'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import CollectionForm from '@/components/CollectionForm';
import { Collection } from '@/types';
import { useNotifications } from '@/contexts/NotificationContext';
import { apiFetch } from '@/lib/api-client';

export default function CreateCollectionPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCollection = async (
    collectionData: Omit<
      Collection,
      '_id' | 'createdAt' | 'updatedAt' | 'description'
    >
  ) => {
    setIsCreating(true);
    try {
      const response = await apiFetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collectionData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create collection');
      }

      // Show success notification with collection name
      addNotification({
        type: 'success',
        title: 'Collection created successfully',
        message: `Collection "${collectionData.name}" has been created`,
      });

      // Redirect to the collections list
      router.push('/collections');
    } catch (error) {
      // Show error notification with collection name
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addNotification({
        type: 'error',
        title: 'Failed to create collection',
        message: `Could not create collection "${collectionData.name}": ${errorMessage}`,
      });
      setIsCreating(false); // Reset loading state on error
    }
  };

  const handleCancel = () => {
    router.push('/collections');
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 pt-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-light tracking-tight text-gray-900 dark:text-gray-100">
              Create New Collection
            </h1>
          </div>
          <Suspense fallback={
            <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                <div className="space-y-4">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          }>
            <CollectionForm
              onSubmit={handleCreateCollection}
              onCancel={handleCancel}
              isLoading={isCreating}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
