import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { generateRouter } from './routes/v1/generate';
import { schemasRouter } from './routes/v1/schemas';
import { healthRouter } from './routes/v1/health';
import { validateRouter } from './routes/v1/validate';
import { previewRouter } from './routes/v1/preview';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// OpenAPI/Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI-Native Foundation API',
      version: '1.0.0',
      description: 'Semantic SQL generation API for identity graphs. Converts natural language audience descriptions into production-ready SQL queries.',
      contact: {
        name: 'API Support',
        email: 'support@semantic-sql.ai'
      }
    },
    servers: [
      {
        url: process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : `http://localhost:${PORT}`,
        description: process.env.NODE_ENV === 'production' 
          ? 'Production API' 
          : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'API key authentication. Use format: Bearer {api_key}'
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ]
  },
  apis: [
    './routes/v1/*.ts',      // Development (TypeScript)
    './dist/routes/v1/*.js'  // Production (compiled JavaScript)
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AI-Native Foundation API Docs'
}));

// API Routes
app.use('/v1/generate', generateRouter);
app.use('/v1/schemas', schemasRouter);
app.use('/v1/health', healthRouter);
app.use('/v1/validate', validateRouter);
app.use('/v1/preview', previewRouter);

// Root redirect to docs
app.get('/', (req: Request, res: Response) => {
  res.redirect('/api-docs');
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server (only when not in Vercel serverless environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 AI-Native Foundation API running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  });
}

// Export for Vercel serverless
export default app;
