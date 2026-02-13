import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('orion')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get('revenue/overview')
  getRevenueOverview() {
    return this.revenueService.getRevenueOverview();
  }

  @Get('revenue/upsell')
  getUpsellOpportunities(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.revenueService.getUpsellOpportunities(limitNum);
  }

  @Get('revenue/leads')
  getLeadScores(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.revenueService.getLeadScores(limitNum);
  }

  @Get('experiments')
  getExperiments() {
    return this.revenueService.getExperiments();
  }

  @Get('experiments/:id')
  getExperiment(@Param('id') id: string) {
    return this.revenueService.getExperiment(id);
  }

  @Post('experiments')
  createExperiment(
    @Body()
    body: {
      name: string;
      description: string;
      type: string;
      variants: { id: string; name: string; config?: Record<string, unknown>; weight: number }[];
      targetAudience?: Record<string, unknown>;
    },
  ) {
    return this.revenueService.createExperiment(body);
  }

  @Put('experiments/:id')
  updateExperiment(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      variants?: { id: string; name: string; config?: Record<string, unknown>; weight: number }[];
      targetAudience?: Record<string, unknown>;
    },
  ) {
    const data: import('./revenue.service').UpdateExperimentDto = {
      ...body,
      startDate: body.startDate != null ? (typeof body.startDate === 'string' ? new Date(body.startDate) : body.startDate) : undefined,
      endDate: body.endDate != null ? (typeof body.endDate === 'string' ? new Date(body.endDate) : body.endDate) : undefined,
    };
    return this.revenueService.updateExperiment(id, data);
  }
}
