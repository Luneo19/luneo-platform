import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { HermesService } from './hermes.service';

@ApiTags('orion-hermes')
@ApiBearerAuth()
@Controller('orion/hermes')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class HermesController {
  constructor(private readonly hermes: HermesService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Hermes communication dashboard' })
  @ApiResponse({ status: 200, description: 'Communication dashboard data' })
  getDashboard() {
    return this.hermes.getDashboard();
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending communications' })
  @ApiResponse({ status: 200, description: 'Pending communications list' })
  getPending() {
    return this.hermes.getPendingCommunications();
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Get recent campaigns' })
  @ApiResponse({ status: 200, description: 'Recent campaigns list' })
  getCampaigns() {
    return this.hermes.getRecentCampaigns();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get engagement statistics' })
  @ApiResponse({ status: 200, description: 'Engagement statistics' })
  getStats() {
    return this.hermes.getEngagementStats();
  }
}
