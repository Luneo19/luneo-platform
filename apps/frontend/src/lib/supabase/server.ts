import { cookies } from 'next/headers';

/**
 * Creates a Supabase server client
 * Returns mock client if Supabase is not configured
 */

// Mock client
const createMockServerClient = () => ({
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
  },
});

// Lazy loader
let supabaseServerModule: any = null;

async function loadSupabaseServerModule() {
  if (supabaseServerModule) return supabaseServerModule;
  
  try {
    supabaseServerModule = await import('@supabase/ssr');
    return supabaseServerModule;
  } catch (error) {
    return null;
  }
}

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, return mock client
  if (!url || !key || !url.trim() || !key.trim()) {
    return createMockServerClient() as any;
  }

  const supabaseModule = await loadSupabaseServerModule();
  if (!supabaseModule || !supabaseModule.createServerClient) {
    return createMockServerClient() as any;
  }

  try {
    const cookieStore = await cookies();
    return supabaseModule.createServerClient(url, key, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Cookie setting can fail in Server Components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Cookie removal can fail in Server Components
          }
        },
      },
    });
  } catch (error) {
    return createMockServerClient() as any;
  }
}
