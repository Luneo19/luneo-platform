import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    // Validation email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email invalide' },
        { status: 400 }
      );
    }

    // Appeler le backend NestJS pour envoyer l'email
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${backendUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        // Timeout de 10 secondes
        signal: AbortSignal.timeout(10000),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Backend forgot-password error', { 
          status: response.status, 
          error: data 
        });
        // Ne pas révéler l'erreur exacte pour des raisons de sécurité
      } else {
        logger.info('Forgot password email sent', { email: email.substring(0, 3) + '***' });
      }
    } catch (backendError) {
      logger.error('Failed to call backend forgot-password', { 
        error: backendError instanceof Error ? backendError.message : 'Unknown error',
        email: email.substring(0, 3) + '***'
      });
      // Continue même si le backend fail - ne pas révéler d'infos
    }

    // Toujours retourner succès pour ne pas révéler si l'email existe
    return NextResponse.json({ 
      success: true,
      message: 'Si votre email existe dans notre système, vous recevrez un lien de réinitialisation dans quelques minutes.'
    });

  } catch (error: unknown) {
    logger.error('Error in forgot-password route', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    // Ne pas révéler si le compte existe ou non (sécurité)
    return NextResponse.json(
      { 
        success: true,
        message: 'Si votre email existe dans notre système, vous recevrez un lien de réinitialisation'
      },
      { status: 200 }
    );
  }
}
