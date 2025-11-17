# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI-Native Foundation** - An API for converting natural language audience descriptions into production-ready SQL queries for identity graph activation. This is being refactored from a Next.js POC into a standalone Express.js API product.

**Current State**: Early development - core files copied from POC, most implementation files are empty stubs awaiting full implementation per the Phase 1 Build Spec.

## Development Commands

### Starting the Server
```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

### Testing
```bash
# No tests implemented yet
npm test
```

**Note**: The project uses `tsx` for TypeScript execution in development and `nodemon` for auto-reloading.

## Architecture Overview

### Core Concept: AI-Powered Semantic SQL Generation

The system translates natural language (e.g., "affluent millennials in urban areas with email") into valid Snowflake SQL queries using Claude API with carefully engineered prompts and semantic schema annotations.

### Key Components

1. **Prompt Engineering System** (`prompt-engineering/`)
   - **Schema Context Builder**: Converts semantic schemas into Claude-readable format with marketing meanings and AI instructions embedded in field definitions
   - **System Prompts**: Template-based prompts for different use cases (email-marketing, direct-mail, lookalike, suppression)
   - **Few-Shot Examples**: Real-world segment examples used for in-context learning
   - **Critical Pattern**: Enumerated fields (INCOME_HH, NET_WORTH_HH) MUST use `IN (...)` syntax, NEVER `>=` operators (text comparison fails)

2. **Semantic Schema Library** (`schemas/`)
   - **sig-v2.json**: Primary identity graph schema with rich semantic annotations
   - Each field has `marketing_meaning`, `ai_instructions`, `creative_potential` metadata
   - Schema drives both prompt construction AND validation
   - **Valid Values Arrays**: Pre-defined enumerations that must be used exactly as defined

3. **API Endpoints** (`api/v1/`)
   - `POST /v1/generate` - Main SQL generation endpoint (partially implemented from POC)
   - `GET /v1/schemas` - List available schemas
   - `GET /v1/schemas/:id` - Get schema details
   - `GET /v1/health` - Health check
   - Phase 2 stubs: `/validate`, `/preview`

4. **Validation Pipeline** (`validation/`)
   - Syntax validation (basic SQL correctness)
   - Schema validation (tables/fields exist in schema)
   - Snowflake validation (Phase 2 - EXPLAIN queries)
   - Quality scoring (Phase 2 - performance metrics)

5. **Authentication** (`api/auth/`)
   - API key validation via Bearer tokens
   - Phase 1: In-memory key storage (DEMO_API_KEY env var)
   - Phase 2: Database-backed key management

### Data Flow

```
User Request → Prompt Builder → Claude API → JSON Parser → Validator → Response
                     ↓
         (Schema Context + System Prompt + Few-Shot Examples)
```

## Critical Development Rules

### Enumerated Field Handling
**This is the #1 source of bugs** - fields with `valid_values` arrays use prefixed strings:

```sql
-- CORRECT: Use IN with exact string values
INCOME_HH IN ('K. $100,000-$149,999', 'L. $150,000-$174,999')

