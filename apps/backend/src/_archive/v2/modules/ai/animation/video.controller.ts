import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { User } from '@/common/decorators/user.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { VideoGeneratorService } from './video-generator.service';

@ApiTags('AI Studio - Videos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-studio/videos')
export class VideoController {
  constructor(private readonly videoGenerator: VideoGeneratorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a video generation job' })
  async generate(
    @User() user: CurrentUser,
    @Body()
    body: {
      brandId: string;
      sourceImages: string[];
      prompt?: string;
      motion: string;
      duration: number;
      fps?: number;
      resolution?: string;
      provider?: string;
    },
  ) {
    const userId = user.id;
    if (!body.brandId) throw new BadRequestException('Brand ID is required');
    return this.videoGenerator.generate({
      userId,
      brandId: body.brandId,
      sourceImages: body.sourceImages,
      prompt: body.prompt,
      motion: body.motion,
      duration: body.duration,
      fps: body.fps,
      resolution: body.resolution,
      provider: body.provider,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List video generations' })
  @ApiQuery({ name: 'brandId', required: false, description: 'Filter by brand' })
  async list(@User() user: CurrentUser, @Query('brandId') brandId?: string) {
    return this.videoGenerator.listVideos(user.id, brandId ?? undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get video generation status' })
  @ApiParam({ name: 'id', description: 'Video generation ID' })
  async getStatus(@Param('id') id: string, @User() user: CurrentUser) {
    return this.videoGenerator.getStatus(id, user.id);
  }
}
