import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CUSTOMIZER_QUEUES } from '../visual-customizer.constants';

/** Immutable order-time snapshot returned to callers */
export interface OrderSnapshot {
  id: string;
  canvasData: Prisma.JsonValue;
  price: number;
  currency: string;
  thumbnailUrl: string | null;
}

@Injectable()
export class CustomizationOrderService {
  private readonly logger = new Logger(CustomizationOrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CUSTOMIZER_QUEUES.EXPORT) private readonly exportQueue: Queue,
  ) {}

  /**
   * Creates an immutable snapshot of the design at order time: reads session canvasData,
   * stores as CustomizerSavedDesign if not already saved, calculates final price,
   * returns snapshot with id, canvasData, price, thumbnailUrl.
   */
  async createOrderSnapshot(sessionId: string): Promise<OrderSnapshot> {
    const session = await this.prisma.customizerSession.findFirst({
      where: { id: sessionId },
      include: {
        customizer: {
          select: {
            id: true,
            basePrice: true,
            currency: true,
            pricingEnabled: true,
            canvasWidth: true,
            canvasHeight: true,
          },
        },
        savedDesign: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const canvasData = session.canvasData as Prisma.JsonValue;
    if (canvasData == null || (typeof canvasData === 'object' && Object.keys(canvasData as object).length === 0)) {
      throw new BadRequestException('Session has no canvas data to snapshot');
    }

    let savedDesign = session.savedDesign;
    if (!savedDesign) {
      const name = `Order snapshot ${new Date().toISOString().slice(0, 10)}`;
      savedDesign = await this.prisma.customizerSavedDesign.create({
        data: {
          customizerId: session.customizerId,
          sessionId,
          userId: session.userId ?? undefined,
          name,
          canvasData: canvasData as Prisma.InputJsonValue,
          thumbnailUrl: null,
          savedPrice: this.calculatePrice(session),
          currency: session.customizer.currency,
        },
      });
      this.logger.log(
        `Created saved design ${savedDesign.id} for order snapshot (session ${sessionId})`,
      );
    }

    const price = savedDesign.savedPrice ?? session.calculatedPrice ?? session.customizer.basePrice ?? 0;

    return {
      id: savedDesign.id,
      canvasData: savedDesign.canvasData,
      price,
      currency: savedDesign.currency,
      thumbnailUrl: savedDesign.thumbnailUrl,
    };
  }

  /**
   * Gets the immutable order snapshot by snapshot (saved design) id.
   */
  async getOrderSnapshot(snapshotId: string): Promise<OrderSnapshot> {
    const saved = await this.prisma.customizerSavedDesign.findFirst({
      where: { id: snapshotId, deletedAt: null },
    });

    if (!saved) {
      throw new NotFoundException(`Order snapshot ${snapshotId} not found`);
    }

    return {
      id: saved.id,
      canvasData: saved.canvasData,
      price: saved.savedPrice ?? 0,
      currency: saved.currency,
      thumbnailUrl: saved.thumbnailUrl,
    };
  }

  /**
   * Queues production file generation (high-res exports) for the given snapshot.
   */
  async generateProductionFiles(snapshotId: string): Promise<{ exportId: string; jobId: string }> {
    const saved = await this.prisma.customizerSavedDesign.findFirst({
      where: { id: snapshotId, deletedAt: null },
      include: {
        customizer: {
          select: { canvasWidth: true, canvasHeight: true },
        },
      },
    });

    if (!saved) {
      throw new NotFoundException(`Order snapshot ${snapshotId} not found`);
    }

    if (!saved.sessionId) {
      throw new BadRequestException(
        `Snapshot ${snapshotId} has no linked session; production export requires a session`,
      );
    }

    const exportRecord = await this.prisma.customizerExport.create({
      data: {
        sessionId: saved.sessionId,
        userId: saved.userId ?? undefined,
        type: 'IMAGE',
        format: 'png',
        status: 'PENDING',
        width: saved.customizer.canvasWidth,
        height: saved.customizer.canvasHeight,
        dpi: 300,
        quality: 100,
        options: {
          highRes: true,
          production: true,
          snapshotId,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    const canvasData = saved.canvasData as {
      objects?: unknown[];
      background?: string;
      width?: number;
      height?: number;
    };

    const job = await this.exportQueue.add(
      'export-image',
      {
        exportId: exportRecord.id,
        type: 'IMAGE' as const,
        sessionId: saved.sessionId,
        canvasData: {
          objects: canvasData?.objects ?? [],
          background: canvasData?.background,
          width: canvasData?.width ?? saved.customizer.canvasWidth,
          height: canvasData?.height ?? saved.customizer.canvasHeight,
        },
        options: {
          width: saved.customizer.canvasWidth,
          height: saved.customizer.canvasHeight,
          format: 'png',
          quality: 100,
          dpi: 300,
        },
      },
      { jobId: exportRecord.id },
    );

    this.logger.log(
      `Queued production export ${exportRecord.id} for snapshot ${snapshotId} (job ${job.id})`,
    );

    return {
      exportId: exportRecord.id,
      jobId: String(job.id),
    };
  }

  private calculatePrice(session: {
    calculatedPrice: number | null;
    customizer: { basePrice: number };
  }): number {
    return session.calculatedPrice ?? session.customizer.basePrice ?? 0;
  }
}
