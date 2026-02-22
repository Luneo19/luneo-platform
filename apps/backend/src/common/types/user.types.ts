/**
 * User Types - Types pour les utilisateurs et l'authentification V2
 * Adapte pour le schema multi-tenant Organization (ex-Brand)
 */

import { PlatformRole } from '@prisma/client';

export type RequestWithOptionalUser = import('express').Request & { user?: CurrentUser };
export type RequestWithUser = import('express').Request & { user: CurrentUser };

/**
 * Utilisateur actuel authentifie
 * Retourne par JWT Strategy apres validation du token
 */
export interface CurrentUser {
  id: string;
  email: string;
  role: PlatformRole;
  organizationId: string | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    logo?: string | null;
  } | null;
  /** @deprecated Use organizationId instead */
  brandId?: string | null;
}

/**
 * Payload JWT standard
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: PlatformRole;
  iat?: number;
  exp?: number;
}

/**
 * Utilisateur minimal pour les verifications d'autorisation
 */
export interface MinimalUser {
  id: string;
  role: PlatformRole;
  organizationId?: string | null;
}

export function toMinimalUser(user: CurrentUser): MinimalUser {
  return {
    id: user.id,
    role: user.role,
    organizationId: user.organizationId,
  };
}
