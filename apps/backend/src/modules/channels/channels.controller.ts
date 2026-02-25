import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ChannelReliabilityService } from './channel-reliability.service';

@ApiTags('channels')
@Controller('channels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChannelsController {
  private readonly logger = new Logger(ChannelsController.name);

  constructor(
    private readonly channelsService: ChannelsService,
    private readonly channelReliabilityService: ChannelReliabilityService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste des canaux d\'un agent' })
  @ApiQuery({ name: 'agentId', required: true, description: 'ID de l\'agent' })
  @ApiResponse({ status: 200, description: 'Liste des canaux' })
  async list(
    @Query('agentId') agentId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.channelsService.listByAgent(agentId, user);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un canal pour un agent' })
  @ApiResponse({ status: 201, description: 'Canal créé' })
  async create(
    @Body() dto: CreateChannelDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.channelsService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un canal' })
  @ApiParam({ name: 'id', description: 'ID du canal' })
  @ApiResponse({ status: 200, description: 'Canal mis à jour' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateChannelDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.channelsService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un canal' })
  @ApiParam({ name: 'id', description: 'ID du canal' })
  @ApiResponse({ status: 200, description: 'Canal supprimé' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.channelsService.delete(id, user);
  }

  @Get('reliability/sla')
  @ApiOperation({ summary: 'Statistiques SLA par canal' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getSla(
    @CurrentUser() user: CurrentUserType,
    @Query('days') days?: string,
  ) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    return this.channelReliabilityService.getChannelSla(
      user.organizationId,
      days ? parseInt(days, 10) : 7,
    );
  }

  @Get('reliability/dlq')
  @ApiOperation({ summary: 'Dead-letter queue des envois canal' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDlq(
    @CurrentUser() user: CurrentUserType,
    @Query('limit') limit?: string,
  ) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    const items = this.channelReliabilityService.getDeadLetterQueue(
      user.organizationId,
      limit ? parseInt(limit, 10) : 50,
    );
    return {
      data: items.map((item) => ({
        id: item.id,
        channelType: item.channelType,
        recipientId: item.recipientId,
        reason: item.reason,
        failedAt: item.failedAt,
      })),
    };
  }

  @Post('reliability/dlq/:id/retry')
  @ApiOperation({ summary: 'Rejouer un message depuis la dead-letter queue' })
  async retryDlqItem(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    return this.channelReliabilityService.retryDeadLetterItem(user.organizationId, id);
  }
}
