import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { validateApiKey, AuthenticatedRequest } from '../auth/api-key-validator';
import { buildPrompt } from '../../prompt-engineering/prompt-builder';
import { validateSyntax } from '../../validation/syntax-validator';
import { validateAgainstSchema } from '../../validation/schema-validator';

const router = Router();

// Initialize Anthropic client - will be created per request to ensure env vars are loaded
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set in environment variables');
    throw new Error('Anthropic API key not configured');
  }

  console.log(`Using Anthropic API key: ${apiKey.substring(0, 15)}...`);

  return new Anthropic({
    apiKey: apiKey
  });
}

/**
 * @openapi
 * /v1/generate:
 *   post:
 *     summary: Generate SQL from natural language
 *     description: Converts a natural language audience description into a SQL query for identity graph discovery & activation.
 *     tags:
 *       - Generate SQL Query
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Natural language description of target audience
 *                 example: "Affluent millennials in urban areas with high email quality"
 *               schema:
 *                 type: string
 *                 description: Schema identifier to use
 *                 default: "demo-graph-v1"
 *                 example: "demo-graph-v1"
 *               useCase:
 *                 type: string
 *                 description: Marketing use case (affects query optimization)
 *                 enum: [email-marketing, direct-mail, lookalike, suppression]
 *                 example: "email-marketing"
 *               constraints:
 *                 type: object
 *                 description: Optional constraints for audience targeting
 *                 properties:
 *                   minSize:
 *                     type: integer
 *                     description: Minimum audience size in households
 *                     example: 10000
 *                   maxSize:
 *                     type: integer
 *                     description: Maximum audience size in households
 *                     example: 500000
 *                   requireEmail:
 *                     type: boolean
 *                     description: Require email addresses with quality filters
 *                     example: true
 *                   requirePhone:
 *                     type: boolean
 *                     description: Require phone numbers with quality filters
 *                     example: false
 *     responses:
 *       200:
 *         description: Successfully generated SQL query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sqlQuery:
 *                   type: string
 *                   description: Generated SQL query
 *                 segmentName:
 *                   type: string
 *                   description: Descriptive name for the segment
 *                 description:
 *                   type: string
 *                   description: Clear description of the audience
 *                 reasoning:
 *                   type: string
 *                   description: Explanation of query approach
 *                 confidence:
 *                   type: number
 *                   description: Confidence score (0-1)
 *                 estimatedSize:
 *                   type: integer
 *                   description: Estimated audience size
 *                 validation:
 *                   type: object
 *                   description: Validation results
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: string
 *                 metadata:
 *                   type: object
 *                   description: Request metadata
 *                   properties:
 *                     schema:
 *                       type: string
 *                     useCase:
 *                       type: string
 *                     tokensUsed:
 *                       type: integer
 *                     model:
 *                       type: string
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Invalid or missing API key
 *       500:
 *         description: Internal server error
 */
router.post('/', validateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      prompt,
      schema = 'demo-graph-v1',
      useCase,
      constraints
    } = req.body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        message: 'Field "prompt" is required and must be a string'
      });
      return;
    }

    console.log(`Generating SQL for prompt: "${prompt.substring(0, 50)}..."`);

    // Build prompt for Claude
    const systemPrompt = buildPrompt({
      userPrompt: prompt,
      schemaId: schema,
      useCase,
      constraints
    });

    // Get Anthropic client with API key validation
    const anthropic = getAnthropicClient();

    // Call Claude API
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: systemPrompt
      }]
    });

    // Extract and parse response
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse JSON from response (Claude may include markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate the generated SQL
    const syntaxValidation = validateSyntax(result.sqlQuery || '');
    const schemaValidation = validateAgainstSchema(result.sqlQuery || '', schema);

    const validation = {
      isValid: syntaxValidation.isValid && schemaValidation.isValid,
      errors: [...syntaxValidation.errors, ...schemaValidation.errors],
      warnings: [...syntaxValidation.warnings, ...schemaValidation.warnings]
    };

    // Return response
    res.json({
      ...result,
      validation,
      metadata: {
        schema,
        useCase: useCase || 'general',
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Generation error:', error);

    if (error.message?.includes('Schema not found')) {
      res.status(400).json({
        error: 'Invalid schema',
        message: error.message
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to generate SQL',
      message: error.message || 'Unknown error'
    });
  }
});

export { router as generateRouter };
