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
import { UpdateAgentDto } from './dto/update-agent.dto';

@Controller('orion')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
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
    @Body() body: UpdateAgentDto,
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

  @Get('analytics/dashboard')
  async getAnalyticsDashboard() {
    const overview = await this.orionService.getOverview();
    return { success: true, data: overview };
  }
}
