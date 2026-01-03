# 📁 FICHIERS D'IMPLÉMENTATION - EXEMPLES CONCRETS

## 1. GUARDS & DECORATORS

### BrandScoped Decorator & Guard

**Fichier** : `apps/backend/src/common/decorators/brand-scoped.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const BRAND_SCOPED_KEY = 'brandScoped';

/**
 * Decorator pour scoper automatiquement les requêtes par brandId
 * Utilise currentUser.brandId pour filtrer les résultats
 */
export const BrandScoped = () => SetMetadata(BRAND_SCOPED_KEY, true);
```

**Fichier** : `apps/backend/src/common/guards/brand-scoped.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BRAND_SCOPED_KEY } from '../decorators/brand-scoped.decorator';
import { CurrentUser } from '../types/user.types';

@Injectable()
export class BrandScopedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isBrandScoped = this.reflector.getAllAndOverride<boolean>(BRAND_SCOPED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isBrandScoped) {
      return true; // Pas de scoping requis
    }

    const request = context.switchToHttp().getRequest();
    const user: CurrentUser = request.user;

    if (!user || !user.brandId) {
      throw new ForbiddenException('Brand context required');
    }

    // Injecter brandId dans request pour utilisation dans services
    request.brandId = user.brandId;

    return true;
  }
}
```

---

### Idempotency Decorator & Guard

**Fichier** : `apps/backend/src/common/decorators/idempotency-key.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENCY_KEY = 'idempotencyKey';

/**
 * Decorator pour activer l'idempotency sur un endpoint
 * Utilise le header Idempotency-Key ou X-Idempotency-Key
 */
export const IdempotencyKey = () => SetMetadata(IDEMPOTENCY_KEY, true);
```

**Fichier** : `apps/backend/src/common/guards/idempotency.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IDEMPOTENCY_KEY } from '../decorators/idempotency-key.decorator';
import { RedisService } from '@/libs/redis/redis-optimized.service';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isIdempotent = this.reflector.getAllAndOverride<boolean>(IDEMPOTENCY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isIdempotent) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const idempotencyKey = 
      request.headers['idempotency-key'] || 
      request.headers['x-idempotency-key'];

    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header required');
    }

    // Vérifier si la requête a déjà été traitée
    const cachedResponse = await this.redis.get(`idempotency:${idempotencyKey}`);
    if (cachedResponse) {
      // Retourner la réponse mise en cache
      request.idempotencyKey = idempotencyKey;
      request.idempotencyCachedResponse = JSON.parse(cachedResponse);
      return true; // Laisser l'interceptor gérer la réponse
    }

    // Stocker l'idempotency key pour l'interceptor
    request.idempotencyKey = idempotencyKey;
    request.idempotencyStartTime = Date.now();

    return true;
  }
}
```

