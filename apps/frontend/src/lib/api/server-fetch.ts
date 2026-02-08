import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

/**
 * Server-side fetch wrapper for Next.js server components.
 * Automatically attaches auth token from cookies.
 */
export async function serverFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get('accessToken')?.value ||
    cookieStore.get('access_token')?.value ||
    cookieStore.get('token')?.value;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${getBackendUrl()}${path}`, {
    ...options,
    headers,
    cache: options?.cache ?? 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
