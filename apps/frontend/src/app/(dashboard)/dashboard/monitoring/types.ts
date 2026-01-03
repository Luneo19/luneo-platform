/**
 * Types partagés pour la page Monitoring
 */

export type MonitoringTab = 'overview' | 'metrics' | 'logs' | 'alerts' | 'system';

export type Period = '1h' | '24h' | '7d' | '30d';

export type ServiceStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export type AlertSeverity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface Service {
  name: string;
  status: ServiceStatus;
  message?: string;
  latency?: number;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  service: string;
  message: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  service: string;
  message: string;
  source: string;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    load: number[];
    temperature: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    cached: number;
    buffers: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
    readSpeed: number;
    writeSpeed: number;
  };
  network: {
    in: number;
    out: number;
    packetsIn: number;
    packetsOut: number;
    errors: number;
  };
}

export interface WebVitals {
  LCP: number;
  FID: number;
  CLS: number;
  TTFB: number;
  FCP: number;
}

export interface MonitoringMetrics {
  activeUsers: number;
  requestsPerMinute: number;
  errorRate: number;
  avgResponseTime: number;
  totalRequests24h: number;
  totalErrors24h: number;
  uniqueVisitors24h: number;
  peakRPM: number;
  services: Service[];
  avgWebVitals: WebVitals;
}

