/**
 * ★★★ SERVICE - ANALYTICS AR ★★★
 * Service pour tracker les sessions et interactions AR
 * - Sessions AR
 * - Interactions utilisateur
 * - Analytics agrégés
 */

import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/cache/CacheService';
import { PrismaClient } from '@prisma/client';

// db importé depuis @/lib/db

export interface ARSession {
  id: string;
  productId: string;
  customizationId?: string;
  userId?: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    isMobile?: boolean;
    isARSupported?: boolean;
  };
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
}

export interface ARInteraction {
  id: string;
  sessionId: string;
  type: 'session_start' | 'session_end' | 'model_loaded' | 'model_error' | 'placement_success' | 'placement_failed' | 'screenshot' | 'share';
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ARAnalytics {
  totalSessions: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  mostUsedDevice: string;
  successRate: number;
  byProduct: Record<string, number>;
  byDevice: Record<string, number>;
  trends: Array<{ date: Date; sessions: number; interactions: number }>;
}

export class ARAnalyticsService {
  private static instance: ARAnalyticsService;

  private constructor() {}

  static getInstance(): ARAnalyticsService {
    if (!ARAnalyticsService.instance) {
      ARAnalyticsService.instance = new ARAnalyticsService();
    }
    return ARAnalyticsService.instance;
  }

  /**
   * Crée une session AR
   */
  async createSession(data: {
    productId: string;
    customizationId?: string;
    userId?: string;
    deviceInfo?: any;
  }): Promise<ARSession> {
    const sessionId = `ar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const session: ARSession = {
      id: sessionId,
      productId: data.productId,
      customizationId: data.customizationId,
      userId: data.userId,
      deviceInfo: data.deviceInfo,
      startedAt: new Date(),
    };

    // Store in cache (in production, use ARSession table)
    cacheService.set(`ar:session:${sessionId}`, session, { ttl: 86400 * 1000 }); // 24 hours

    // Track in product analytics
    const productSessions = cacheService.get<string[]>(`ar:product:${data.productId}:sessions`) || [];
    productSessions.push(sessionId);
    cacheService.set(`ar:product:${data.productId}:sessions`, productSessions, { ttl: 86400 * 1000 });

    logger.info('AR session created', { sessionId, productId: data.productId });

    return session;
  }

  /**
   * Enregistre une interaction AR
   */
  async trackInteraction(data: {
    sessionId: string;
    type: ARInteraction['type'];
    metadata?: Record<string, any>;
  }): Promise<void> {
    const interaction: ARInteraction = {
      id: `interaction-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sessionId: data.sessionId,
      type: data.type,
      metadata: data.metadata,
      timestamp: new Date(),
    };

    // Store in cache
    const sessionInteractions = cacheService.get<ARInteraction[]>(`ar:session:${data.sessionId}:interactions`) || [];
    sessionInteractions.push(interaction);
    cacheService.set(`ar:session:${data.sessionId}:interactions`, sessionInteractions, { ttl: 86400 * 1000 });

    // Update session if ended
    if (data.type === 'session_end') {
      const session = cacheService.get<ARSession>(`ar:session:${data.sessionId}`);
      if (session) {
        session.endedAt = new Date();
        session.duration = session.endedAt.getTime() - session.startedAt.getTime();
        cacheService.set(`ar:session:${data.sessionId}`, session, { ttl: 86400 * 1000 });
      }
    }

    logger.info('AR interaction tracked', { sessionId: data.sessionId, type: data.type });
  }

  /**
   * Récupère les analytics AR pour un produit
   */
  async getProductAnalytics(
    productId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<ARAnalytics> {
    const start = periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = periodEnd || new Date();

    // Get all sessions for this product
    const sessionIds = cacheService.get<string[]>(`ar:product:${productId}:sessions`) || [];
    const sessions: ARSession[] = [];

    for (const sessionId of sessionIds) {
      const session = cacheService.get<ARSession>(`ar:session:${sessionId}`);
      if (session && session.startedAt >= start && session.startedAt <= end) {
        sessions.push(session);
      }
    }

    // Aggregate analytics
    const totalSessions = sessions.length;
    const uniqueUsers = new Set(sessions.filter((s) => s.userId).map((s) => s.userId)).size;

    const completedSessions = sessions.filter((s) => s.duration);
    const averageSessionDuration = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSessions.length / 1000 // Convert to seconds
      : 0;

    // Device breakdown
    const deviceCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      const platform = s.deviceInfo?.platform || 'unknown';
      deviceCounts[platform] = (deviceCounts[platform] || 0) + 1;
    });
    const mostUsedDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    // Success rate (placement_success / total attempts)
    let placementSuccesses = 0;
    let placementAttempts = 0;
    for (const session of sessions) {
      const interactions = cacheService.get<ARInteraction[]>(`ar:session:${session.id}:interactions`) || [];
      interactions.forEach((i) => {
        if (i.type === 'placement_success') placementSuccesses++;
        if (i.type === 'placement_success' || i.type === 'placement_failed') placementAttempts++;
      });
    }
    const successRate = placementAttempts > 0 ? (placementSuccesses / placementAttempts) * 100 : 0;

    // Trends (daily)
    const trends: Array<{ date: Date; sessions: number; interactions: number }> = [];
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const daySessions = sessions.filter(
        (s) => s.startedAt >= dayStart && s.startedAt <= dayEnd
      );
      let dayInteractions = 0;
      daySessions.forEach((s) => {
        const interactions = cacheService.get<ARInteraction[]>(`ar:session:${s.id}:interactions`) || [];
        dayInteractions += interactions.length;
      });

      trends.push({
        date: dayStart,
        sessions: daySessions.length,
        interactions: dayInteractions,
      });
    }

    return {
      totalSessions,
      uniqueUsers,
      averageSessionDuration,
      mostUsedDevice,
      successRate,
      byProduct: { [productId]: totalSessions },
      byDevice: deviceCounts,
      trends,
    };
  }
}

export const arAnalyticsService = ARAnalyticsService.getInstance();

