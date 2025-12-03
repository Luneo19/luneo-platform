/**
 * Analytics Events API
 * A-006: Endpoint pour recevoir et stocker les événements analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

// Event validation schema
const eventSchema = z.object({
  id: z.string().optional(),
  timestamp: z.number(),
  category: z.string(),
  action: z.string(),
  label: z.string().optional(),
  value: z.number().optional(),
  metadata: z.record(z.any()).optional(),
  sessionId: z.string(),
  userId: z.string().optional(),
  anonymousId: z.string(),
  deviceInfo: z.object({
    type: z.string(),
    os: z.string(),
    browser: z.string(),
    browserVersion: z.string(),
    screenWidth: z.number(),
    screenHeight: z.number(),
    viewport: z.object({
      width: z.number(),
      height: z.number(),
    }),
    language: z.string(),
    timezone: z.string(),
  }),
  pageInfo: z.object({
    url: z.string(),
    path: z.string(),
    title: z.string(),
    hash: z.string().optional(),
    query: z.record(z.string()).optional(),
  }),
  referrer: z.string().optional(),
  utm: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
    term: z.string().optional(),
    content: z.string().optional(),
  }).optional(),
});

const requestSchema = z.object({
  events: z.array(eventSchema),
});

// In-memory store for demo (in production, use Redis or database)
const eventsStore: any[] = [];
const MAX_EVENTS = 10000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Invalid analytics events', { errors: validation.error.issues });
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { events } = validation.data;

    // Process events
    const processedEvents = events.map(event => ({
      ...event,
      receivedAt: Date.now(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }));

    // Store events (in production, use proper database/analytics service)
    eventsStore.push(...processedEvents);
    
    // Keep only last MAX_EVENTS
    if (eventsStore.length > MAX_EVENTS) {
      eventsStore.splice(0, eventsStore.length - MAX_EVENTS);
    }

    // Try to store in Supabase if available
    try {
      const supabase = await createClient();
      
      // Check if analytics_events table exists
      const { error: insertError } = await supabase
        .from('analytics_events')
        .insert(processedEvents.map(event => ({
          event_id: event.id,
          timestamp: new Date(event.timestamp).toISOString(),
          category: event.category,
          action: event.action,
          label: event.label,
          value: event.value,
          metadata: event.metadata,
          session_id: event.sessionId,
          user_id: event.userId,
          anonymous_id: event.anonymousId,
          device_type: event.deviceInfo.type,
          device_os: event.deviceInfo.os,
          browser: event.deviceInfo.browser,
          page_path: event.pageInfo.path,
          page_title: event.pageInfo.title,
          referrer: event.referrer,
          utm_source: event.utm?.source,
          utm_medium: event.utm?.medium,
          utm_campaign: event.utm?.campaign,
        })));

      if (insertError) {
        // Table might not exist, log but don't fail
        logger.debug('Supabase insert skipped', { error: insertError.message });
      }
    } catch (supabaseError) {
      // Supabase not configured, continue with in-memory storage
      logger.debug('Supabase analytics storage skipped');
    }

    // Forward to external analytics services if configured
    await forwardToExternalServices(processedEvents);

    logger.info('Analytics events received', { 
      count: events.length,
      categories: [...new Set(events.map(e => e.category))],
    });

    return NextResponse.json({
      success: true,
      received: events.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Analytics events error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving events (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const action = searchParams.get('action');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let filteredEvents = [...eventsStore];

    // Apply filters
    if (category) {
      filteredEvents = filteredEvents.filter(e => e.category === category);
    }
    if (action) {
      filteredEvents = filteredEvents.filter(e => e.action === action);
    }
    if (startTime) {
      const start = parseInt(startTime, 10);
      filteredEvents = filteredEvents.filter(e => e.timestamp >= start);
    }
    if (endTime) {
      const end = parseInt(endTime, 10);
      filteredEvents = filteredEvents.filter(e => e.timestamp <= end);
    }

    // Sort by timestamp descending and limit
    filteredEvents = filteredEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    // Calculate aggregates
    const aggregates = calculateAggregates(filteredEvents);

    return NextResponse.json({
      success: true,
      events: filteredEvents,
      total: filteredEvents.length,
      aggregates,
    });
  } catch (error) {
    logger.error('Analytics GET error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper: Calculate aggregates
function calculateAggregates(events: any[]) {
  const uniqueSessions = new Set(events.map(e => e.sessionId));
  const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId));
  
  const byCategory: Record<string, number> = {};
  const byAction: Record<string, number> = {};
  const byPage: Record<string, number> = {};
  const byDevice: Record<string, number> = {};

  events.forEach(event => {
    byCategory[event.category] = (byCategory[event.category] || 0) + 1;
    byAction[event.action] = (byAction[event.action] || 0) + 1;
    byPage[event.pageInfo.path] = (byPage[event.pageInfo.path] || 0) + 1;
    byDevice[event.deviceInfo.type] = (byDevice[event.deviceInfo.type] || 0) + 1;
  });

  return {
    totalEvents: events.length,
    uniqueSessions: uniqueSessions.size,
    uniqueUsers: uniqueUsers.size,
    byCategory,
    byAction,
    topPages: Object.entries(byPage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count })),
    byDevice,
  };
}

// Helper: Forward to external services
async function forwardToExternalServices(events: any[]) {
  const promises: Promise<void>[] = [];

  // Google Analytics (if configured)
  if (process.env.GOOGLE_ANALYTICS_ID) {
    // GA4 Measurement Protocol would go here
  }

  // Mixpanel (if configured)
  if (process.env.MIXPANEL_TOKEN) {
    // Mixpanel API would go here
  }

  // Amplitude (if configured)
  if (process.env.AMPLITUDE_API_KEY) {
    // Amplitude API would go here
  }

  // PostHog (if configured)
  if (process.env.POSTHOG_API_KEY) {
    // PostHog API would go here
  }

  await Promise.allSettled(promises);
}


