/**
 * Module 16 - Collaboration (Liveblocks-style).
 * Presence, pin-style comments, share links with view/edit/comment permissions.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ResourceType } from '@prisma/client';
import { randomBytes } from 'crypto';

export interface PresenceUser {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  cursorX: number;
  cursorY: number;
  lastSeenAt: Date;
}

export type SharePermission = 'view' | 'edit' | 'comment';

export interface ShareLinkResult {
  url: string;
  token: string;
  permissions: SharePermission[];
  expiresAt?: Date;
}

@Injectable()
export class CollaborationEnhancedService {
  private readonly logger = new Logger(CollaborationEnhancedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns list of active users with cursor positions for a design (Liveblocks-style).
   * Reads from design_presence table if present; otherwise returns empty list.
   */
  async getPresence(designId: string): Promise<PresenceUser[]> {
    try {
      const design = await this.prisma.design.findUnique({
        where: { id: designId },
        select: { id: true },
      });
      if (!design) {
        throw new NotFoundException(`Design not found: ${designId}`);
      }

      const rows = await this.prisma.$queryRaw<
        Array<{
          user_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar: string | null;
          cursor_x: number;
          cursor_y: number;
          last_seen_at: Date;
        }>
      >`
        SELECT p.user_id, u.email, u."firstName" AS first_name, u."lastName" AS last_name, u.avatar,
               COALESCE(p.cursor_x, 0)::float AS cursor_x,
               COALESCE(p.cursor_y, 0)::float AS cursor_y,
               p.updated_at AS last_seen_at
        FROM design_presence p
        JOIN "User" u ON u.id = p.user_id AND u."deletedAt" IS NULL
        WHERE p.design_id = ${designId}
          AND p.updated_at > NOW() - INTERVAL '2 minutes'
      `.catch(() => []);

      return (Array.isArray(rows) ? rows : []).map((r) => ({
        userId: r.user_id,
        email: r.email,
        firstName: r.first_name,
        lastName: r.last_name,
        avatar: r.avatar,
        cursorX: Number(r.cursor_x) || 0,
        cursorY: Number(r.cursor_y) || 0,
        lastSeenAt: r.last_seen_at,
      }));
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      this.logger.warn(`getPresence failed for design ${designId}, returning []`, e);
      return [];
    }
  }

  /**
   * Add a pin-style comment at coordinates (x, y) on a design.
   */
  async addComment(
    designId: string,
    userId: string,
    x: number,
    y: number,
    content: string,
  ) {
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: { id: true },
    });
    if (!design) {
      throw new NotFoundException(`Design not found: ${designId}`);
    }
    if (!content?.trim()) {
      throw new BadRequestException('Comment content is required');
    }

    const comment = await this.prisma.comment.create({
      data: {
        resourceType: ResourceType.DESIGN,
        resourceId: designId,
        content: content.trim(),
        authorId: userId,
      },
      include: { author: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } } },
    });

    try {
      await this.prisma.$executeRaw`
        INSERT INTO design_comment_pin (id, comment_id, design_id, x, y, created_at)
        VALUES (gen_random_uuid()::text, ${comment.id}, ${designId}, ${x}, ${y}, NOW())
        ON CONFLICT (comment_id) DO UPDATE SET x = EXCLUDED.x, y = EXCLUDED.y
      `;
    } catch {
      this.logger.debug('design_comment_pin table may not exist; comment saved without position');
    }

    return {
      id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      author: comment.author,
      x,
      y,
      createdAt: comment.createdAt,
    };
  }

  /**
   * Generate a share link with view / edit / comment permissions.
   */
  async getShareLink(
    designId: string,
    permissions: SharePermission[],
    options?: { expiresInHours?: number },
  ): Promise<ShareLinkResult> {
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: { id: true },
    });
    if (!design) {
      throw new NotFoundException(`Design not found: ${designId}`);
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = options?.expiresInHours
      ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000)
      : undefined;

    const designWithIds = await this.prisma.design.findUnique({
      where: { id: designId },
      select: { brandId: true, userId: true },
    });
    if (!designWithIds) throw new NotFoundException(`Design not found: ${designId}`);

    let createdBy: string | null = designWithIds.userId;
    if (!createdBy) {
      const brandUser = await this.prisma.user.findFirst({
        where: { brandId: designWithIds.brandId },
        select: { id: true },
      });
      createdBy = brandUser?.id != null ? brandUser.id : null;
    }
    if (!createdBy) {
      throw new BadRequestException('Design has no owner; cannot create share link.');
    }

    await this.prisma.sharedResource.create({
      data: {
        resourceType: ResourceType.DESIGN,
        resourceId: designId,
        sharedWith: [],
        permissions: { public: permissions } as object,
        isPublic: true,
        publicToken: token,
        createdBy,
        brandId: designWithIds.brandId,
      },
    });

    const baseUrl = process.env.FRONTEND_URL || 'https://app.luneo.com';
    const url = `${baseUrl}/shared/design/${designId}?token=${token}`;

    return { url, token, permissions, expiresAt };
  }
}
