import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SegmentsService } from './segments.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('orion')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Get('segments')
  getSegments(@Query('brandId') brandId?: string) {
    return this.segmentsService.getSegments(brandId);
  }

  @Get('segments/:id')
  getSegment(@Param('id') id: string) {
    return this.segmentsService.getSegment(id);
  }

  @Post('segments')
  createSegment(
    @Body()
    body: {
      name: string;
      description?: string;
      conditions: { property: string; operator: string; value: string }[];
      type?: string;
      brandId?: string;
    },
  ) {
    return this.segmentsService.createSegment(body);
  }

  @Put('segments/:id')
  updateSegment(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      conditions?: { property: string; operator: string; value: string }[];
      type?: string;
      isActive?: boolean;
    },
  ) {
    return this.segmentsService.updateSegment(id, body);
  }

  @Delete('segments/:id')
  deleteSegment(@Param('id') id: string) {
    return this.segmentsService.deleteSegment(id);
  }

  @Get('analytics/predictions')
  getPredictions(@Query('brandId') brandId?: string) {
    return this.segmentsService.getPredictions(brandId);
  }

  @Get('analytics/cohorts')
  getCohorts(@Query('brandId') brandId?: string) {
    return this.segmentsService.getCohorts(brandId);
  }
}
