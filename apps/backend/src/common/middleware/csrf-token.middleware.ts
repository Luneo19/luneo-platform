import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * Express middleware function for CSRF token generation
 * Can be used directly in Express apps (e.g., main.ts)
 */
export function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check if csrf_token cookie exists
  const existingToken = req.cookies?.csrf_token;

  if (!existingToken) {
    // Generate a new random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set cookie: httpOnly: false (client JS must read it), sameSite: 'strict', secure: true in production, path: '/'
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('csrf_token', token, {
      httpOnly: false, // Client JS must read it for double-submit pattern
      sameSite: 'strict',
      secure: isProduction, // Only send over HTTPS in production
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Attach to res.locals for SSR if needed
    res.locals.csrfToken = token;
  } else {
    // Token exists, attach to res.locals
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
