"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Collection } from "@/types";
import { apiFetch } from "@/lib/api-client";

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
  const [searchFilter, setSearchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch("/api/collections");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch collections");
      }

      setCollections(data.collections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
        "Are you sure you want to delete this collection? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await apiFetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to delete collection");
      }

      // Refresh the list
      fetchCollections();
    } catch (err) {
      alert(
        `Failed to delete collection: ${
          err instanceof Error ? err.message : "Unknown error"
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
          <div className="animate-spin h-8 w-8 border-b-2 border-nillion-primary mx-auto"></div>
          <p className="mt-2 text-nillion-text-secondary">
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
            <button onClick={fetchCollections} className="mt-4">
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (filteredCollections.length === 0 && collections.length > 0) {
      return (
        <div className="text-center py-12 nillion-card">
          <div className="text-5xl mb-4 opacity-20">🔍</div>
          <h3 className="mb-2">No matching collections</h3>
          <p className="text-nillion-text-secondary mb-4">
            No collections match your search criteria. Try a different search
            term.
          </p>
        </div>
      );
    }

    if (collections.length === 0) {
      return (
        <div className="text-center py-16 nillion-card">
          <div className="text-8xl mb-8 opacity-10">📁</div>
          <h3 className="mb-4">No collections yet</h3>
          <p className="text-nillion-text-secondary mb-8 max-w-md mx-auto">
            Create your first collection to start storing encrypted data with
            Nillion.
          </p>
          <div className="space-y-4">
            <button onClick={() => router.push("/create-collection")}>
              Create Your First Collection
            </button>
            <div>
              <button
                onClick={() => router.push("/")}
                className="nillion-button-ghost"
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
                className="nillion-card cursor-pointer hover:transform hover:-translate-y-1 transition-all duration-200"
                onClick={() => router.push(`/collections/${collection._id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="truncate flex-1 mr-2 text-lg">
                    {collection.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="nillion-badge">{collection.type}</span>
                  </div>
                </div>

                <div className="text-sm text-nillion-text-secondary mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0">ID:</span>
                    <span className="font-mono truncate">{collection._id}</span>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-nillion-border">
                  <span className="text-sm text-nillion-primary">
                    View Collection Details →
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-nillion-border">
            <p className="text-sm text-nillion-text-secondary">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredCollections.length)} of{" "}
              {filteredCollections.length} collections
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="nillion-button-outline nillion-small"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-nillion-text-secondary">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="nillion-button-outline nillion-small"
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
    <div>
      {/* Collections header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3>
          {searchFilter ? (
            <span>
              Collections ({filteredCollections.length} of {collections.length})
            </span>
          ) : (
            <span>Your Collections ({collections.length})</span>
          )}
        </h3>
        <button onClick={() => router.push("/create-collection")}>
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
            placeholder="Search by collection name or ID..."
            className="pr-10"
          />
          {searchFilter && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 nillion-button-ghost nillion-small"
              style={{ padding: "0.25rem" }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
