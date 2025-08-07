'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Collection, SchemaProperty } from '@/types';
import { useNotifications } from '@/contexts/NotificationContext';

interface CollectionFormProps {
  onSubmit: (
    collection: Omit<
      Collection,
      '_id' | 'createdAt' | 'updatedAt' | 'description'
    >
  ) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FieldDefinition {
  id: string;
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
  required: boolean;
  isSecret: boolean;
  description: string;
  properties?: FieldDefinition[]; // For nested object properties
  items?: FieldDefinition; // For array item type
  parentPath?: string; // To track nesting path
  // String constraints
  format?: string;
  // Number/integer constraints
  minimum?: number;
  maximum?: number;
  // Array constraints
  minItems?: number;
  maxItems?: number;
  // Other properties
  coerce?: boolean;
}

export default function CollectionForm({
  onSubmit,
  onCancel,
  isLoading,
}: CollectionFormProps) {
  const { addNotification } = useNotifications();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'build' | 'upload'>('build');
  const [name, setName] = useState('');
  const [type, setType] = useState<'standard' | 'owned'>('standard');
  const [fields, setFields] = useState<FieldDefinition[]>([
    {
      id: 'field-0',
      name: '_id',
      type: 'string',
      required: true,
      isSecret: false,
      description: 'Unique identifier',
    },
  ]);
  const [showSchemaPreview, setShowSchemaPreview] = useState(false);
  const [jsonSchema, setJsonSchema] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync active tab with URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'upload') {
      setActiveTab('upload');
    } else {
      setActiveTab('build'); // Default to build
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: 'build' | 'upload') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'upload') {
      params.set('tab', 'upload');
    } else {
      params.delete('tab'); // Remove param for default build tab
    }
    const queryString = params.toString();
    router.replace(`/create-collection${queryString ? `?${queryString}` : ''}`);
  };

  // Helper to generate unique IDs
  const generateFieldId = () =>
    `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addField = (parentPath?: string) => {
    const newField: FieldDefinition = {
      id: generateFieldId(),
      name: '',
      type: 'string',
      required: false,
      isSecret: false,
      description: '',
      parentPath,
    };

    if (parentPath) {
      // Add to nested object properties or array item properties
      const updateNestedFields = (
        fields: FieldDefinition[]
      ): FieldDefinition[] => {
        return fields.map((field) => {
          if (field.id === parentPath) {
            return {
              ...field,
              properties: [...(field.properties || []), newField],
            };
          } else if (field.properties) {
            return {
              ...field,
              properties: updateNestedFields(field.properties),
            };
          } else if (field.items && field.items.id === parentPath) {
            // Add property to array item
            return {
              ...field,
              items: {
                ...field.items,
                properties: [...(field.items.properties || []), newField],
              },
            };
          } else if (field.items && field.items.properties) {
            // Recurse into array item properties
            return {
              ...field,
              items: {
                ...field.items,
                properties: updateNestedFields(field.items.properties),
              },
            };
          }
          return field;
        });
      };
      setFields(updateNestedFields(fields));
    } else {
      setFields([...fields, newField]);
    }
  };

  const updateField = (
    fieldId: string,
    updates: Partial<FieldDefinition>,
    parentFields?: FieldDefinition[]
  ): FieldDefinition[] => {
    const fieldsToUpdate = parentFields || fields;

    const updatedFields = fieldsToUpdate.map((field) => {
      if (field.id === fieldId) {
        const updatedField = { ...field, ...updates };

        // If changing to object type, initialize properties
        if (updates.type === 'object' && !updatedField.properties) {
          updatedField.properties = [];
        }

        // If changing to array type, initialize items
        if (updates.type === 'array' && !updatedField.items) {
          updatedField.items = {
            id: generateFieldId(),
            name: 'item',
            type: 'string',
            required: false,
            isSecret: false,
            description: '',
            parentPath: updatedField.id,
          };
        }

        return updatedField;
      } else if (field.properties) {
        return {
          ...field,
          properties: updateField(fieldId, updates, field.properties),
        };
      } else if (field.items && field.items.id === fieldId) {
        // Handle updates to array items
        const updatedItems = { ...field.items, ...updates };

        // If changing array item to object type, initialize properties
        if (updates.type === 'object' && !updatedItems.properties) {
          updatedItems.properties = [];
        }

        // If changing array item to array type, initialize nested items
        if (updates.type === 'array' && !updatedItems.items) {
          updatedItems.items = {
            id: generateFieldId(),
            name: 'item',
            type: 'string',
            required: false,
            isSecret: false,
            description: '',
            parentPath: updatedItems.id,
          };
        }

        return {
          ...field,
          items: updatedItems,
        };
      } else if (field.items && field.items.properties) {
        // Recurse into array item properties
        return {
          ...field,
          items: {
            ...field.items,
            properties: updateField(fieldId, updates, field.items.properties),
          },
        };
      }
      return field;
    });

    if (!parentFields) {
      setFields(updatedFields);
    }

    return updatedFields;
  };

  const removeField = (
    fieldId: string,
    parentFields?: FieldDefinition[]
  ): FieldDefinition[] => {
    // Don't remove _id field
    if (fieldId === 'field-0') return parentFields || fields;

    const fieldsToUpdate = parentFields || fields;

    const filteredFields = fieldsToUpdate.filter((field) => {
      if (field.id === fieldId) return false;
      if (field.properties) {
        field.properties = removeField(fieldId, field.properties);
      }
      if (field.items && field.items.properties) {
        field.items.properties = removeField(fieldId, field.items.properties);
      }
      return true;
    });

    if (!parentFields) {
      setFields(filteredFields);
    }

    return filteredFields;
  };

  // Convert FieldDefinition to SchemaProperty recursively
  const buildSchemaProperty = (field: FieldDefinition): SchemaProperty => {
    if (field.isSecret) {
      // Secret fields use the %share pattern
      return {
        type: 'object',
        properties: {
          '%share': {
            type:
              field.type === 'object' || field.type === 'array'
                ? 'string'
                : field.type,
          },
        },
        required: ['%share'],
        ...(field.description && { description: field.description }),
      };
    }

    const baseProperty: SchemaProperty = {
      type: field.type,
      ...(field.description && { description: field.description }),
    };

    // Add constraints based on type
    if (field.type === 'string') {
      if (field.format) baseProperty.format = field.format;
      if (field.coerce) baseProperty.coerce = field.coerce;
    }

    if (field.type === 'number' || field.type === 'integer') {
      if (field.minimum !== undefined) baseProperty.minimum = field.minimum;
      if (field.maximum !== undefined) baseProperty.maximum = field.maximum;
    }

    if (field.type === 'array') {
      if (field.minItems !== undefined) baseProperty.minItems = field.minItems;
      if (field.maxItems !== undefined) baseProperty.maxItems = field.maxItems;
      if (field.items) {
        baseProperty.items = buildSchemaProperty(field.items);
      }
    }

    if (field.type === 'object' && field.properties) {
      baseProperty.properties = {};
      const objectRequired: string[] = [];

      field.properties.forEach((prop) => {
        baseProperty.properties![prop.name] = buildSchemaProperty(prop);
        if (prop.required) {
          objectRequired.push(prop.name);
        }
      });

      if (objectRequired.length > 0) {
        baseProperty.required = objectRequired;
      }
    }

    return baseProperty;
  };

  // Check if all fields have names recursively
  const validateFieldNames = (fieldsToCheck: FieldDefinition[]): boolean => {
    for (const field of fieldsToCheck) {
      if (!field.name.trim()) return false;
      if (field.properties && !validateFieldNames(field.properties))
        return false;
      if (field.items && !field.items.name.trim()) return false;
    }
    return true;
  };

  const handleJsonUpload = () => {
    try {
      setJsonError(null);
      const parsedSchema = JSON.parse(jsonSchema);

      // Validate $schema field
      if (parsedSchema.$schema !== 'http://json-schema.org/draft-07/schema#') {
        throw new Error(
          'Schema must have "$schema": "http://json-schema.org/draft-07/schema#"'
        );
      }

      // Validate type is array
      if (parsedSchema.type !== 'array') {
        throw new Error('Schema "type" must be "array"');
      }

      // Validate items structure
      if (!parsedSchema.items) {
        throw new Error('Schema must have "items" property');
      }

      if (parsedSchema.items.type !== 'object') {
        throw new Error('Schema items "type" must be "object"');
      }

      if (!parsedSchema.items.properties) {
        throw new Error('Schema items must have "properties"');
      }

      // Validate _id field exists and is required
      if (!parsedSchema.items.properties._id) {
        throw new Error('Schema items properties must include "_id" field');
      }

      if (
        !parsedSchema.items.required ||
        !Array.isArray(parsedSchema.items.required) ||
        !parsedSchema.items.required.includes('_id')
      ) {
        throw new Error('Schema items must have "_id" in required array');
      }

      // Submit the parsed schema
      onSubmit({
        name,
        type,
        schema: parsedSchema,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Invalid JSON format';
      setJsonError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Invalid Schema Format',
        message: `Schema format is incorrect: ${errorMessage}`,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Collection name is required');
      return;
    }

    if (activeTab === 'upload') {
      handleJsonUpload();
      return;
    }

    if (!validateFieldNames(fields)) {
      alert('All fields must have a name');
      return;
    }

    // Build schema
    const properties: Record<string, SchemaProperty> = {};
    const required: string[] = [];

    fields.forEach((field) => {
      properties[field.name] = buildSchemaProperty(field);
      if (field.required) {
        required.push(field.name);
      }
    });

    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties,
        required,
      },
    };

    await onSubmit({
      name,
      type,
      schema,
    });
  };

  // Render field with nested support
  const renderField = (
    field: FieldDefinition,
    depth: number = 0
  ): React.JSX.Element => {
    const indentClass =
      depth > 0
        ? `ml-${Math.min(
            depth * 4,
            16
          )} border-l-2 border-gray-200 dark:border-gray-600 pl-4`
        : '';

    return (
      <div
        key={field.id}
        className={`p-4 border border-gray-200 dark:border-gray-600 rounded-lg ${indentClass}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Field Name</label>
            <input
              type="text"
              value={field.name}
              onChange={(e) => updateField(field.id, { name: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-all duration-300"
              disabled={field.id === 'field-0'} // _id field is readonly
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={field.type}
              onChange={(e) =>
                updateField(field.id, { type: e.target.value as any })
              }
              className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-all duration-300"
              disabled={field.id === 'field-0'} // _id type is locked to string
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="integer">Integer</option>
              <option value="boolean">Boolean</option>
              <option value="object">Object</option>
              <option value="array">Array</option>
            </select>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) =>
                  updateField(field.id, { required: e.target.checked })
                }
                className="mr-2"
                disabled={field.id === 'field-0'} // _id is always required
              />
              <span className="text-sm">Required</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.isSecret}
                onChange={(e) =>
                  updateField(field.id, { isSecret: e.target.checked })
                }
                className="mr-2"
                disabled={
                  field.id === 'field-0' ||
                  field.type === 'object' ||
                  field.type === 'array'
                } // Objects/arrays can't be directly secret
              />
              <span className="text-sm">Secret</span>
            </label>
          </div>

          <div className="flex items-end">
            {field.id !== 'field-0' && (
              <button
                type="button"
                onClick={() => removeField(field.id)}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition-colors duration-300 font-medium"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="mt-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            value={field.description}
            onChange={(e) =>
              updateField(field.id, { description: e.target.value })
            }
            className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-all duration-300"
            placeholder="Optional field description"
          />
        </div>

        {/* Type-specific constraints */}
        <div className="mt-3">
          {field.type === 'string' && field.id !== 'field-0' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Format</label>
                <select
                  value={field.format || ''}
                  onChange={(e) =>
                    updateField(field.id, {
                      format: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-all duration-300"
                >
                  <option value="">None</option>
                  <option value="uuid">UUID</option>
                  <option value="email">Email</option>
                  <option value="uri">URI</option>
                  <option value="date">Date</option>
                  <option value="datetime">DateTime</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.coerce || false}
                    onChange={(e) =>
                      updateField(field.id, {
                        coerce: e.target.checked || undefined,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-xs">Coerce</span>
                </label>
              </div>
            </div>
          )}

          {(field.type === 'number' || field.type === 'integer') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Minimum
                </label>
                <input
                  type="number"
                  value={field.minimum ?? ''}
                  onChange={(e) =>
                    updateField(field.id, {
                      minimum: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-all duration-300"
                  placeholder="No limit"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Maximum
                </label>
                <input
                  type="number"
                  value={field.maximum ?? ''}
                  onChange={(e) =>
                    updateField(field.id, {
                      maximum: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-all duration-300"
                  placeholder="No limit"
                />
              </div>
            </div>
          )}

          {field.type === 'array' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Min Items
                </label>
                <input
                  type="number"
                  min="0"
                  value={field.minItems ?? ''}
                  onChange={(e) =>
                    updateField(field.id, {
                      minItems: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-all duration-300"
                  placeholder="No limit"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Max Items
                </label>
                <input
                  type="number"
                  min="0"
                  value={field.maxItems ?? ''}
                  onChange={(e) =>
                    updateField(field.id, {
                      maxItems: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-all duration-300"
                  placeholder="No limit"
                />
              </div>
            </div>
          )}
        </div>

        {field.isSecret &&
          field.type !== 'object' &&
          field.type !== 'array' && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
              <p className="text-gray-800 dark:text-gray-200">
                🔒 This field will be encrypted using secret sharing across
                multiple nodes.
              </p>
            </div>
          )}

        {/* Array items configuration */}
        {field.type === 'array' && field.items && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">
              Array Item Configuration:
            </h4>
            <div className="pl-4 border-l-2 border-gray-300 dark:border-gray-600">
              {/* Render the array items as a nested field */}
              {renderField(field.items, depth + 1)}
            </div>
          </div>
        )}

        {/* Object properties */}
        {field.type === 'object' && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Object Properties:</h4>
              <button
                type="button"
                onClick={() => addField(field.id)}
                className="text-sm px-3 py-1 border-2 border-gray-300 dark:border-gray-600 rounded-none text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-900 dark:hover:border-gray-100 transition-all duration-300 font-medium tracking-wide"
              >
                + Add Property
              </button>
            </div>
            <div className="space-y-3">
              {field.properties?.map((prop) => renderField(prop, depth + 1))}
              {(!field.properties || field.properties.length === 0) && (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-none font-light">
                  No properties defined. Click "Add Property" to add object
                  properties.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Collection Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Collection Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-800 dark:text-white font-light tracking-wide transition-all duration-300"
              placeholder="My New Collection"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Collection Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'standard' | 'owned')}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-800 dark:text-white font-light tracking-wide transition-all duration-300"
            >
              <option value="standard">Standard</option>
              <option value="owned" disabled>
                Owned (Individual ownership with ACL)
              </option>
            </select>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {type === 'standard'
                ? 'Builder managed collections for application data'
                : 'Users own individual documents with granular permissions'}
            </p>
          </div>
        </div>

        {/* Schema Tabs */}
        <div>
          <div className="flex border-b border-gray-200 dark:border-gray-600 mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('build')}
              className={`px-6 py-3 border-b-2 font-light text-base tracking-wide transition-all duration-300 ${
                activeTab === 'build'
                  ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Build Custom Schema
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('upload')}
              className={`px-6 py-3 border-b-2 font-light text-base tracking-wide transition-all duration-300 ${
                activeTab === 'upload'
                  ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Upload JSON Schema
            </button>
          </div>

          {activeTab === 'build' ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-light tracking-wide text-gray-900 dark:text-gray-100">
                  Schema Definition
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSchemaPreview(!showSchemaPreview)}
                  className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-none text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-900 dark:hover:border-gray-100 transition-all duration-300 font-medium tracking-wide"
                >
                  {showSchemaPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>

              {showSchemaPreview && (
                <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-900 rounded-none border border-gray-200 dark:border-gray-600">
                  <h4 className="text-base font-light tracking-wide mb-4 text-gray-900 dark:text-gray-100">
                    Schema Preview:
                  </h4>
                  <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
                    {JSON.stringify(
                      {
                        $schema: 'http://json-schema.org/draft-07/schema#',
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: Object.fromEntries(
                            fields.map((field) => [
                              field.name,
                              buildSchemaProperty(field),
                            ])
                          ),
                          required: fields
                            .filter((f) => f.required)
                            .map((f) => f.name),
                        },
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

              <div className="space-y-4">
                {fields.map((field) => renderField(field))}

                <button
                  type="button"
                  onClick={() => addField()}
                  className="w-full px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-none text-gray-600 dark:text-gray-400 hover:border-gray-900 dark:hover:border-gray-100 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 font-medium tracking-wide"
                >
                  + Add Field
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-base font-light tracking-wide mb-3 text-gray-900 dark:text-gray-100">
                  JSON Schema *
                </label>
                <textarea
                  value={jsonSchema}
                  onChange={(e) => setJsonSchema(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white font-mono text-sm transition-all duration-300"
                  placeholder={`{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "_id": { "type": "string" },
      "name": { "type": "string" }
    },
    "required": ["_id"]
  }
}`}
                  rows={15}
                  required={activeTab === 'upload'}
                />
                {jsonError && (
                  <p className="mt-2 text-sm text-gray-900 dark:text-gray-100 font-light">
                    {jsonError}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed">
                Paste your JSON schema above. The schema must be an array type
                with object items containing properties.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-8 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-none hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
          >
            {isLoading ? 'Creating...' : 'Create Collection'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-8 py-3 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 rounded-none hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 font-medium tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
