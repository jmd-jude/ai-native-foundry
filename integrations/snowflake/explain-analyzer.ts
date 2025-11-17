interface ExplainAnalysis {
  estimatedRows: number;
  summary: string;
  operations: string[];
  complexity: 'low' | 'medium' | 'high';
}

/**
 * Parses Snowflake EXPLAIN output to extract query metadata
 * EXPLAIN returns rows with execution plan details
 */
export function parseExplainOutput(explainRows: any[]): ExplainAnalysis {
  try {
    // EXPLAIN output is typically in a column called 'step' or 'plan' or 'PLAN'
    const planText = explainRows
      .map(row => row['step'] || row['plan'] || row['PLAN'] || JSON.stringify(row))
      .join('\n');

    // Extract estimated row counts (Snowflake includes these in EXPLAIN)
    const rowEstimates = extractRowEstimates(planText);
    const estimatedRows = Math.max(...rowEstimates, 0);

    // Extract operations (JOIN, FILTER, AGGREGATE, etc.)
    const operations = extractOperations(planText);

    // Determine complexity based on operations
    const complexity = determineComplexity(operations, estimatedRows);

    return {
      estimatedRows,
      summary: `Query will process approximately ${estimatedRows.toLocaleString()} rows using ${operations.length} operations`,
      operations,
      complexity
    };

  } catch (error) {
    console.error('Error parsing EXPLAIN output:', error);

    return {
      estimatedRows: 0,
      summary: 'Unable to analyze query plan',
      operations: [],
      complexity: 'medium'
    };
  }
}

/**
 * Extracts estimated row counts from EXPLAIN text
 */
function extractRowEstimates(planText: string): number[] {
  const estimates: number[] = [];

  // Snowflake EXPLAIN includes patterns like "rows=12345" or "cardinality: 12345"
  const rowPatterns = [
    /rows[=:]\s*(\d+)/gi,
    /cardinality[=:]\s*(\d+)/gi,
    /output[=:]\s*(\d+)/gi
  ];

  for (const pattern of rowPatterns) {
    const matches = planText.matchAll(pattern);
    for (const match of matches) {
      const count = parseInt(match[1], 10);
      if (!isNaN(count)) {
        estimates.push(count);
      }
    }
  }

  return estimates;
}

/**
 * Extracts operation types from EXPLAIN text
 */
function extractOperations(planText: string): string[] {
  const operations: string[] = [];

  // Common Snowflake operations
  const operationPatterns = [
    'TableScan',
    'Filter',
    'Join',
    'Aggregate',
    'Sort',
    'Limit',
    'Distinct',
    'Project',
    'GroupBy'
  ];

  for (const op of operationPatterns) {
    if (planText.includes(op)) {
      operations.push(op);
    }
  }

  return operations;
}

/**
 * Determines query complexity based on operations and row estimates
 */
function determineComplexity(
  operations: string[],
  estimatedRows: number
): 'low' | 'medium' | 'high' {
  // High complexity indicators
  if (estimatedRows > 1000000) return 'high';
  if (operations.includes('Join') && operations.includes('Aggregate')) return 'high';

  // Medium complexity indicators
  if (estimatedRows > 100000) return 'medium';
  if (operations.includes('Join') || operations.includes('Aggregate')) return 'medium';

  // Low complexity
  return 'low';
}
