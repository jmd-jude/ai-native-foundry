import { Router, Request, Response } from 'express';
import { validateApiKey, AuthenticatedRequest } from '../auth/api-key-validator';
import { previewQuery } from '../../integrations/snowflake/query-executor';

const router = Router();

/**
 * @openapi
 * /v1/preview:
 *   post:
 *     summary: Preview query results
 *     description: Executes SQL query against Snowflake and returns sample data (limited rows). Also estimates total audience size.
 *     tags:
 *       - Execution
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
 *                 description: SQL query to execute
 *                 example: "SELECT DISTINCT d.HOUSEHOLD_ID, d.AGE FROM DATA d WHERE d.AGE > 25 LIMIT 10"
 *               maxRows:
 *                 type: integer
 *                 description: Maximum number of rows to return
 *                 default: 100
 *                 minimum: 1
 *                 maximum: 1000
 *                 example: 10
 *     responses:
 *       200:
 *         description: Query executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rows:
 *                   type: array
 *                   description: Sample data rows
 *                   items:
 *                     type: object
 *                 columns:
 *                   type: array
 *                   description: Column metadata
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                 rowCount:
 *                   type: integer
 *                   description: Number of rows returned in preview
 *                 totalEstimate:
 *                   type: integer
 *                   description: Estimated total rows in full query result
 *                 executionTime:
 *                   type: number
 *                   description: Query execution time in milliseconds
 *                 queryId:
 *                   type: string
 *                   description: Snowflake query ID for tracking
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     limitApplied:
 *                       type: boolean
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid or missing API key
 *       500:
 *         description: Query execution failed
 */
router.post('/', validateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sql, maxRows = 100 } = req.body;

    if (!sql || typeof sql !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        message: 'Field "sql" is required and must be a string'
      });
      return;
    }

    // Validate maxRows
    const limit = Math.min(Math.max(parseInt(String(maxRows), 10), 1), 1000);

    console.log(`Executing preview query (max ${limit} rows)...`);

    // Execute query and get preview
    const preview = await previewQuery(sql, limit);

    res.json({
      ...preview,
      metadata: {
        timestamp: new Date().toISOString(),
        limitApplied: limit < 1000
      }
    });

  } catch (error: any) {
    console.error('Preview endpoint error:', error);

    res.status(500).json({
      error: 'Query execution failed',
      message: error.message || 'Unknown error'
    });
  }
});

export { router as previewRouter };
