// Vercel serverless function entry point
// Wraps Express app to handle serverless request/response

import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server';

// Export the Express app as a Vercel serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Let Express handle the request
  return app(req as any, res as any);
}
