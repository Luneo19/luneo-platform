/**
 * ★★★ PRISMA CLIENT - FRONTEND ★★★
 * Instance Prisma client pour le frontend
 * - Singleton pattern
 * - Connection pooling
 * - Error handling
 */

import { logger } from '@/lib/logger';

// ========================================
// CLIENT
// ========================================

// Lazy import pour éviter les erreurs si Prisma Client n'est pas encore généré
let PrismaClient: any;
let dbInstance: any;

function getPrismaClient() {
  if (!PrismaClient) {
    try {
      PrismaClient = require('@prisma/client').PrismaClient;
    } catch (error) {
      throw new Error('@prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.');
    }
  }
  return PrismaClient;
}

function createPrismaClient() {
  const Prisma = getPrismaClient();
  return new Prisma({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: any | undefined;
}

// Lazy initialization - ne crée le client que lorsqu'il est utilisé
function getDb() {
  if (!dbInstance) {
    dbInstance = globalThis.prisma ?? createPrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalThis.prisma = dbInstance;
    }
    
    // Configurer le middleware seulement si disponible
    if (dbInstance && typeof dbInstance.$use === 'function') {
      try {
        dbInstance.$use(async (params: any, next: any) => {
          const before = Date.now();
          const result = await next();
          const after = Date.now();

          if (after - before > 1000) {
            logger.warn('Slow query detected', {
              model: params.model,
              action: params.action,
              duration: after - before,
            });
          }

          return result;
        });
      } catch (error) {
        // Ignore si $use n'est pas disponible
      }
    }
  }
  return dbInstance;
}

// Proxy pour accéder aux propriétés de Prisma Client de manière lazy
export const db = new Proxy({} as any, {
  get(_target, prop) {
    const client = getDb();
    return client[prop];
  },
});

// ========================================
// EXPORT
// ========================================

export default db;

