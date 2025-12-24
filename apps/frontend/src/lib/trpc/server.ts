/**
 * ★★★ SERVER TRPC - CONFIGURATION COMPLÈTE ★★★
 * Configuration serveur tRPC avec:
 * - Context avec DB et auth
 * - Middleware de logging
 * - Gestion d'erreurs
 * - Validation Zod
 */

import { getUserFromRequest } from '@/lib/auth/get-user';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';

// ========================================
// CONTEXT
// ========================================

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  brandId?: string;
}

export interface Context {
  db: typeof db;
  user: AuthUser | null;
}

/**
 * Crée le context pour chaque requête
 */
export async function createContext(opts?: { req?: Request }): Promise<Context> {
  let user: AuthUser | null = null;

  // Récupérer user depuis session/auth si requête fournie
  if (opts?.req) {
    try {
      user = await getUserFromRequest(opts.req);
    } catch (error) {
      logger.error('Error getting user in tRPC context', { error });
      // Continue with null user
    }
  }

  return {
    db,
    user,
  };
}

// ========================================
// INITIALISATION TRPC
// ========================================

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

// ========================================
// MIDDLEWARES
// ========================================

/**
 * Middleware de logging
 */
const loggingMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();

  logger.info(`[tRPC] ${type.toUpperCase()} ${path}`, {
    userId: ctx.user?.id,
  });

  const result = await next();

  const duration = Date.now() - start;

  if (result.ok) {
    logger.info(`[tRPC] ${type.toUpperCase()} ${path} completed in ${duration}ms`);
  } else {
    logger.error(`[tRPC] ${type.toUpperCase()} ${path} failed`, {
      error: result.error,
      duration,
    });
  }

  return result;
});

/**
 * Middleware d'authentification
 */
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Vous devez être connecté pour accéder à cette ressource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Type narrowing
    },
  });
});

/**
 * Middleware admin
 */
const adminMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Vous devez être connecté',
    });
  }

  if (ctx.user.role !== 'PLATFORM_ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé aux administrateurs',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// ========================================
// PROCEDURES
// ========================================

/**
 * Procedure publique (pas d'auth requise)
 */
export const publicProcedure = t.procedure.use(loggingMiddleware);

/**
 * Procedure protégée (auth requise)
 */
export const protectedProcedure = t.procedure
  .use(loggingMiddleware)
  .use(authMiddleware);

/**
 * Procedure admin (admin uniquement)
 */
export const adminProcedure = t.procedure
  .use(loggingMiddleware)
  .use(adminMiddleware);

// ========================================
// ROUTER BASE
// ========================================

export const router = t.router;

