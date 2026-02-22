// @ts-nocheck
import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@/common/compat/v1-enums';
import { AthenaService } from './athena.service';

@ApiTags('orion-athena')
@ApiBearerAuth()
@Controller('orion/athena')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class AthenaController {
  constructor(private readonly athena: AthenaService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Athena intelligence dashboard' })
  @ApiResponse({ status: 200, description: 'Intelligence dashboard data' })
  getDashboard() {
    return this.athena.getDashboard();
  }

  @Get('distribution')
  @ApiOperation({ summary: 'Get customer health distribution' })
  @ApiResponse({ status: 200, description: 'Health distribution data' })
  getDistribution() {
    return this.athena.getHealthDistribution();
  }

  @Get('customer/:userId')
  @ApiOperation({ summary: 'Get customer health details' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Customer health data' })
  getCustomerHealth(@Param('userId') userId: string) {
    return this.athena.getCustomerHealth(userId);
  }

  @Post('calculate/:userId')
  @ApiOperation({ summary: 'Calculate health score for a customer' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 201, description: 'Calculated health score' })
  calculateHealthScore(@Param('userId') userId: string) {
    return this.athena.calculateHealthScore(userId);
  }

  @Post('insights/generate')
  @ApiOperation({ summary: 'Generate AI insights' })
  @ApiResponse({ status: 201, description: 'Generated insights' })
  generateInsights() {
    return this.athena.generateInsights();
  }
}
