/**
 * ★★★ ADMIN MARKETING AUTOMATIONS API ★★★
 * API route pour créer et lister les automations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { db } from '@/lib/db';
import { serverLogger } from '@/lib/logger-server';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const automations = await db.emailAutomation.findMany({
      include: {
        steps: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrichir avec stats (même logique que dans la route GET existante)
    const enrichedAutomations = await Promise.all(
      automations.map(async (automation: any) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const logs = await db.emailLog.findMany({
          where: {
            automationId: automation.id,
            createdAt: { gte: thirtyDaysAgo },
          },
        });

        const sent = logs.length;
        const opened = logs.filter((l: any) => l.openedAt).length;
        const clicked = logs.filter((l: any) => l.clickedAt).length;
        const converted = logs.filter((l: any) => l.converted).length;

        return {
          id: automation.id,
          name: automation.name,
          trigger: automation.trigger,
          status: automation.status,
          steps: automation.steps.map((s: any) => ({
            id: s.id,
            type: s.type,
            delay: s.delayHours,
            templateId: s.templateId,
            condition: s.condition,
            order: s.order,
          })),
          stats: {
            sent,
            opened,
            clicked,
            converted,
            openRate: sent > 0 ? (opened / sent) * 100 : 0,
            clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
            conversionRate: sent > 0 ? (converted / sent) * 100 : 0,
          },
          createdAt: automation.createdAt,
          updatedAt: automation.updatedAt,
        };
      })
    );

    return NextResponse.json(enrichedAutomations);
  } catch (error) {
    serverLogger.apiError('/api/admin/marketing/automations', 'GET', error);
    return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, trigger, steps, status = 'draft' } = body;

    if (!name || !trigger || !steps || steps.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Créer l'automation avec ses steps
    const automation = await db.emailAutomation.create({
      data: {
        name,
        trigger,
        status,
        steps: {
          create: steps.map((step: any, index: number) => ({
            type: step.type,
            delayHours: step.delay || step.delayHours,
            templateId: step.templateId,
            condition: step.condition,
            order: step.order !== undefined ? step.order : index,
          })),
        },
      },
      include: {
        steps: true,
      },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    serverLogger.apiError('/api/admin/marketing/automations', 'POST', error);
    return NextResponse.json(
      { error: 'Failed to create automation' },
      { status: 500 }
    );
  }
}
