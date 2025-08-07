'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Collection, SchemaProperty } from '@/types';
import AddDataModal from '@/components/AddDataModal';
import ViewRecordModal from '@/components/ViewRecordModal';
import EditDataModal from '@/components/EditDataModal';
import JsonModal from '@/components/JsonModal';
import { useNotifications } from '@/contexts/NotificationContext';
import { apiFetch } from '@/lib/api-client';
import './records-table.css';

interface CollectionMetadata {
  count: number;
  size: number;
  firstWrite: Date;
  lastWrite: Date;
  schema: Record<string, unknown>;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const { addNotification } = useNotifications();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [metadata, setMetadata] = useState<CollectionMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [showAddDataModal, setShowAddDataModal] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [showSchemaModal, setShowSchemaModal] = useState(false);

  useEffect(() => {
    if (!collectionId) return;

    const fetchCollectionData = async () => {
      try {
        setLoading(true);
        setRecordsLoading(true);

        // Fetch collection metadata
        const metadataResponse = await apiFetch(
          `/api/collections/${collectionId}`
        );
        if (!metadataResponse.ok) {
          throw new Error(
            `Failed to fetch collection: ${metadataResponse.status}`
          );
        }

        const metadataData = await metadataResponse.json();
        if (!metadataData.success) {
          throw new Error(metadataData.error || 'Failed to fetch collection');
        }

        // Create collection object with available data from API
        const schema = metadataData.schema;

        const collectionData: Collection = {
          _id: collectionId,
          name: metadataData.collectionInfo.name,
          type: metadataData.collectionInfo.type,
          schema: schema,
          description: `Created: ${
            metadataData.metadata.first_write
              ? new Date(metadataData.metadata.first_write).toLocaleDateString()
              : 'Unknown'
          }`,
          createdAt:
            metadataData.metadata.first_write || new Date().toISOString(),
        };

        setCollection(collectionData);
        setMetadata({
          count: metadataData.metadata.count,
          size: metadataData.metadata.size,
          firstWrite: metadataData.metadata.first_write
            ? new Date(metadataData.metadata.first_write)
            : new Date(),
          lastWrite: metadataData.metadata.last_write
            ? new Date(metadataData.metadata.last_write)
            : new Date(),
          schema: schema,
        });

        // Fetch records immediately after collection is loaded
        try {
          const response = await apiFetch(`/api/data/${collectionId}`);
          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || 'Failed to fetch records');
          }

          setRecords(data.data || []);
          setRecordsError(null);
        } catch (recordsErr) {
          setRecordsError(recordsErr instanceof Error ? recordsErr.message : 'Failed to load records');
        }
      } catch (err) {
        // Failed to load collection data
        setError(
          err instanceof Error ? err.message : 'Failed to load collection'
        );
      } finally {
        setLoading(false);
        setRecordsLoading(false);
      }
    };

