import { generateCSRFToken } from '@/lib/csrf';
import { NextResponse } from 'next/server';
import { serverLogger } from '@/lib/logger-server';

/**
 * GET /api/csrf/token
 * Génère un token CSRF pour le client
 * Utilisé par les formulaires sensibles (création de compte, paiement, etc.)
 */
export async function GET() {
  try {
    const token = await generateCSRFToken();

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error: unknown) {
    serverLogger.error('CSRF token generation error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

