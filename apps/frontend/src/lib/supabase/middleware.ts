import { NextRequest, NextResponse } from 'next/server';

/**
 * Creates a Supabase middleware client
 * Returns mock client if Supabase is not configured
 */

// Mock client
const createMockMiddlewareClient = () => ({
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
  },
});

// Lazy loader
let supabaseMiddlewareModule: any = null;

function loadSupabaseMiddlewareModule() {
  if (supabaseMiddlewareModule) return supabaseMiddlewareModule;
  
  try {
    supabaseMiddlewareModule = require('@supabase/ssr');
    return supabaseMiddlewareModule;
  } catch (error) {
    return null;
  }
}

export function createClient(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, return mock client
  if (!url || !key || !url.trim() || !key.trim()) {
    return createMockMiddlewareClient() as any;
  }

  const supabaseModule = loadSupabaseMiddlewareModule();
  if (!supabaseModule || !supabaseModule.createServerClient) {
    return createMockMiddlewareClient() as any;
  }

  try {
    return supabaseModule.createServerClient(url, key, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    });
  } catch (error) {
    return createMockMiddlewareClient() as any;
  }
}
