import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PublicApiAuthContext } from '../types/public-api-auth.type';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      ip?: string;
      socket?: { remoteAddress?: string };
      method: string;
      path: string;
      publicApiAuth?: PublicApiAuthContext;
      apiKey?: { id: string };
    }>();
    const apiKey = request.headers['x-api-key'];
    if (!apiKey) throw new UnauthorizedException('Missing API key');

    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const key = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      select: {
        id: true,
        organizationId: true,
        isActive: true,
        expiresAt: true,
        scopes: true,
        permissions: true,
        rateLimit: true,
        keyPrefix: true,
        allowedIps: true,
      },
    });

    if (!key || !key.isActive) {
      throw new UnauthorizedException('Invalid API key');
    }
    if (key.expiresAt && key.expiresAt < new Date()) {
      throw new ForbiddenException('API key expired');
    }

    const ip = this.getClientIp(request);
    if (key.allowedIps.length > 0 && !key.allowedIps.includes(ip)) {
      throw new ForbiddenException('IP not allowed for this API key');
    }

    await this.prisma.apiKey.update({
      where: { id: key.id },
      data: {
        lastUsedAt: new Date(),
        lastUsedIp: ip,
        usageCount: { increment: 1 },
      },
    });

    request.publicApiAuth = {
      keyId: key.id,
      keyPrefix: key.keyPrefix,
      organizationId: key.organizationId,
      scopes: key.scopes,
      permissions: key.permissions,
      rateLimit: key.rateLimit,
      sandbox: key.keyPrefix.startsWith('lun_sbx_'),
    };
    request.apiKey = { id: key.id };

    await this.createAuditLog({
      organizationId: key.organizationId,
      action: 'public_api.authenticated',
      resource: 'api_key',
      resourceId: key.id,
      metadata: {
        method: request.method,
        path: request.path,
        scopes: key.scopes,
      },
      ipAddress: ip,
      userAgent: request.headers['user-agent'],
      success: true,
    });
    return true;
  }

  private getClientIp(request: {
    headers: Record<string, string | undefined>;
    ip?: string;
    socket?: { remoteAddress?: string };
  }): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.ip ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private async createAuditLog(input: {
    organizationId: string;
    action: string;
    resource: string;
    resourceId: string;
    metadata: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    error?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId: input.organizationId,
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
          metadata: input.metadata as Prisma.InputJsonValue,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          success: input.success,
          error: input.error,
        },
      });
    } catch {
      // Audit failure must never block API traffic.
    }
  }
}