**Fichier** : `apps/backend/src/common/interceptors/idempotency.interceptor.ts`

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '@/libs/redis/redis-optimized.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private redis: RedisService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.idempotencyKey;
    const cachedResponse = request.idempotencyCachedResponse;

    // Si réponse en cache, la retourner directement
    if (cachedResponse) {
      return of(cachedResponse);
    }

    // Sinon, exécuter la requête et mettre en cache
    return next.handle().pipe(
      tap(async (response) => {
        if (idempotencyKey && response) {
          // Mettre en cache pour 24h
          await this.redis.set(
            `idempotency:${idempotencyKey}`,
            JSON.stringify(response),
            { ttl: 86400 }, // 24h
          );
        }
      }),
    );
  }
}
```

---

## 2. MODULE SPECS - EXEMPLE COMPLET

### Module

**Fichier** : `apps/backend/src/modules/specs/specs.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { SpecsController } from './specs.controller';
import { SpecsService } from './specs.service';
import { SpecBuilderService } from './services/spec-builder.service';
import { SpecCanonicalizerService } from './services/spec-canonicalizer.service';
import { SpecHasherService } from './services/spec-hasher.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  controllers: [SpecsController],
  providers: [
    SpecsService,
    SpecBuilderService,
    SpecCanonicalizerService,
    SpecHasherService,
  ],
  exports: [SpecsService],
})
export class SpecsModule {}
```

### Service Principal

**Fichier** : `apps/backend/src/modules/specs/specs.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SpecBuilderService } from './services/spec-builder.service';
import { SpecCanonicalizerService } from './services/spec-canonicalizer.service';
import { SpecHasherService } from './services/spec-hasher.service';
import { CreateSpecDto } from './dto/create-spec.dto';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class SpecsService {
  constructor(
    private prisma: PrismaService,
    private specBuilder: SpecBuilderService,
    private canonicalizer: SpecCanonicalizerService,
    private hasher: SpecHasherService,
  ) {}

  /**
   * Créer ou récupérer un DesignSpec (idempotent via specHash)
   */
  @CacheInvalidate({ type: 'spec', tags: () => ['specs:list'] })
  async createOrGet(dto: CreateSpecDto, brandId: string): Promise<any> {
    // 1. Builder le spec depuis zone inputs
    const spec = await this.specBuilder.build(dto.productId, dto.zoneInputs);

    // 2. Canonicalizer (normaliser JSON)
    const canonicalSpec = this.canonicalizer.canonicalize(spec);

    // 3. Hasher (SHA256)
    const specHash = this.hasher.hash(canonicalSpec);

    // 4. Vérifier si existe déjà (idempotency)
    const existing = await this.prisma.designSpec.findUnique({
      where: { specHash },
      include: { product: true },
    });

    if (existing) {
      // Vérifier que le product appartient au brand
      if (existing.product.brandId !== brandId) {
        throw new NotFoundException('Spec not found');
      }
      return existing;
    }

    // 5. Créer nouveau spec
    return this.prisma.designSpec.create({
      data: {
        specVersion: dto.specVersion || '1.0.0',
        specHash,
        spec: canonicalSpec,
        productId: dto.productId,
        zoneInputs: dto.zoneInputs,
        metadata: dto.metadata || {},
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brandId: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer un spec par hash (cacheable)
   */
  @Cacheable({ 
    type: 'spec', 
    ttl: 3600,
    keyGenerator: (args) => `spec:hash:${args[0]}`,
  })
  async findByHash(specHash: string, brandId: string): Promise<any> {
    const spec = await this.prisma.designSpec.findUnique({
      where: { specHash },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brandId: true,
          },
        },
      },
    });

    if (!spec) {
      throw new NotFoundException('Spec not found');
    }

    // Vérifier brand scoping
    if (spec.product.brandId !== brandId) {
      throw new NotFoundException('Spec not found');
    }

    return spec;
  }

  /**
   * Valider un spec JSON contre le schema
   */
  async validate(spec: any): Promise<{ valid: boolean; errors?: string[] }> {
    // Validation JSON Schema (à implémenter)
    return { valid: true };
  }
}
```

### Spec Builder Service

**Fichier** : `apps/backend/src/modules/specs/services/spec-builder.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface ZoneInput {
  zoneId: string;
  text?: string;
  font?: string;
  color?: string;
  size?: number;
  effect?: string;
  orientation?: string;
  [key: string]: any;
}

@Injectable()
export class SpecBuilderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Construire un DesignSpec depuis zone inputs
   */
  async build(productId: string, zoneInputs: Record<string, ZoneInput>): Promise<any> {
    // 1. Récupérer le produit et ses zones
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        zones: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Valider que toutes les zones existent
    const zoneIds = Object.keys(zoneInputs);
    const productZoneIds = product.zones.map(z => z.id);
    const invalidZones = zoneIds.filter(id => !productZoneIds.includes(id));

    if (invalidZones.length > 0) {
      throw new Error(`Invalid zones: ${invalidZones.join(', ')}`);
    }

    // 3. Construire le spec JSON
    const spec = {
      version: '1.0.0',
      productId,
      productName: product.name,
      zones: product.zones.map(zone => ({
        zoneId: zone.id,
        zoneName: zone.name,
        zoneType: zone.type,
        input: zoneInputs[zone.id] || null,
        constraints: {
          maxChars: zone.maxChars,
          allowedFonts: zone.allowedFonts,
          allowedColors: zone.allowedColors,
          allowedPatterns: zone.allowedPatterns,
        },
      })),
      timestamp: new Date().toISOString(),
    };

    return spec;
  }
}
```

### Spec Canonicalizer Service

**Fichier** : `apps/backend/src/modules/specs/services/spec-canonicalizer.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class SpecCanonicalizerService {
  /**
   * Canonicaliser un JSON (ordre des clés, pas de whitespace)
   * Pour avoir un hash stable
   */
  canonicalize(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.canonicalize(item));
    }

    if (typeof obj === 'object') {
      // Trier les clés
      const sortedKeys = Object.keys(obj).sort();
      const canonical: any = {};
      
      for (const key of sortedKeys) {
        canonical[key] = this.canonicalize(obj[key]);
      }
      
      return canonical;
    }

    return obj;
  }

  /**
   * Convertir en JSON string canonique
   */
  toCanonicalString(obj: any): string {
    return JSON.stringify(this.canonicalize(obj));
  }
}
```

### Spec Hasher Service

**Fichier** : `apps/backend/src/modules/specs/services/spec-hasher.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { SpecCanonicalizerService } from './spec-canonicalizer.service';

