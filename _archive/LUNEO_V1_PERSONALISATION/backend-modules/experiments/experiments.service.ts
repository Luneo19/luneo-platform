import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface ExperimentVariant {
  id: string;
  name: string;
  config?: Record<string, unknown>;
  weight: number;
}

@Injectable()
export class ExperimentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an experiment with variants and optional target percentage per variant.
   */
  async createExperiment(
    name: string,
    variants: ExperimentVariant[],
    options?: { description?: string; type?: string; targetPercentage?: number },
  ) {
    if (!name?.trim()) throw new BadRequestException('name is required');
    if (!Array.isArray(variants) || variants.length < 2) throw new BadRequestException('at least 2 variants required');
    const totalWeight = variants.reduce((s, v) => s + (v.weight ?? 100), 0);
    const normalized = variants.map((v) => ({
      id: v.id,
      name: v.name,
      config: v.config ?? {},
      weight: totalWeight > 0 ? (v.weight ?? 100) / totalWeight : 1 / variants.length,
    }));
    return this.prisma.experiment.create({
      data: {
        name: name.trim(),
        description: options?.description ?? '',
        type: options?.type ?? 'variants',
        variants: normalized as unknown as object,
        status: 'draft',
      },
    });
  }

  /**
   * Get or create a variant assignment for a user. Returns the variant id.
   */
  async getAssignment(userId: string, experimentName: string): Promise<{ variant: string }> {
    const experiment = await this.prisma.experiment.findFirst({
      where: { name: experimentName, status: 'running' },
    });
    if (!experiment) throw new NotFoundException('Experiment not found or not running');
    const variants = experiment.variants as unknown as ExperimentVariant[];
    if (!variants?.length) throw new BadRequestException('Experiment has no variants');

    let assignment = await this.prisma.experimentAssignment.findUnique({
      where: { userId_experimentId: { userId, experimentId: experiment.id } },
    });
    if (assignment) return { variant: assignment.variantId };

    const rand = Math.random();
    let cum = 0;
    let chosen = variants[0];
    for (const v of variants) {
      cum += v.weight ?? 1 / variants.length;
      if (rand <= cum) {
        chosen = v;
        break;
      }
      chosen = v;
    }
    assignment = await this.prisma.experimentAssignment.create({
      data: {
        userId,
        experimentId: experiment.id,
        variantId: chosen.id,
      },
    });
    return { variant: assignment.variantId };
  }

  /**
   * Record a conversion for an experiment (optionally with value).
   */
  async recordConversion(
    userId: string,
    experimentName: string,
    options?: { value?: number; sessionId?: string; eventType?: string },
  ) {
    const experiment = await this.prisma.experiment.findFirst({
      where: { name: experimentName },
    });
    if (!experiment) throw new NotFoundException('Experiment not found');
    const assignment = await this.prisma.experimentAssignment.findUnique({
      where: { userId_experimentId: { userId, experimentId: experiment.id } },
    });
    const sessionId = options?.sessionId ?? `session-${userId}-${Date.now()}`;
    return this.prisma.conversion.create({
      data: {
        userId,
        sessionId,
        experimentId: experiment.id,
        variantId: assignment?.variantId ?? null,
        eventType: options?.eventType ?? 'conversion',
        value: options?.value ?? null,
        attribution: {},
      },
    });
  }

  /**
   * Get experiment results: conversion counts and rates per variant.
   */
  async getResults(experimentName: string) {
    const experiment = await this.prisma.experiment.findFirst({
      where: { name: experimentName },
      include: { assignments: true, conversions: true },
    });
    if (!experiment) throw new NotFoundException('Experiment not found');
    const variants = (experiment.variants as unknown as ExperimentVariant[]) ?? [];
    const byVariant: Record<string, { assignments: number; conversions: number; totalValue: number }> = {};
    for (const v of variants) byVariant[v.id] = { assignments: 0, conversions: 0, totalValue: 0 };
    for (const a of experiment.assignments) {
      byVariant[a.variantId] = byVariant[a.variantId] ?? { assignments: 0, conversions: 0, totalValue: 0 };
      byVariant[a.variantId].assignments += 1;
    }
    for (const c of experiment.conversions) {
      if (c.variantId) {
        byVariant[c.variantId] = byVariant[c.variantId] ?? { assignments: 0, conversions: 0, totalValue: 0 };
        byVariant[c.variantId].conversions += 1;
        byVariant[c.variantId].totalValue += c.value ?? 0;
      }
    }
    const results = Object.entries(byVariant).map(([variantId, data]) => ({
      variantId,
      variantName: variants.find((v) => v.id === variantId)?.name ?? variantId,
      assignments: data.assignments,
      conversions: data.conversions,
      conversionRate: data.assignments > 0 ? data.conversions / data.assignments : 0,
      totalValue: data.totalValue,
    }));
    return { experiment: { id: experiment.id, name: experiment.name }, results };
  }

  async findAll() {
    return this.prisma.experiment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { assignments: true, conversions: true } } },
    });
  }

  async findOne(id: string) {
    const exp = await this.prisma.experiment.findUnique({
      where: { id },
      include: { assignments: true, conversions: true },
    });
    if (!exp) throw new NotFoundException('Experiment not found');
    return exp;
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.experiment.update({
      where: { id },
      data: { status, ...(status === 'running' ? { startDate: new Date() } : {}) },
    });
  }
}
