/**
 * @file utils.test.ts
 * @description Tests pour les utilitaires
 * @task T-001 - Validation de la configuration Vitest
 */

import { describe, it, expect } from 'vitest';

// Import utilities - ces fonctions doivent exister dans votre codebase
// Sinon, créez-les ou adaptez les tests

describe('Utility Functions', () => {
  describe('String Utilities', () => {
    it('should handle empty strings', () => {
      const str = '';
      expect(str.length).toBe(0);
    });

    it('should trim whitespace', () => {
      const str = '  hello world  ';
      expect(str.trim()).toBe('hello world');
    });
  });

  describe('Number Utilities', () => {
    it('should format price correctly', () => {
      const price = 29.99;
      const formatted = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(price);
      
      expect(formatted).toContain('29,99');
      expect(formatted).toContain('€');
    });

    it('should calculate percentage', () => {
      const calculatePercentage = (value: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
      };
      
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 3)).toBe(33);
      expect(calculatePercentage(0, 100)).toBe(0);
      expect(calculatePercentage(100, 0)).toBe(0);
    });
  });

  describe('Date Utilities', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-11-27T12:00:00Z');
      const formatted = new Intl.DateTimeFormat('fr-FR').format(date);
      
      expect(formatted).toBe('27/11/2025');
    });

    it('should calculate days between dates', () => {
      const daysBetween = (date1: Date, date2: Date) => {
        const diff = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      };
      
      const date1 = new Date('2025-11-01');
      const date2 = new Date('2025-11-27');
      
      expect(daysBetween(date1, date2)).toBe(26);
    });
  });

  describe('Array Utilities', () => {
    it('should remove duplicates', () => {
      const removeDuplicates = <T>(arr: T[]): T[] => [...new Set(arr)];
      
      const input = [1, 2, 2, 3, 3, 3, 4];
      expect(removeDuplicates(input)).toEqual([1, 2, 3, 4]);
    });

    it('should group by key', () => {
      const groupBy = <T>(arr: T[], key: keyof T): Record<string, T[]> => {
        return arr.reduce((acc, item) => {
          const groupKey = String(item[key]);
          if (!acc[groupKey]) {
            acc[groupKey] = [];
          }
          acc[groupKey].push(item);
          return acc;
        }, {} as Record<string, T[]>);
      };
      
      const items = [
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
        { id: 3, category: 'A' },
      ];
      
      const grouped = groupBy(items, 'category');
      expect(grouped['A']).toHaveLength(2);
      expect(grouped['B']).toHaveLength(1);
    });

    it('should chunk array', () => {
      const chunk = <T>(arr: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };
      
      const input = [1, 2, 3, 4, 5, 6, 7];
      expect(chunk(input, 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });
  });

  describe('Object Utilities', () => {
    it('should deep clone object', () => {
      const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
      
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      cloned.b.c = 3;
      
      expect(original.b.c).toBe(2);
      expect(cloned.b.c).toBe(3);
    });

    it('should pick specific keys', () => {
      const pick = <T extends object, K extends keyof T>(
        obj: T,
        keys: K[]
      ): Pick<T, K> => {
        const result = {} as Pick<T, K>;
        keys.forEach((key) => {
          if (key in obj) {
            result[key] = obj[key];
          }
        });
        return result;
      };
      
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    it('should omit specific keys', () => {
      const omit = <T extends object, K extends keyof T>(
        obj: T,
        keys: K[]
      ): Omit<T, K> => {
        const result = { ...obj };
        keys.forEach((key) => {
          delete (result as any)[key];
        });
        return result;
      };
      
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
    });
  });

  describe('Validation Utilities', () => {
    it('should validate email format', () => {
      const isValidEmail = (email: string): boolean => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      };
      
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('test.user@example.co.uk')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should validate password strength', () => {
      const isStrongPassword = (password: string): boolean => {
        // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return regex.test(password);
      };
      
      expect(isStrongPassword('Password123')).toBe(true);
      expect(isStrongPassword('password')).toBe(false);
      expect(isStrongPassword('PASSWORD')).toBe(false);
      expect(isStrongPassword('Pass1')).toBe(false);
    });

    it('should validate URL format', () => {
      const isValidUrl = (url: string): boolean => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };
      
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('not-a-url')).toBe(false);
    });
  });

  describe('Async Utilities', () => {
    it('should debounce function calls', async () => {
      const debounce = <T extends (...args: any[]) => any>(
        fn: T,
        delay: number
      ): ((...args: Parameters<T>) => void) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => fn(...args), delay);
        };
      };
      
      let callCount = 0;
      const increment = () => callCount++;
      const debouncedIncrement = debounce(increment, 50);
      
      debouncedIncrement();
      debouncedIncrement();
      debouncedIncrement();
      
      expect(callCount).toBe(0);
      
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      expect(callCount).toBe(1);
    });

    it('should retry failed operations', async () => {
      const retry = async <T>(
        fn: () => Promise<T>,
        retries: number
      ): Promise<T> => {
        for (let i = 0; i < retries; i++) {
          try {
            return await fn();
          } catch (error) {
            if (i === retries - 1) throw error;
          }
        }
        throw new Error('All retries failed');
      };
      
      let attempts = 0;
      const failTwice = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Fail');
        return 'success';
      };
      
      const result = await retry(failTwice, 3);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });
});

