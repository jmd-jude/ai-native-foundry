import { readFileSync } from 'fs';
import { join } from 'path';

interface Schema {
  version: string;
  tables: Record<string, any>;
  business_context?: any;
  query_guidelines?: any;
  email_campaign_rules?: any;
  direct_mail_rules?: any;
}

interface PromptParams {
  userPrompt: string;
  schemaId: string;
  useCase?: string;
  constraints?: {
    minSize?: number;
    maxSize?: number;
    requireEmail?: boolean;
    requirePhone?: boolean;
  };
}

/**
 * Loads a schema from the schemas directory
 */
export function loadSchema(schemaId: string): Schema {
  try {
    const schemaPath = join(__dirname, '../schemas', `${schemaId}.json`);
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    return JSON.parse(schemaContent);
  } catch (error) {
    throw new Error(`Schema not found: ${schemaId}`);
  }
}

/**
 * Builds a compact schema context for Claude prompts
 * Includes field names, types, and semantic annotations
 */
export function buildCompactSchemaContext(schema: Schema): string {
  let context = 'DATABASE SCHEMA:\n';
  context += '='.repeat(50) + '\n\n';

  for (const [tableName, table] of Object.entries(schema.tables)) {
    context += `TABLE: ${tableName}\n`;
    if (table.description) {
      context += `Purpose: ${table.description}\n`;
    }
    context += '\nFields:\n';

    for (const [fieldName, field] of Object.entries(table.fields)) {
      const fieldInfo: any = field;
      context += `  - ${fieldName} (${fieldInfo.type})`;

      // Add semantic annotations if available
      if (fieldInfo.marketing_meaning) {
        context += `\n    Meaning: ${fieldInfo.marketing_meaning}`;
      }

      if (fieldInfo.ai_instructions) {
        context += `\n    Instructions: ${fieldInfo.ai_instructions}`;
      }

      // Add valid values if enumerated field
      if (fieldInfo.valid_values && fieldInfo.valid_values.length > 0) {
        if (fieldInfo.valid_values.length <= 5) {
          context += `\n    Valid values: ${fieldInfo.valid_values.map((v: string) => `"${v}"`).join(', ')}`;
        } else {
          const first3 = fieldInfo.valid_values.slice(0, 3);
          const last2 = fieldInfo.valid_values.slice(-2);
          context += `\n    Valid values: ${first3.map((v: string) => `"${v}"`).join(', ')} ... (${fieldInfo.valid_values.length} total) ... ${last2.map((v: string) => `"${v}"`).join(', ')}`;
        }
      }

      context += '\n';
    }
    context += '\n';
  }

  return context;
}

/**
 * Loads the base system prompt template
 */
function loadSystemPrompt(): string {
  try {
    const promptPath = join(__dirname, 'system-prompts', 'base.txt');
    return readFileSync(promptPath, 'utf-8');
  } catch (error) {
    // Fallback if file doesn't exist yet
    return `You are a SQL expert specializing in identity graph queries.

CRITICAL RULES:
1. ALWAYS use DISTINCT on HOUSEHOLD_ID for deduplication
2. ALWAYS join tables on HOUSEHOLD_ID or ADDRESS_ID
3. For enumerated fields with valid_values, ALWAYS use IN clause with EXACT string values
4. NEVER use >= or <= on TEXT fields with letter prefixes
5. Target 50,000-200,000 households for optimal campaign scale

Return ONLY valid JSON in this format:
{
  "sqlQuery": "SELECT DISTINCT...",
  "segmentName": "Brief descriptive name",
  "description": "Clear description of the audience",
  "reasoning": "Explanation of query approach",
  "confidence": 0.85,
  "estimatedSize": 125000
}`;
  }
}

/**
 * Loads use-case-specific prompt augmentation
 */
function loadUseCasePrompt(useCase: string): string {
  const validUseCases = ['email-marketing', 'direct-mail', 'lookalike', 'suppression'];

  if (!useCase || !validUseCases.includes(useCase)) {
    return '';
  }

  try {
    const promptPath = join(__dirname, 'system-prompts', `${useCase}.txt`);
    return readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.warn(`Use case prompt file not found: ${useCase}.txt`);

    // Fallback inline instructions
    if (useCase === 'email-marketing') {
      return `
EMAIL MARKETING REQUIREMENTS:
- ALWAYS include EMAILQUALITYLEVEL >= 8 and EMAILOPTIN = 1
- ALWAYS include EMAIL field in SELECT
- Target 50K-200K households for optimal campaigns
      `.trim();
    }

    if (useCase === 'direct-mail') {
      return `
DIRECT MAIL REQUIREMENTS:
- ALWAYS include ADDRESS_ID IS NOT NULL
- ALWAYS include STATE and ZIP in SELECT
- Use INNER JOIN for PII table
- Target 25K-100K households for optimal ROI
      `.trim();
    }

    return '';
  }
}

/**
 * Builds the complete prompt for Claude API
 */
export function buildPrompt(params: PromptParams): string {
  const { userPrompt, schemaId, useCase, constraints } = params;

  // Load schema
  const schema = loadSchema(schemaId);

  // Build prompt components
  let prompt = loadSystemPrompt();

  // Add schema-specific rules if available
  if (schema.email_campaign_rules && useCase === 'email-marketing') {
    prompt += '\n\nSCHEMA-SPECIFIC EMAIL RULES:\n';
    prompt += `Required filters: ${schema.email_campaign_rules.required_filters.join(', ')}\n`;
    prompt += `Required fields: ${schema.email_campaign_rules.required_fields.join(', ')}\n`;
  }

  if (schema.direct_mail_rules && useCase === 'direct-mail') {
    prompt += '\n\nSCHEMA-SPECIFIC DIRECT MAIL RULES:\n';
    prompt += `Required filters: ${schema.direct_mail_rules.required_filters.join(', ')}\n`;
    prompt += `Required fields: ${schema.direct_mail_rules.required_fields.join(', ')}\n`;
  }

  // Add schema context
  prompt += '\n\n' + buildCompactSchemaContext(schema);

  // Add use-case-specific instructions
  if (useCase) {
    const useCaseInstructions = loadUseCasePrompt(useCase);
    if (useCaseInstructions) {
      prompt += '\n\nUSE CASE INSTRUCTIONS:\n' + useCaseInstructions;
    }
  }

  // Add constraints if provided
  if (constraints) {
    prompt += '\n\nCONSTRAINTS:\n';
    if (constraints.minSize) {
      prompt += `- Minimum audience size: ${constraints.minSize.toLocaleString()} households\n`;
    }
    if (constraints.maxSize) {
      prompt += `- Maximum audience size: ${constraints.maxSize.toLocaleString()} households\n`;
    }
    if (constraints.requireEmail) {
      prompt += '- MUST include email addresses with quality filters\n';
    }
    if (constraints.requirePhone) {
      prompt += '- MUST include phone numbers with quality filters\n';
    }
  }

  // Add user prompt
  prompt += '\n\nUSER REQUEST:\n' + userPrompt;

  return prompt;
}
