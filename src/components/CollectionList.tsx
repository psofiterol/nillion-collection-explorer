'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Collection } from '@/types';
import { apiFetch } from '@/lib/api-client';

interface CollectionListProps {
  refreshTrigger?: number;
}

export default function CollectionList({
  refreshTrigger,
}: CollectionListProps) {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch('/api/collections');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch collections');
      }

      setCollections(data.collections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [refreshTrigger]);

  const deleteCollection = async (
    collectionId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent selecting the collection

    if (
      !confirm(
        'Are you sure you want to delete this collection? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await apiFetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete collection');
      }

      // Refresh the list
      fetchCollections();
    } catch (err) {
      alert(
        `Failed to delete collection: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
    }
  };

  // Filter collections based on search input
  const filteredCollections = collections.filter((collection) => {
    if (!searchFilter.trim()) return true;

    const searchTerm = searchFilter.toLowerCase();
    const nameMatch = collection.name.toLowerCase().includes(searchTerm);
    const idMatch = collection._id.toLowerCase().includes(searchTerm);

    return nameMatch || idMatch;
  });

  // Reset to page 1 when search filter changes
  const handleSearchChange = (value: string) => {
    setSearchFilter(value);
    setCurrentPage(1);
  };

  // Paginate filtered collections
  const totalPages = Math.ceil(filteredCollections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCollections = filteredCollections.slice(startIndex, endIndex);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Loading collections...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <div className="text-red-600 dark:text-red-400">
            <p className="font-semibold">Error loading collections</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={fetchCollections}
              className="mt-4 px-6 py-3 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (filteredCollections.length === 0 && collections.length > 0) {
      return (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-gray-400 text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No matching collections
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No collections match your search criteria. Try a different search
            term.
          </p>
        </div>
      );
    }

    if (collections.length === 0) {
      return (
        <div className="text-center py-16 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-gray-300 dark:text-gray-600 text-8xl mb-8 opacity-20">
            📁
          </div>
          <h3 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-4 tracking-wide">
            No collections yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 font-light leading-relaxed max-w-md mx-auto">
            Create your first collection to start storing encrypted data with
            Nillion.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/create-collection')}
              className="px-8 py-3 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Create Your First Collection
            </button>
            <div>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-light tracking-wide transition-colors duration-300"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {paginatedCollections
            .filter((collection) => collection?._id)
            .map((collection) => (
              <div
                key={collection._id}
                className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-none bg-white dark:bg-gray-800"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-light text-lg tracking-wide text-gray-900 dark:text-gray-100 truncate">
                    {collection.name}
                  </h3>
                  <div className="flex space-x-1">
                    <span className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 leading-none font-medium tracking-wide uppercase">
                      {collection.type}
                    </span>
                    {/* <button
                      onClick={(e) => deleteCollection(collection._id, e)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-300"
                      title="Delete collection"
                    >
                      🗑️
                    </button> */}
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="font-light tracking-wide">ID:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                      {collection._id}
                    </span>
                  </div>
                </div>

                <div
                  className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 -mx-6 px-6 -mb-6 pb-6 transition-all duration-300"
                  onClick={() => router.push(`/collections/${collection._id}`)}
                >
                  <div className="flex justify-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-light tracking-wide opacity-75 hover:opacity-100 transition-opacity duration-300">
                      View Collection Details →
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to{' '}
              {Math.min(endIndex, filteredCollections.length)} of{' '}
              {filteredCollections.length} collections
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-900 dark:hover:border-gray-100 transition-all duration-300 font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 font-light tracking-wide">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-900 dark:hover:border-gray-100 transition-all duration-300 font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Collections header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-light tracking-tight text-gray-900 dark:text-gray-100">
            {searchFilter ? (
              <span>
                Collections ({filteredCollections.length} of{' '}
                {collections.length})
              </span>
            ) : (
              <span>Your Collections ({collections.length})</span>
            )}
          </h1>
          <button
            onClick={() => router.push('/create-collection')}
            className="px-4 py-2 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Create New Collection
          </button>
        </div>

        {/* Search bar */}
        <div className="max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2 pr-12 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-800 dark:text-white font-light tracking-wide transition-all duration-300"
              placeholder="Search by collection name or ID..."
            />
            {searchFilter && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 transition-colors duration-200"
                title="Clear search"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
