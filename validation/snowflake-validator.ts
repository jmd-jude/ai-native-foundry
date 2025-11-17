import { validateWithSnowflake } from '../integrations/snowflake/query-executor';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedRowCount?: number;
}

/**
 * Validates SQL against Snowflake using EXPLAIN
 * This is the wrapper used by API endpoints
 */
export async function validateSQL(sql: string): Promise<ValidationResult> {
  try {
    const result = await validateWithSnowflake(sql);
    return result;
  } catch (error: any) {
    return {
      isValid: false,
      errors: [error.message || 'Unknown validation error'],
      warnings: []
    };
  }
}
