import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { CreateGenerationDto } from './dto/create-generation.dto';
import { GenerationStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

// Helper pour générer un ID unique (remplace nanoid)
function generatePublicId(): string {
  return randomBytes(8).toString('base64url').substring(0, 12);
}

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(
    private prisma: PrismaService,
    private promptBuilder: PromptBuilderService,
    private eventEmitter: EventEmitter2,
    @InjectQueue('generation') private generationQueue: Queue,
  ) {}

  async create(dto: CreateGenerationDto & { clientId: string; metadata?: any }) {
    // 1. Vérifier le produit existe et appartient au client
    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        brandId: dto.clientId,
        status: 'ACTIVE',
      },
      include: {
        customizationZones: true,
        brand: {
          include: { clientSettings: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Vérifier les limites du client
    const client = product.brand;
    if (client.monthlyGenerations >= client.maxMonthlyGenerations) {
      throw new BadRequestException('Monthly generation limit reached');
    }

    // 3. Valider les personnalisations
    this.validateCustomizations(dto.customizations, product.customizationZones);

    // 4. Construire le prompt final
    const { finalPrompt, negativePrompt } = await this.promptBuilder.build({
      product,
      customizations: dto.customizations,
      userPrompt: dto.userPrompt,
    });

    // 5. Créer l'enregistrement génération
    const generation = await this.prisma.generation.create({
      data: {
        publicId: generatePublicId(),
        brandId: dto.clientId,
        productId: dto.productId,
        customizations: dto.customizations as Prisma.JsonObject,
        userPrompt: dto.userPrompt,
        finalPrompt,
        negativePrompt,
        aiProvider: product.aiProvider,
        model: this.getModelForProvider(product.aiProvider),
        quality: product.generationQuality,
        status: GenerationStatus.PENDING,
        ipAddress: dto.metadata?.ipAddress,
        userAgent: dto.metadata?.userAgent,
        referrer: dto.metadata?.referrer,
        sessionId: dto.sessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    // 6. Incrémenter le compteur
    await this.prisma.brand.update({
      where: { id: dto.clientId },
      data: { monthlyGenerations: { increment: 1 } },
    });

    // 7. Ajouter à la queue
    const job = await this.generationQueue.add(
      'generate',
      {
        generationId: generation.id,
        productId: product.id,
        finalPrompt,
        negativePrompt,
        aiProvider: product.aiProvider,
        quality: product.generationQuality,
        outputFormat: product.outputFormat,
        outputWidth: product.outputWidth,
        outputHeight: product.outputHeight,
        baseImage: product.baseImage,
        customizations: dto.customizations,
        customizationZones: product.customizationZones,
      },
      {
        priority: this.getPriority(client.subscriptionPlan),
      },
    );

    // 8. Émettre événement
    this.eventEmitter.emit('generation.created', {
      generationId: generation.id,
      clientId: dto.clientId,
    });

    return {
      id: generation.publicId,
      status: 'pending',
      estimatedTime: this.estimateTime(client.subscriptionPlan),
      statusUrl: `/api/v1/generation/${generation.publicId}/status`,
    };
  }

  async getStatus(publicId: string) {
    const generation = await this.prisma.generation.findUnique({
      where: { publicId },
      select: {
        status: true,
        outputUrl: true,
        thumbnailUrl: true,
        arModelUrl: true,
        errorMessage: true,
        processingTime: true,
      },
    });

    if (!generation) {
      throw new NotFoundException('Generation not found');
    }

    return {
      status: generation.status.toLowerCase(),
      ...(generation.status === 'COMPLETED' && {
        result: {
          imageUrl: generation.outputUrl,
          thumbnailUrl: generation.thumbnailUrl,
          arModelUrl: generation.arModelUrl,
        },
        processingTime: generation.processingTime,
      }),
      ...(generation.status === 'FAILED' && {
        error: generation.errorMessage,
      }),
    };
  }

  async findByPublicId(publicId: string) {
    const generation = await this.prisma.generation.findUnique({
      where: { publicId },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
            arEnabled: true,
            arTrackingType: true,
          },
        },
      },
    });

    if (!generation) {
      throw new NotFoundException('Generation not found');
    }

    return {
      id: generation.publicId,
      status: generation.status.toLowerCase(),
      product: generation.product,
      customizations: generation.customizations,
      result: generation.status === 'COMPLETED' ? {
        imageUrl: generation.outputUrl,
        thumbnailUrl: generation.thumbnailUrl,
      } : null,
      ar: generation.product.arEnabled ? {
        enabled: true,
        modelUrl: generation.arModelUrl,
        trackingType: generation.product.arTrackingType,
      } : null,
      createdAt: generation.createdAt,
    };
  }

  async getArData(publicId: string) {
    const generation = await this.prisma.generation.findUnique({
      where: { publicId },
      include: {
        product: {
          select: {
            model3dUrl: true,
            arEnabled: true,
            arTrackingType: true,
            arScale: true,
            arOffset: true,
          },
        },
      },
    });

    if (!generation || !generation.product.arEnabled) {
      throw new NotFoundException('AR not available for this generation');
    }

    // Track AR view
    await this.prisma.generation.update({
      where: { id: generation.id },
      data: {
        viewedInAr: true,
        arViewCount: { increment: 1 },
      },
    });

    this.eventEmitter.emit('ar.viewed', {
      generationId: generation.id,
      clientId: generation.brandId,
    });

    return {
      textureUrl: generation.outputUrl,
      modelUrl: generation.product.model3dUrl,
      trackingType: generation.product.arTrackingType,
      scale: generation.product.arScale,
      offset: generation.product.arOffset,
      sessionConfig: this.getArSessionConfig(generation.product.arTrackingType),
    };
  }

  async findAll(params: {
    clientId: string;
    page: number;
    limit: number;
    productId?: string;
    status?: string;
  }) {
    const { clientId, page, limit, productId, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.GenerationWhereInput = {
      brandId: clientId,
      ...(productId && { productId }),
      ...(status && { status: status.toUpperCase() as GenerationStatus }),
    };

    const [generations, total] = await Promise.all([
      this.prisma.generation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { name: true, slug: true },
          },
        },
      }),
      this.prisma.generation.count({ where }),
    ]);

    return {
      data: generations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private validateCustomizations(customizations: any, zones: any[]) {
    for (const zone of zones) {
      if (zone.required && !customizations[zone.id]) {
        throw new BadRequestException(`Zone ${zone.name} is required`);
      }
      
      const value = customizations[zone.id];
      if (value) {
        if (zone.type === 'TEXT' && zone.maxLength && value.text?.length > zone.maxLength) {
          throw new BadRequestException(`Text too long for zone ${zone.name}`);
        }
      }
    }
  }

  private getModelForProvider(provider: string): string {
    const models: Record<string, string> = {
      openai: 'dall-e-3',
      stability: 'stable-diffusion-xl-1024-v1-0',
      replicate: 'stability-ai/sdxl',
    };
    return models[provider] || 'dall-e-3';
  }

  private getPriority(plan: string): number {
    const priorities: Record<string, number> = {
      ENTERPRISE: 1,
      PROFESSIONAL: 2,
      STARTER: 3,
      FREE: 4,
    };
    return priorities[plan] || 4;
  }

  private estimateTime(plan: string): number {
    const times: Record<string, number> = {
      ENTERPRISE: 5,
      PROFESSIONAL: 10,
      STARTER: 20,
      FREE: 30,
    };
    return times[plan] || 30;
  }

  private getArSessionConfig(trackingType: string) {
    const configs: Record<string, any> = {
      face: {
        requiredFeatures: ['face-detection'],
        optionalFeatures: ['dom-overlay'],
      },
      body: {
        requiredFeatures: ['body-tracking'],
        optionalFeatures: ['dom-overlay', 'hit-test'],
      },
      surface: {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'anchors'],
      },
      hand: {
        requiredFeatures: ['hand-tracking'],
        optionalFeatures: ['dom-overlay'],
      },
    };
    return configs[trackingType] || configs.surface;
  }
}

