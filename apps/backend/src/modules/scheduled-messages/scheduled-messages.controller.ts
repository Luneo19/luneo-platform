import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { CreateScheduledMessageDto } from './dto/create-scheduled-message.dto';
import { ScheduledMessagesService } from './scheduled-messages.service';

@ApiTags('scheduled-messages')
@Controller('scheduled-messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScheduledMessagesController {
  constructor(
    private readonly scheduledMessagesService: ScheduledMessagesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister les messages planifies' })
  async list(
    @CurrentUser() user: CurrentUserType,
    @Query('limit') limit?: string,
  ) {
    return this.scheduledMessagesService.list(user, limit ? Number(limit) : 50);
  }

  @Post()
  @ApiOperation({ summary: 'Planifier un message' })
  async create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateScheduledMessageDto,
  ) {
    return this.scheduledMessagesService.create(user, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Annuler un message planifie' })
  async cancel(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.scheduledMessagesService.cancel(user, id);
  }
}
