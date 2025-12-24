/**
 * Real-time Events SSE Endpoint
 * A-010: Server-Sent Events pour mises à jour en temps réel
 */

import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

// Store active connections (in production, use Redis pub/sub)
const connections = new Map<string, ReadableStreamDefaultController>();

// Event types for demo
const eventTypes = [
  'metrics_update',
  'design_created',
  'order_created',
  'notification',
  'conversion',
];

// Generate mock events
function generateMockEvent(channels: string[]) {
  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  let data: Record<string, any>;
  
  switch (type) {
    case 'metrics_update':
      data = {
        visitors: Math.floor(Math.random() * 100) + 200,
        conversions: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 5000) + 1000,
        designs: Math.floor(Math.random() * 50) + 20,
        trend: Math.random() > 0.5 ? 'up' : 'down',
      };
      break;
    case 'design_created':
      data = {
        designId: `design_${Date.now()}`,
        name: `Design #${Math.floor(Math.random() * 1000)}`,
        userId: `user_${Math.floor(Math.random() * 100)}`,
        productId: `product_${Math.floor(Math.random() * 10)}`,
        action: 'created',
      };
      break;
    case 'order_created':
      data = {
        orderId: `order_${Date.now()}`,
        status: 'pending',
        amount: Math.floor(Math.random() * 200) + 20,
        currency: 'EUR',
        items: Math.floor(Math.random() * 5) + 1,
      };
      break;
    case 'notification':
      const notifications = [
        { type: 'success', title: 'Nouveau client !', message: 'Un nouveau client vient de s\'inscrire.' },
        { type: 'info', title: 'Design exporté', message: 'Un design a été exporté en haute résolution.' },
        { type: 'warning', title: 'Quota proche', message: 'Vous approchez de votre limite mensuelle.' },
      ];
      const notif = notifications[Math.floor(Math.random() * notifications.length)];
      data = {
        id: `notif_${Date.now()}`,
        ...notif,
      };
      break;
    case 'conversion':
      data = {
        conversionId: `conv_${Date.now()}`,
        type: Math.random() > 0.5 ? 'purchase' : 'signup',
        value: Math.floor(Math.random() * 100) + 10,
        source: ['direct', 'google', 'facebook', 'referral'][Math.floor(Math.random() * 4)],
      };
      break;
    default:
      data = {};
  }

  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: Date.now(),
    data,
    channel: channels[0] || 'default',
  };
}

// Encode SSE message
function encodeSSE(event: Record<string, any>): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

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

      // Send periodic updates (demo mode)
      const interval = setInterval(() => {
        try {
          const event = generateMockEvent(channels);
          const encoded = encodeSSE(event);
          controller.enqueue(new TextEncoder().encode(encoded));
        } catch {
          clearInterval(interval);
        }
      }, 5000 + Math.random() * 5000); // Random interval between 5-10 seconds

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
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

// Broadcast event to all connections (for use by other API routes)
export function broadcastEvent(event: Record<string, any>, channelFilter?: string[]) {
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


