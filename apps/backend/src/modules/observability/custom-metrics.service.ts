import { Injectable, OnModuleInit } from '@nestjs/common';
import { Histogram, Counter, Gauge } from 'prom-client';
import { QueueMetricsService } from './queue-metrics.service';

/**
 * Custom Prometheus metrics service for Luneo-specific KPIs
 * 
 * Tracks:
 * - Worker queue wait time
 * - OpenAI request duration
 * - Render durations
 * - Embed handshake failures
 * - AR conversion time
 */
@Injectable()
export class CustomMetricsService implements OnModuleInit {
  // Worker Queue Metrics
  private readonly queueWaitTimeHistogram: Histogram<string>;
  private readonly queueWaitTimeGauge: Gauge<string>;

  // OpenAI Metrics
  private readonly openaiRequestDurationHistogram: Histogram<string>;
  private readonly openaiRequestTotalCounter: Counter<string>;
  private readonly openaiRequestErrorCounter: Counter<string>;
  private readonly openaiCostGauge: Gauge<string>;

  // Render Metrics
  private readonly renderDurationHistogram: Histogram<string>;
  private readonly renderTotalCounter: Counter<string>;
  private readonly renderErrorCounter: Counter<string>;

  // Embed Handshake Metrics
  private readonly embedHandshakeFailureCounter: Counter<string>;
  private readonly embedHandshakeTotalCounter: Counter<string>;
  private readonly embedHandshakeDurationHistogram: Histogram<string>;

  // AR Conversion Metrics
  private readonly arConversionDurationHistogram: Histogram<string>;
  private readonly arConversionTotalCounter: Counter<string>;
  private readonly arConversionErrorCounter: Counter<string>;

  // Cost Tracking (for cost spike alerts)
  private readonly aiCostBaselineGauge: Gauge<string>;
  private readonly aiCostCurrentGauge: Gauge<string>;

