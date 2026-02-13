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
    options?: { rememberMe?: boolean },
  ): void {
    const isProduction = configService.get('app.nodeEnv') === 'production';
    const frontendUrl = configService.get('app.frontendUrl') || process.env.FRONTEND_URL || 'http://localhost:3000';
    const domain = this.extractDomain(frontendUrl);
    const rememberMe = options?.rememberMe ?? false;

    // Access Token cookie (15 minutes — always short-lived regardless of rememberMe)
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only en production
      sameSite: 'lax', // Protection CSRF
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
      ...(domain && !domain.includes('localhost') ? { domain } : {}),
    });

    // Refresh Token cookie: 7 days default, 30 days with rememberMe
    const refreshTokenMaxAge = rememberMe
      ? 30 * 24 * 60 * 60 * 1000  // 30 jours
      : 7 * 24 * 60 * 60 * 1000;  // 7 jours

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only en production
      sameSite: 'lax', // Protection CSRF
      maxAge: refreshTokenMaxAge,
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
    const isProduction = configService.get('app.nodeEnv') === 'production';
    const frontendUrl = configService.get('app.frontendUrl') || process.env.FRONTEND_URL || 'http://localhost:3000';
    const domain = this.extractDomain(frontendUrl);
    const clearOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      ...(domain && !domain.includes('localhost') ? { domain } : {}),
    };

    res.clearCookie('access_token', { ...clearOpts, path: '/' });
    res.clearCookie('refresh_token', { ...clearOpts, path: '/api/v1/auth/refresh' });
    res.clearCookie('accessToken', { ...clearOpts, path: '/' });
    res.clearCookie('refreshToken', { ...clearOpts, path: '/' });
    res.clearCookie('refreshToken', { ...clearOpts, path: '/api/v1/auth' });
    res.clearCookie('refreshToken', { ...clearOpts, path: '/api/v1/auth/refresh' });
  }

  /**
   * Extraire le domaine depuis une URL
   * Retourne toujours avec un point devant pour le partage de cookies cross-subdomain.
   * Ex: "https://luneo.app"      -> ".luneo.app"
   *     "https://app.luneo.app"  -> ".luneo.app"
   *     "http://localhost:3000"   -> null
   */
  private static extractDomain(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Pour localhost, pas de domaine
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return null;
      }

      // Extraire le domaine principal avec point devant
      // Ex: app.luneo.app -> .luneo.app
      //     luneo.app     -> .luneo.app
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        return `.${parts.slice(-2).join('.')}`;
      }
      
      return hostname;
    } catch {
      return null;
    }
  }
}
