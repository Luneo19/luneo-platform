/**
 * Monitoring Module
 * Export centralisé du module de monitoring
 */

export { monitoringService, default as MonitoringService } from './MonitoringService';

export type {
  HealthStatus,
  ServiceHealth,
  SystemHealth,
  WebVitals,
  PerformanceMetrics,
  APIMetrics,
  TrackedError,
  RateLimitStats,
  DashboardMetrics,
  Alert,
  LogEntry,
} from './types';


