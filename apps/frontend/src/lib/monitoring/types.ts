/**
 * Monitoring Types
 * MON-001: Types pour le système de monitoring
 */

// Health check status
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

// Service health
export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  latency?: number; // ms
  message?: string;
  lastCheck: number;
}

// System health
export interface SystemHealth {
  status: HealthStatus;
  timestamp: number;
  uptime: number;
  version: string;
  services: ServiceHealth[];
}

// Web Vitals
export interface WebVitals {
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  TTFB: number; // Time to First Byte
  FCP: number; // First Contentful Paint
  INP: number; // Interaction to Next Paint
}

// Performance metrics
export interface PerformanceMetrics {
  pageLoad: number;
  domContentLoaded: number;
  firstPaint: number;
  resourceCount: number;
  transferSize: number;
  decodedBodySize: number;
}

// API metrics
export interface APIMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

// Error tracking
export interface TrackedError {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  source: 'client' | 'server';
  url?: string;
  userAgent?: string;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// Rate limit stats
export interface RateLimitStats {
  identifier: string;
  requests: number;
  limit: number;
  remaining: number;
  resetAt: number;
  blocked: boolean;
}

// Dashboard metrics
export interface DashboardMetrics {
  // Real-time
  activeUsers: number;
  requestsPerMinute: number;
  errorRate: number;
  avgResponseTime: number;
  
  // Aggregated
  totalRequests24h: number;
  totalErrors24h: number;
  uniqueVisitors24h: number;
  peakRPM: number;
  
  // Services
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    storage: ServiceHealth;
    email: ServiceHealth;
    payments: ServiceHealth;
  };
  
  // Performance
  avgWebVitals: Partial<WebVitals>;
}

// Alert
export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  resolvedAt?: number;
}

// Log entry
export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  source: string;
  metadata?: Record<string, unknown>;
  traceId?: string;
  spanId?: string;
}


