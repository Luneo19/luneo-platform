/**
 * AR Studio - Collaboration Rooms Controller
 * Create/join/leave/end rooms, share anchors
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ARPlanGuard } from '@/common/guards/ar-plan.guard';
import { User } from '@/common/decorators/user.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { ARRoomService } from '../collaboration/ar-room.service';
import { SharedAnchorService } from '../collaboration/shared-anchor.service';
import { CreateRoomDto, JoinRoomDto, ShareAnchorDto } from '../dto/ar-rooms.dto';

@ApiTags('AR Studio Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ARPlanGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('ar-studio/rooms')
export class ARRoomsController {
  private readonly logger = new Logger(ARRoomsController.name);

  constructor(
    private readonly roomService: ARRoomService,
    private readonly sharedAnchor: SharedAnchorService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create room' })
  async createRoom(@User() user: CurrentUser, @Body() dto: CreateRoomDto) {
    if (!user.brandId) throw new BadRequestException('User must be associated with a brand');
    return this.roomService.createRoom(dto.projectId, user.id, {
      name: dto.name,
      maxParticipants: dto.maxParticipants,
      allowVoiceChat: dto.allowVoiceChat,
      allowAnnotations: dto.allowAnnotations,
      allowModelEditing: dto.allowModelEditing,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List rooms for project' })
  async listRooms(@User() user: CurrentUser, @Query('projectId') projectId: string) {
    if (!projectId) throw new BadRequestException('projectId query required');
    return this.roomService.listRooms(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Room details' })
  async getRoomDetails(@User() user: CurrentUser, @Param('id') id: string) {
    return this.roomService.getRoomDetails(id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join room' })
  async joinRoom(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: JoinRoomDto,
  ) {
    return this.roomService.joinRoom(id, user.id, dto.platform, dto.role);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave room' })
  async leaveRoom(@User() user: CurrentUser, @Param('id') id: string) {
    return this.roomService.leaveRoom(id, user.id);
  }

  @Post(':id/end')
  @ApiOperation({ summary: 'End room (host only)' })
  async endRoom(@User() user: CurrentUser, @Param('id') id: string) {
    return this.roomService.endRoom(id, user.id);
  }

  @Post(':id/anchors')
  @ApiOperation({ summary: 'Share anchor' })
  async shareAnchor(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ShareAnchorDto,
  ) {
    return this.sharedAnchor.shareAnchor(id, user.id, {
      id: dto.id,
      position: dto.position,
      rotation: dto.rotation,
      scale: dto.scale,
      type: dto.type,
      metadata: dto.metadata,
    });
  }

  @Get(':id/anchors')
  @ApiOperation({ summary: 'Get shared anchors' })
  async getSharedAnchors(@User() user: CurrentUser, @Param('id') id: string) {
    return this.sharedAnchor.getSharedAnchors(id);
  }

  @Post(':id/anchors/:anchorId/remove')
  @ApiOperation({ summary: 'Remove anchor' })
  async removeAnchor(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Param('anchorId') anchorId: string,
  ) {
    return this.sharedAnchor.removeAnchor(id, anchorId);
  }
}
