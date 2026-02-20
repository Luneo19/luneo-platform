import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * Express middleware function for CSRF token generation
 * Can be used directly in Express apps (e.g., main.ts)
 */
function extractCookieDomain(): string | undefined {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
  if (!frontendUrl) return undefined;
  try {
    const hostname = new URL(frontendUrl).hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return '.' + parts.slice(-2).join('.');
    }
  } catch { /* ignore */ }
  return undefined;
}

export function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingToken = req.cookies?.csrf_token;
  const isProduction = process.env.NODE_ENV === 'production';

  const isValidFormat = existingToken && typeof existingToken === 'string' && /^[a-f0-9]{64}$/.test(existingToken);

  const tokenCreatedAt = req.cookies?.csrf_token_created;
  const maxAge = 1 * 60 * 60 * 1000;
  const needsRotation = !tokenCreatedAt || (Date.now() - parseInt(tokenCreatedAt, 10)) > maxAge;

  if (!isValidFormat || needsRotation) {
    const token = crypto.randomBytes(32).toString('hex');
    const domain = isProduction ? extractCookieDomain() : undefined;
    
    const cookieOpts: Record<string, unknown> = {
      httpOnly: false,
      sameSite: isProduction ? 'lax' as const : 'strict' as const,
      secure: isProduction,
      path: '/',
      maxAge: 2 * 60 * 60 * 1000,
      ...(domain ? { domain } : {}),
    };

    res.cookie('csrf_token', token, cookieOpts);
    res.cookie('csrf_token_created', String(Date.now()), {
      ...cookieOpts,
      httpOnly: true,
    });

    res.locals.csrfToken = token;
  } else {
    res.locals.csrfToken = existingToken;
  }

  next();
}

/**
 * NestJS middleware class for CSRF token generation
 * Can be registered in NestJS modules if needed
 */
@Injectable()
export class CsrfTokenMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    return csrfTokenMiddleware(req, res, next);
  }
}