@Injectable()
export class SpecHasherService {
  constructor(private canonicalizer: SpecCanonicalizerService) {}

  /**
   * Hasher un spec (SHA256)
   */
  hash(spec: any): string {
    const canonical = this.canonicalizer.toCanonicalString(spec);
    return createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Vérifier si un spec correspond à un hash
   */
  verify(spec: any, expectedHash: string): boolean {
    return this.hash(spec) === expectedHash;
  }
}
```

### Controller

**Fichier** : `apps/backend/src/modules/specs/specs.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SpecsService } from './specs.service';
import { CreateSpecDto } from './dto/create-spec.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { BrandScopedGuard } from '@/common/guards/brand-scoped.guard';
import { BrandScoped } from '@/common/decorators/brand-scoped.decorator';
import { IdempotencyKey } from '@/common/decorators/idempotency-key.decorator';
import { IdempotencyGuard } from '@/common/guards/idempotency.guard';

@ApiTags('specs')
@Controller('api/v1/specs')
@UseGuards(JwtAuthGuard, BrandScopedGuard, IdempotencyGuard)
@ApiBearerAuth()
@BrandScoped()
export class SpecsController {
  constructor(private readonly specsService: SpecsService) {}

  @Post()
  @IdempotencyKey()
  @ApiOperation({ summary: 'Créer ou récupérer un DesignSpec (idempotent)' })
  @ApiResponse({ status: 201, description: 'Spec créé ou récupéré' })
  async createOrGet(
    @Body() dto: CreateSpecDto,
    @Request() req: any,
  ) {
    return this.specsService.createOrGet(dto, req.brandId);
  }

