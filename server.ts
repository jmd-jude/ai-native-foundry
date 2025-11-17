import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
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
        // Use relative URL for same-origin requests (works in both dev and prod)
        url: '/',
        description: 'Current environment'
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
  // In production, server.js is in dist/, so paths are relative to dist/
  // In development, server.ts is in root, so paths are relative to root
  apis: process.env.NODE_ENV === 'production'
    ? ['./routes/v1/*.js']           // Production: from dist/server.js -> dist/routes/v1/*.js
    : ['./routes/v1/*.ts']            // Development: from server.ts -> routes/v1/*.ts
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI route with CDN-hosted assets (for Vercel compatibility)
app.get('/api-docs', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AI-Native Foundation API Docs</title>
  <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui.min.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui-bundle.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui-standalone-preset.min.js"></script>
  <script>
    window.onload = function() {
      const spec = ${JSON.stringify(swaggerSpec)};
      window.ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
  `);
});

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
