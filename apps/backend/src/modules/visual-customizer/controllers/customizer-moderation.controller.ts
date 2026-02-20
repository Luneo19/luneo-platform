import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
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
import { CustomizerModerationService } from '../services/customizer-moderation.service';
import { Type } from 'class-transformer';
import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';

class ModerationQueryDto {
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED'])
  status?: string;

  @IsOptional()
  @IsEnum(['DESIGN', 'TEXT', 'IMAGE'])
  contentType?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

class ApproveModerationDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

class RejectModerationDto {
  @IsString()
  reason: string;

  @IsOptional()
  notifyUser?: boolean;
}

class EscalateModerationDto {
  @IsString()
  reason: string;
}

class UpdateBlockedWordsDto {
  @IsString({ each: true })
  words: string[];

  @IsEnum(['add', 'remove', 'replace'])
  action: 'add' | 'remove' | 'replace';
}

@ApiTags('Visual Customizer - Moderation')
@Controller('visual-customizer/moderation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomizerModerationController {
  constructor(
    private readonly moderationService: CustomizerModerationService,
  ) {}

  @Get('flagged')
  @ApiOperation({
    summary: 'List flagged designs',
    description: 'Get a paginated list of flagged designs requiring moderation',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of flagged designs retrieved successfully',
  })
  async listFlagged(
    @Query(ValidationPipe) query: ModerationQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.moderationService.listFlaggedDesigns(
      {
        ...query,
        status: query.status as never,
        contentType: query.contentType as never,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      },
      user,
    );
  }

  @Get('records/:id')
  @ApiOperation({
    summary: 'Get moderation record',
    description: 'Retrieves a single moderation record with details',
  })
  @ApiParam({
    name: 'id',
    description: 'Moderation record UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation record retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Moderation record not found',
  })
  async getRecord(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.moderationService.getRecord(id, user);
  }

  @Post('records/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve moderation record',
    description: 'Approves a flagged design and makes it available',
  })
  @ApiParam({
    name: 'id',
    description: 'Moderation record UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation record approved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Moderation record not found',
  })
  async approve(
    @Param('id') id: string,
    @Body(ValidationPipe) body: ApproveModerationDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.moderationService.approve(id, body.notes || '', user);
  }

  @Post('records/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject moderation record',
    description: 'Rejects a flagged design and optionally notifies the user',
  })
  @ApiParam({
    name: 'id',
    description: 'Moderation record UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation record rejected successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Moderation record not found',
  })
  async reject(
    @Param('id') id: string,
    @Body(ValidationPipe) body: RejectModerationDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.moderationService.reject(id, body, user);
  }

  @Post('records/:id/escalate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Escalate moderation record',
    description: 'Escalates a moderation record for manual review',
  })
  @ApiParam({
    name: 'id',
    description: 'Moderation record UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation record escalated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Moderation record not found',
  })
  async escalate(
    @Param('id') id: string,
    @Body(ValidationPipe) body: EscalateModerationDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.moderationService.escalate(id, body.reason, user);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get moderation statistics',
    description: 'Retrieves moderation statistics for a date range',
  })
  @ApiQuery({
    name: 'from',
    description: 'Start date (ISO string)',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'to',
    description: 'End date (ISO string)',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation statistics retrieved successfully',
  })
  async getStats(
    @CurrentUser() user: CurrentUserType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.moderationService.getStats(
      {
        from: from ? new Date(from) : thirtyDaysAgo,
        to: to ? new Date(to) : now,
      },
      user,
    );
  }

  @Put('blocked-words')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update blocked words',
    description: 'Adds, removes, or replaces blocked words list',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Blocked words updated successfully',
  })
  async updateBlockedWords(
    @Body(ValidationPipe) dto: UpdateBlockedWordsDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.moderationService.updateBlockedWords(
      dto.words,
      dto.action,
      user,
    );
  }

  @Get('blocked-words')
  @ApiOperation({
    summary: 'Get blocked words',
    description: 'Retrieves the current list of blocked words',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Blocked words retrieved successfully',
  })
  async getBlockedWords(@CurrentUser() user: CurrentUserType) {
    return this.moderationService.getBlockedWords(user);
  }
}
