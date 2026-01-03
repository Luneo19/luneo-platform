/**
 * Utilitaires pour le monitoring
 */

import { useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import type { ServiceStatus, AlertSeverity } from '../types';

/**
 * Retourne la classe CSS pour le statut d'un service
 */
export function useStatusColor() {
  return useCallback((status: ServiceStatus): string => {
    switch (status) {
      case 'HEALTHY':
        return 'text-green-400';
      case 'DEGRADED':
        return 'text-amber-400';
      case 'UNHEALTHY':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  }, []);
}

/**
 * Retourne l'icône correspondant au statut
 */
export function useStatusIcon() {
  return useCallback((status: ServiceStatus) => {
    switch (status) {
      case 'HEALTHY':
        return CheckCircle;
      case 'DEGRADED':
        return AlertTriangle;
      case 'UNHEALTHY':
        return XCircle;
      default:
        return Info;
    }
  }, []);
}

/**
 * Retourne la classe CSS pour la sévérité d'une alerte
 */
export function useSeverityColor() {
  return useCallback((severity: AlertSeverity): string => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'ERROR':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'WARNING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'INFO':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }, []);
}

/**
 * Formate un temps en millisecondes en format lisible
 */
export function useFormatUptime() {
  return useCallback((ms: number): string => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${days}d ${hours}h ${minutes}m`;
  }, []);
}

/**
 * Détermine le statut d'une métrique Web Vital
 */
export function useVitalStatus() {
  return useCallback((metric: string, value: number): ServiceStatus => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
      FCP: { good: 1800, poor: 3000 },
    };
    const threshold = thresholds[metric];
    if (!threshold) return 'HEALTHY';
    if (value <= threshold.good) return 'HEALTHY';
    if (value <= threshold.poor) return 'DEGRADED';
    return 'UNHEALTHY';
  }, []);
}

