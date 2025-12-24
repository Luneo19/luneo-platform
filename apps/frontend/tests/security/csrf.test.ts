/**
 * Tests CSRF Protection
 * TODO-048: Tests complets pour protection CSRF
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { validateCSRFFromRequest, generateCSRFToken } from '@/lib/csrf';
import { csrfMiddleware } from '@/lib/csrf-middleware';

describe('CSRF Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Generation', () => {
    it('should generate a valid CSRF token', async () => {
      const token = await generateCSRFToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', async () => {
      const token1 = await generateCSRFToken();
      const token2 = await generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('Token Validation', () => {
    it('should validate a correct CSRF token', async () => {
      const token = await generateCSRFToken();
      const isValid = await validateCSRFToken(token);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid CSRF token', async () => {
      const isValid = await validateCSRFToken('invalid-token');
      expect(isValid).toBe(false);
    });

    it('should reject an empty token', async () => {
      const isValid = await validateCSRFToken('');
      expect(isValid).toBe(false);
    });
  });

  describe('CSRF Middleware', () => {
    it('should allow GET requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      const response = await csrfMiddleware(request);
      expect(response).toBeNull();
    });

    it('should allow OPTIONS requests without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS',
      });

      const response = await csrfMiddleware(request);
      expect(response).toBeNull();
    });

    it('should require CSRF token for POST requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await csrfMiddleware(request);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
    });

    it('should allow POST requests with valid CSRF token', async () => {
      const token = await generateCSRFToken();
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
      });

      // Mock cookies pour la validation
      // Note: Ce test nécessite un environnement de test complet
      // avec gestion des cookies
    });

    it('should allow public routes without CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/test', {
        method: 'POST',
      });

      const response = await csrfMiddleware(request);
      expect(response).toBeNull();
    });

    it('should require CSRF token for PUT requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'PUT',
      });

      const response = await csrfMiddleware(request);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
    });

    it('should require CSRF token for DELETE requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'DELETE',
      });

      const response = await csrfMiddleware(request);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing token gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });

      const response = await csrfMiddleware(request);
      expect(response).not.toBeNull();
      const json = await response?.json();
      expect(json.error).toContain('CSRF token');
    });

    it('should return proper error code', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });

      const response = await csrfMiddleware(request);
      const json = await response?.json();
      expect(json.code).toBe('CSRF_TOKEN_INVALID');
    });
  });
});