    fetchCollectionData();
  }, [collectionId]);

  const fetchCollectionMetadata = async () => {
    try {
      // Fetch collection metadata to update stats
      const metadataResponse = await apiFetch(`/api/collections/${collectionId}`);
      if (metadataResponse.ok) {
        const metadataData = await metadataResponse.json();
        if (metadataData.success) {
          setMetadata({
            count: metadataData.metadata.count,
            size: metadataData.metadata.size,
            firstWrite: metadataData.metadata.first_write
              ? new Date(metadataData.metadata.first_write)
              : new Date(),
            lastWrite: metadataData.metadata.last_write
              ? new Date(metadataData.metadata.last_write)
              : new Date(),
            schema: metadataData.schema,
          });
        }
      }
    } catch (err) {
      // Failed to refresh metadata
    }
  };

  const fetchRecords = async () => {
    try {
      setRecordsLoading(true);
      setRecordsError(null);

      const response = await apiFetch(`/api/data/${collectionId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch records');
      }

      setRecords(data.data || []);
    } catch (err) {
      setRecordsError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRecordsLoading(false);
    }
  };

  const refreshData = async () => {
    // Refresh both records and metadata
    await Promise.all([fetchRecords(), fetchCollectionMetadata()]);
  };


  const handleEdit = (record: any) => {
    setEditingRecord(record);
  };

  // Helper to format complex data for table display
  const formatValueForTable = (
    value: any,
    property: SchemaProperty
  ): React.ReactNode => {
    if (value === undefined || value === null) {
      return <span className="text-gray-400 italic">-</span>;
    }

    // Handle encrypted fields
    const isEncrypted =
      property.type === 'object' && property.properties?.['%share'];
    if (isEncrypted) {
      return (
        <span className="text-gray-500 dark:text-gray-400 font-mono">***</span>
      );
    }

    // Handle different data types
    switch (property.type) {
      case 'array':
        if (Array.isArray(value)) {
          const itemCount = value.length;
          if (itemCount === 0) {
            return <span className="text-gray-400 italic">Empty array</span>;
          }

          // Show array length and preview of first item
          let preview = '';
          if (itemCount > 0 && property.items) {
            const firstItem = value[0];
            if (property.items.type === 'object') {
              // For object items, show a key count or key names
              if (firstItem && typeof firstItem === 'object') {
                const keys = Object.keys(firstItem);
                preview =
                  keys.length > 0
                    ? ` {${keys.slice(0, 2).join(', ')}${
                        keys.length > 2 ? '...' : ''
                      }}`
                    : ' {}';
              }
            } else if (property.items.type === 'string') {
              preview = firstItem
                ? ` "${String(firstItem).slice(0, 20)}${
                    String(firstItem).length > 20 ? '...' : ''
                  }"`
                : '';
            } else {
              preview = firstItem !== undefined ? ` ${String(firstItem)}` : '';
            }
          }

          return (
            <span className="text-gray-700 dark:text-gray-300">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </span>
              {preview && (
                <span className="text-xs text-gray-500 ml-1">{preview}</span>
              )}
            </span>
          );
        }
        return <span className="text-gray-400 italic">Invalid array</span>;

      case 'object':
        if (value && typeof value === 'object') {
          const keys = Object.keys(value);
          if (keys.length === 0) {
            return <span className="text-gray-400 italic">Empty object</span>;
          }

          // Show object with key count and key names
          const keyPreview = keys.slice(0, 3).join(', ');
          const hasMore = keys.length > 3;

          return (
            <span className="text-gray-700 dark:text-gray-300">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {keys.length} field{keys.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                {keyPreview}
                {hasMore ? '...' : ''}
              </span>
            </span>
          );
        }
        return <span className="text-gray-400 italic">Invalid object</span>;

      case 'boolean':
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              value
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            {value ? 'True' : 'False'}
          </span>
        );

      case 'number':
      case 'integer':
        return (
          <span className="font-mono text-gray-900 dark:text-gray-100">
            {value}
          </span>
        );

      case 'string':
      default:
        const stringValue = String(value);
        if (stringValue.length > 50) {
          return (
            <span
              className="text-gray-900 dark:text-gray-100"
              title={stringValue}
            >
              {stringValue.slice(0, 47)}...
            </span>
          );
        }
        return (
          <span className="text-gray-900 dark:text-gray-100">
            {stringValue}
          </span>
        );
    }
  };

  const handleDeleteCollection = async () => {
    if (!confirm('Are you sure you want to delete this entire collection? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiFetch(`/api/collections/${collectionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete collection');
      }

      addNotification({
        type: 'success',
        title: 'Collection deleted',
        message: `Collection "${collection?.name}" has been deleted successfully.`,
      });

      // Redirect to collections list
      router.push('/collections');
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: err instanceof Error ? err.message : 'Failed to delete collection',
      });
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const response = await apiFetch(
        `/api/data/${collectionId}?filter=${encodeURIComponent(
          JSON.stringify({ _id: recordId })
        )}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete record');
      }

      addNotification({
        type: 'success',
        title: 'Record deleted',
        message: 'The record has been successfully deleted',
      });

      await refreshData();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete record';
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: errorMessage,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading collection...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light text-gray-900 dark:text-gray-100 mb-4">
            Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/collections')}
            className="px-6 py-3 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light text-gray-900 dark:text-gray-100 mb-6">
            Collection Not Found
          </h1>
          <button
            onClick={() => router.push('/collections')}
            className="px-6 py-3 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-4">
        {/* Header */}
        <div className="mb-12">
          <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-8">
              {/* Header with name on left, type and buttons on right */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                  <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-white mb-3">
                    {collection.name}
                  </h1>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {collection._id}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(collection._id);
                        addNotification({
                          type: 'success',
                          title: 'ID copied',
                          message: 'Collection ID has been copied to clipboard',
                          duration: 2000,
                        });
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-300"
                      title="Copy collection ID"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-none tracking-wide">
                    {collection.type.toUpperCase()}
                  </span>
                  <button
                    onClick={() => setShowSchemaModal(true)}
                    className="inline-flex items-center px-4 py-2 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    View Schema
                  </button>
                  <button 
                    onClick={handleDeleteCollection}
                    className="inline-flex items-center px-4 py-2 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete Collection
                  </button>
                </div>
              </div>

              {/* Stats section */}
              {metadata && (
                <div className="grid grid-cols-4 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Created
                    </div>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {metadata.firstWrite
                        ? new Date(metadata.firstWrite).toLocaleDateString()
                        : 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Last Updated
                    </div>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {metadata.lastWrite
                        ? new Date(metadata.lastWrite).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Records
                    </div>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {metadata.count}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Size
                    </div>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {(metadata.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Records Section */}
        <div className="my-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl text-2xl font-light text-gray-900 dark:text-white">
              Records ({records.length})
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={refreshData}
                disabled={recordsLoading}
                className="px-4 py-2 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-md"
              >
                {recordsLoading ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={() => setShowAddDataModal(true)}
                className="px-4 py-2 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Add Data
              </button>
            </div>
          </div>

          {recordsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Loading records...
              </p>
            </div>
          ) : recordsError ? (
            <div className="text-center py-8">
              <div className="text-red-600 dark:text-red-400">
                <p className="font-semibold">Error loading records</p>
                <p className="text-sm mt-1">{recordsError}</p>
                <button
                  onClick={refreshData}
                  className="mt-4 px-4 py-2 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-gray-400 text-5xl mb-4">📄</div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No records yet
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This collection doesn't contain any records yet.
              </p>
              <button
                onClick={() => setShowAddDataModal(true)}
                className="px-6 py-2 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Add First Record
              </button>
            </div>
          ) : (
            <div className="relative overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg mt-4">
              <div className="overflow-x-auto">
                <table className="relative w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      {/* Sticky ID column */}
                      <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                        ID
                      </th>
                      {/* Dynamic columns for other fields */}
                      {Object.entries(collection.schema.items.properties)
                        .filter(([fieldName]) => fieldName !== '_id')
                        .map(([fieldName, property]) => (
                          <th
                            key={fieldName}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                          >
                            {fieldName}
                            {(property as SchemaProperty).type === 'object' &&
                              (property as SchemaProperty).properties?.[
                                '%share'
                              ] && (
                                <span className="ml-1 text-yellow-600">🔒</span>
                              )}
                          </th>
                        ))}
                      {/* Sticky Actions column */}
                      <th className="sticky right-0 z-10 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-l border-gray-200 dark:border-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {records.map((record, index) => (
                      <tr
                        key={record._id || index}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {/* Sticky ID cell */}
                        <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-mono text-xs border-r border-gray-200 dark:border-gray-600">
                          {record._id || 'N/A'}
                        </td>
                        {/* Dynamic cells for other fields */}
                        {Object.entries(collection.schema.items.properties)
                          .filter(([fieldName]) => fieldName !== '_id')
                          .map(([fieldName, property]) => {
                            const value = record[fieldName];

                            return (
                              <td
                                key={fieldName}
                                className="px-4 py-3 text-sm whitespace-nowrap"
                              >
                                {formatValueForTable(
                                  value,
                                  property as SchemaProperty
                                )}
                              </td>
                            );
                          })}
                        {/* Sticky Actions cell */}
                        <td className="sticky right-0 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 text-center border-l border-gray-200 dark:border-gray-600">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => setViewingRecord(record)}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                              title="View full record"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                              title="Edit record"
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(record._id)}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                              title="Delete record"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Data Modal */}
      {collection && (
        <AddDataModal
          collection={collection}
          isOpen={showAddDataModal}
          onClose={() => setShowAddDataModal(false)}
          onSuccess={refreshData}
        />
      )}

      {/* View Record Modal */}
      <ViewRecordModal
        record={viewingRecord}
        isOpen={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
      />

      {/* Edit Record Modal */}
      {collection && editingRecord && (
        <EditDataModal
          collection={collection}
          record={editingRecord}
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={refreshData}
        />
      )}

      {/* Schema Modal */}
      {collection && (
        <JsonModal
          title="Collection Schema"
          subtitle={`Schema for ${collection.name}`}
          data={collection.schema}
          isOpen={showSchemaModal}
          onClose={() => setShowSchemaModal(false)}
        />
      )}
    </div>
  );
}
