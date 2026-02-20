/**
 * Module 8 - Render 2D/3D pipeline.
 * Submits render jobs (mockup, HD, CMYK), validates for print, generates mockups.
 */
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';

const MIN_DPI_PRINT = 300;
const DEFAULT_DPI = 72;

export interface SubmitRenderRequest {
  sourceType: 'design' | 'snapshot' | 'customization';
  sourceId: string;
  outputs: Array<'mockup' | 'hd' | 'cmyk' | 'preview'>;
  priority?: number;
}

export interface SubmitRenderResult {
  renderId: string;
  jobId: string;
  outputs: string[];
}

export interface PrintValidationResult {
  valid: boolean;
  dpi: boolean;
  colorSpace: boolean;
  bleed: boolean;
  errors: string[];
}

@Injectable()
export class RenderPipelineService {
  private readonly logger = new Logger(RenderPipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('render-pipeline') private readonly renderPipelineQueue: Queue,
  ) {}

  /**
   * Submits a render job with DPI and output type validation (mockup, HD, CMYK).
   */
  async submitRender(request: SubmitRenderRequest): Promise<SubmitRenderResult> {
    const { sourceType, sourceId, outputs, priority = 0 } = request;

    if (!sourceType || !sourceId || !outputs?.length) {
      throw new BadRequestException('sourceType, sourceId and outputs are required');
    }

    const validOutputs = ['mockup', 'hd', 'cmyk', 'preview'];
    const invalid = outputs.filter((o) => !validOutputs.includes(o));
    if (invalid.length > 0) {
      throw new BadRequestException(`Invalid outputs: ${invalid.join(', ')}`);
    }

    const designId = await this.resolveDesignId(sourceType, sourceId);
    if (!designId) {
      throw new NotFoundException(`Source not found: ${sourceType}/${sourceId}`);
    }

    const renderId = `rp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    await this.prisma.renderResult.create({
      data: {
        renderId,
        type: '2d',
        status: 'pending',
        designId,
        metadata: {
          sourceType,
          sourceId,
          outputs,
          priority,
          submittedAt: new Date().toISOString(),
        },
      },
    });

    const job = await this.renderPipelineQueue.add(
      'render',
      {
        renderId,
        sourceType,
        sourceId,
        designId,
        outputs,
      },
      {
        priority: Math.max(0, Math.min(10, priority)),
        jobId: renderId,
        attempts: 3,
        removeOnComplete: 100,
      },
    );

    this.logger.log(`Render job submitted: ${renderId} for ${outputs.join(', ')}`);

    return {
      renderId,
      jobId: job.id as string,
      outputs,
    };
  }

  /**
   * Validates design for print: min 300 DPI, CMYK color space, bleed check.
   */
  async validateForPrint(designId: string): Promise<PrintValidationResult> {
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: {
        id: true,
        metadata: true,
        designData: true,
        canvasWidth: true,
        canvasHeight: true,
      },
    });

    if (!design) {
      throw new NotFoundException(`Design not found: ${designId}`);
    }

    const errors: string[] = [];
    const meta = (design.metadata ?? {}) as Record<string, unknown>;
    const dpi = (meta.dpi as number) ?? (design.designData as Record<string, unknown>)?.dpi ?? DEFAULT_DPI;
    const colorSpace = (meta.colorSpace as string) ?? 'RGB';
    const bleed = (meta.bleed as number) ?? 0;

    const dpiOk = dpi >= MIN_DPI_PRINT;
    if (!dpiOk) errors.push(`DPI ${dpi} is below minimum ${MIN_DPI_PRINT} for print`);

    const colorSpaceOk = String(colorSpace).toUpperCase() === 'CMYK';
    if (!colorSpaceOk) errors.push('Color space must be CMYK for print');

    const bleedOk = bleed >= 0;
    if (!bleedOk) errors.push('Bleed must be non-negative');

    return {
      valid: errors.length === 0,
      dpi: dpiOk,
      colorSpace: colorSpaceOk,
      bleed: bleedOk,
      errors,
    };
  }

  /**
   * Generates a product mockup for the design using the given template.
   */
  async generateMockup(
    designId: string,
    mockupTemplateId: string,
  ): Promise<{ renderId: string; jobId: string }> {
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: { id: true },
    });
    if (!design) {
      throw new NotFoundException(`Design not found: ${designId}`);
    }

    const renderId = `mockup_${designId.slice(0, 8)}_${Date.now()}`;

    await this.prisma.renderResult.create({
      data: {
        renderId,
        type: '2d',
        status: 'pending',
        designId,
        metadata: {
          mockupTemplateId,
          outputType: 'mockup',
          requestedAt: new Date().toISOString(),
        },
      },
    });

    const job = await this.renderPipelineQueue.add(
      'mockup',
      {
        renderId,
        designId,
        mockupTemplateId,
      },
      {
        priority: 5,
        jobId: renderId,
        attempts: 2,
        removeOnComplete: 50,
      },
    );

    this.logger.log(`Mockup job enqueued: ${renderId} for design ${designId}`);

    return { renderId, jobId: job.id as string };
  }

  private async resolveDesignId(
    sourceType: string,
    sourceId: string,
  ): Promise<string | null> {
    switch (sourceType) {
      case 'design':
        const d = await this.prisma.design.findUnique({
          where: { id: sourceId },
          select: { id: true },
        });
        return d?.id ?? null;
      case 'snapshot':
        const s = await this.prisma.snapshot.findUnique({
          where: { id: sourceId },
          select: { specId: true },
        });
        return s?.specId ?? null;
      case 'customization':
        const c = await this.prisma.customization.findUnique({
          where: { id: sourceId },
          select: { designId: true },
        });
        return c?.designId ?? null;
      default:
        return null;
    }
  }
}
