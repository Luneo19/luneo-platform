/**
 * Web Vitals Tracking
 * Track Core Web Vitals (CLS, FID, FCP, LCP, TTFB)
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';
import { logger } from './logger';

// Fonction pour envoyer les métriques
function sendToAnalytics(metric: Metric) {
  // Log en développement
  if (process.env.NODE_ENV === 'development') {
    logger.info('Web Vitals', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    });
  }

  // Envoyer à Vercel Analytics (déjà intégré via @vercel/speed-insights)
  // Les données sont automatiquement envoyées

  // Optionnel : Envoyer à votre propre analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

// Initialiser le tracking des Web Vitals
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  onCLS(sendToAnalytics);  // Cumulative Layout Shift
  onFID(sendToAnalytics);  // First Input Delay
  onFCP(sendToAnalytics);  // First Contentful Paint
  onLCP(sendToAnalytics);  // Largest Contentful Paint
  onTTFB(sendToAnalytics); // Time to First Byte
}

// Fonction helper pour vérifier les seuils
export function getVitalRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
  };

  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}