  @Get(':specHash')
  @ApiOperation({ summary: 'Récupérer un spec par hash' })
  @ApiResponse({ status: 200, description: 'Spec trouvé' })
  async findByHash(
    @Param('specHash') specHash: string,
    @Request() req: any,
  ) {
    return this.specsService.findByHash(specHash, req.brandId);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Valider un spec JSON' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validate(@Body() body: { spec: any }) {
    return this.specsService.validate(body.spec);
  }
}
```

### DTO

**Fichier** : `apps/backend/src/modules/specs/dto/create-spec.dto.ts`

```typescript
import { IsString, IsObject, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSpecDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Zone inputs (zoneId -> input)' })
  @IsObject()
  @IsNotEmpty()
  zoneInputs: Record<string, any>;

  @ApiProperty({ description: 'Spec version', required: false, default: '1.0.0' })
  @IsString()
  @IsOptional()
  specVersion?: string;

  @ApiProperty({ description: 'Metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
```

---

## 3. MODULE SNAPSHOTS - EXEMPLE

### Service

**Fichier** : `apps/backend/src/modules/snapshots/snapshots.service.ts`

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class SnapshotsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un snapshot (idempotent via specHash)
   */
  @CacheInvalidate({ type: 'snapshot', tags: () => ['snapshots:list'] })
  async create(dto: CreateSnapshotDto, brandId: string, userId?: string): Promise<any> {
    // 1. Vérifier que le spec existe et appartient au brand
    const spec = await this.prisma.designSpec.findUnique({
      where: { specHash: dto.specHash },
      include: {
        product: {
          select: {
            id: true,
            brandId: true,
          },
        },
      },
    });

    if (!spec || spec.product.brandId !== brandId) {
      throw new NotFoundException('Spec not found');
    }

    // 2. Vérifier si snapshot existe déjà (idempotency)
    const existing = await this.prisma.snapshot.findFirst({
      where: {
        specHash: dto.specHash,
        isValidated: dto.isValidated || false,
      },
      include: {
        spec: {
          include: {
            product: true,
          },
        },
      },
    });

    if (existing) {
      return existing;
    }

    // 3. Créer nouveau snapshot
    return this.prisma.snapshot.create({
      data: {
        specId: spec.id,
        specHash: dto.specHash,
        spec: spec.spec, // Dupliquer pour immutabilité
        previewUrl: dto.previewUrl,
        preview3dUrl: dto.preview3dUrl,
        thumbnailUrl: dto.thumbnailUrl,
        productionBundleUrl: dto.productionBundleUrl,
        arModelUrl: dto.arModelUrl,
        gltfModelUrl: dto.gltfModelUrl,
        assetVersions: dto.assetVersions,
        isValidated: dto.isValidated || false,
        validatedBy: dto.isValidated ? userId : null,
        validatedAt: dto.isValidated ? new Date() : null,
        isLocked: dto.isLocked || false,
        lockedAt: dto.isLocked ? new Date() : null,
        createdBy: userId || dto.createdBy || 'api',
        provenance: dto.provenance || {},
      },
      include: {
        spec: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer un snapshot (cacheable)
   */
  @Cacheable({ 
    type: 'snapshot', 
    ttl: 3600,
    keyGenerator: (args) => `snapshot:${args[0]}`,
  })
  async findOne(id: string, brandId: string): Promise<any> {
    const snapshot = await this.prisma.snapshot.findUnique({
      where: { id },
      include: {
        spec: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                brandId: true,
              },
            },
          },
        },
      },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    // Vérifier brand scoping
    if (snapshot.spec.product.brandId !== brandId) {
      throw new NotFoundException('Snapshot not found');
    }

    return snapshot;
  }

  /**
   * Verrouiller un snapshot
   */
  @CacheInvalidate({ type: 'snapshot', pattern: (args) => `snapshot:${args[0]}` })
  async lock(id: string, brandId: string, userId: string): Promise<any> {
    const snapshot = await this.findOne(id, brandId);

    if (snapshot.isLocked) {
      throw new ForbiddenException('Snapshot already locked');
    }

    return this.prisma.snapshot.update({
      where: { id },
      data: {
        isLocked: true,
        lockedAt: new Date(),
      },
    });
  }
}
```

---

## 4. WORKER BULLMQ - EXEMPLE

### Render Preview Processor

**Fichier** : `apps/backend/src/jobs/workers/render/render-preview.processor.ts`

```typescript
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import * as Sentry from '@sentry/node';

interface RenderPreviewJob {
  snapshotId: string;
  specHash: string;
  type: '2d' | '3d';
  options?: Record<string, any>;
}

@Processor('render-preview', {
  concurrency: 5, // 5 jobs en parallèle
})
export class RenderPreviewProcessor extends WorkerHost {
  private readonly logger = new Logger(RenderPreviewProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<RenderPreviewJob>): Promise<any> {
    const { snapshotId, specHash, type, options } = job.data;
    const startTime = Date.now();

    try {
      // 1. Récupérer le snapshot
      const snapshot = await this.prisma.snapshot.findUnique({
        where: { id: snapshotId },
        include: {
          spec: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      // 2. Vérifier idempotency (si render existe déjà)
      const existingRender = await this.prisma.renderResult.findFirst({
        where: {
          snapshotId,
          type: type === '2d' ? '2d' : '3d',
          status: 'success',
        },
      });

      if (existingRender && existingRender.url) {
        this.logger.log(`Render already exists for snapshot ${snapshotId}, returning cached`);
        return {
          renderId: existingRender.renderId,
          url: existingRender.url,
          thumbnailUrl: existingRender.thumbnailUrl,
          cached: true,
        };
      }

      // 3. Créer RenderResult (pending)
      const renderResult = await this.prisma.renderResult.create({
        data: {
          renderId: `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: type === '2d' ? '2d' : '3d',
          status: 'processing',
          snapshotId,
          metadata: {
            specHash,
            options,
            jobId: job.id,
          },
        },
      });

      // 4. Appeler le service de rendu (à implémenter selon votre stack)
      const renderService = type === '2d' 
        ? await this.render2D(snapshot, options)
        : await this.render3D(snapshot, options);

      // 5. Upload vers Cloudinary/S3
      const previewUrl = await this.storage.upload(renderService.imageBuffer, {
        folder: `renders/preview/${snapshotId}`,
        format: 'webp',
        quality: 80,
      });

      const thumbnailUrl = await this.storage.upload(renderService.thumbnailBuffer, {
        folder: `renders/thumbnails/${snapshotId}`,
        format: 'webp',
        width: 200,
        height: 200,
        quality: 70,
      });

      // 6. Mettre à jour RenderResult
      await this.prisma.renderResult.update({
        where: { id: renderResult.id },
        data: {
          status: 'success',
          url: previewUrl,
          thumbnailUrl,
          metadata: {
            ...renderResult.metadata,
            duration: Date.now() - startTime,
            size: renderService.imageBuffer.length,
          },
        },
      });

      // 7. Mettre à jour Snapshot avec previewUrl
      await this.prisma.snapshot.update({
        where: { id: snapshotId },
        data: {
          previewUrl: type === '2d' ? previewUrl : undefined,
          preview3dUrl: type === '3d' ? previewUrl : undefined,
          thumbnailUrl,
        },
      });

      const duration = Date.now() - startTime;
      this.logger.log(`Render preview completed for snapshot ${snapshotId} in ${duration}ms`);

      return {
        renderId: renderResult.renderId,
        url: previewUrl,
        thumbnailUrl,
        duration,
      };
    } catch (error) {
      this.logger.error(`Render preview failed for snapshot ${snapshotId}`, error);
      
      // Sentry
      Sentry.captureException(error, {
        tags: {
          jobId: job.id,
          snapshotId,
          specHash,
          type,
        },
        extra: {
          jobData: job.data,
        },
      });

      // Mettre à jour RenderResult en failed
      await this.prisma.renderResult.updateMany({
        where: { snapshotId },
        data: {
          status: 'failed',
          metadata: {
            error: error.message,
            failedAt: new Date().toISOString(),
          },
        },
      });

      throw error; // BullMQ va retry
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed`, error);
  }

  private async render2D(snapshot: any, options?: any): Promise<{ imageBuffer: Buffer; thumbnailBuffer: Buffer }> {
    // Implémentation rendu 2D (Canvas, Sharp, etc.)
    // Pour l'exemple, retourner des buffers vides
    return {
      imageBuffer: Buffer.from(''),
      thumbnailBuffer: Buffer.from(''),
    };
  }

  private async render3D(snapshot: any, options?: any): Promise<{ imageBuffer: Buffer; thumbnailBuffer: Buffer }> {
    // Implémentation rendu 3D (Three.js, Blender, etc.)
    return {
      imageBuffer: Buffer.from(''),
      thumbnailBuffer: Buffer.from(''),
    };
  }
}
```

---

## 5. SHOPIFY WEBHOOK HANDLER

**Fichier** : `apps/backend/src/modules/ecommerce/services/shopify-webhook-handler.service.ts`

```typescript
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { createHmac } from 'crypto';
import { SnapshotsService } from '@/modules/snapshots/snapshots.service';
import { OrdersService } from '@/modules/orders/orders.service';

@Injectable()
export class ShopifyWebhookHandlerService {
  private readonly logger = new Logger(ShopifyWebhookHandlerService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private snapshotsService: SnapshotsService,
    private ordersService: OrdersService,
  ) {}

  /**
   * Vérifier la signature Shopify (HMAC SHA256)
   */
  verifySignature(payload: string, signature: string, shopSecret: string): boolean {
    const hmac = createHmac('sha256', shopSecret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('base64');
    return calculatedSignature === signature;
  }

  /**
   * Handler pour webhook order.paid
   */
  async handleOrderPaid(payload: any, shopDomain: string): Promise<void> {
    this.logger.log(`Processing order.paid webhook for shop ${shopDomain}`);

    // 1. Récupérer l'intégration Shopify
    const integration = await this.prisma.ecommerceIntegration.findFirst({
      where: {
        shopDomain,
        platform: 'shopify',
        status: 'active',
      },
      include: {
        brand: true,
      },
    });

    if (!integration) {
      throw new BadRequestException(`Integration not found for shop ${shopDomain}`);
    }

    // 2. Extraire les line item properties (customization data)
    const order = payload;
    const lineItems = order.line_items || [];

    for (const lineItem of lineItems) {
      // Chercher les properties avec le préfixe 'luneo_'
      const luneoProperties = lineItem.properties?.filter((p: any) => 
        p.name?.startsWith('luneo_')
      ) || [];

      if (luneoProperties.length === 0) {
        continue; // Pas de personnalisation
      }

      // Extraire specHash et snapshotId
      const specHashProperty = luneoProperties.find((p: any) => p.name === 'luneo_spec_hash');
      const snapshotIdProperty = luneoProperties.find((p: any) => p.name === 'luneo_snapshot_id');

      if (!specHashProperty || !snapshotIdProperty) {
        this.logger.warn(`Missing luneo properties in line item ${lineItem.id}`);
        continue;
      }

      const specHash = specHashProperty.value;
      const snapshotId = snapshotIdProperty.value;

      // 3. Récupérer le ProductMapping
      const productMapping = await this.prisma.productMapping.findFirst({
        where: {
          integrationId: integration.id,
          externalProductId: lineItem.product_id.toString(),
        },
        include: {
          product: true,
        },
      });

      if (!productMapping) {
        this.logger.warn(`Product mapping not found for external product ${lineItem.product_id}`);
        continue;
      }

      // 4. Créer Order dans notre système
      // (Utiliser OrdersService avec OrderItem)
      // ...
    }
  }
}
```

---

**FIN DES EXEMPLES**






