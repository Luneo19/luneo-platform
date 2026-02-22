// @ts-nocheck
import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export type SegmentCondition = {
  property: string;
  operator: string;
  value: string;
};

export type SegmentCriteria = {
  type?: string;
  conditions?: SegmentCondition[];
};

export type CreateSegmentDto = {
  name: string;
  description?: string;
  conditions: SegmentCondition[];
  type?: string;
  brandId?: string;
};

export type UpdateSegmentDto = {
  name?: string;
  description?: string;
  conditions?: SegmentCondition[];
  type?: string;
  isActive?: boolean;
};

@Injectable()
export class SegmentsService {
  private readonly logger = new Logger(SegmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSegments(brandId?: string) {
    const segments = await this.prisma.analyticsSegment.findMany({
      where: brandId ? { brandId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: { select: { id: true, name: true } },
      },
    });
    return segments.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      criteria: s.criteria as SegmentCriteria,
      userCount: s.userCount,
      isActive: s.isActive,
      brandId: s.brandId,
      brand: s.brand,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  async getSegment(id: string) {
    const segment = await this.prisma.analyticsSegment.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, name: true } },
      },
    });
    if (!segment) throw new NotFoundException('Segment not found');
    return {
      ...segment,
      criteria: segment.criteria as SegmentCriteria,
    };
  }

  async createSegment(data: CreateSegmentDto) {
    const brandId =
      data.brandId ??
      (await this.prisma.brand.findFirst().then((b) => b?.id));
    if (!brandId) {
      throw new Error('No brand available. Create a brand first or pass brandId.');
    }
    const criteria: SegmentCriteria = {
      type: data.type ?? 'Behavioral',
      conditions: data.conditions ?? [],
    };
    return this.prisma.analyticsSegment.create({
      data: {
        name: data.name,
        description: data.description,
        criteria: criteria as object,
        brandId,
      },
    });
  }

  async updateSegment(id: string, data: UpdateSegmentDto) {
    const existing = await this.prisma.analyticsSegment.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Segment not found');

    const criteria = existing.criteria as SegmentCriteria;
    const updatedCriteria: SegmentCriteria = {
      type: data.type ?? criteria?.type,
      conditions: data.conditions ?? criteria?.conditions ?? [],
    };

    return this.prisma.analyticsSegment.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        criteria: updatedCriteria as object,
      },
    });
  }

  async deleteSegment(id: string) {
    const existing = await this.prisma.analyticsSegment.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Segment not found');
    await this.prisma.analyticsSegment.delete({ where: { id } });
    return { deleted: true, id };
  }

  async getPredictions(brandId?: string) {
    const predictions = await this.prisma.analyticsPrediction.findMany({
      where: brandId ? { brandId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        brand: { select: { id: true, name: true } },
      },
    });
    return predictions;
  }

  async getCohorts(brandId?: string) {
    const cohorts = await this.prisma.analyticsCohort.findMany({
      where: brandId ? { brandId } : undefined,
      orderBy: [{ cohortDate: 'desc' }, { period: 'asc' }],
      take: 200,
      include: {
        brand: { select: { id: true, name: true } },
      },
    });
    return cohorts;
  }
}
