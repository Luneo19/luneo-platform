/**
 * User Types - Types pour les utilisateurs et l'authentification
 * Types centralisés pour remplacer les 'any' dans les services
 */

import { UserRole } from '@prisma/client';

/** Express request with optional user (e.g. public or authenticated routes) */
export type RequestWithOptionalUser = import('express').Request & { user?: CurrentUser };

/** Express request with required user (use after JwtAuthGuard) */
export type RequestWithUser = import('express').Request & { user: CurrentUser };

/** Express request with user and brandId (set by BrandScopedGuard) */
export type RequestWithUserAndBrand = RequestWithUser & { brandId: string };

/**
 * Utilisateur actuel authentifié
 * Retourné par JWT Strategy et utilisé dans les guards
 */
export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  brandId?: string | null;
  brand?: {
    id: string;
    name: string;
    logo?: string | null;
    website?: string | null;
  } | null;
}

/**
 * Payload JWT standard
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Utilisateur minimal pour les vérifications d'autorisation
 */
export interface MinimalUser {
  id: string;
  role: UserRole;
  brandId?: string | null;
}

/**
 * Helper pour extraire un MinimalUser d'un CurrentUser
 */
export function toMinimalUser(user: CurrentUser): MinimalUser {
  return {
    id: user.id,
    role: user.role,
    brandId: user.brandId,
  };
}