-- WRONG: Text comparison will fail
INCOME_HH >= 'K. $100,000'  -- ❌ Never do this
```

### Table Join Patterns
- **Primary join key**: `HOUSEHOLD_ID` (most common)
- **Alternative key**: `ADDRESS_ID`
- **EMAIL/PHONE tables**: Use `LEFT JOIN` (optional contact info)
- **DATA/PII tables**: Use `INNER JOIN` or `WHERE` filters

### Query Construction Philosophy
- **Always use DISTINCT** on HOUSEHOLD_ID to avoid duplicates
- **Target 50K-200K households** for optimal campaign scale
- **Balance precision vs. reach**: Too many AND conditions = no results
- **Quality filters for contact info**:
  - Email: `EMAILQUALITYLEVEL >= 7 AND EMAILOPTIN = 1`
  - Phone: `PHONEQUALITYLEVEL >= 7 AND DNC = 0`

### Snowflake SQL Syntax
- Uses Snowflake-specific SQL (not PostgreSQL/MySQL)
- All queries are SELECT-only (no mutations allowed)
- Table and field names are UPPERCASE in schemas

## File Organization Patterns

### Adding New Schemas
1. Create `schemas/{schema-id}.json` with semantic annotations
2. Follow sig-v2.json structure: tables → fields → metadata
3. Include `marketing_meaning`, `ai_instructions`, `creative_potential` for all fields
4. Define `valid_values` arrays for enumerated fields

### Adding System Prompts
1. Create `prompt-engineering/system-prompts/{use-case}.txt`
2. Include use-case-specific instructions (email opt-in requirements, etc.)
3. Reference in prompt builder's use-case selection logic

### Adding API Endpoints
1. Create route file in `api/v1/{endpoint}.ts`
2. Export Express router with OpenAPI JSDoc comments
3. Import and mount in `server.ts`
4. Add API key validation middleware: `validateApiKey`

## Environment Variables

Required in `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...          # Claude API key (required)
ANTHROPIC_MODEL=claude-sonnet-4-20250514  # Model version
PORT=4000                              # API server port
NODE_ENV=development                   # Environment
DEMO_API_KEY=sk_test_demo123456789    # Phase 1 auth key
```

## Phase 1 Implementation Status

Per `z-PRDs/PHASE I - Build Spec.md`:

**Completed** (copied from POC):
- ✅ Schema files (sig-v2.json)
- ✅ Schema context builder (schema-context.ts)
- ✅ System prompts structure (prompts.ts)
- ✅ Generate endpoint skeleton (generate.ts - needs refactoring)

**Needs Implementation**:
- ❌ Express server setup (server.ts)
- ❌ API key validator (api/auth/api-key-validator.ts)
- ❌ Prompt builder refactor (prompt-engineering/prompt-builder.ts)
- ❌ Validation implementations (syntax-validator.ts, schema-validator.ts)
- ❌ Health and schemas endpoints
- ❌ Swagger/OpenAPI documentation setup

**Phase 2 (Stubs Only)**:
- Snowflake integration (connection-manager.ts, query-executor.ts)
- Validate and preview endpoints
- Quality scoring and advanced validation

## Common Patterns

### Accessing Schemas
```typescript
import { loadSchema } from '../prompt-engineering/prompt-builder';
const schema = loadSchema('sig-v2');
```

### Building Prompts
```typescript
import { buildPrompt } from '../prompt-engineering/prompt-builder';
const prompt = buildPrompt({
  userPrompt: "affluent families",
  schemaId: "sig-v2",
  useCase: "email-marketing",
  constraints: { minSize: 50000, requireEmail: true }
});
```

### Validation Pipeline
```typescript
import { validateSyntax } from '../validation/syntax-validator';
import { validateAgainstSchema } from '../validation/schema-validator';

const syntaxResult = validateSyntax(sql);
const schemaResult = validateAgainstSchema(sql, 'sig-v2');
const isValid = syntaxResult.isValid && schemaResult.isValid;
```

## Testing Strategy

**Phase 1 Testing** (via Swagger UI at `/api-docs`):
1. Test `/v1/generate` with sample prompts from Build Spec
2. Verify SQL output uses DISTINCT and proper joins
3. Check validation catches enumerated field misuse
4. Confirm API key authentication blocks unauthorized requests

**Example Test Prompt**:
```json
{
  "prompt": "Affluent millennials in urban areas with high email quality",
  "schema": "sig-v2",
  "useCase": "email-marketing",
  "constraints": {
    "minSize": 50000,
    "maxSize": 200000,
    "requireEmail": true
  }
}
```

## Debugging Tips

1. **Schema loading errors**: Check file paths are relative to compiled `dist/` directory in production
2. **Validation false positives**: Schema validator uses regex - may miss complex subqueries
3. **Claude response parsing**: Claude may return markdown code blocks - use `jsonMatch` regex pattern
4. **Enumerated field bugs**: Always check field definitions for `valid_values` arrays before building WHERE clauses

## Next Development Steps

Follow the Phase 1 Build Spec in `z-PRDs/PHASE I - Build Spec.md`:
1. Set up Express server with TypeScript
2. Install npm dependencies (express, swagger-jsdoc, @anthropic-ai/sdk, etc.)
3. Implement API key validation
4. Refactor prompt builder to work outside Next.js context
5. Create validation pipeline
6. Build Swagger documentation
7. Test via `/api-docs` interface
