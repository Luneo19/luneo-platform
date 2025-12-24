import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for browser-side usage
 * Automatically handles cookie management for session persistence
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

