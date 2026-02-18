/**
 * AR Export - Social Share Service
 * Shareable links with OG preview for AR sessions
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import * as crypto from 'node:crypto';

export type ShareLinkOptions = {
  title?: string;
  expiresInHours?: number;
};

export type SharePreview = {
  title: string;
  description: string;
  imageUrl: string | null;
  projectName: string;
  sessionId: string;
}

@Injectable()
export class SocialShareService {
  private readonly logger = new Logger(SocialShareService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private getSecret(): string {
    return this.config.get<string>('AR_SHARE_SECRET') ?? this.config.get<string>('JWT_SECRET') ?? 'ar-share-default';
  }

  /**
   * Create a shareable link for an AR session (token-based, no DB table)
   */
  async createShareLink(sessionId: string, options: ShareLinkOptions = {}): Promise<string> {
    const session = await this.prisma.aRSession.findUnique({
      where: { id: sessionId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!session) {
      throw new NotFoundException(`AR session ${sessionId} not found`);
    }

    const expiresInHours = options.expiresInHours ?? 168; // 7 days
    const payload = {
      sessionId,
      projectId: session.projectId,
      title: options.title ?? session.project?.name ?? 'AR Experience',
      exp: Math.floor(Date.now() / 1000) + expiresInHours * 3600,
    };
    const secret = this.getSecret();
    const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    const token = `${data}.${sig}`;

    const baseUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://app.luneo.com';
    return `${baseUrl}/ar/share/${token}`;
  }

  /**
   * Get OG meta for social preview from share token
   */
  async getSharePreview(shareToken: string): Promise<SharePreview> {
    const parts = shareToken.split('.');
    if (parts.length !== 2) {
      throw new NotFoundException('Invalid share token');
    }
    const [dataB64, sig] = parts;
    const secret = this.getSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(dataB64).digest('base64url');
    if (sig !== expectedSig) {
      throw new NotFoundException('Invalid share token');
    }

    let payload: { sessionId: string; projectId: string; title?: string; exp: number };
    try {
      payload = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf8'));
    } catch {
      throw new NotFoundException('Invalid share token');
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new NotFoundException('Share link expired');
    }

    const session = await this.prisma.aRSession.findUnique({
      where: { id: payload.sessionId },
      include: {
        project: { select: { id: true, name: true } },
        model: { select: { thumbnailURL: true, name: true } },
      },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      title: payload.title ?? session.project?.name ?? 'AR Experience',
      description: `View "${session.project?.name ?? 'AR'}" in Augmented Reality`,
      imageUrl: session.model?.thumbnailURL ?? null,
      projectName: session.project?.name ?? 'AR',
      sessionId: payload.sessionId,
    };
  }
}
