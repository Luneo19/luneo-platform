/**
 * Creates a Supabase client for browser-side usage
 * Automatically handles cookie management for session persistence
 * 
 * NOTE: Supabase is being phased out in favor of NestJS backend auth.
 * This function returns a mock client if Supabase env vars are not configured.
 */

// Mock Supabase client when not configured
const createMockClient = () => ({
  auth: {
    signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ 
      data: { 
        subscription: { 
          unsubscribe: () => {} 
        } 
      } 
    }),
    getSession: async () => ({ data: { session: null }, error: null }),
  },
});

// Lazy loader for Supabase - only loads if configured
let supabaseModule: any = null;

function loadSupabaseModule() {
  if (supabaseModule) return supabaseModule;
  
  try {
    supabaseModule = require('@supabase/ssr');
    return supabaseModule;
  } catch (error) {
    return null;
  }
}

export function createClient() {
  // Check if Supabase is configured BEFORE importing
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, return mock client immediately
  if (!url || !key || !url.trim() || !key.trim()) {
    return createMockClient() as any;
  }

  // Try to load and use Supabase module
  const module = loadSupabaseModule();
  if (!module || !module.createBrowserClient) {
    return createMockClient() as any;
  }

  try {
    return module.createBrowserClient(url, key);
  } catch (error) {
    return createMockClient() as any;
  }
}

