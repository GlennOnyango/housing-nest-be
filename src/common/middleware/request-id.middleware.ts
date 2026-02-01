import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const header = request.headers['x-request-id'];
  const requestId = typeof header === 'string' ? header : randomUUID();
  request.headers['x-request-id'] = requestId;
  response.setHeader('x-request-id', requestId);
  next();
}
