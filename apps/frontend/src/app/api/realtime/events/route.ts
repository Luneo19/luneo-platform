/**
 * Real-time Events SSE Endpoint
 * A-010: Server-Sent Events pour mises à jour en temps réel
 * 
 * ✅ Connecté au backend pour les événements réels
 */

import { NextRequest } from 'next/server';
import { getBackendUrl } from '@/lib/api/server-url';
import { logger } from '@/lib/logger';

// Store active connections (in production, use Redis pub/sub)
const connections = new Map<string, ReadableStreamDefaultController>();

// Store last event timestamps per channel to avoid duplicates
const lastEventTimestamps = new Map<string, number>();

interface RealtimeEvent {
  id: string;
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
  channel: string;
}

/**
 * Fetch real events from backend API
 */
async function fetchRealEvents(channels: string[], since?: number): Promise<RealtimeEvent[]> {
  try {
    const params = new URLSearchParams();
    params.append('channels', channels.join(','));
    if (since) params.append('since', since.toString());
    
    const response = await fetch(`${getBackendUrl()}/api/v1/events/stream?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      return data.events || [];
    }
    logger.warn('Backend events stream returned non-OK', { status: response.status, channels });
  } catch (error) {
    logger.error('Failed to fetch events from backend', { error, channels });
  }

  return [];
}

/**
 * Fetch real metrics from backend analytics
 */
async function fetchRealtimeMetrics(): Promise<RealtimeEvent | null> {
  try {
    const response = await fetch(`${getBackendUrl()}/api/v1/analytics/realtime`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      return {
        id: `metrics_${Date.now()}`,
        type: 'metrics_update',
        timestamp: Date.now(),
        data: {
          visitors: data.activeUsers || data.visitors || 0,
          conversions: data.conversions || 0,
          revenue: data.revenue || 0,
          designs: data.designsCreated || 0,
          orders: data.ordersCreated || 0,
          trend: data.trend || 'stable',
        },
        channel: 'metrics',
      };
    }
  } catch (error) {
    logger.warn('Failed to fetch realtime metrics from backend (optional)', { error });
  }

  return null;
}

/**
 * Fetch recent activity from backend
 */
async function fetchRecentActivity(channels: string[]): Promise<RealtimeEvent[]> {
  const events: RealtimeEvent[] = [];
  
  try {
    // Fetch recent designs
    if (channels.includes('designs') || channels.includes('default')) {
      const response = await fetch(`${getBackendUrl()}/api/v1/designs?limit=1&sort=createdAt:desc`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        const design = data.designs?.[0];
        if (design) {
          const lastTimestamp = lastEventTimestamps.get('design_created') || 0;
          const designTime = new Date(design.createdAt).getTime();
          if (designTime > lastTimestamp) {
            lastEventTimestamps.set('design_created', designTime);
            events.push({
              id: `design_${design.id}`,
              type: 'design_created',
              timestamp: designTime,
              data: {
                designId: design.id,
                name: design.name || `Design #${design.id.slice(-4)}`,
                userId: design.userId,
                productId: design.productId,
                action: 'created',
              },
              channel: 'designs',
            });
          }
        }
      }
    }

    // Fetch recent orders
    if (channels.includes('orders') || channels.includes('default')) {
      const response = await fetch(`${getBackendUrl()}/api/v1/orders?limit=1&sort=createdAt:desc`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        const order = data.orders?.[0];
        if (order) {
          const lastTimestamp = lastEventTimestamps.get('order_created') || 0;
          const orderTime = new Date(order.createdAt).getTime();
          if (orderTime > lastTimestamp) {
            lastEventTimestamps.set('order_created', orderTime);
            events.push({
              id: `order_${order.id}`,
              type: 'order_created',
              timestamp: orderTime,
              data: {
                orderId: order.id,
                status: order.status || 'pending',
                amount: order.total || order.amount || 0,
                currency: order.currency || 'EUR',
                items: order.items?.length || 1,
              },
              channel: 'orders',
            });
          }
        }
      }
    }

    // Fetch notifications
    if (channels.includes('notifications') || channels.includes('default')) {
      const response = await fetch(`${getBackendUrl()}/api/v1/notifications?limit=1&unreadOnly=true`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        const notification = data.notifications?.[0];
        if (notification) {
          const lastTimestamp = lastEventTimestamps.get('notification') || 0;
          const notifTime = new Date(notification.createdAt).getTime();
          if (notifTime > lastTimestamp) {
            lastEventTimestamps.set('notification', notifTime);
            events.push({
              id: `notif_${notification.id}`,
              type: 'notification',
              timestamp: notifTime,
              data: {
                id: notification.id,
                type: notification.type || 'info',
                title: notification.title,
                message: notification.message,
              },
              channel: 'notifications',
            });
          }
        }
      }
    }
  } catch (error) {
    logger.warn('Failed to fetch recent activity from backend', { error, channels });
  }

  return events;
}

// Encode SSE message
function encodeSSE(event: Record<string, any>): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// ✅ Force dynamic rendering (pas de cache)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channels = searchParams.get('channels')?.split(',') || ['default'];
  const connectionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.info('SSE connection opened', { connectionId, channels });

  // Create readable stream
  const stream = new ReadableStream({
    start(controller) {
      connections.set(connectionId, controller);

      // Send initial connection event
      const connectEvent = encodeSSE({
        id: `connect_${connectionId}`,
        type: 'system_alert',
        timestamp: Date.now(),
        data: { message: 'Connected', connectionId },
      });
      controller.enqueue(new TextEncoder().encode(connectEvent));

      // Function to fetch and send real events
      const fetchAndSendEvents = async () => {
        try {
          // Fetch real events from backend
          const backendEvents = await fetchRealEvents(channels);
          for (const event of backendEvents) {
            controller.enqueue(new TextEncoder().encode(encodeSSE(event)));
          }

          // Fetch recent activity (designs, orders, notifications)
          const activityEvents = await fetchRecentActivity(channels);
          for (const event of activityEvents) {
            controller.enqueue(new TextEncoder().encode(encodeSSE(event)));
          }

          // Fetch and send metrics if subscribed
          if (channels.includes('metrics') || channels.includes('default')) {
            const metricsEvent = await fetchRealtimeMetrics();
            if (metricsEvent) {
              controller.enqueue(new TextEncoder().encode(encodeSSE(metricsEvent)));
            }
          }
        } catch (error) {
          logger.warn('Error fetching real events during SSE poll', { error });
        }
      };

      // Initial fetch
      fetchAndSendEvents();

      // Poll for real events every 10 seconds
      const interval = setInterval(() => {
        fetchAndSendEvents().catch((err) => {
          logger.warn('SSE polling error', { error: err, connectionId });
        });
      }, 10000);

      // Heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          const heartbeatEvent = encodeSSE({
            id: `heartbeat_${Date.now()}`,
            type: 'system_alert',
            timestamp: Date.now(),
            data: { message: 'heartbeat' },
          });
          controller.enqueue(new TextEncoder().encode(heartbeatEvent));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        connections.delete(connectionId);
        logger.info('SSE connection closed', { connectionId });

        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
    cancel() {
      connections.delete(connectionId);
      logger.info('SSE connection cancelled', { connectionId });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

// Broadcast event to all connections (for use by other API routes)
export function broadcastEvent(
  event: Record<string, any>,
  channelFilter?: string[]
) {
  const encoded = encodeSSE(event);
  const bytes = new TextEncoder().encode(encoded);

  connections.forEach((controller, connectionId) => {
    try {
      controller.enqueue(bytes);
    } catch (err) {
      // Connection closed, remove it
      connections.delete(connectionId);
    }
  });
}
