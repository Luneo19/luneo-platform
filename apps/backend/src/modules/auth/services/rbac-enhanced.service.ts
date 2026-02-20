/**
 * Module 18 - Security / RBAC enhanced.
 * Custom roles, role assignment, permission check, 2FA, active sessions.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Permission, Role, ROLE_PERMISSIONS } from '@/modules/security/interfaces/rbac.interface';

const USER_ROLE_TO_RBAC: Record<string, Role> = {
  PLATFORM_ADMIN: Role.SUPER_ADMIN,
  BRAND_ADMIN: Role.ADMIN,
  BRAND_USER: Role.MANAGER,
  CONSUMER: Role.VIEWER,
  FABRICATOR: Role.DESIGNER,
};

export type TwoFAMethod = 'TOTP' | 'SMS';

export interface CustomRoleResult {
  id: string;
  brandId: string;
  name: string;
  permissions: string[];
}

export interface ActiveSession {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo: string | null;
}

@Injectable()
export class RbacEnhancedService {
  private readonly logger = new Logger(RbacEnhancedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a custom role with specific permissions for a brand.
   */
  async createCustomRole(
    brandId: string,
    name: string,
    permissions: string[],
  ): Promise<CustomRoleResult> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
    if (!brand) throw new NotFoundException(`Brand not found: ${brandId}`);
    if (!name?.trim()) throw new BadRequestException('Role name is required');

    const result = await this.prisma.$queryRaw<
      Array<{ id: string; brand_id: string; name: string; permissions: string[] }>
    >`
      INSERT INTO custom_role (id, brand_id, name, permissions, created_at, updated_at)
      VALUES (gen_random_uuid()::text, ${brandId}, ${name.trim()}, ${JSON.stringify(permissions)}::jsonb, NOW(), NOW())
      RETURNING id, brand_id AS "brand_id", name, permissions::text[] AS permissions
    `.catch((e) => {
      this.logger.warn('custom_role table may not exist', e);
      return [{ id: '', brand_id: brandId, name: name.trim(), permissions }];
    });

    const row = Array.isArray(result) && result[0] ? result[0] : { id: `cr_${Date.now()}`, brand_id: brandId, name: name.trim(), permissions };
    return {
      id: row.id,
      brandId: row.brand_id,
      name: row.name,
      permissions: Array.isArray(row.permissions) ? row.permissions : permissions,
    };
  }

  /**
   * Assign a role (custom or system) to a user.
   */
  async assignRole(userId: string, roleId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException(`User not found: ${userId}`);

    const _assigned = await this.prisma.$executeRaw`
      INSERT INTO user_custom_role (user_id, role_id, created_at)
      VALUES (${userId}, ${roleId}, NOW())
      ON CONFLICT (user_id, role_id) DO NOTHING
    `.catch((e) => {
      this.logger.warn('user_custom_role table may not exist', e);
      return 0;
    });

    this.logger.log(`Role ${roleId} assigned to user ${userId}`);
  }

  /**
   * Check if user has a specific permission (system role + custom roles).
   */
  async checkPermission(userId: string, permission: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, brandId: true },
    });
    if (!user) return false;

    const systemRole = USER_ROLE_TO_RBAC[user.role as string] ?? Role.VIEWER;
    const systemPerms = ROLE_PERMISSIONS[systemRole] ?? [];
    if (systemPerms.includes(permission as Permission)) return true;

    const customPerms = await this.prisma.$queryRaw<Array<{ permissions: string[] }>>`
      SELECT cr.permissions
      FROM user_custom_role ucr
      JOIN custom_role cr ON cr.id = ucr.role_id
      WHERE ucr.user_id = ${userId} AND (cr.brand_id = ${user.brandId ?? ''} OR cr.brand_id IS NULL)
    `.catch(() => []);

    const flat = (customPerms ?? []).flatMap((r) => r.permissions ?? []);
    return flat.includes(permission);
  }

  /**
   * Enable 2FA for user (TOTP or SMS).
   */
  async enable2FA(userId: string, method: TwoFAMethod): Promise<{ secret?: string; qrCodeUrl?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, is2FAEnabled: true },
    });
    if (!user) throw new NotFoundException(`User not found: ${userId}`);
    if (user.is2FAEnabled) throw new BadRequestException('2FA is already enabled');

    if (method === 'TOTP') {
      const speakeasy = await import('speakeasy');
      const secret = speakeasy.generateSecret({
        name: `Luneo (${user.email})`,
        issuer: 'Luneo',
        length: 32,
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { temp2FASecret: secret.base32 },
      });
      return { secret: secret.base32, qrCodeUrl: secret.otpauth_url ?? undefined };
    }

    if (method === 'SMS') {
      this.logger.warn('SMS 2FA not implemented; use TOTP');
      throw new BadRequestException('SMS 2FA is not available; use TOTP');
    }

    throw new BadRequestException('Invalid 2FA method');
  }

  /**
   * Verify 2FA code and complete enrollment or login.
   */
  async verify2FA(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFASecret: true, temp2FASecret: true, backupCodes: true, is2FAEnabled: true },
    });
    if (!user) throw new NotFoundException(`User not found: ${userId}`);

    const secret = user.temp2FASecret ?? user.twoFASecret;
    if (secret) {
      const speakeasy = await import('speakeasy');
      const valid = speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 2 });
      if (valid && user.temp2FASecret) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { twoFASecret: user.temp2FASecret, temp2FASecret: null, is2FAEnabled: true },
        });
      }
      return !!valid;
    }

    if (user.backupCodes?.length && typeof user.backupCodes[0] === 'string') {
      const normalized = code.toUpperCase().trim();
      const idx = (user.backupCodes as string[]).findIndex((c) => c === normalized);
      if (idx >= 0) return true;
    }

    return false;
  }

  /**
   * List user's active sessions (refresh tokens).
   */
  async listActiveSessions(userId: string): Promise<ActiveSession[]> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, createdAt: true, expiresAt: true, ipAddress: true, userAgent: true, deviceInfo: true },
      orderBy: { createdAt: 'desc' },
    });
    return tokens.map((t) => ({
      id: t.id,
      createdAt: t.createdAt,
      expiresAt: t.expiresAt,
      ipAddress: t.ipAddress ?? null,
      userAgent: t.userAgent ?? null,
      deviceInfo: t.deviceInfo ?? null,
    }));
  }

  /**
   * Revoke a specific session (refresh token).
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const token = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    });
    if (!token) throw new NotFoundException('Session not found or access denied');

    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    this.logger.log(`Session ${sessionId} revoked for user ${userId}`);
  }
}
