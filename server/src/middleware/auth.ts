import type { NextFunction, Request, Response } from 'express';
import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SupabaseJwtPayload extends Record<string, unknown> {
  sub: string;
  exp: number;
  role?: string;
  email?: string;
  aud?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    supabaseUser?: SupabaseJwtPayload;
  }
}

const UNAUTHORIZED_RESPONSE = {
  success: false,
  error: 'Unauthorized',
};

export const authenticateSupabaseJwt = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    res.status(401).json(UNAUTHORIZED_RESPONSE);
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    res.status(401).json(UNAUTHORIZED_RESPONSE);
    return;
  }

  try {
    const payload = verifySupabaseJwt(token);
    req.supabaseUser = payload;
    res.locals.supabaseUser = payload;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'Supabase JWT secret not configured') {
      console.error('[auth] Missing SUPABASE_JWT_SECRET environment variable');
      res.status(500).json({
        success: false,
        error: 'Server configuration error',
      });
      return;
    }

    console.warn('[auth] Supabase JWT rejected', {
      reason: message,
      path: req.path,
      method: req.method,
    });

    res.status(401).json(UNAUTHORIZED_RESPONSE);
  }
};

const verifySupabaseJwt = (token: string): SupabaseJwtPayload => {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('Supabase JWT secret not configured');
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = segments;

  const header = parseJsonSegment(encodedHeader);
  if (header.alg !== 'HS256' || header.typ !== 'JWT') {
    throw new Error('Unsupported token algorithm');
  }

  const computedSignature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  const providedSignature = base64UrlToBuffer(encodedSignature);

  if (
    computedSignature.length !== providedSignature.length ||
    !timingSafeEqual(computedSignature, providedSignature)
  ) {
    throw new Error('Invalid token signature');
  }

  const payload = parseJsonSegment(encodedPayload) as SupabaseJwtPayload;

  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    throw new Error('Invalid subject claim');
  }

  if (typeof payload.exp !== 'number') {
    throw new Error('Invalid exp claim');
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp <= nowInSeconds) {
    throw new Error('Token expired');
  }

  return payload;
};

const parseJsonSegment = (segment: string): Record<string, unknown> => {
  const buffer = base64UrlToBuffer(segment);
  try {
    return JSON.parse(buffer.toString('utf8')) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown reason';
    throw new Error(`Malformed token segment: ${message}`);
  }
};

const base64UrlToBuffer = (segment: string): Buffer => {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  return Buffer.from(padded, 'base64');
};
