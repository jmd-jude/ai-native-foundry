export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates SQL syntax at a basic level
 * Checks for dangerous keywords and structural issues
 */
export function validateSyntax(sql: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic checks
  if (!sql || sql.trim().length === 0) {
    errors.push('SQL query cannot be empty');
    return { isValid: false, errors, warnings };
  }

  const upperSQL = sql.toUpperCase();

  // Must start with SELECT
  if (!upperSQL.trim().startsWith('SELECT')) {
    errors.push('Query must start with SELECT');
  }

  // Must include FROM
  if (!upperSQL.includes('FROM')) {
    errors.push('Query must include FROM clause');
  }

  // Check for dangerous operations
  const dangerousKeywords = [
    'DROP', 'DELETE', 'UPDATE', 'INSERT',
    'TRUNCATE', 'ALTER', 'CREATE', 'EXEC'
  ];

  for (const keyword of dangerousKeywords) {
    if (upperSQL.includes(keyword)) {
      errors.push(`Dangerous keyword detected: ${keyword}. Only SELECT queries are allowed.`);
    }
  }

  // Check for balanced parentheses
  const openParens = (sql.match(/\(/g) || []).length;
  const closeParens = (sql.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push('Unbalanced parentheses in query');
  }

  // Warn if DISTINCT is not used (best practice for audience queries)
  if (!upperSQL.includes('DISTINCT')) {
    warnings.push('Consider using DISTINCT to avoid duplicate records');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
