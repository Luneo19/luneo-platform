import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * GET /auth/callback
 * OAuth callback handler for Google, GitHub, and other providers
 * This route is called by Supabase Auth after successful OAuth authentication
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  // Handle OAuth error
  if (error) {
    logger.error('OAuth Error', {
      error,
      errorDescription,
      origin,
    });
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
    );
  }

  // Exchange code for session
  if (code) {
    try {
      const supabase = await createClient();
      
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        logger.error('Code exchange error', {
          error: exchangeError,
          code: code.substring(0, 10) + '...',
          origin,
        });
        return NextResponse.redirect(
          `${origin}/login?error=auth_failed&description=${encodeURIComponent(exchangeError.message)}`
        );
      }

      if (data.session) {

        // Get redirect URL from query params or default to dashboard overview
        const redirectTo = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirect') || '/dashboard/overview';
        
        // Successful authentication - redirect to dashboard or specified URL
        return NextResponse.redirect(`${origin}${redirectTo}`);
      }
    } catch (err: any) {
      logger.error('Erreur callback OAuth', {
        error: err,
        code: code?.substring(0, 10) + '...',
        origin,
        message: err.message || 'Unknown error',
      });
      return NextResponse.redirect(
        `${origin}/login?error=server_error&description=${encodeURIComponent(err.message)}`
      );
    }
  }

  // No code provided - redirect to login

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}

