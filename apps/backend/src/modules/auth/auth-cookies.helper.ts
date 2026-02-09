import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Helper pour gérer les cookies httpOnly pour les tokens JWT
 */
export class AuthCookiesHelper {
  /**
   * Définir les cookies pour les tokens JWT
   */
  static setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    configService: ConfigService,
  ): void {
    const isProduction = configService.get('app.nodeEnv') === 'production';
    const frontendUrl = configService.get('app.frontendUrl') || process.env.FRONTEND_URL || 'http://localhost:3000';
    const domain = this.extractDomain(frontendUrl);

    // Access Token cookie (15 minutes)
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only en production
      sameSite: 'lax', // Protection CSRF
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
      ...(domain && !domain.includes('localhost') ? { domain } : {}),
    });

    // Refresh Token cookie (7 days)
    // Path set to '/' so Next.js server-side rendering can read it for token refresh
    // The cookie is httpOnly so client-side JS cannot access it
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only en production
      sameSite: 'lax', // Protection CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
      ...(domain && !domain.includes('localhost') ? { domain } : {}),
    });
  }

  /**
   * Supprimer les cookies d'authentification
   */
  static clearAuthCookies(
    res: Response,
    configService: ConfigService,
  ): void {
    const frontendUrl = configService.get('app.frontendUrl') || process.env.FRONTEND_URL || 'http://localhost:3000';
    const domain = this.extractDomain(frontendUrl);

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: configService.get('app.nodeEnv') === 'production',
      sameSite: 'lax',
      path: '/',
      ...(domain && !domain.includes('localhost') ? { domain } : {}),
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: configService.get('app.nodeEnv') === 'production',
      sameSite: 'lax',
      path: '/',
      ...(domain && !domain.includes('localhost') ? { domain } : {}),
    });
    
    // Also clear with old path for migration (existing cookies with path=/api/v1/auth)
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: configService.get('app.nodeEnv') === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      ...(domain && !domain.includes('localhost') ? { domain } : {}),
    });
  }

  /**
   * Extraire le domaine depuis une URL
   */
  private static extractDomain(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Pour localhost, pas de domaine
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return null;
      }

      // Extraire le domaine principal (sans sous-domaine si nécessaire)
      // Ex: app.luneo.app -> .luneo.app
      const parts = hostname.split('.');
      if (parts.length > 2) {
        return `.${parts.slice(-2).join('.')}`; // .luneo.app
      }
      
      return hostname;
    } catch {
      return null;
    }
  }
}
