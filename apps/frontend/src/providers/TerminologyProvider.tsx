'use client';

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useIndustryStore } from '@/store/industry.store';

// ========================================
// CONTEXT
// ========================================

interface TerminologyContextValue {
  /**
   * Translate a generic term to the industry-specific term.
   * Falls back to the generic term if no custom term is found.
   * 
   * @example
   * t('product') → "pièce" (jewelry) or "monture" (eyewear)
   */
  t: (genericTerm: string) => string;

  /**
   * Get the current locale (for future i18n support).
   */
  locale: 'fr' | 'en';
}

const TerminologyContext = createContext<TerminologyContextValue>({
  t: (term: string) => term,
  locale: 'fr',
});

// ========================================
// PROVIDER
// ========================================

interface TerminologyProviderProps {
  children: React.ReactNode;
  locale?: 'fr' | 'en';
}

export function TerminologyProvider({ children, locale = 'fr' }: TerminologyProviderProps) {
  const { industryConfig } = useIndustryStore();

  const terminologyMap: Record<string, string> = useMemo(() => {
    if (!industryConfig?.terminology) return {};
    return industryConfig.terminology as Record<string, string>;
  }, [industryConfig?.terminology]);

  const t = useCallback(
    (genericTerm: string): string => {
      const customTerm = terminologyMap[genericTerm];
      if (customTerm) return customTerm;
      return genericTerm;
    },
    [terminologyMap]
  );

  const value = useMemo(
    () => ({ t, locale }),
    [t, locale]
  );

  return (
    <TerminologyContext.Provider value={value}>
      {children}
    </TerminologyContext.Provider>
  );
}

// ========================================
// HOOK
// ========================================

/**
 * Hook to access industry-specific terminology.
 * 
 * @example
 * ```tsx
 * function ProductList() {
 *   const { t } = useTerminology();
 *   return <h1>Vos {t('product')}s</h1>;
 *   // Renders: "Vos pièces" for jewelry, "Vos montures" for eyewear
 * }
 * ```
 */
export function useTerminology() {
  const context = useContext(TerminologyContext);
  if (!context) {
    throw new Error('useTerminology must be used within a TerminologyProvider');
  }
  return context;
}
