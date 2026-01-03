/**
 * Helper pour intégration Prometheus
 * 
 * Usage:
 * ```typescript
 * import { PrometheusHelper } from '@/libs/integrations/prometheus.helper';
 * 
 * const prometheus = new PrometheusHelper();
 * 
 * // Query latency p95
 * const latency = await prometheus.queryLatencyP95('api', '24h');
 * 
 * // Query error rate
 * const errorRate = await prometheus.queryErrorRate('api', '24h');
 * ```
 */

export class PrometheusHelper {
  private prometheusUrl: string;

  constructor(prometheusUrl: string = process.env.PROMETHEUS_URL || 'http://localhost:9090') {
    this.prometheusUrl = prometheusUrl;
  }

  /**
   * Query Prometheus
   */
  async query(query: string): Promise<any> {
    const response = await fetch(`${this.prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error(`Prometheus query failed: ${data.error}`);
    }

    return data.data.result;
  }

  /**
   * Query latency p95
   */
  async queryLatencyP95(service: string, window: string = '24h'): Promise<number> {
    const query = `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{service="${service}"}[${window}]))`;
    const result = await this.query(query);

    if (result && result.length > 0) {
      return parseFloat(result[0].value[1]) * 1000; // Convert to ms
    }

    return 0;
  }

  /**
   * Query error rate
   */
  async queryErrorRate(service: string, window: string = '24h'): Promise<number> {
    const query = `(sum(rate(http_requests_total{service="${service}",status=~"5.."}[${window}])) / sum(rate(http_requests_total{service="${service}"}[${window}]))) * 100`;
    const result = await this.query(query);

    if (result && result.length > 0) {
      return parseFloat(result[0].value[1]);
    }

    return 0;
  }

  /**
   * Query availability
   */
  async queryAvailability(service: string, window: string = '30d'): Promise<number> {
    const query = `(1 - (sum(rate(up{job="${service}"}[${window}])) == 0)) * 100`;
    const result = await this.query(query);

    if (result && result.length > 0) {
      return parseFloat(result[0].value[1]);
    }

    return 100;
  }

  /**
   * Query throughput
   */
  async queryThroughput(service: string, window: string = '24h'): Promise<number> {
    const query = `sum(rate(http_requests_total{service="${service}"}[${window}]))`;
    const result = await this.query(query);

    if (result && result.length > 0) {
      return parseFloat(result[0].value[1]);
    }

    return 0;
  }
}




























