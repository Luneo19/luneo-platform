import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrionService } from './orion.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('api/v1/orion')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN)
export class OrionController {
  constructor(private readonly orionService: OrionService) {}

  @Get('overview')
  getOverview() {
    return this.orionService.getOverview();
  }

  @Get('agents')
  getAgents() {
    return this.orionService.getAgents();
  }

  @Get('agents/:id')
  getAgent(@Param('id') id: string) {
    return this.orionService.getAgent(id);
  }

  @Put('agents/:id')
  updateAgent(
    @Param('id') id: string,
    @Body() body: { status?: string; config?: any },
  ) {
    return this.orionService.updateAgent(id, body);
  }

  @Post('seed')
  seedAgents() {
    return this.orionService.seedAgents();
  }

  @Get('health-scores')
  getHealthScores(
    @Query('churnRisk') churnRisk?: string,
    @Query('limit') limit?: string,
  ) {
    return this.orionService.getHealthScores({
      churnRisk,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
