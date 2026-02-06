/**
 * Helper pour les tests d'intégration
 * Vérifie si l'environnement de test est configuré (DB, Redis)
 */

import { execSync } from 'child_process';

/**
 * Vérifie si PostgreSQL est disponible
 */
export const isPostgresAvailable = async (): Promise<boolean> => {
  try {
    // Vérifier la connexion à PostgreSQL via l'URL de test
    // Try test port first (5433), then local port (5432)
    try {
      execSync(`pg_isready -h localhost -p 5433 -U postgres`, { timeout: 5000, stdio: 'pipe' });
      return true;
    } catch {
      execSync(`pg_isready -h localhost -p 5432 -U postgres`, { timeout: 5000, stdio: 'pipe' });
      return true;
    }
  } catch {
    return false;
  }
};

/**
 * Vérifie si Redis est disponible
 */
export const isRedisAvailable = async (): Promise<boolean> => {
  try {
    // Try test port first (6380), then local port (6379)
    try {
      execSync('redis-cli -p 6380 ping', { timeout: 5000, stdio: 'pipe' });
      return true;
    } catch {
      execSync('redis-cli -p 6379 ping', { timeout: 5000, stdio: 'pipe' });
      return true;
    }
  } catch {
    return false;
  }
};

/**
 * Vérifie si l'environnement de test complet est disponible
 */
export const isTestEnvironmentReady = async (): Promise<boolean> => {
  const [postgres, redis] = await Promise.all([
    isPostgresAvailable(),
    isRedisAvailable(),
  ]);
  return postgres && redis;
};

/**
 * Décorateur pour skipper les tests si l'environnement n'est pas prêt
 */
export const describeIntegration = (
  name: string,
  fn: () => void,
  options: { skipMessage?: string } = {},
): void => {
  const { skipMessage = 'Integration tests require PostgreSQL and Redis running (docker-compose.test.yml)' } = options;
  
  let isReady = false;
  
  // Check if we're running integration tests explicitly
  // Integration tests require specific environment variable to be set
  const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';
  
  if (!runIntegration) {
    // Skip integration tests unless explicitly enabled
    isReady = false;
  } else {
    // Check synchronously at load time - try both test and local ports
    try {
      // Try PostgreSQL
      try {
        execSync('pg_isready -h localhost -p 5433 -U postgres', { timeout: 2000, stdio: 'pipe' });
      } catch {
        execSync('pg_isready -h localhost -p 5432 -U postgres', { timeout: 2000, stdio: 'pipe' });
      }
      // Try Redis
      try {
        execSync('redis-cli -p 6380 ping', { timeout: 2000, stdio: 'pipe' });
      } catch {
        execSync('redis-cli -p 6379 ping', { timeout: 2000, stdio: 'pipe' });
      }
      isReady = true;
    } catch {
      isReady = false;
    }
  }
  
  if (isReady) {
    describe(name, fn);
  } else {
    describe.skip(`${name} - SKIPPED: ${skipMessage}`, fn);
  }
};

/**
 * Helper pour créer des données de test
 */
export const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
};

export const testBrand = {
  name: 'Test Brand',
  slug: 'test-brand',
};
