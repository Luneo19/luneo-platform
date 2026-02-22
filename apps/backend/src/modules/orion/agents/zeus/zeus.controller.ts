// @ts-nocheck
import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
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
import { ZeusService } from './zeus.service';
import { ExecuteOverrideDto } from '../../dto/zeus.dto';

@ApiTags('orion-zeus')
@ApiBearerAuth()
@Controller('orion/zeus')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class ZeusController {
  constructor(private readonly zeus: ZeusService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Zeus strategic dashboard' })
  @ApiResponse({ status: 200, description: 'Strategic dashboard data' })
  getDashboard() {
    return this.zeus.getDashboard();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get critical platform alerts' })
  @ApiResponse({ status: 200, description: 'Critical alerts list' })
  getAlerts() {
    return this.zeus.getCriticalAlerts();
  }

  @Get('decisions')
  @ApiOperation({ summary: 'Get strategic decisions' })
  @ApiResponse({ status: 200, description: 'Strategic decisions list' })
  getDecisions() {
    return this.zeus.getStrategicDecisions();
  }

  @Post('override/:actionId')
  @ApiOperation({ summary: 'Execute admin override on an action' })
  @ApiParam({ name: 'actionId', description: 'Action ID' })
  @ApiResponse({ status: 200, description: 'Override executed' })
  executeOverride(
    @Param('actionId') actionId: string,
    @Body() body: ExecuteOverrideDto,
  ) {
    return this.zeus.executeOverride(actionId, body.approved);
  }
}
