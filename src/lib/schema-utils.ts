import { SchemaProperty } from '@/types';

// Helper to check if a property has %share structure (indicates it should be encrypted)
export const hasShareStructure = (property: SchemaProperty): boolean => {
  return property.type === 'object' && 
         property.properties !== undefined && 
         '%share' in property.properties &&
         (property.required?.includes('%share') ?? false);
};

// Generate example value for a given property
const generateExampleValue = (property: SchemaProperty, fieldName: string, depth: number = 0): any => {
  // Handle encrypted fields - these can appear at any nesting level
  if (hasShareStructure(property)) {
    return {
      "%allot": `example ${fieldName} (will be encrypted)`
    };
  }

  switch (property.type) {
    case 'string':
      // Use different examples based on format
      if (property.format === 'uuid') {
        return '550e8400-e29b-41d4-a716-446655440000';
      } else if (property.format === 'email') {
        return `${fieldName}@example.com`;
      } else if (property.format === 'uri' || property.format === 'url') {
        return `https://example.com/${fieldName}`;
      } else if (property.format === 'date') {
        return '2024-01-15';
      } else if (property.format === 'date-time') {
        return '2024-01-15T10:30:00Z';
      }
      return `example ${fieldName}`;
    
    case 'number':
      // Generate numbers within constraints if provided
      if (property.minimum !== undefined && property.maximum !== undefined) {
        // Use midpoint of range
        return (property.minimum + property.maximum) / 2;
      } else if (property.minimum !== undefined) {
        return property.minimum + 10;
      } else if (property.maximum !== undefined) {
        return property.maximum - 10;
      }
      return 42.5;
    
    case 'integer':
      // Generate integers within constraints if provided
      if (property.minimum !== undefined && property.maximum !== undefined) {
        // Use midpoint of range, rounded
        return Math.round((property.minimum + property.maximum) / 2);
      } else if (property.minimum !== undefined) {
        return property.minimum + 1;
      } else if (property.maximum !== undefined) {
        return property.maximum - 1;
      }
      return 42;
    
    case 'boolean':
      return true;
    
    case 'array':
      if (property.items) {
        // Respect array constraints
        const minItems = property.minItems || 0;
        const maxItems = property.maxItems || 3;
        const itemCount = Math.min(Math.max(2, minItems), maxItems);
        
        // Generate appropriate number of items, but limit depth to prevent huge examples
        const items = [];
        for (let i = 0; i < itemCount && depth < 3; i++) {
          items.push(generateExampleValue(property.items, `${fieldName}[${i}]`, depth + 1));
        }
        return items;
      }
      return [];
    
    case 'object':
      if (property.properties) {
        const obj: any = {};
        // Generate all properties, including nested objects
        Object.entries(property.properties).forEach(([key, prop]) => {
          if (depth < 3) { // Limit nesting depth to prevent huge examples
            obj[key] = generateExampleValue(prop, key, depth + 1);
          }
        });
        return obj;
      }
      return {};
    
    default:
      return `example ${fieldName}`;
  }
};

// Generate an example record based on collection schema
export const generateExampleRecord = (schema: any): any => {
  if (!schema?.items?.properties) {
    return {};
  }

  const record: any = {};
  
  // Generate example values for each field (excluding _id which is auto-generated)
  Object.entries(schema.items.properties).forEach(([fieldName, property]) => {
    if (fieldName !== '_id') {
      record[fieldName] = generateExampleValue(property as SchemaProperty, fieldName);
    }
  });

  return record;
};