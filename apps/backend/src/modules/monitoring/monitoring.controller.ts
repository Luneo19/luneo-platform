import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { MetricsService } from './services/metrics.service';
import { AlertsService } from './services/alerts.service';
import { GetMetricsDto } from './dto/get-metrics.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/types/user.types';
import { Request as ExpressRequest } from 'express';

/**
 * Monitoring Controller - Enterprise Grade
 * RESTful API for monitoring and observability
 * Inspired by: Datadog API, New Relic API, Vercel Analytics API
 */
@ApiTags('monitoring')
@Controller('monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class MonitoringController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly metricsService: MetricsService,
    private readonly alertsService: AlertsService
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get monitoring dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getDashboard() {
    return this.monitoringService.getDashboard();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get overall system health' })
  @ApiResponse({ status: 200, description: 'Health status retrieved' })
  async getHealth() {
    return this.monitoringService.getHealthStatus();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get metrics with optional filters' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved' })
  async getMetrics(@Query() dto: GetMetricsDto) {
    return this.metricsService.getMetrics(dto);
  }

  @Get('services/health')
  @ApiOperation({ summary: 'Get service health status' })
  @ApiQuery({ name: 'service', required: false })
  @ApiResponse({ status: 200, description: 'Service health retrieved' })
  async getServiceHealth(@Query('service') service?: string) {
    return this.metricsService.getServiceHealth(service);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get alerts' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'service', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Alerts retrieved' })
  async getAlerts(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('service') service?: string,
    @Query('limit') limit?: number
  ) {
    return this.alertsService.getAlerts({
      status: status as any,
      severity: severity as any,
      service,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Create a new alert' })
  @ApiResponse({ status: 201, description: 'Alert created' })
  async createAlert(
    @Body() dto: CreateAlertDto,
    @ExpressRequest() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.alertsService.createAlert(dto, req.user.id);
  }

  @Patch('alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged' })
  async acknowledgeAlert(
    @Param('id') id: string,
    @ExpressRequest() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.alertsService.acknowledgeAlert(id, req.user.id);
  }

  @Patch('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  async resolveAlert(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @ExpressRequest() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.alertsService.resolveAlert(id, req.user.id, body.reason);
  }

  @Get('alert-rules')
  @ApiOperation({ summary: 'Get alert rules' })
  @ApiQuery({ name: 'enabled', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Alert rules retrieved' })
  async getAlertRules(@Query('enabled') enabled?: string) {
    return this.alertsService.getAlertRules(
      enabled === 'true' ? true : enabled === 'false' ? false : undefined
    );
  }

  @Post('alert-rules')
  @ApiOperation({ summary: 'Create an alert rule' })
  @ApiResponse({ status: 201, description: 'Alert rule created' })
  async createAlertRule(@Body() dto: CreateAlertRuleDto) {
    return this.alertsService.createAlertRule(dto);
  }

  @Post('alert-rules/evaluate')
  @ApiOperation({ summary: 'Evaluate all alert rules (admin only)' })
  @ApiResponse({ status: 200, description: 'Alert rules evaluated' })
  async evaluateAlertRules() {
    return this.alertsService.evaluateAlertRules();
  }
}

