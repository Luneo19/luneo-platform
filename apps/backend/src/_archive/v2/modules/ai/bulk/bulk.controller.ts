import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { User } from '@/common/decorators/user.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { BulkGeneratorService } from './bulk-generator.service';

@ApiTags('AI Studio - Bulk')
@Controller('ai-studio/bulk')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BulkController {
  constructor(private readonly bulkGenerator: BulkGeneratorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a bulk generation job' })
  async create(
    @User() user: CurrentUser,
    @Body()
    body: {
      brandId: string;
      name: string;
      description?: string;
      template: string;
      variables: Record<string, string>[];
      provider?: string;
      model?: string;
      parameters?: Record<string, unknown>;
      batchSize?: number;
    },
  ) {
    const brandId = body.brandId ?? user.brandId;
    if (!brandId) throw new BadRequestException('Brand ID is required');
    const userId = user.id;
    return this.bulkGenerator.createBulkJob({
      userId,
      brandId,
      name: body.name,
      description: body.description,
      template: body.template,
      variables: body.variables,
      provider: body.provider,
      model: body.model,
      parameters: body.parameters,
      batchSize: body.batchSize,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List bulk jobs' })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async list(
    @User() user: CurrentUser,
    @Query('brandId') brandId?: string,
    @Query('status') status?: string,
  ) {
    return this.bulkGenerator.listJobs(user.id, brandId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bulk job by ID' })
  @ApiParam({ name: 'id', description: 'Bulk job ID' })
  async getOne(@User() user: CurrentUser, @Param('id') id: string) {
    return this.bulkGenerator.getJob(id, user.id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get bulk job progress' })
  @ApiParam({ name: 'id', description: 'Bulk job ID' })
  async progress(@User() user: CurrentUser, @Param('id') id: string) {
    await this.bulkGenerator.getJob(id, user.id);
    return this.bulkGenerator.getJobProgress(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a bulk job' })
  @ApiParam({ name: 'id', description: 'Bulk job ID' })
  async cancel(@User() user: CurrentUser, @Param('id') id: string) {
    return this.bulkGenerator.cancelJob(id, user.id);
  }
}
