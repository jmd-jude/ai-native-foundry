# AI-Native Foundation API

Semantic SQL generation API for identity graphs. Converts natural language audience descriptions into production-ready SQL queries using Claude AI.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
PORT=4000
NODE_ENV=development
DEMO_API_KEY=sk_test_your_api_key_here
```

### 3. Start the Server

Development mode with hot reload:
```bash
npm run dev
```

The API will be available at `http://localhost:4000`

### 4. Access API Documentation

Open your browser to:
```
http://localhost:4000/api-docs
```

This provides an interactive Swagger UI for testing all endpoints.

## Testing the API

### Via Swagger UI

1. Navigate to `http://localhost:4000/api-docs`
2. Click "Authorize" button
3. Enter: `Bearer your_api_key`
4. Click "Authorize" and "Close"
5. Try the `POST /v1/generate` endpoint:

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

### Via cURL

```bash
curl -X POST http://localhost:4000/v1/generate \
  -H "Authorization: Bearer sk_test_apikey" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "affluent families with children",
    "schema": "sig-v2"
  }'
```

## Available Endpoints

- `GET /v1/health` - Health check
- `GET /v1/schemas` - List available schemas
- `GET /v1/schemas/:id` - Get schema details
- `POST /v1/generate` - Generate SQL from natural language
- `POST /v1/validate` - (Phase 2) Validate SQL against Snowflake
- `POST /v1/preview` - (Phase 2) Execute SQL and get sample data

## Project Structure

```
ai-native-foundry/
├── api/
│   ├── auth/              # API key validation
│   └── v1/                # API endpoints
├── schemas/               # Semantic schema library
├── prompt-engineering/    # Prompt templates and builders
│   ├── system-prompts/    # Use-case specific prompts
│   └── few-shot-examples/ # Example segments for learning
├── validation/            # SQL validation logic
├── integrations/          # External system integrations (Phase 2)
├── server.ts              # Express server entry point
└── CLAUDE.md              # Development guide for AI assistants
```

## Development

### Build for Production

```bash
npm run build
npm start
```

### Key Concepts

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation, including:
- Semantic schema structure with marketing annotations
- Prompt engineering patterns
- Enumerated field handling (critical!)
- Query construction best practices
- Validation pipeline

## Phase 1 Completion Status

✅ Express server with Swagger documentation
✅ API key authentication
✅ SQL generation endpoint (`/v1/generate`)
✅ Schema management endpoints
✅ Health check endpoint
✅ Basic validation (syntax + schema)
✅ Refactored prompt builder
✅ Development and production scripts

## Phase 2 Roadmap

- Snowflake integration for real validation
- Preview endpoint with sample data execution
- Database-backed API key management
- Additional schemas (email-focus, direct-mail)
- Few-shot examples library expansion
- Usage tracking and analytics
- Response caching

## Support

For build issues:
1. Ensure npm cache permissions are correct
2. Verify `.env` has valid `ANTHROPIC_API_KEY`
3. Check port 4000 is available
4. Review console output for TypeScript errors

For questions about the codebase, see [CLAUDE.md](./CLAUDE.md).
