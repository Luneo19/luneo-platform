/**
 * Server-side API utilities
 * Re-exports authentication helpers for server components and API routes
 */

export { getServerUser, getUserFromRequest, type AuthUser } from '@/lib/auth/get-user';