  constructor(private readonly queueMetricsService: QueueMetricsService) {
    const registry = this.queueMetricsService.getRegistry();

    // Worker Queue Wait Time
    this.queueWaitTimeHistogram = new Histogram({
      name: 'luneo_worker_queue_wait_time_seconds',
      help: 'Time jobs spend waiting in queue before processing (seconds)',
      labelNames: ['queue_name'],
      buckets: [1, 5, 10, 30, 60, 120, 300, 600],
      registers: [registry],
    });

    this.queueWaitTimeGauge = new Gauge({
      name: 'luneo_worker_queue_wait_time_current_seconds',
      help: 'Current wait time for oldest waiting job per queue (seconds)',
      labelNames: ['queue_name'],
      registers: [registry],
    });

    // OpenAI Request Metrics
    this.openaiRequestDurationHistogram = new Histogram({
      name: 'luneo_openai_request_duration_seconds',
      help: 'Duration of OpenAI API requests (seconds)',
      labelNames: ['model', 'operation', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [registry],
    });

    this.openaiRequestTotalCounter = new Counter({
      name: 'luneo_openai_requests_total',
      help: 'Total number of OpenAI API requests',
      labelNames: ['model', 'operation'],
      registers: [registry],
    });

    this.openaiRequestErrorCounter = new Counter({
      name: 'luneo_openai_requests_error_total',
      help: 'Total number of failed OpenAI API requests',
      labelNames: ['model', 'operation', 'error_type'],
      registers: [registry],
    });

    this.openaiCostGauge = new Gauge({
      name: 'luneo_openai_cost_cents',
      help: 'Current OpenAI API cost in cents',
      labelNames: ['model', 'operation'],
      registers: [registry],
    });

    // Render Metrics
    this.renderDurationHistogram = new Histogram({
      name: 'luneo_render_duration_seconds',
      help: 'Duration of render operations (seconds)',
      labelNames: ['render_type', 'quality', 'status'],
      buckets: [1, 5, 10, 30, 60, 120, 300, 600],
      registers: [registry],
    });

    this.renderTotalCounter = new Counter({
      name: 'luneo_renders_total',
      help: 'Total number of render operations',
      labelNames: ['render_type', 'quality'],
      registers: [registry],
    });

    this.renderErrorCounter = new Counter({
      name: 'luneo_renders_error_total',
      help: 'Total number of failed render operations',
      labelNames: ['render_type', 'quality', 'error_type'],
      registers: [registry],
    });

    // Embed Handshake Metrics
    this.embedHandshakeFailureCounter = new Counter({
      name: 'luneo_embed_handshake_failures_total',
      help: 'Total number of embed handshake failures',
      labelNames: ['failure_reason', 'shop_domain'],
      registers: [registry],
    });

    this.embedHandshakeTotalCounter = new Counter({
      name: 'luneo_embed_handshakes_total',
      help: 'Total number of embed handshake attempts',
      labelNames: ['status'],
      registers: [registry],
    });

    this.embedHandshakeDurationHistogram = new Histogram({
      name: 'luneo_embed_handshake_duration_seconds',
      help: 'Duration of embed handshake operations (seconds)',
      labelNames: ['status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
      registers: [registry],
    });

    // AR Conversion Metrics
    this.arConversionDurationHistogram = new Histogram({
      name: 'luneo_ar_conversion_duration_seconds',
      help: 'Duration of AR conversion operations (seconds)',
      labelNames: ['conversion_type', 'status'],
      buckets: [1, 5, 10, 30, 60, 120, 300],
      registers: [registry],
    });

    this.arConversionTotalCounter = new Counter({
      name: 'luneo_ar_conversions_total',
      help: 'Total number of AR conversion operations',
      labelNames: ['conversion_type'],
      registers: [registry],
    });

    this.arConversionErrorCounter = new Counter({
      name: 'luneo_ar_conversions_error_total',
      help: 'Total number of failed AR conversion operations',
      labelNames: ['conversion_type', 'error_type'],
      registers: [registry],
    });

    // Cost Tracking (for baseline comparison)
    this.aiCostBaselineGauge = new Gauge({
      name: 'luneo_ai_cost_baseline_cents',
      help: 'Baseline AI cost in cents (calculated from historical average)',
      labelNames: ['time_window'],
      registers: [registry],
    });

    this.aiCostCurrentGauge = new Gauge({
      name: 'luneo_ai_cost_current_cents',
      help: 'Current AI cost in cents (for current time window)',
      labelNames: ['time_window'],
      registers: [registry],
    });
  }

  onModuleInit(): void {
    // Initialize baseline cost (can be updated periodically)
    // This would typically be calculated from historical data
    this.aiCostBaselineGauge.labels('1h').set(0);
    this.aiCostBaselineGauge.labels('24h').set(0);
  }

  // Worker Queue Metrics
  recordQueueWaitTime(queueName: string, waitTimeSeconds: number): void {
    this.queueWaitTimeHistogram.labels(queueName).observe(waitTimeSeconds);
    this.queueWaitTimeGauge.labels(queueName).set(waitTimeSeconds);
  }

  // OpenAI Metrics
  recordOpenAIRequest(
    model: string,
    operation: string,
    durationSeconds: number,
    costCents?: number,
  ): void {
    this.openaiRequestDurationHistogram
      .labels(model, operation, 'success')
      .observe(durationSeconds);
    this.openaiRequestTotalCounter.labels(model, operation).inc();
    if (costCents !== undefined) {
      this.openaiCostGauge.labels(model, operation).set(costCents);
      // Update current cost for spike detection
      const current1h = this.aiCostCurrentGauge.labels('1h').get() || 0;
      this.aiCostCurrentGauge.labels('1h').set(current1h + costCents);
    }
  }

  recordOpenAIError(
    model: string,
    operation: string,
    durationSeconds: number,
    errorType: string,
  ): void {
    this.openaiRequestDurationHistogram
      .labels(model, operation, 'error')
      .observe(durationSeconds);
    this.openaiRequestErrorCounter.labels(model, operation, errorType).inc();
  }

  // Render Metrics
  recordRender(
    renderType: string,
    quality: string,
    durationSeconds: number,
    success: boolean,
  ): void {
    const status = success ? 'success' : 'error';
    this.renderDurationHistogram
      .labels(renderType, quality, status)
      .observe(durationSeconds);
    this.renderTotalCounter.labels(renderType, quality).inc();
    if (!success) {
      this.renderErrorCounter.labels(renderType, quality, 'unknown').inc();
    }
  }

  recordRenderError(
    renderType: string,
    quality: string,
    errorType: string,
  ): void {
    this.renderErrorCounter.labels(renderType, quality, errorType).inc();
  }

  // Embed Handshake Metrics
  recordEmbedHandshakeSuccess(durationSeconds: number): void {
    this.embedHandshakeTotalCounter.labels('success').inc();
    this.embedHandshakeDurationHistogram
      .labels('success')
      .observe(durationSeconds);
  }

  recordEmbedHandshakeFailure(
    reason: string,
    shopDomain: string,
    durationSeconds?: number,
  ): void {
    this.embedHandshakeFailureCounter
      .labels(reason, shopDomain || 'unknown')
      .inc();
    this.embedHandshakeTotalCounter.labels('failure').inc();
    if (durationSeconds !== undefined) {
      this.embedHandshakeDurationHistogram
        .labels('failure')
        .observe(durationSeconds);
    }
  }

  // AR Conversion Metrics
  recordARConversion(
    conversionType: string,
    durationSeconds: number,
    success: boolean,
  ): void {
    const status = success ? 'success' : 'error';
    this.arConversionDurationHistogram
      .labels(conversionType, status)
      .observe(durationSeconds);
    this.arConversionTotalCounter.labels(conversionType).inc();
    if (!success) {
      this.arConversionErrorCounter.labels(conversionType, 'unknown').inc();
    }
  }

  recordARConversionError(conversionType: string, errorType: string): void {
    this.arConversionErrorCounter.labels(conversionType, errorType).inc();
  }

  // Cost Management
  updateCostBaseline(timeWindow: string, baselineCents: number): void {
    this.aiCostBaselineGauge.labels(timeWindow).set(baselineCents);
  }

  resetCurrentCost(timeWindow: string): void {
    this.aiCostCurrentGauge.labels(timeWindow).set(0);
  }

  getCurrentCost(timeWindow: string): number {
    return this.aiCostCurrentGauge.labels(timeWindow).get() || 0;
  }

  getBaselineCost(timeWindow: string): number {
    return this.aiCostBaselineGauge.labels(timeWindow).get() || 0;
  }
}
