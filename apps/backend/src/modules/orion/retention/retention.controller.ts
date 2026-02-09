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
import { RetentionService } from './retention.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('api/v1/orion/retention')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN)
export class RetentionController {
  constructor(private readonly retentionService: RetentionService) {}

  @Get('dashboard')
  getHealthDashboard() {
    return this.retentionService.getHealthDashboard();
  }

  @Get('at-risk')
  getAtRiskCustomers(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : undefined;
    return this.retentionService.getAtRiskCustomers(Number.isNaN(parsed) ? undefined : parsed);
  }

  @Get('health/:userId')
  getHealthScore(@Param('userId') userId: string) {
    return this.retentionService.getHealthScore(userId);
  }

  @Put('health/:userId')
  updateHealthScore(
    @Param('userId') userId: string,
    @Body()
    body: {
      healthScore?: number;
      churnRisk?: string;
      activationScore?: number;
      engagementScore?: number;
      adoptionScore?: number;
      growthPotential?: string;
      lastActivityAt?: string | null;
      signals?: unknown;
    },
  ) {
    const data = {
      ...body,
      lastActivityAt: body.lastActivityAt ? new Date(body.lastActivityAt) : body.lastActivityAt,
    };
    return this.retentionService.updateHealthScore(userId, data);
  }

  @Post('calculate/:userId')
  calculateHealthScore(@Param('userId') userId: string) {
    return this.retentionService.calculateHealthScore(userId);
  }

  @Get('win-back')
  getWinBackCampaigns() {
    return this.retentionService.getWinBackCampaigns();
  }

  @Post('win-back/trigger')
  triggerWinBack(@Body() body: { userIds: string[] }) {
    return this.retentionService.triggerWinBack(body.userIds ?? []);
  }
}
