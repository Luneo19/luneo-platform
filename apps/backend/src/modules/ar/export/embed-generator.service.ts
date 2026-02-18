/**
 * AR Export - Embed Generator Service
 * Generate embed code and config for third-party sites
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';

export type EmbedOptions = {
  width?: string | number;
  height?: string | number;
  allowFullscreen?: boolean;
  showControls?: boolean;
};

export type EmbedConfig = {
  projectId: string;
  embedUrl: string;
  width: number;
  height: number;
  allowFullscreen: boolean;
  showControls: boolean;
};

@Injectable()
export class EmbedGeneratorService {
  private readonly logger = new Logger(EmbedGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Generate iframe HTML for embedding AR viewer on third-party sites
   */
  async generateEmbedCode(projectId: string, options: EmbedOptions = {}): Promise<string> {
    const project = await this.prisma.aRProject.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const baseUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://app.luneo.com';
    const embedUrl = `${baseUrl.replace(/\/$/, '')}/ar/embed/${projectId}`;
    const width = options.width ?? 640;
    const height = options.height ?? 480;
    const allowFullscreen = options.allowFullscreen ?? true;
    const showControls = options.showControls ?? true;

    const w = typeof width === 'number' ? width : width;
    const h = typeof height === 'number' ? height : height;
    const allow = allowFullscreen ? ' allow="fullscreen; xr-spatial-tracking"' : '';
    return `<iframe src="${embedUrl}" width="${w}" height="${h}" frameborder="0" allowfullscreen${allow} title="AR - ${project.name}"></iframe>`;
  }

  /**
   * Get embed settings for a project
   */
  async getEmbedConfig(projectId: string): Promise<EmbedConfig> {
    const project = await this.prisma.aRProject.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const baseUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://app.luneo.com';
    const embedUrl = `${baseUrl.replace(/\/$/, '')}/ar/embed/${projectId}`;

    return {
      projectId,
      embedUrl,
      width: 640,
      height: 480,
      allowFullscreen: true,
      showControls: true,
    };
  }
}
