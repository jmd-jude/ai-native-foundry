import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import { generateRouter } from './routes/v1/generate';
import { schemasRouter } from './routes/v1/schemas';
import { healthRouter } from './routes/v1/health';
import { validateRouter } from './routes/v1/validate';
import { previewRouter } from './routes/v1/preview';
import { landingRouter } from './routes/landing';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins for now (configure properly in production)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
      title: 'AI-Native Semantic Foundry API',
      version: '1.0.0',
      description: 'Semantic context and SQL generation API for identity graph agents.',
      contact: {
        name: 'API Support',
        email: 'jude@two-to-one.org'
      }
    },
    servers: [
      {
        url: '/',
        description: 'demo'
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
  apis: process.env.NODE_ENV === 'production'
    ? ['./routes/v1/*.js']
    : ['./routes/v1/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Redoc documentation route
app.get('/api-docs', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AI-Native Semantic Foundry - API Documentation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <script 
    id="api-reference"
    data-url="/api-spec">
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>
  `);
});

// Serve OpenAPI spec as JSON for Redoc
app.get('/api-spec', (req: Request, res: Response) => {
  res.json(swaggerSpec);
});

// Landing page
app.use('/', landingRouter);

// API Routes
app.use('/v1/generate', generateRouter);
app.use('/v1/schemas', schemasRouter);
app.use('/v1/health', healthRouter);
app.use('/v1/validate', validateRouter);
app.use('/v1/preview', previewRouter);

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