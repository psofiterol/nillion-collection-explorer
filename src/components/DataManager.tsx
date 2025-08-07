'use client';

import { useState, useEffect } from 'react';
import { Collection, CollectionRecord, SchemaProperty } from '@/types';
import { apiFetch } from '@/lib/api-client';

interface DataManagerProps {
  collection: Collection;
  onBack: () => void;
}

interface RecordFormData {
  [key: string]: any;
}

export default function DataManager({ collection, onBack }: DataManagerProps) {
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<RecordFormData>({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form data based on schema
  useEffect(() => {
    const initialData: RecordFormData = {};
    Object.entries(collection.schema.items.properties).forEach(([key, property]) => {
      if (key === '_id') {
        initialData[key] = ''; // Will be auto-generated if empty
      } else if (property.isSecret) {
        initialData[key] = { isSecret: true, value: '' };
      } else {
        initialData[key] = property.type === 'number' ? 0 : property.type === 'boolean' ? false : '';
      }
    });
    setFormData(initialData);
  }, [collection.schema]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFetch(`/api/data/${collection._id}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch records');
      }
      
      setRecords(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [collection._id]);

  const handleInputChange = (fieldName: string, value: any, property: SchemaProperty) => {
    if (property.isSecret) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: { isSecret: true, value }
      }));
    } else {
      let processedValue = value;
      if (property.type === 'number') {
        processedValue = parseFloat(value) || 0;
      } else if (property.type === 'boolean') {
        processedValue = value === 'true';
      }
      
      setFormData(prev => ({
        ...prev,
        [fieldName]: processedValue
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Prepare the data
      const recordData = { ...formData };
      
      // Remove empty _id to let the API generate one
      if (!recordData._id || recordData._id.trim() === '') {
        delete recordData._id;
      }
      
      const response = await apiFetch(`/api/data/${collection._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: recordData,
          type: collection.type,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to add record');
      }
      
      // Reset form and refresh data
      setShowAddForm(false);
      const initialData: RecordFormData = {};
      Object.entries(collection.schema.items.properties).forEach(([key, property]) => {
        if (key === '_id') {
          initialData[key] = '';
        } else if (property.isSecret) {
          initialData[key] = { isSecret: true, value: '' };
        } else {
          initialData[key] = property.type === 'number' ? 0 : property.type === 'boolean' ? false : '';
        }
      });
      setFormData(initialData);
      
      await fetchRecords();
    } catch (err) {
      alert(`Failed to add record: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }
    
    try {
      const response = await apiFetch(
        `/api/data/${collection._id}?filter=${encodeURIComponent(JSON.stringify({ _id: recordId }))}`,
        { method: 'DELETE' }
      );
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete record');
      }
      
      await fetchRecords();
    } catch (err) {
      alert(`Failed to delete record: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const renderFieldValue = (value: any, property: SchemaProperty) => {
    if (property.isSecret) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded text-sm">
          🔒 Encrypted
        </span>
      );
    }
    
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  const renderFormField = (fieldName: string, property: SchemaProperty) => {
    const isRequired = collection.schema.items.required.includes(fieldName);
    const value = property.isSecret ? formData[fieldName]?.value || '' : formData[fieldName];

    return (
      <div key={fieldName} className="space-y-2">
        <label className="block text-sm font-medium">
          {fieldName} {isRequired && <span className="text-red-500">*</span>}
          {property.isSecret && <span className="text-yellow-600 ml-1">🔒</span>}
        </label>
        
        {property.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400">{property.description}</p>
        )}
        
        {property.type === 'boolean' ? (
          <select
            value={String(value)}
            onChange={(e) => handleInputChange(fieldName, e.target.value, property)}
            className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-all duration-300"
            required={isRequired}
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </select>
        ) : (
          <input
            type={property.type === 'number' ? 'number' : property.isSecret ? 'password' : 'text'}
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value, property)}
            className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-all duration-300"
            placeholder={property.isSecret ? 'Enter secret value...' : `Enter ${fieldName}...`}
            required={isRequired}
            readOnly={fieldName === '_id' && !value} // Make _id readonly when auto-generating
          />
        )}
        
        {property.isSecret && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            This field will be encrypted and secret-shared across nodes
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-light tracking-wide transition-colors duration-300"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-gray-900 dark:text-gray-100">{collection.name}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {collection.type === 'owned' ? '👤 Owned Collection' : '🌐 Standard Collection'} • {records.length} records
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {showAddForm ? 'Cancel' : 'Add Record'}
        </button>
      </div>

      {/* Collection Info */}
      {collection.description && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">{collection.description}</p>
        </div>
      )}

      {/* Add Record Form */}
      {showAddForm && (
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <h3 className="text-xl font-light tracking-wide text-gray-900 dark:text-gray-100 mb-6">Add New Record</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.entries(collection.schema.items.properties).map(([fieldName, property]) =>
              renderFormField(fieldName, property)
            )}
            
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-none hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
              >
                {submitting ? 'Adding...' : 'Add Record'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                disabled={submitting}
                className="px-6 py-3 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records List */}
      <div>
        <h3 className="text-xl font-light tracking-wide text-gray-900 dark:text-gray-100 mb-6">Records</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading records...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 dark:text-red-400">
              <p className="font-semibold">Error loading records</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={fetchRecords}
                className="mt-4 px-4 py-2 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide"
              >
                Retry
              </button>
            </div>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-gray-400 text-5xl mb-4">📄</div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No records yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add your first record to start storing data in this collection.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-8 py-3 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Add First Record
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {Object.entries(collection.schema.items.properties).map(([fieldName, property]) => (
                    <th key={fieldName} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {fieldName}
                      {property.isSecret && <span className="ml-1">🔒</span>}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {Object.entries(collection.schema.items.properties).map(([fieldName, property]) => (
                      <td key={fieldName} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {renderFieldValue(record[fieldName], property)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => deleteRecord(record._id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete record"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}