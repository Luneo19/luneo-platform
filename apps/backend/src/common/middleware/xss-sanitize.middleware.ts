import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * XSS Sanitization Middleware
 * 
 * Sanitizes string values in request bodies to prevent XSS attacks.
 * Strips common XSS vectors: <script>, event handlers, javascript: URIs.
 */
@Injectable()
export class XssSanitizeMiddleware implements NestMiddleware {
  private static readonly RAW_SIGNATURE_SENSITIVE_PATHS = [
    '/billing/webhook',
    '/webhooks/email/inbound',
    '/webhooks/sendgrid/events',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // SECURITY FIX: Path traversal protection - reject requests with directory traversal patterns
    const url = req.url || req.originalUrl || '';
    if (url.includes('..') || url.includes('%2e%2e') || url.includes('%252e')) {
      res.status(400).json({ message: 'Invalid request path' });
      return;
    }

    if (this.shouldBypassSanitize(req)) {
      next();
      return;
    }

    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }
    next();
  }

  private shouldBypassSanitize(req: Request): boolean {
    if (req.method !== 'POST') {
      return false;
    }

    const path = req.path || req.url || '';
    return XssSanitizeMiddleware.RAW_SIGNATURE_SENSITIVE_PATHS.some((sensitivePath) =>
      path.endsWith(sensitivePath),
    );
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'string'
            ? this.sanitizeString(item)
            : typeof item === 'object' && item !== null
            ? this.sanitizeObject(item as Record<string, unknown>)
            : item,
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private sanitizeString(input: string): string {
    let sanitized = input
      // Remove <script> tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove on* event handlers (onclick, onerror, onload, etc.)
      .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
      // Remove javascript: URIs
      .replace(/javascript\s*:/gi, '')
      // Remove data: URIs that could contain scripts
      .replace(/data\s*:\s*text\/html/gi, '')
      // Remove vbscript: URIs
      .replace(/vbscript\s*:/gi, '')
      // Remove expression() CSS
      .replace(/expression\s*\(/gi, '')
      // Remove <iframe> tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<iframe\b[^>]*\/?>/gi, '')
      // Remove <object> tags
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<object\b[^>]*\/?>/gi, '')
      // Remove <embed> tags
      .replace(/<embed\b[^>]*\/?>/gi, '')
      // SECURITY FIX: Remove <form> tags (prevent form injection)
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      .replace(/<form\b[^>]*\/?>/gi, '')
      // SECURITY FIX: Remove <base> tags (prevent base URL hijacking)
      .replace(/<base\b[^>]*\/?>/gi, '')
      // SECURITY FIX: Remove <meta> tags (prevent redirect/refresh injection)
      .replace(/<meta\b[^>]*\/?>/gi, '')
      // SECURITY FIX: Remove <link> tags with rel=import or rel=stylesheet (prevent CSS injection)
      .replace(/<link\b[^>]*\/?>/gi, '')
      // SECURITY FIX: Remove <svg> onload and similar vectors
      .replace(/<svg\b[^>]*\bon\w+\s*=[^>]*>/gi, '');

    // SECURITY FIX: Encode remaining dangerous HTML entities in strings
    // that contain potential HTML (has < or > characters)
    if (sanitized.includes('<') || sanitized.includes('>')) {
      // Remove any remaining HTML tags that weren't caught above
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    return sanitized;
  }
}
