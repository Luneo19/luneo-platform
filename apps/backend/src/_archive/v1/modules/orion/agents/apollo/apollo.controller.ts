// @ts-nocheck
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@/common/compat/v1-enums';
import { ApolloService } from './apollo.service';
import { GetIncidentsQueryDto, GetMetricsQueryDto } from '../../dto/apollo.dto';

@ApiTags('orion-apollo')
@ApiBearerAuth()
@Controller('orion/apollo')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class ApolloController {
  constructor(private readonly apollo: ApolloService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Apollo platform guardian dashboard' })
  @ApiResponse({ status: 200, description: 'Platform health dashboard' })
  getDashboard() {
    return this.apollo.getDashboard();
  }

  @Get('services')
  @ApiOperation({ summary: 'Get services health status' })
  @ApiResponse({ status: 200, description: 'Services health list' })
  getServicesHealth() {
    return this.apollo.getServicesHealth();
  }

  @Get('incidents')
  @ApiOperation({ summary: 'Get platform incidents' })
  @ApiResponse({ status: 200, description: 'Incidents list' })
  getIncidents(@Query() query: GetIncidentsQueryDto) {
    return this.apollo.getIncidents(query.status);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics data' })
  getMetrics(@Query() query: GetMetricsQueryDto) {
    return this.apollo.getPerformanceMetrics(query.hours ?? 24);
  }
}
