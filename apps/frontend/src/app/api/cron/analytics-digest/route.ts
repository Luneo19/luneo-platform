import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/cron/analytics-digest
 * Scheduled cron job to generate analytics digest
 * Runs weekly on Monday at 8:00 AM (configured in vercel.json)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    logger.info('Cron job: analytics-digest started');
    const supabase = await createClient();

    // Calculate last week period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Aggregate weekly metrics
    const [designsCount, ordersCount, revenueResult, activeUsersCount] = await Promise.all([
      // Total designs created last week
      supabase
        .from('designs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .then(({ count, error }) => {
          if (error) {
            logger.dbError('count designs for analytics digest', error);
            return 0;
          }
          return count || 0;
        }),

      // Total orders last week
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .then(({ count, error }) => {
          if (error) {
            logger.dbError('count orders for analytics digest', error);
            return 0;
          }
          return count || 0;
        }),

      // Total revenue last week
      supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('status', ['completed', 'paid', 'delivered'])
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('calculate revenue for analytics digest', error);
            return 0;
          }
          return (data || []).reduce((sum, order) => sum + (order.total_amount || 0), 0);
        }),

      // Active users (users who logged in last week)
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_at', startDate.toISOString())
        .lte('last_login_at', endDate.toISOString())
        .then(({ count, error }) => {
          if (error) {
            logger.dbError('count active users for analytics digest', error);
            return 0;
          }
          return count || 0;
        }),
    ]);

    // Generate digest report
    const digest = {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        week: getWeekNumber(startDate),
      },
      metrics: {
        designs: {
          count: designsCount,
          change: 0, // Would need previous week data to calculate
        },
        orders: {
          count: ordersCount,
          revenue: revenueResult,
          change: 0,
        },
        activeUsers: {
          count: activeUsersCount,
          change: 0,
        },
      },
      generatedAt: new Date().toISOString(),
    };

    // Save digest to database (if analytics_digests table exists)
    try {
      const { error: saveError } = await supabase
        .from('analytics_digests')
        .insert({
          period_start: startDate.toISOString(),
          period_end: endDate.toISOString(),
          metrics: digest.metrics,
          created_at: new Date().toISOString(),
        });

      if (saveError && saveError.code !== 'PGRST116') {
        logger.warn('Analytics digest: failed to save to database', { error: saveError.message });
      } else if (!saveError) {
        logger.info('Analytics digest: saved to database');
      }
    } catch (error) {
      logger.error('Analytics digest: failed to save', error instanceof Error ? error : new Error(String(error)));
    }

    // Send digest email to admins (if configured)
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (adminEmails.length > 0 && process.env.BACKEND_URL) {
      try {
        const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        for (const email of adminEmails) {
          await fetch(`${backendUrl}/api/emails/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({
              to: email.trim(),
              subject: `📊 Luneo Analytics Digest - Week ${digest.period.week}`,
              html: generateDigestEmail(digest),
            }),
          });
        }
        logger.info('Analytics digest: emails sent', { count: adminEmails.length });
      } catch (error) {
        logger.error('Analytics digest: failed to send emails', error instanceof Error ? error : new Error(String(error)));
      }
    }

    logger.info('Cron job: analytics-digest completed', {
      period: digest.period,
      metrics: digest.metrics,
    });

    return NextResponse.json({
      success: true,
      message: 'Analytics digest job completed',
      digest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cron job: analytics-digest failed', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      {
        success: false,
        error: 'Analytics digest job failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Support POST for Vercel cron
export async function POST(request: NextRequest) {
  return GET(request);
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper function to generate digest email HTML
function generateDigestEmail(digest: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .metric { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #667eea; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; margin-top: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Analytics Digest - Week ${digest.period.week}</h1>
          <p>${new Date(digest.period.startDate).toLocaleDateString()} - ${new Date(digest.period.endDate).toLocaleDateString()}</p>
        </div>
        <div class="content">
          <div class="metric">
            <div class="metric-label">Designs Created</div>
            <div class="metric-value">${digest.metrics.designs.count}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Orders</div>
            <div class="metric-value">${digest.metrics.orders.count}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Revenue</div>
            <div class="metric-value">€${digest.metrics.orders.revenue.toFixed(2)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Active Users</div>
            <div class="metric-value">${digest.metrics.activeUsers.count}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}










