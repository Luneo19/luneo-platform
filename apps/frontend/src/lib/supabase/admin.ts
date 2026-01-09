/**
 * Creates a Supabase admin client
 * Returns mock client if Supabase is not configured
 */
import { logger } from '@/lib/logger';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If Supabase is not configured, return mock client
  if (!url || !serviceKey) {
    logger.warn('Supabase admin client not configured. Returning mock client.');
    return {
      auth: {
        admin: {
          getUserById: async () => ({ data: { user: null }, error: null }),
          listUsers: async () => ({ data: { users: [] }, error: null }),
        },
      },
    } as any;
  }

  // Dynamic import to avoid errors
  try {
    const { createClient } = require('@supabase/supabase-js');
    return createClient(url, serviceKey);
  } catch (error) {
    logger.warn('Failed to create Supabase admin client', { error: error instanceof Error ? error.message : String(error) });
    return {
      auth: {
        admin: {
          getUserById: async () => ({ data: { user: null }, error: null }),
          listUsers: async () => ({ data: { users: [] }, error: null }),
        },
      },
    } as any;
  }
}


