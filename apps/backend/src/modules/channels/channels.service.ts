// @ts-nocheck
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ChannelStatus } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    private prisma: PrismaOptimizedService,
    private cache: SmartCacheService,
  ) {}

  async listByAgent(agentId: string, user: CurrentUser) {
    await this.ensureAgentAccess(agentId, user);

    return this.cache.getOrSet(
      `channels:agent:${agentId}`,
      () =>
        this.prisma.channel.findMany({
          where: { agentId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
        }),
      3600,
    );
  }

  async create(dto: CreateChannelDto, user: CurrentUser) {
    const agent = await this.ensureAgentAccess(dto.agentId, user);

    const existing = await this.prisma.channel.findFirst({
      where: { agentId: dto.agentId, type: dto.type, deletedAt: null },
    });

    if (existing) {
      throw new BadRequestException(
        `Un canal ${dto.type} existe déjà pour cet agent`,
      );
    }

    const channel = await this.prisma.channel.create({
      data: {
        agentId: dto.agentId,
        type: dto.type,
        status: ChannelStatus.ACTIVE,
        widgetPrimaryColor: dto.widgetPrimaryColor,
        widgetSecondaryColor: dto.widgetSecondaryColor,
        widgetPosition: dto.widgetPosition as any,
        widgetSize: dto.widgetSize as any,
        widgetWelcomeMessage: dto.widgetWelcomeMessage,
        widgetPlaceholder: dto.widgetPlaceholder,
        widgetLogoUrl: dto.widgetLogoUrl,
        widgetAutoOpen: dto.widgetAutoOpen ?? false,
        widgetAutoOpenDelay: dto.widgetAutoOpenDelay,
      },
    });

    await this.cache.invalidate(`channels:agent:${dto.agentId}`, 'brand');
    this.logger.log(`Canal ${channel.id} (${dto.type}) créé pour agent ${dto.agentId}`);

    return channel;
  }

  async update(id: string, dto: UpdateChannelDto, user: CurrentUser) {
    const channel = await this.ensureChannelAccess(id, user);

    const updated = await this.prisma.channel.update({
      where: { id: channel.id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.widgetPrimaryColor !== undefined && { widgetPrimaryColor: dto.widgetPrimaryColor }),
        ...(dto.widgetSecondaryColor !== undefined && { widgetSecondaryColor: dto.widgetSecondaryColor }),
        ...(dto.widgetPosition !== undefined && { widgetPosition: dto.widgetPosition as any }),
        ...(dto.widgetSize !== undefined && { widgetSize: dto.widgetSize as any }),
        ...(dto.widgetWelcomeMessage !== undefined && { widgetWelcomeMessage: dto.widgetWelcomeMessage }),
        ...(dto.widgetPlaceholder !== undefined && { widgetPlaceholder: dto.widgetPlaceholder }),
        ...(dto.widgetLogoUrl !== undefined && { widgetLogoUrl: dto.widgetLogoUrl }),
        ...(dto.widgetAutoOpen !== undefined && { widgetAutoOpen: dto.widgetAutoOpen }),
        ...(dto.widgetAutoOpenDelay !== undefined && { widgetAutoOpenDelay: dto.widgetAutoOpenDelay }),
      },
    });

    await this.cache.invalidate(`channels:agent:${channel.agentId}`, 'brand');
    return updated;
  }

  async delete(id: string, user: CurrentUser) {
    const channel = await this.ensureChannelAccess(id, user);

    await this.prisma.channel.update({
      where: { id: channel.id },
      data: { deletedAt: new Date() },
    });

    await this.cache.invalidate(`channels:agent:${channel.agentId}`, 'brand');
    this.logger.log(`Canal ${id} supprimé (soft delete)`);

    return { deleted: true };
  }

  private async ensureAgentAccess(agentId: string, user: CurrentUser) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }

    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, organizationId: user.organizationId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} introuvable`);
    }

    return agent;
  }

  private async ensureChannelAccess(id: string, user: CurrentUser) {
    const channel = await this.prisma.channel.findFirst({
      where: { id, deletedAt: null },
      include: { agent: { select: { organizationId: true } } },
    });

    if (!channel || channel.agent.organizationId !== user.organizationId) {
      throw new NotFoundException(`Canal ${id} introuvable`);
    }

    return channel;
  }
}
