/**
 * AR Enhanced Service
 * Enhances AR Studio with model conversion, QR generation, embed code, and public viewer config.
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { QRCodeType } from '@prisma/client';
import { ModelViewerConfigService } from '../platforms/web/model-viewer-config.service';
import { QrCustomizerService } from '../qr-codes/qr-customizer.service';
import { randomBytes } from 'crypto';

const SUPPORTED_FORMATS = ['gltf', 'glb', 'usdz', 'obj', 'fbx'] as const;
const MODEL_VIEWER_CDN = 'https://unpkg.com/@google/model-viewer@2.2.2/dist/model-viewer.min.js';
const ESTIMATED_DURATION_MS = 45000;

export interface ConvertModelOptions {
  optimizePolygons?: boolean;
  targetPolyCount?: number;
  compressTextures?: boolean;
}

export interface ConvertModelResult {
  jobId: string;
  estimatedDuration: number;
}

export interface GenerateQRCodeOptions {
  name?: string;
  color?: string;
  backgroundColor?: string;
  logo?: string;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface GenerateQRCodeResult {
  qrUrl: string;
  viewerUrl: string;
  trackingId: string;
}

export interface GetEmbedCodeOptions {
  width?: number | string;
  height?: number | string;
  autoRotate?: boolean;
  backgroundColor?: string;
  cameraOrbit?: string;
}

export interface GetEmbedCodeResult {
  html: string;
  scriptUrl: string;
}

export interface PublicViewerConfig {
  modelUrl: string;
  poster?: string;
  alt: string;
  cameraControls: boolean;
  autoRotate: boolean;
  environmentImage?: string;
}

@Injectable()
export class ArEnhancedService {
  private readonly logger = new Logger(ArEnhancedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
    private readonly modelViewerConfig: ModelViewerConfigService,
    private readonly qrCustomizer: QrCustomizerService,
    @InjectQueue('ar-processing') private readonly arProcessingQueue: Queue,
  ) {}

  /**
   * Converts a 3D model between formats (glTF, USDZ, OBJ, FBX).
   * Queues the conversion job and returns job id and estimated duration.
   */
  async convertModel(
    sourceUrl: string,
    targetFormat: string,
    options: ConvertModelOptions = {},
  ): Promise<ConvertModelResult> {
    const format = targetFormat.toLowerCase();
    if (!SUPPORTED_FORMATS.includes(format as (typeof SUPPORTED_FORMATS)[number])) {
      throw new BadRequestException(
        `Unsupported target format: ${targetFormat}. Supported: ${SUPPORTED_FORMATS.join(', ')}`,
      );
    }

    const job = await this.arProcessingQueue.add(
      'convert-model',
      {
        sourceUrl,
        targetFormat: format,
        optimizePolygons: options.optimizePolygons ?? false,
        targetPolyCount: options.targetPolyCount,
        compressTextures: options.compressTextures ?? true,
      },
      { removeOnComplete: { count: 1000 } },
    );

    const jobId = typeof job.id === 'string' ? job.id : String(job.id);
    this.logger.log(`Queued conversion job ${jobId}: ${sourceUrl} -> ${format}`);

    return {
      jobId,
      estimatedDuration: ESTIMATED_DURATION_MS,
    };
  }

  /**
   * Generates a custom QR code that embeds the AR viewer URL for the given model.
   * Returns QR image URL, viewer URL, and tracking id (shortCode).
   */
  async generateQRCode(arModelId: string, options: GenerateQRCodeOptions = {}): Promise<GenerateQRCodeResult> {
    const model = await this.prisma.aR3DModel.findUnique({
      where: { id: arModelId },
      select: { id: true, name: true, projectId: true },
    });

    if (!model) {
      throw new NotFoundException(`AR model ${arModelId} not found`);
    }

    const baseUrl = (this.config.get<string>('app.url') ?? this.config.get<string>('FRONTEND_URL') ?? 'https://app.luneo.com').replace(/\/$/, '');
    const viewerPath = `/ar/viewer/${model.id}`;
    const targetUrl = `${baseUrl}${viewerPath}`;

    const shortCode = this.generateShortCode();
    const qr = await this.prisma.aRQRCode.create({
      data: {
        projectId: model.projectId,
        type: QRCodeType.AR_VIEWER,
        targetURL: targetUrl,
        shortCode,
        name: options.name ?? `AR - ${model.name}`,
        foregroundColor: options.color ?? '#000000',
        backgroundColor: options.backgroundColor ?? '#FFFFFF',
        logoURL: options.logo ?? undefined,
        size: options.size ?? 300,
        errorCorrection: options.errorCorrectionLevel ?? 'M',
        tags: [],
      },
    });

    const viewerUrl = `${baseUrl}/ar/view/${shortCode}`;
    let qrUrl = viewerUrl;

    try {
      const qrBuffer = await this.qrCustomizer.generateStyledQR(
        viewerUrl,
        {
          size: qr.size,
          foregroundColor: qr.foregroundColor,
          backgroundColor: qr.backgroundColor,
          errorCorrectionLevel: (qr.errorCorrection as 'L' | 'M' | 'Q' | 'H') ?? 'M',
        },
        'png',
      );
      if (qrBuffer.length > 0) {
        const key = `ar/qr/${qr.id}.png`;
        const uploadUrl = await this.storage.uploadBuffer(qrBuffer, key, { contentType: 'image/png' });
        await this.prisma.aRQRCode.update({
          where: { id: qr.id },
          data: { pngURL: uploadUrl },
        });
        qrUrl = uploadUrl;
      }
    } catch (err) {
      this.logger.warn(`QR image upload skipped: ${err instanceof Error ? err.message : String(err)}`);
    }

    this.logger.log(`Generated QR for model ${arModelId}, shortCode=${shortCode}`);

    return {
      qrUrl,
      viewerUrl,
      trackingId: shortCode,
    };
  }

  /**
   * Generates embed code (HTML snippet with model-viewer web component) for the given model.
   */
  async getEmbedCode(modelId: string, options: GetEmbedCodeOptions = {}): Promise<GetEmbedCodeResult> {
    const model = await this.prisma.aR3DModel.findUnique({
      where: { id: modelId },
      select: { id: true, name: true, gltfURL: true, gltfDracoURL: true, thumbnailURL: true },
    });

    if (!model) {
      throw new NotFoundException(`AR model ${modelId} not found`);
    }

    const modelUrl = model.gltfDracoURL ?? model.gltfURL ?? '';
    if (!modelUrl) {
      throw new BadRequestException('Model has no glTF/GLB URL available for embedding');
    }

    const config = this.modelViewerConfig.getConfig({
      modelUrl,
      posterUrl: model.thumbnailURL ?? undefined,
      alt: model.name,
      cameraControls: true,
      autoRotate: options.autoRotate ?? false,
    });

    const width = options.width ?? 640;
    const height = options.height ?? 480;
    const w = typeof width === 'number' ? width : width;
    const h = typeof height === 'number' ? height : height;
    const autoRotate = options.autoRotate ?? false;
    const bg = options.backgroundColor ?? 'transparent';
    const orbit = options.cameraOrbit ?? 'auto';

    const attrs = [
      `src="${this.escapeHtml(modelUrl)}"`,
      `alt="${this.escapeHtml(model.name)}"`,
      `camera-controls`,
      `width="${w}"`,
      `height="${h}"`,
      `style="background-color: ${this.escapeHtml(bg)}"`,
      `camera-orbit="${this.escapeHtml(orbit)}"`,
    ];
    if (config.poster) attrs.push(`poster="${this.escapeHtml(config.poster)}"`);
    if (autoRotate) attrs.push('auto-rotate');
    if (config.ar) attrs.push('ar');
    if (config.arMode) attrs.push(`ar-mode="${config.arMode}"`);

    const html = `<script type="module" src="${MODEL_VIEWER_CDN}"></script>
<model-viewer ${attrs.join(' ')}></model-viewer>`;

    return {
      html,
      scriptUrl: MODEL_VIEWER_CDN,
    };
  }

  /**
   * Returns public viewer config for token-based access (no auth).
   * Token is the shortCode of an ARQRCode that points to a viewer.
   */
  async getPublicViewerConfig(token: string): Promise<PublicViewerConfig> {
    const qr = await this.prisma.aRQRCode.findFirst({
      where: { shortCode: token, isActive: true },
      include: { project: { select: { id: true } } },
    });

    if (!qr) {
      throw new NotFoundException('Invalid or expired viewer token');
    }

    let modelId: string | null = null;
    const viewerMatch = qr.targetURL.match(/\/ar\/viewer\/([a-zA-Z0-9_-]+)/);
    if (viewerMatch) {
      modelId = viewerMatch[1];
    }
    if (!modelId) {
      const first = await this.prisma.aR3DModel.findFirst({
        where: { projectId: qr.projectId },
        select: { id: true },
      });
      modelId = first?.id ?? null;
    }
    if (!modelId) {
      throw new NotFoundException('No model linked to this viewer');
    }

    const model = await this.prisma.aR3DModel.findUnique({
      where: { id: modelId },
      select: { name: true, gltfURL: true, gltfDracoURL: true, thumbnailURL: true },
    });

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    const modelUrl = model.gltfDracoURL ?? model.gltfURL ?? '';
    const config = this.modelViewerConfig.getConfig({
      modelUrl,
      posterUrl: model.thumbnailURL ?? undefined,
      alt: model.name,
      cameraControls: true,
      autoRotate: false,
    });

    return {
      modelUrl,
      poster: config.poster,
      alt: config.alt,
      cameraControls: config.cameraControls ?? true,
      autoRotate: config.autoRotate ?? false,
      environmentImage: config.environmentImage,
    };
  }

  private generateShortCode(): string {
    return randomBytes(4).toString('base64url').replace(/[-_]/g, 'x').slice(0, 8);
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
