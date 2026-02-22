import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { CustomizationStatus } from '@prisma/client';

@Injectable()
export class CustomizationService {
  private readonly logger = new Logger(CustomizationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Génère une personnalisation pour un produit
   */
  async generateCustomization(body: {
    productId: string;
    zoneId: string;
    prompt: string;
    font?: string;
    color?: string;
    size?: number;
    effect?: 'normal' | 'embossed' | 'engraved' | '3d';
    zoneUV: { u: number[]; v: number[] };
    modelUrl: string;
  }): Promise<{ jobId?: string; textureUrl?: string }> {
    try {
      this.logger.log(`Starting customization generation for product ${body.productId}, zone ${body.zoneId}`);

      // Appeler le moteur IA Python externe
      const aiEngineUrl = this.configService.get<string>('ai.engineUrl') || process.env.AI_ENGINE_URL || 'http://localhost:8000';

      const response = await fetch(`${aiEngineUrl}/api/generate/texture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: body.prompt,
          font: body.font || 'Arial',
          color: body.color || '#000000',
          size: body.size || 24,
          effect: body.effect || 'engraved',
          zoneUV: body.zoneUV,
          modelUrl: body.modelUrl,
          productId: body.productId,
          zoneId: body.zoneId,
        }),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('AI Engine error', { status: response.status, error: errorText });
        throw new InternalServerErrorException(`AI Engine error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      this.logger.log('Customization generated', {
        jobId: data.jobId,
        textureUrl: data.textureUrl,
      });

      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Error calling AI engine', { error: message });

      if (error instanceof Error && (error.name === 'AbortError' || message.includes('timeout'))) {
        throw new InternalServerErrorException('La génération a pris trop de temps. Veuillez réessayer.');
      }

      throw new InternalServerErrorException(`Erreur lors de la génération: ${message}`);
    }
  }

  /**
   * List customizations for the brand
   */
  async list(brandId: string, params: { productId?: string; status?: CustomizationStatus; limit?: number; offset?: number }) {
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const offset = Math.max(0, params.offset ?? 0);
    const where: { brandId: string; productId?: string; status?: CustomizationStatus } = { brandId };
    if (params.productId) where.productId = params.productId;
    if (params.status) where.status = params.status;

    const [customizations, total] = await Promise.all([
      this.prisma.customization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.customization.count({ where }),
    ]);
    return { customizations, total, pagination: { total } };
  }

  /**
   * Get one customization by id (brand-scoped)
   */
  async getById(id: string, brandId: string) {
    const customization = await this.prisma.customization.findFirst({
      where: { id, brandId },
    });
    if (!customization) return null;
    return customization;
  }

  /**
   * Create a customization (save configuration)
   */
  async create(
    brandId: string,
    userId: string,
    data: {
      productId: string;
      zoneId: string;
      prompt: string;
      name?: string;
      description?: string;
      font?: string;
      color?: string;
      size?: number;
      effect?: string;
      orientation?: string;
      options?: Record<string, unknown>;
    },
  ) {
    return this.prisma.customization.create({
      data: {
        brandId,
        userId,
        productId: data.productId,
        zoneId: data.zoneId,
        prompt: data.prompt,
        name: data.name,
        description: data.description,
        font: data.font,
        color: data.color,
        size: data.size,
        effect: (data.effect as 'NORMAL' | 'EMBOSSED' | 'ENGRAVED' | 'THREE_D') ?? 'ENGRAVED',
        orientation: data.orientation,
        options: (data.options ?? undefined) as Prisma.InputJsonValue | undefined,
        status: 'PENDING',
      },
    });
  }

  /**
   * Update a customization
   */
  async update(id: string, brandId: string, data: { name?: string; description?: string; options?: Record<string, unknown> }) {
    const existing = await this.getById(id, brandId);
    if (!existing) throw new NotFoundException('Customization not found');
    return this.prisma.customization.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.options !== undefined && { options: data.options as Prisma.InputJsonValue }),
      },
    });
  }

  /**
   * Delete a customization
   */
  async delete(id: string, brandId: string) {
    const existing = await this.getById(id, brandId);
    if (!existing) throw new NotFoundException('Customization not found');
    await this.prisma.customization.delete({ where: { id } });
  }
}
