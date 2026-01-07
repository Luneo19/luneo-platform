/**
 * Types pour AR Studio Integrations
 */

export type IntegrationCategory = 'ecommerce' | 'cms' | 'analytics' | 'marketing' | 'other';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';
export type IntegrationHealth = 'healthy' | 'degraded' | 'down';

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  enabled: boolean;
  status: IntegrationStatus;
  lastSync?: number;
  syncCount: number;
  successRate: number;
  health?: IntegrationHealth;
  latency?: number;
  errorCount: number;
  version: string;
  documentation?: string;
  isPopular?: boolean;
  icon?: string;
}

export interface SyncLog {
  id: string;
  integrationId: string;
  integrationName: string;
  status: 'success' | 'error' | 'pending';
  timestamp: number;
  duration?: number;
  recordsSynced?: number;
  error?: string;
}


