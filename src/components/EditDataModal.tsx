'use client';

import { useState, useEffect } from 'react';
import { Collection, SchemaProperty } from '@/types';
import { useNotifications } from '@/contexts/NotificationContext';
import { apiFetch } from '@/lib/api-client';

interface EditDataModalProps {
  collection: Collection;
  record: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  [key: string]: any;
}

export default function EditDataModal({ collection, record, isOpen, onClose, onSuccess }: EditDataModalProps) {
  const [formData, setFormData] = useState<FormData>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const { addNotification } = useNotifications();

  // Helper to check if a property has %share structure
  const hasShareStructure = (property: SchemaProperty): boolean => {
    return property.type === 'object' && 
           property.properties !== undefined && 
           '%share' in property.properties &&
           (property.required?.includes('%share') ?? false);
  };

  // Recursively extract field values from existing record data
  const extractFieldValue = (recordValue: any, schema: SchemaProperty): any => {
    if (hasShareStructure(schema)) {
      // For encrypted fields, extract the actual value from the %allot or %share structure
      if (recordValue && typeof recordValue === 'object') {
        if (recordValue['%allot']) {
          return recordValue['%allot'];
        } else if (recordValue['%share']) {
          return recordValue['%share'];
        } else {
          // If it's an object but doesn't have expected keys, stringify it
          return JSON.stringify(recordValue);
        }
      } else if (typeof recordValue === 'string') {
        // If it's already a string, use it directly
        return recordValue;
      } else {
        // Fallback to empty string
        return '';
      }
    }

    if (schema.type === 'array' && Array.isArray(recordValue) && schema.items) {
      // Recursively extract array items
      return recordValue.map(item => extractFieldValue(item, schema.items!));
    }

    if (schema.type === 'object' && schema.properties && recordValue && typeof recordValue === 'object') {
      // Recursively extract object properties
      const extractedObject: any = {};
      Object.entries(schema.properties).forEach(([key, propSchema]) => {
        extractedObject[key] = extractFieldValue(recordValue[key], propSchema);
      });
      return extractedObject;
    }

    // For simple types, return the value or appropriate default
    if (recordValue !== undefined && recordValue !== null) {
      return recordValue;
    }

    // Default values for different types
    switch (schema.type) {
      case 'number':
      case 'integer':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return '';
    }
  };

  // Initialize form data based on record data recursively
  useEffect(() => {
    if (!isOpen || !record) return;
    
    const initialData: FormData = {};
    Object.entries(collection.schema.items.properties).forEach(([key, property]) => {
      if (key !== '_id') {
        initialData[key] = extractFieldValue(record[key], property);
      }
    });
    
    setFormData(initialData);
    setError(null);
  }, [collection.schema, record, isOpen]);

  // Helper to update nested field values
  const updateNestedValue = (path: string[], value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  // Helper to get nested value
  const getNestedValue = (path: string[]): any => {
    let current = formData;
    for (const key of path) {
      if (current && typeof current === 'object') {
        current = current[key];
      } else {
        return '';
      }
    }
    return current || '';
  };

  // Initialize default value for field type
  const initializeFieldValue = (property: SchemaProperty): any => {
    if (hasShareStructure(property)) {
      return '';
    }
    
    switch (property.type) {
      case 'string':
        return '';
      case 'number':
      case 'integer':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        if (property.properties) {
          const objectValue: any = {};
          Object.entries(property.properties).forEach(([key, prop]) => {
            objectValue[key] = initializeFieldValue(prop);
          });
          return objectValue;
        }
        return {};
      default:
        return '';
    }
  };

  // Add array item
  const addArrayItem = (path: string[], property: SchemaProperty) => {
    const currentArray = getNestedValue(path) || [];
    const newItem = property.items ? initializeFieldValue(property.items) : '';
    updateNestedValue(path, [...currentArray, newItem]);
  };

  // Remove array item
  const removeArrayItem = (path: string[], index: number) => {
    const currentArray = getNestedValue(path) || [];
    const newArray = currentArray.filter((_: any, i: number) => i !== index);
    updateNestedValue(path, newArray);
  };

  // Recursively process %share fields in nested data structures
  const processShareFields = (data: any, schema: SchemaProperty): any => {
    if (hasShareStructure(schema)) {
      // Convert %share field to %allot format
      return data ? { '%allot': data } : { '%allot': '' };
    }
    
    if (schema.type === 'object' && schema.properties) {
      const processedObject: any = {};
      Object.entries(schema.properties).forEach(([key, propSchema]) => {
        if (data && typeof data === 'object' && key in data) {
          processedObject[key] = processShareFields(data[key], propSchema);
        }
      });
      return processedObject;
    }
    
    if (schema.type === 'array' && schema.items && Array.isArray(data)) {
      return data.map(item => processShareFields(item, schema.items!));
    }
    
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Prepare the update data
      const updateData: any = {};
      
      // Process %share fields recursively
      Object.entries(collection.schema.items.properties).forEach(([key, property]) => {
        if (key !== '_id' && formData[key] !== undefined) {
          updateData[key] = processShareFields(formData[key], property);
        }
      });
      
      const response = await apiFetch(`/api/data/${collection._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: { _id: record._id },
          update: updateData,
          type: collection.type,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update record');
      }
      
      // Success - show notification and close modal
      addNotification({
        type: 'success',
        title: 'Record updated successfully',
        message: `Record ${record._id} has been updated`,
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      // Show error notification
      addNotification({
        type: 'error',
        title: 'Failed to update record',
        message: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderFormField = (fieldName: string, property: SchemaProperty, path: string[] = [fieldName], isRequired: boolean = false): React.ReactNode => {
    const isShareField = hasShareStructure(property);
    const value = getNestedValue(path);
    const isSecretVisible = showSecrets[path.join('.')] || false;
    const fieldKey = path.join('.');

    if (property.type === 'array') {
      const arrayItems = Array.isArray(value) ? value : [];
      
      return (
        <div key={fieldKey} className="space-y-3 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {fieldName} {isRequired && <span className="text-red-500">*</span>}
              <span className="text-xs text-gray-500 ml-2">(Array)</span>
            </label>
            <button
              type="button"
              onClick={() => addArrayItem(path, property)}
              className="px-3 py-1 text-sm border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide"
            >
              + Add Item
            </button>
          </div>
          
          {property.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400">{property.description}</p>
          )}
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {arrayItems.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No items added yet</p>
            ) : (
              arrayItems.map((item: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex-1">
                    {property.items && renderFormField(
                      `Item ${index + 1}`,
                      property.items,
                      [...path, String(index)],
                      false
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeArrayItem(path, index)}
                    className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-300"
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (property.type === 'object' && !isShareField) {
      return (
        <div key={fieldKey} className="space-y-3 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {fieldName} {isRequired && <span className="text-red-500">*</span>}
            <span className="text-xs text-gray-500 ml-2">(Object)</span>
          </label>
          
          {property.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400">{property.description}</p>
          )}
          
          <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
            {property.properties && Object.entries(property.properties).map(([propName, propSchema]) =>
              renderFormField(
                propName,
                propSchema,
                [...path, propName],
                property.required?.includes(propName) || false
              )
            )}
          </div>
        </div>
      );
    }

    // Simple field types (string, number, boolean, or %share object)
    return (
      <div key={fieldKey} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {fieldName} {isRequired && <span className="text-red-500">*</span>}
          {isShareField && <span className="text-yellow-600 ml-1">🔒</span>}
        </label>
        
        {property.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400">{property.description}</p>
        )}
        
        {property.type === 'boolean' ? (
          <select
            value={String(value)}
            onChange={(e) => updateNestedValue(path, e.target.value === 'true')}
            className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-all duration-300"
            required={isRequired}
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </select>
        ) : (
          <div className="relative">
            <input
              type={(property.type === 'number' || property.type === 'integer') ? 'number' : (isShareField && !isSecretVisible) ? 'password' : 'text'}
              value={value}
              onChange={(e) => {
                let processedValue: any = e.target.value;
                if (property.type === 'number' || property.type === 'integer') {
                  processedValue = parseFloat(e.target.value) || 0;
                }
                updateNestedValue(path, processedValue);
              }}
              className="w-full px-3 py-2 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-all duration-300"
              placeholder={isShareField ? 'Enter secret value...' : `Enter ${fieldName}...`}
              required={isRequired && fieldName !== '_id'}
            />
            {isShareField && (
              <button
                type="button"
                onClick={() => setShowSecrets(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }))}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {isSecretVisible ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            )}
          </div>
        )}
        
        {isShareField && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            This field will be encrypted and secret-shared across nodes
          </p>
        )}
      </div>
    );
  };

  if (!isOpen || !record) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white mb-2">
                Edit Record
              </h2>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
                Record ID: {record._id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.entries(collection.schema.items.properties)
              .filter(([fieldName]) => fieldName !== '_id') // Skip _id field in edit
              .map(([fieldName, property]) => 
                renderFormField(
                  fieldName, 
                  property, 
                  [fieldName], 
                  collection.schema.items.required?.includes(fieldName) || false
                )
              )}
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-3 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-none hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
          >
            {submitting ? 'Updating...' : 'Update Record'}
          </button>
        </div>
      </div>
    </div>
  );
}