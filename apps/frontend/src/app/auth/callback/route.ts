import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * OAuth Callback Route
 * Handles OAuth callbacks from backend (NestJS)
 * Backend redirects here after successful OAuth authentication
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle errors
  if (error) {
    logger.error('OAuth callback error', {
      error,
      errorDescription,
      origin,
    });
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
    );
  }

  // Successful OAuth - backend has set httpOnly cookies
  // Redirect to overview
  const redirectTo = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirect') || '/overview';
  
  return NextResponse.redirect(`${origin}${redirectTo}`);
}
