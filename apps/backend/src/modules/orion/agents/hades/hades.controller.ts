// @ts-nocheck
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@/common/compat/v1-enums';
import { HadesService } from './hades.service';

@ApiTags('orion-hades')
@ApiBearerAuth()
@Controller('orion/hades')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class HadesController {
  constructor(private readonly hades: HadesService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Hades retention dashboard' })
  @ApiResponse({ status: 200, description: 'Retention dashboard data' })
  getDashboard() {
    return this.hades.getDashboard();
  }

  @Get('at-risk')
  @ApiOperation({ summary: 'Get customers at risk of churn' })
  @ApiResponse({ status: 200, description: 'At-risk customers list' })
  getAtRisk() {
    return this.hades.getAtRiskCustomers();
  }

  @Get('win-back')
  @ApiOperation({ summary: 'Get win-back candidates' })
  @ApiResponse({ status: 200, description: 'Win-back candidates list' })
  getWinBack() {
    return this.hades.getWinBackCandidates();
  }

  @Get('mrr-at-risk')
  @ApiOperation({ summary: 'Get MRR at risk' })
  @ApiResponse({ status: 200, description: 'MRR at risk data' })
  getMRRAtRisk() {
    return this.hades.getMRRAtRisk();
  }

  @Get('actions')
  @ApiOperation({ summary: 'Get retention actions' })
  @ApiResponse({ status: 200, description: 'Retention actions list' })
  getActions() {
    return this.hades.getRetentionActions();
  }
}
