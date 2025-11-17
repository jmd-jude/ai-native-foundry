import { loadSchema } from '../prompt-engineering/prompt-builder';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that SQL only uses valid schema tables and fields
 */
export function validateAgainstSchema(sql: string, schemaId: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const schema = loadSchema(schemaId);
    const validTables = Object.keys(schema.tables);

    // Extract table names from FROM and JOIN clauses
    const tablePattern = /(?:FROM|JOIN)\s+([A-Z_]+)/gi;
    const matches = sql.matchAll(tablePattern);
    const usedTables = new Set<string>();

    for (const match of matches) {
      const tableName = match[1].toUpperCase();
      usedTables.add(tableName);

      if (!validTables.map(t => t.toUpperCase()).includes(tableName)) {
        errors.push(`Invalid table: ${tableName}. Valid tables: ${validTables.join(', ')}`);
      }
    }

    if (usedTables.size === 0) {
      errors.push('No valid tables found in query');
    }

    // Basic field validation (simplified for Phase 1)
    // In Phase 2, we'll parse the SQL AST for deeper validation
    const fieldPattern = /([A-Z_]+)\.([A-Z_]+)/gi;
    const fieldMatches = sql.matchAll(fieldPattern);

    for (const match of fieldMatches) {
      const tableName = match[1].toUpperCase();
      const fieldName = match[2].toUpperCase();

      const table = schema.tables[tableName];
      if (table && table.fields) {
        const fieldExists = Object.keys(table.fields)
          .map(f => f.toUpperCase())
          .includes(fieldName);

        if (!fieldExists) {
          warnings.push(`Field ${fieldName} may not exist in table ${tableName}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };

  } catch (error: any) {
    return {
      isValid: false,
      errors: [error.message],
      warnings: []
    };
  }
}
