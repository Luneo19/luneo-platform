/**
 * ★★★ SERVICE - AR ★★★
 * Service frontend pour gérer les sessions AR
 * - Création sessions
 * - Tracking interactions
 * - Analytics
 * - Support detection
 */

import { getTRPCClient } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';
import { detectWebXRSupport, detectDeviceInfo } from '@/lib/utils/ar';
import type { ARDeviceInfo } from '@/lib/utils/ar';
import type {
  CreateARSessionRequest,
  ARInteractionRequest,
  ARAnalyticsRequest,
} from '@/lib/types/ar';

// ========================================
// SERVICE
// ========================================

export class ARService {
  private static instance: ARService;
  private activeSessions: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ARService {
    if (!ARService.instance) {
      ARService.instance = new ARService();
    }
    return ARService.instance;
  }

  // ========================================
  // SUPPORT DETECTION
  // ========================================

  /**
   * Vérifie le support AR
   */
  async checkSupport(userAgent?: string) {
    try {
      const deviceInfo = detectDeviceInfo();
      const isSupported = await detectWebXRSupport();

      // Also check server-side
      const client = getTRPCClient();
      const serverCheck = await client.ar.checkSupport.query({ userAgent });

      return {
        ...serverCheck,
        deviceInfo,
        isSupported: isSupported && serverCheck.isARSupported,
      };
    } catch (error: any) {
      logger.error('Error checking AR support', { error });
      return {
        isARSupported: false,
        platform: 'unknown',
        browser: 'unknown',
        recommendations: ['Erreur lors de la vérification du support AR'],
        deviceInfo: null,
        isSupported: false,
      };
    }
  }

  // ========================================
  // SESSIONS
  // ========================================

  /**
   * Crée une session AR
   */
  async createSession(request: CreateARSessionRequest) {
    try {
      const deviceInfo = detectDeviceInfo();

      const client = getTRPCClient();
      const session = await client.ar.createSession.mutate({
        ...request,
        deviceInfo: deviceInfo.isARSupported ? deviceInfo : undefined,
      });

      // Track active session
      this.activeSessions.set(session.sessionId, {
        ...session,
        startTime: new Date(),
        interactions: 0,
      });

      logger.info('AR session created', { sessionId: session.sessionId });

      return session;
    } catch (error: any) {
      logger.error('Error creating AR session', { error, request });
      throw error;
    }
  }

  /**
   * Récupère une session active
   */
  getActiveSession(sessionId: string) {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Met à jour une session active
   */
  updateActiveSession(sessionId: string, updates: any) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      this.activeSessions.set(sessionId, { ...session, ...updates });
    }
  }

  /**
   * Supprime une session active
   */
  removeActiveSession(sessionId: string) {
    this.activeSessions.delete(sessionId);
    logger.info('AR session removed', { sessionId });
  }

  // ========================================
  // INTERACTIONS
  // ========================================

  /**
   * Track une interaction AR
   */
  async trackInteraction(request: ARInteractionRequest) {
    try {
      const client = getTRPCClient();
      await client.ar.trackInteraction.mutate(request);

      // Update session
      const session = this.activeSessions.get(request.sessionId);
      if (session) {
        this.updateActiveSession(request.sessionId, {
          interactions: (session.interactions || 0) + 1,
        });
      }

      logger.info('AR interaction tracked', { type: request.type, sessionId: request.sessionId });
    } catch (error: any) {
      logger.error('Error tracking AR interaction', { error, request });
      // Don't throw, tracking is not critical
    }
  }

  // ========================================
  // ANALYTICS
  // ========================================

  /**
   * Récupère les analytics AR
   */
  async getAnalytics(request: ARAnalyticsRequest) {
    try {
      const client = getTRPCClient();
      return await client.ar.getAnalytics.query(request);
    } catch (error: any) {
      logger.error('Error fetching AR analytics', { error, request });
      throw error;
    }
  }

  // ========================================
  // CLEANUP
  // ========================================

  /**
   * Nettoie les sessions expirées
   */
  cleanupExpiredSessions(maxAge: number = 3600000) {
    const now = Date.now();
    let cleaned = 0;

    this.activeSessions.forEach((session, sessionId) => {
      const age = now - session.startTime.getTime();
      if (age > maxAge) {
        this.activeSessions.delete(sessionId);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      logger.info('Cleaned expired AR sessions', { count: cleaned });
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const arService = ARService.getInstance();

