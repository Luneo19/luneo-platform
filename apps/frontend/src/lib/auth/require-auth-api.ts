/**
 * API Route Authentication Helper
 * Ensures the user is authenticated before processing the request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, AuthUser } from './get-user';

export interface AuthenticatedRequest extends NextRequest {
  user: AuthUser;
}

/**
 * Require authentication for API routes
 * Returns the authenticated user or throws an error response
 */
export async function requireAuthApi(request: NextRequest): Promise<AuthUser> {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    throw new NextResponse(
      JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return user;
}

/**
 * Wrapper for API route handlers that require authentication
 */
export function withAuth<T>(
  handler: (request: NextRequest, user: AuthUser) => Promise<T>
) {
  return async (request: NextRequest): Promise<T | NextResponse> => {
    try {
      const user = await requireAuthApi(request);
      return handler(request, user);
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
      return new NextResponse(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}
