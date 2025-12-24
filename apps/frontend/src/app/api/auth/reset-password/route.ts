import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token et mot de passe requis' },
        { status: 400 }
      );
    }

    // Validation robuste du mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    if (password.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe est trop long (max 100 caractères)' },
        { status: 400 }
      );
    }

    // Vérifier la complexité (au moins 1 lettre et 1 chiffre)
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (!hasLetter || !hasNumber) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe doit contenir au moins une lettre et un chiffre' },
        { status: 400 }
      );
    }

    // Appeler le backend NestJS pour réinitialiser le mot de passe
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword: password }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Backend reset-password error', { 
        status: response.status,
        error: data.message || 'Unknown error'
      });

      return NextResponse.json(
        { 
          success: false,
          error: data.message || 'Token invalide ou expiré',
        },
        { status: response.status }
      );
    }

    logger.info('Password reset successful', { 
      token: token.substring(0, 10) + '***'
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    });
  } catch (error: unknown) {
    logger.error('Error in reset-password route', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la réinitialisation du mot de passe. Veuillez réessayer.',
      },
      { status: 500 }
    );
  }
}

