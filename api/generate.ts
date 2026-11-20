import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleGatewayRequest } from '../server/gateway';

// Vercel serverless function. The API key never reaches the browser bundle.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleGatewayRequest(req, res, process.env);
}
