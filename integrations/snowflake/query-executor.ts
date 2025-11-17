import { createSnowflakeConnection } from './connection-manager';
import { parseExplainOutput } from './explain-analyzer';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedRowCount?: number;
  executionPlan?: string;
}

export interface PreviewResult {
  rows: any[];
  columns: Array<{ name: string; type: string }>;
  rowCount: number;
  totalEstimate: number;
  executionTime: number;
  queryId: string;
}

export interface CountResult {
  count: number;
  executionTime: number;
  queryId: string;
}

/**
 * Validates SQL query using Snowflake EXPLAIN
 * Does not execute the query or return data
 */
export async function validateWithSnowflake(sql: string): Promise<ValidationResult> {
  const connection = createSnowflakeConnection();

  try {
    // Use the validateQuery method from connection manager
    const validation = await connection.validateQuery(sql);

    // If validation passed, try to parse EXPLAIN for row estimates
    if (validation.isValid) {
      // Execute EXPLAIN to get query plan
      const explainSQL = `EXPLAIN ${sql}`;
      const explainResult = await connection.executeQuery(explainSQL);

      // Parse the EXPLAIN output for insights
      const planAnalysis = parseExplainOutput(explainResult.rows);

      return {
        isValid: true,
        errors: [],
        warnings: validation.warnings || [],
        estimatedRowCount: planAnalysis.estimatedRows,
        executionPlan: planAnalysis.summary
      };
    }

    return validation;

  } catch (error: any) {
    console.error('Snowflake validation error:', error);

    return {
      isValid: false,
      errors: [error.message || 'Unknown Snowflake error'],
      warnings: []
    };

  } finally {
    await connection.disconnect();
  }
}

/**
 * Executes SQL query and returns sample data
 * Automatically limits results if no LIMIT clause present
 */
export async function previewQuery(
  sql: string,
  maxRows: number = 100
): Promise<PreviewResult> {
  const connection = createSnowflakeConnection();

  try {
    // Add LIMIT if not present (safety measure)
    let previewSQL = sql.trim();
    if (!previewSQL.toUpperCase().includes('LIMIT')) {
      previewSQL = `${previewSQL} LIMIT ${maxRows}`;
    }

    // Execute the query
    const result = await connection.executeQuery(previewSQL);

    // Get total count estimate (run COUNT query)
    const countResult = await getQueryCount(sql);

    return {
      rows: result.rows,
      columns: result.columns,
      rowCount: result.rowCount,
      totalEstimate: countResult.count,
      executionTime: result.executionTime,
      queryId: result.queryId
    };

  } catch (error: any) {
    console.error('Snowflake preview error:', error);
    throw new Error(`Failed to preview query: ${error.message}`);

  } finally {
    await connection.disconnect();
  }
}

/**
 * Gets total count for a query using COUNT(*) wrapper
 * Used to estimate full audience size without returning all rows
 */
export async function getQueryCount(sql: string): Promise<CountResult> {
  const connection = createSnowflakeConnection();

  try {
    // Wrap query in COUNT to get total rows
    const countSQL = `
      WITH base_query AS (
        ${sql}
      )
      SELECT COUNT(*) as total_count FROM base_query
    `;

    const result = await connection.executeQuery(countSQL);

    return {
      count: result.rows[0]?.TOTAL_COUNT || 0,
      executionTime: result.executionTime,
      queryId: result.queryId
    };

  } catch (error: any) {
    console.error('Snowflake count error:', error);

    // Return 0 if count fails (non-fatal)
    return {
      count: 0,
      executionTime: 0,
      queryId: 'error'
    };

  } finally {
    await connection.disconnect();
  }
}
