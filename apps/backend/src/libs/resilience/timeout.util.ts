/**
 * TIMEOUT-01: Utilitaire de timeout pour les services externes
 * Permet d'éviter les requêtes qui bloquent indéfiniment
 */

export class TimeoutError extends Error {
  constructor(
    public readonly operation: string,
    public readonly timeoutMs: number,
  ) {
    super(`Operation "${operation}" timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Exécute une opération avec timeout
 * @param operation - Promise à exécuter
 * @param timeoutMs - Timeout en millisecondes
 * @param operationName - Nom de l'opération pour le logging
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  operationName: string = 'Operation',
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(operationName, timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([operation, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Crée une version avec timeout d'une fonction async
 * @param fn - Fonction async à wrapper
 * @param timeoutMs - Timeout en millisecondes
 * @param operationName - Nom de l'opération pour le logging
 */
export function createTimeoutWrapper<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  timeoutMs: number,
  operationName: string = 'Operation',
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    return withTimeout(fn(...args), timeoutMs, operationName);
  };
}

/**
 * Timeouts par défaut recommandés par service
 */
export const DEFAULT_TIMEOUTS = {
  // Base de données
  PRISMA_QUERY: 30000,        // 30s pour queries complexes
  PRISMA_TRANSACTION: 60000,  // 60s pour transactions
  
  // Storage
  CLOUDINARY_UPLOAD: 60000,   // 60s pour uploads
  CLOUDINARY_DELETE: 10000,   // 10s pour suppressions
  
  // Email
  SENDGRID_SEND: 30000,       // 30s
  MAILGUN_SEND: 30000,        // 30s
  
  // E-commerce
  SHOPIFY_API: 30000,         // 30s
  WOOCOMMERCE_API: 30000,     // 30s
  
  // AI Services
  OPENAI_API: 120000,         // 2min pour génération
  REPLICATE_API: 300000,      // 5min pour modèles lourds
  
  // Payments
  STRIPE_API: 30000,          // 30s
} as const;
