/**
 * Web Vitals Service
 * Handles Core Web Vitals metrics storage and retrieval
 */

import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateWebVitalDto, GetWebVitalsDto } from '../dto/web-vitals.dto';

@Injectable()
export class WebVitalsService {
  private readonly logger = new Logger(WebVitalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a Web Vital metric
   */
  async recordWebVital(dto: CreateWebVitalDto) {
    try {
      const webVital = await this.prisma.webVital.create({
        data: {
          name: dto.name,
          value: dto.value,
          rating: dto.rating || this.calculateRating(dto.name, dto.value),
          delta: dto.delta ?? null,
          page: dto.url || '/',
          sessionId: dto.sessionId ?? null,
          connection: dto.connection ? JSON.stringify(dto.connection) : null,
        },
      });

      this.logger.debug(`Web Vital recorded: ${dto.name} = ${dto.value}ms`);

      return {
        success: true,
        data: webVital,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to record Web Vital: ${message}`, stack);
      throw error;
    }
  }

  /**
   * Get Web Vitals metrics with filters
   */
  async getWebVitals(dto: GetWebVitalsDto) {
    try {
      const {
        metric,
        startDate,
        endDate,
        page,
        pageNumber = 1,
        pageSize = 50,
      } = dto;

      const where: Prisma.WebVitalWhereInput = {};

      if (metric) {
        where.name = metric;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      if (page) {
        where.page = page;
      }

      const skip = (pageNumber - 1) * pageSize;

      const [webVitals, total] = await Promise.all([
        this.prisma.webVital.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.webVital.count({ where }),
      ]);

      return {
        success: true,
        data: {
          webVitals,
          pagination: {
            page: pageNumber,
            pageSize,
            total,
            pages: Math.ceil(total / pageSize),
          },
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get Web Vitals: ${message}`, stack);
      throw error;
    }
  }

  /**
   * Get Web Vitals summary with aggregated metrics
   */
  async getWebVitalsSummary(dto: GetWebVitalsDto) {
    try {
      const { startDate, endDate } = dto;

      const where: Prisma.WebVitalWhereInput = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      const webVitals = await this.prisma.webVital.findMany({
        where,
        select: {
          name: true,
          value: true,
          rating: true,
          page: true,
        },
      });

      const metrics = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'];
      const summary: Record<string, { count: number; average: number; p50: number; p75: number; p95: number; p99: number; good: number; needsImprovement: number; poor: number }> = {};

      for (const metricName of metrics) {
        const metricData = webVitals.filter((w) => w.name === metricName);
        
        if (metricData.length === 0) {
          summary[metricName] = {
            count: 0,
            average: 0,
            p50: 0,
            p75: 0,
            p95: 0,
            p99: 0,
            good: 0,
            needsImprovement: 0,
            poor: 0,
          };
          continue;
        }

        const values = metricData.map((w) => w.value).sort((a, b) => a - b);
        const ratings = metricData.map((w) => w.rating || 'unknown');

        summary[metricName] = {
          count: metricData.length,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          p50: this.percentile(values, 50),
          p75: this.percentile(values, 75),
          p95: this.percentile(values, 95),
          p99: this.percentile(values, 99),
          good: ratings.filter((r) => r === 'good').length,
          needsImprovement: ratings.filter((r) => r === 'needs-improvement').length,
          poor: ratings.filter((r) => r === 'poor').length,
        };
      }

      return {
        success: true,
        data: {
          summary,
          period: {
            start: startDate ? new Date(startDate) : null,
            end: endDate ? new Date(endDate) : null,
          },
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get Web Vitals summary: ${message}`, stack);
      throw error;
    }
  }

  /**
   * Calculate rating based on metric thresholds
   */
  private calculateRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, { good: number; poor: number }> = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
      INP: { good: 200, poor: 500 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }
}
