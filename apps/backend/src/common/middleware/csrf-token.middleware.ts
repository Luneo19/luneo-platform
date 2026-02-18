import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * Express middleware function for CSRF token generation
 * Can be used directly in Express apps (e.g., main.ts)
 */
export function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingToken = req.cookies?.csrf_token;
  const isProduction = process.env.NODE_ENV === 'production';

  // SECURITY FIX: Validate existing token format and enforce rotation
  const isValidFormat = existingToken && typeof existingToken === 'string' && /^[a-f0-9]{64}$/.test(existingToken);

  // SECURITY FIX: Rotate CSRF token periodically (every 1 hour instead of 7 days)
  // Check token age via a companion cookie
  const tokenCreatedAt = req.cookies?.csrf_token_created;
  const maxAge = 1 * 60 * 60 * 1000; // 1 hour rotation
  const needsRotation = !tokenCreatedAt || (Date.now() - parseInt(tokenCreatedAt, 10)) > maxAge;

  if (!isValidFormat || needsRotation) {
    const token = crypto.randomBytes(32).toString('hex');
    
    const cookieOpts = {
      httpOnly: false, // Client JS must read it for double-submit pattern
      sameSite: 'strict' as const,
      secure: isProduction,
      path: '/',
      maxAge: 2 * 60 * 60 * 1000, // 2 hours (token lives longer than rotation cycle)
    };

    res.cookie('csrf_token', token, cookieOpts);
    // SECURITY FIX: Track token creation time for rotation
    res.cookie('csrf_token_created', String(Date.now()), {
      ...cookieOpts,
      httpOnly: true, // Creation timestamp doesn't need JS access
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
