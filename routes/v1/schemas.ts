import { Router, Request, Response } from 'express';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { validateApiKey, AuthenticatedRequest } from '../auth/api-key-validator';

const router = Router();

/**
 * @openapi
 * /v1/schemas:
 *   get:
 *     summary: List available schemas
 *     description: Returns a list of all available identity graph schemas that can be used for SQL generation.
 *     tags:
 *       - Schemas
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved schema list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 schemas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       version:
 *                         type: string
 *                       description:
 *                         type: string
 *                       tableCount:
 *                         type: integer
 *       401:
 *         description: Invalid or missing API key
 */
router.get('/', validateApiKey, (req: AuthenticatedRequest, res: Response) => {
  try {
    const schemasDir = join(__dirname, '../../schemas');
    const files = readdirSync(schemasDir).filter(f => f.endsWith('.json') && f !== 'schema-metadata.json');

    const schemas = files
      .map(file => {
        try {
          const schemaPath = join(schemasDir, file);
          const schemaContent = readFileSync(schemaPath, 'utf-8');

          // Skip empty files
          if (!schemaContent.trim()) {
            return null;
          }

          const schema = JSON.parse(schemaContent);

          return {
            id: file.replace('.json', ''),
            name: schema.name || file.replace('.json', ''),
            version: schema.version || '1.0.0',
            description: schema.description || 'Identity graph schema',
            tableCount: Object.keys(schema.tables || {}).length
          };
        } catch (error) {
          // Skip files that can't be parsed (Phase 2 placeholders)
          console.warn(`Skipping invalid schema file: ${file}`);
          return null;
        }
      })
      .filter(schema => schema !== null);

    res.json({ schemas });

  } catch (error: any) {
    console.error('Error listing schemas:', error);
    res.status(500).json({
      error: 'Failed to list schemas',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /v1/schemas/{schemaId}:
 *   get:
 *     summary: Get schema details
 *     description: Returns the complete schema definition including all tables, fields, and semantic annotations.
 *     tags:
 *       - Schemas
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Schema identifier (e.g., "sig-v2")
 *     responses:
 *       200:
 *         description: Successfully retrieved schema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Schema not found
 *       401:
 *         description: Invalid or missing API key
 */
router.get('/:schemaId', validateApiKey, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { schemaId } = req.params;
    const schemaPath = join(__dirname, '../../schemas', `${schemaId}.json`);
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

    res.json(schema);

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      res.status(404).json({
        error: 'Schema not found',
        message: `No schema exists with ID: ${req.params.schemaId}`
      });
      return;
    }

    console.error('Error retrieving schema:', error);
    res.status(500).json({
      error: 'Failed to retrieve schema',
      message: error.message
    });
  }
});

export { router as schemasRouter };
