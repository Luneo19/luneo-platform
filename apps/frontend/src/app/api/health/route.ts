/**
 * Health Check API
 * MON-001: Endpoint de health check pour monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/lib/monitoring/MonitoringService';

// Cache health check for 10 seconds
let cachedHealth: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 10000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';

  try {
    // Check cache
    if (cachedHealth && Date.now() - cachedHealth.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedHealth.data);
    }

    // Perform health check
    const health = await monitoringService.performHealthCheck();

    // Simple response for load balancers
    if (!detailed) {
      const response = {
        status: health.status,
        timestamp: health.timestamp,
      };
      
      cachedHealth = { data: response, timestamp: Date.now() };
      
      return NextResponse.json(response, {
        status: health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503,
      });
    }

    // Detailed response
    const response = {
      status: health.status,
      timestamp: health.timestamp,
      uptime: health.uptime,
      version: health.version,
      services: health.services.map((s) => ({
        name: s.name,
        status: s.status,
        latency: s.latency,
        message: s.message,
      })),
      metrics: monitoringService.getDashboardMetrics(),
    };

    cachedHealth = { data: response, timestamp: Date.now() };

    return NextResponse.json(response, {
      status: health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: Date.now(),
      },
      { status: 503 }
    );
  }
}

// Liveness probe (Kubernetes)
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
