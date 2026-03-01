/**
 * ★★★ HELPERS - UTILITAIRES GÉNÉRAUX ★★★
 * Helpers professionnels pour le développement
 * - Array helpers
 * - Object helpers
 * - Async helpers
 * - Debounce/Throttle
 * - Deep merge
 * - Cloning
 */

// ========================================
// ARRAY HELPERS
// ========================================

/**
 * Groupe un tableau par une clé
 */
export function groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  const getKey = typeof key === 'function' ? key : (item: T) => String(item[key]);
  
  return array.reduce((acc, item) => {
    const groupKey = getKey(item);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Trie un tableau par une clé
 */
export function sortBy<T>(array: T[], key: keyof T | ((item: T) => unknown), order: 'asc' | 'desc' = 'asc'): T[] {
  const getValue = typeof key === 'function' ? key : (item: T) => item[key];
  
  return [...array].sort((a, b) => {
    const aVal = getValue(a) as string | number;
    const bVal = getValue(b) as string | number;
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Supprime les doublons d'un tableau
 */
export function unique<T>(array: T[], key?: keyof T | ((item: T) => unknown)): T[] {
  if (!key) {
    return Array.from(new Set(array));
  }
  
  const getValue = typeof key === 'function' ? key : (item: T) => item[key];
  const seen = new Set();
  
  return array.filter((item) => {
    const value = getValue(item);
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Chunk un tableau en groupes de taille n
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Flatten un tableau multidimensionnel
 */
export function flatten<T>(array: (T | T[])[]): T[] {
  return array.reduce<T[]>((acc, item) => {
    if (Array.isArray(item)) {
      acc.push(...flatten(item));
      return acc;
    }
    acc.push(item);
    return acc;
  }, []);
}

// ========================================
// OBJECT HELPERS
// ========================================

/**
 * Deep merge deux objets
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const output: Record<string, unknown> = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = (source as Record<string, unknown>)[key];
      const targetValue = (target as Record<string, unknown>)[key];

      if (isObject(sourceValue)) {
        if (!targetValue) {
          output[key] = sourceValue;
        } else {
          output[key] = deepMerge(targetValue as Record<string, unknown>, sourceValue as Partial<Record<string, unknown>>);
        }
        return;
      }

      output[key] = sourceValue;
    });
  }
  
  return output as T;
}

/**
 * Deep clone un objet
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}

/**
 * Omet des clés d'un objet
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
}

/**
 * Sélectionne des clés d'un objet
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Vérifie si une valeur est un objet
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Vérifie si un objet est vide
 */
export function isEmpty(obj: unknown): boolean {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (isObject(obj)) return Object.keys(obj).length === 0;
  return false;
}

// ========================================
// ASYNC HELPERS
// ========================================

/**
 * Retourne une promesse qui se résout après un délai
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retourne une promesse avec timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Retry une fonction async
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, onRetry } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        onRetry?.(attempt + 1, error);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// ========================================
// DEBOUNCE & THROTTLE
// ========================================

/**
 * Debounce une fonction
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle une fonction
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ========================================
// RANDOM HELPERS
// ========================================

/**
 * Génère un ID unique
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Génère un nombre aléatoire entre min et max
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sélectionne un élément aléatoire d'un tableau
 */
export function randomItem<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[randomInt(0, array.length - 1)];
}

// ========================================
// TYPE HELPERS
// ========================================

/**
 * Type guard pour vérifier si une valeur n'est pas null/undefined
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard pour vérifier si une valeur est un string non vide
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard pour vérifier si une valeur est un nombre
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

// ========================================
// EXPORT
// ========================================

// Tous les exports sont déjà déclarés avec 'export function' ci-dessus
// Pas besoin de bloc export supplémentaire

