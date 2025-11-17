import { Request, Response, NextFunction } from 'express';

// In-memory API keys for Phase 1 (will move to database in Phase 2)
const VALID_API_KEYS = new Set([
  process.env.DEMO_API_KEY || 'sk_test_demo123456789'
]);

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
}

/**
 * Middleware to validate API key from Authorization header
 */
export function validateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Missing Authorization header',
      message: 'Include header: Authorization: Bearer {your_api_key}'
    });
    return;
  }

  const [scheme, apiKey] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !apiKey) {
    res.status(401).json({
      error: 'Invalid Authorization format',
      message: 'Use format: Bearer {your_api_key}'
    });
    return;
  }

  if (!VALID_API_KEYS.has(apiKey)) {
    res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
    return;
  }

  // Attach API key to request for usage tracking (future)
  req.apiKey = apiKey;
  next();
}
