'use client';

import { useState, useEffect } from 'react';
import { getCSRFToken } from '@/lib/csrf-middleware';

/**
 * Hook React pour utiliser CSRF dans les composants
 * Note: Ce hook doit être utilisé uniquement dans des composants client
 */
export function useCSRF() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCSRFToken().then((t) => {
      setToken(t);
      setLoading(false);
    });
  }, []);

  const refreshToken = async () => {
    setLoading(true);
    const newToken = await getCSRFToken();
    setToken(newToken);
    setLoading(false);
    return newToken;
  };

  return {
    token,
    loading,
    refreshToken,
    getHeaders: () => ({
      'X-CSRF-Token': token || '',
      'Content-Type': 'application/json',
    }),
  };
}

