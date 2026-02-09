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

@Controller('api/v1/orion')
@UseGuards(JwtAuthGuard, RolesGuard)
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
    const data = {
      ...body,
      ...(body.startDate && { startDate: new Date(body.startDate) }),
      ...(body.endDate && { endDate: new Date(body.endDate) }),
    };
    return this.revenueService.updateExperiment(id, data);
  }
}
