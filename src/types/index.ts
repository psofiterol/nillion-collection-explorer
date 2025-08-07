export interface Collection {
  _id: string;
  type: 'standard' | 'owned';
  name: string;
  description?: string;
  schema: CollectionSchema;
  createdAt?: string;
  updatedAt?: string;
}

export interface CollectionSchema {
  $schema?: string;
  type: 'array';
  items: {
    type: 'object';
    properties: Record<string, SchemaProperty>;
    required: string[];
  };
}

export interface SchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty; // For array type
  required?: string[];
  description?: string;
  isSecret?: boolean; // UI flag to indicate this field should use %allot
  // String constraints
  format?: string; // e.g., "uuid"
  // Number/integer constraints
  minimum?: number;
  maximum?: number;
  // Array constraints
  minItems?: number;
  maxItems?: number;
  // Other properties
  coerce?: boolean;
}

export interface CollectionRecord extends Record<string, unknown> {
  _id: string;
}

export interface CollectionMetadata {
  count: number;
  size: number;
  last_write?: string;
}

export interface BuilderProfile {
  collections: Collection[];
  queries: any[];
}