import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

interface Integration {
  id: string;
  platform: string;
  platform_name: string;
  store_url: string | null;
  store_name: string | null;
  status: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  products_synced: number;
  orders_synced: number;
  created_at: string;
}

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error: dbError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      setIntegrations(data || []);
    } catch (err: any) {
      logger.error('Error fetching integrations', {
        error: err,
        message: err.message,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const connectShopify = async (storeDomain: string) => {
    try {
      // Rediriger vers l'OAuth Shopify
      window.location.href = `/api/integrations/shopify/connect?shop=${encodeURIComponent(storeDomain)}`;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const syncShopify = async (integrationId: string) => {
    try {
      const response = await fetch('/api/integrations/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Sync failed');
      }

      // Rafraîchir les intégrations
      await fetchIntegrations();

      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const disconnectIntegration = async (integrationId: string) => {
    try {
      const supabase = createClient();
      
      const { error: dbError } = await supabase
        .from('integrations')
        .update({
          is_active: false,
          status: 'disconnected',
          disconnected_at: new Date().toISOString(),
        })
        .eq('id', integrationId);

      if (dbError) throw dbError;

      // Rafraîchir les intégrations
      await fetchIntegrations();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    integrations,
    loading,
    error,
    connectShopify,
    syncShopify,
    disconnectIntegration,
    refresh: fetchIntegrations,
  };
}
