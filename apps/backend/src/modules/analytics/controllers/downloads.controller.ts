import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { DownloadsService, CreateDownloadInput, DownloadResourceType } from '../services/downloads.service';

@ApiTags('downloads')
@Controller('downloads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get()
  @ApiOperation({ summary: 'List download history for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Paginated list of downloads' })
  async list(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('type') type?: DownloadResourceType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.downloadsService.list(req.user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sortBy,
      sortOrder,
      type,
      startDate,
      endDate,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Record a download event' })
  @ApiResponse({ status: 201, description: 'Download recorded' })
  async record(@Request() req: any, @Body() body: CreateDownloadInput) {
    return this.downloadsService.record(req.user.id, body);
  }
}
