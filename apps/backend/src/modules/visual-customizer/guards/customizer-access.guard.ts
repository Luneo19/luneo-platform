import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { VisualCustomizer } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '@/libs/prisma/prisma.service';
import * as crypto from 'crypto';

export const CUSTOMIZER_KEY = 'customizer';

export type RequestWithCustomizerAccess = Request & {
  [CUSTOMIZER_KEY]?: VisualCustomizer;
};

@Injectable()
export class CustomizerAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCustomizerAccess>();
    const customizerId = this.extractCustomizerId(request);

    if (!customizerId) {
      throw new ForbiddenException('Customizer ID is required');
    }

    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: customizerId },
      select: {
        id: true,
        status: true,
        isPublic: true,
        isPasswordProtected: true,
        password: true,
        allowedDomains: true,
        expiresAt: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!customizer) {
      throw new NotFoundException('Customizer not found');
    }

    if (customizer.deletedAt) {
      throw new NotFoundException('Customizer not found');
    }

    // Check if customizer is active
    if (!customizer.isActive) {
      throw new ForbiddenException('Customizer is not active');
    }

    // Check if status is PUBLISHED
    if (customizer.status !== 'PUBLISHED') {
      throw new ForbiddenException('Customizer is not published');
    }

    // Check if customizer is public
    if (!customizer.isPublic) {
      throw new ForbiddenException('Customizer is not publicly accessible');
    }

    // Check domain restrictions
    if (
      customizer.allowedDomains &&
      Array.isArray(customizer.allowedDomains) &&
      customizer.allowedDomains.length > 0
    ) {
      const origin = request.headers.origin || request.headers.referer;
      if (!origin) {
        throw new ForbiddenException('Origin header is required for domain-restricted customizers');
      }

      const originUrl = new URL(origin);
      const originHost = originUrl.hostname;

      const isAllowed = customizer.allowedDomains.some((domain) => {
        // Exact match
        if (originHost === domain) {
          return true;
        }
        // Subdomain match (e.g., app.example.com matches example.com)
        if (originHost.endsWith(`.${domain}`)) {
          return true;
        }
        return false;
      });

      if (!isAllowed) {
        throw new ForbiddenException('Access denied: origin domain not allowed');
      }
    }

    // Check expiration
    if (customizer.expiresAt && customizer.expiresAt < new Date()) {
      throw new ForbiddenException('Customizer has expired');
    }

    // Check password protection
    if (customizer.isPasswordProtected && customizer.password) {
      const providedPassword = request.headers['x-customizer-password'] as string;
      if (!providedPassword) {
        throw new UnauthorizedException('Password required for this customizer');
      }

      // Compare password (assuming it's hashed in DB, or plain text for simple cases)
      // For production, use bcrypt.compare. For now, simple comparison
      const isValidPassword = this.verifyPassword(providedPassword, customizer.password);
      if (!isValidPassword) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    request[CUSTOMIZER_KEY] = customizer as VisualCustomizer;
    return true;
  }

  private extractCustomizerId(request: Request): string | undefined {
    return (
      request.params?.customizerId ||
      request.params?.id ||
      request.body?.customizerId ||
      request.body?.id
    );
  }

  private verifyPassword(provided: string, stored: string): boolean {
    // Simple comparison for now. In production, use bcrypt.compare if password is hashed
    // This assumes password is stored as plain text or hashed
    // For hashed passwords, use: return bcrypt.compareSync(provided, stored);
    return provided === stored;
  }
}
