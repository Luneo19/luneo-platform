import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AbTestingService } from './ab-testing.service';

interface AuthenticatedRequest extends Request {
  user: { id: string; brandId?: string };
}

@ApiTags('AI Studio - A/B Testing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-studio/experiments')
export class AbTestingController {
  constructor(private readonly abTestingService: AbTestingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new A/B testing experiment' })
  @HttpCode(HttpStatus.CREATED)
  async createExperiment(
    @Body()
    body: {
      name: string;
      description?: string;
      brandId?: string;
      basePrompt: string;
      variantA: string;
      variantB: string;
      provider?: string;
      model?: string;
      sampleCount?: number;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.abTestingService.createExperiment({
      userId: req.user.id,
      ...body,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List experiments' })
  async listExperiments(
    @Req() req: AuthenticatedRequest,
    @Query('brandId') brandId?: string,
    @Query('status') status?: string,
  ) {
    return this.abTestingService.listExperiments(req.user.id, brandId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get experiment details' })
  async getExperiment(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.abTestingService.getExperiment(id, req.user.id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete experiment and determine winner' })
  async completeExperiment(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.abTestingService.completeExperiment(id, req.user.id);
  }

  @Post(':id/metrics')
  @ApiOperation({ summary: 'Record a metric for an experiment variant' })
  async recordMetric(
    @Param('id') id: string,
    @Body() body: { variant: 'A' | 'B'; metric: string; value: number },
  ) {
    return this.abTestingService.recordMetric(
      id,
      body.variant,
      body.metric,
      body.value,
    );
  }
}
