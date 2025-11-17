import { Router, Request, Response } from 'express';
import { validateApiKey, AuthenticatedRequest } from '../auth/api-key-validator';
import { validateSQL } from '../../validation/snowflake-validator';

const router = Router();

/**
 * @openapi
 * /v1/validate:
 *   post:
 *     summary: Validate SQL against Snowflake
 *     description: Uses Snowflake EXPLAIN to validate SQL query without executing it. Returns validity status and estimated row count.
 *     tags:
 *       - Validation
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sql
 *             properties:
 *               sql:
 *                 type: string
 *                 description: SQL query to validate
 *                 example: "SELECT DISTINCT d.HOUSEHOLD_ID FROM DATA d WHERE d.AGE > 25"
 *               schema:
 *                 type: string
 *                 description: Schema identifier (for reference only)
 *                 default: "sig-v2"
 *                 example: "sig-v2"
 *     responses:
 *       200:
 *         description: Validation complete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isValid:
 *                   type: boolean
 *                   description: Whether the SQL is valid
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Validation errors (if any)
 *                 warnings:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Validation warnings
 *                 estimatedRowCount:
 *                   type: integer
 *                   description: Estimated number of rows the query will return
 *                 executionPlan:
 *                   type: string
 *                   description: Summary of query execution plan
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     schema:
 *                       type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid or missing API key
 *       500:
 *         description: Validation failed
 */
router.post('/', validateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sql, schema = 'sig-v2' } = req.body;

    if (!sql || typeof sql !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        message: 'Field "sql" is required and must be a string'
      });
      return;
    }

    console.log(`Validating SQL against Snowflake (${sql.length} chars)...`);

    // Validate against Snowflake
    const validation = await validateSQL(sql);

    res.json({
      ...validation,
      metadata: {
        timestamp: new Date().toISOString(),
        schema
      }
    });

  } catch (error: any) {
    console.error('Validation endpoint error:', error);

    res.status(500).json({
      error: 'Validation failed',
      message: error.message || 'Unknown error'
    });
  }
});

export { router as validateRouter };
