/**
 * 🔔 Règles d'Alertes de Monitoring
 * Configuration TypeScript pour les alertes
 */

export interface AlertRule {
  name: string;
  description: string;
  conditions: AlertCondition[];
  actions: AlertAction[];
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  window: string; // e.g., "5m", "1h"
  environment?: string[];
}

export interface AlertAction {
  type: 'email' | 'slack' | 'pagerduty' | 'webhook';
  config: Record<string, any>;
}

export const alertRules: AlertRule[] = [
  // Erreurs critiques
  {
    name: 'Critical Errors',
    description: 'Alert when critical errors exceed threshold',
    severity: 'critical',
    enabled: true,
    conditions: [
      {
        metric: 'error_rate',
        operator: 'gt',
        threshold: 10,
        window: '5m',
        environment: ['production'],
      },
    ],
    actions: [
      {
        type: 'email',
        config: {
          recipients: ['devops@luneo.com'],
          subject: '🚨 Critical Errors Detected',
        },
      },
      {
        type: 'slack',
        config: {
          channel: '#alerts-critical',
          message: 'Critical errors detected in production',
        },
      },
    ],
  },

  // Performance dégradée
  {
    name: 'Performance Degradation',
    description: 'Alert when p95 latency exceeds threshold',
    severity: 'warning',
    enabled: true,
    conditions: [
      {
        metric: 'p95_latency',
        operator: 'gt',
        threshold: 1000, // ms
        window: '15m',
        environment: ['production'],
      },
    ],
    actions: [
      {
        type: 'email',
        config: {
          recipients: ['devops@luneo.com'],
          subject: '⚠️ Performance Degradation Detected',
        },
      },
      {
        type: 'slack',
        config: {
          channel: '#alerts',
          message: 'Performance degradation detected',
        },
      },
    ],
  },

  // Disponibilité
  {
    name: 'Service Availability',
    description: 'Alert when service availability drops below threshold',
    severity: 'critical',
    enabled: true,
    conditions: [
      {
        metric: 'availability',
        operator: 'lt',
        threshold: 99.9, // %
        window: '1h',
        environment: ['production'],
      },
    ],
    actions: [
      {
        type: 'email',
        config: {
          recipients: ['devops@luneo.com', 'cto@luneo.com'],
          subject: '🚨 Service Availability Below Threshold',
        },
      },
      {
        type: 'pagerduty',
        config: {
          severity: 'critical',
        },
      },
    ],
  },

  // Taux d'erreur élevé
  {
    name: 'High Error Rate',
    description: 'Alert when error rate exceeds threshold',
    severity: 'warning',
    enabled: true,
    conditions: [
      {
        metric: 'error_rate',
        operator: 'gt',
        threshold: 5,
        window: '10m',
        environment: ['production'],
      },
    ],
    actions: [
      {
        type: 'email',
        config: {
          recipients: ['devops@luneo.com'],
          subject: '⚠️ High Error Rate Detected',
        },
      },
      {
        type: 'slack',
        config: {
          channel: '#alerts',
        },
      },
    ],
  },

  // CPU élevé
  {
    name: 'High CPU Usage',
    description: 'Alert when CPU usage exceeds threshold',
    severity: 'warning',
    enabled: true,
    conditions: [
      {
        metric: 'cpu_usage',
        operator: 'gt',
        threshold: 80, // %
        window: '10m',
      },
    ],
    actions: [
      {
        type: 'email',
        config: {
          recipients: ['devops@luneo.com'],
        },
      },
    ],
  },

  // Mémoire élevée
  {
    name: 'High Memory Usage',
    description: 'Alert when memory usage exceeds threshold',
    severity: 'warning',
    enabled: true,
    conditions: [
      {
        metric: 'memory_usage',
        operator: 'gt',
        threshold: 85, // %
        window: '10m',
      },
    ],
    actions: [
      {
        type: 'email',
        config: {
          recipients: ['devops@luneo.com'],
        },
      },
    ],
  },
];

/**
 * Vérifie si une alerte doit être déclenchée
 */
export function checkAlert(rule: AlertRule, metrics: Record<string, number>): boolean {
  return rule.conditions.every((condition) => {
    const value = metrics[condition.metric];
    if (value === undefined) return false;

    switch (condition.operator) {
      case 'gt':
        return value > condition.threshold;
      case 'lt':
        return value < condition.threshold;
      case 'eq':
        return value === condition.threshold;
      case 'gte':
        return value >= condition.threshold;
      case 'lte':
        return value <= condition.threshold;
      default:
        return false;
    }
  });
}

/**
 * Envoie une alerte
 */
export async function sendAlert(rule: AlertRule, metrics: Record<string, number>): Promise<void> {
  if (!rule.enabled) return;

  const shouldAlert = checkAlert(rule, metrics);
  if (!shouldAlert) return;

  for (const action of rule.actions) {
    try {
      switch (action.type) {
        case 'email':
          await sendEmailAlert(action.config, rule, metrics);
          break;
        case 'slack':
          await sendSlackAlert(action.config, rule, metrics);
          break;
        case 'pagerduty':
          await sendPagerDutyAlert(action.config, rule, metrics);
          break;
        case 'webhook':
          await sendWebhookAlert(action.config, rule, metrics);
          break;
      }
    } catch (error) {
      console.error(`Failed to send alert via ${action.type}:`, error);
    }
  }
}

async function sendEmailAlert(config: any, rule: AlertRule, metrics: Record<string, number>): Promise<void> {
  // Implementation would use email service (SendGrid, etc.)
  console.log(`Sending email alert: ${rule.name}`, config, metrics);
}

async function sendSlackAlert(config: any, rule: AlertRule, metrics: Record<string, number>): Promise<void> {
  // Implementation would use Slack API
  console.log(`Sending Slack alert: ${rule.name}`, config, metrics);
}

async function sendPagerDutyAlert(config: any, rule: AlertRule, metrics: Record<string, number>): Promise<void> {
  // Implementation would use PagerDuty API
  console.log(`Sending PagerDuty alert: ${rule.name}`, config, metrics);
}

async function sendWebhookAlert(config: any, rule: AlertRule, metrics: Record<string, number>): Promise<void> {
  // Implementation would send HTTP request to webhook URL
  console.log(`Sending webhook alert: ${rule.name}`, config, metrics);
}
