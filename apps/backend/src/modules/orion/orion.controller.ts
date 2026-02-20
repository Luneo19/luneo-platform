import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Post,
  Query,
  UseGuards,
  Sse,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { OrionService } from './orion.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { UpdateAgentDto } from './dto/update-agent.dto';
import {
  GetHealthScoresQueryDto,
  GetInsightsQueryDto,
  GetActionsQueryDto,
  GetActivityFeedQueryDto,
} from './dto/orion-query.dto';

@ApiTags('orion')
@ApiBearerAuth()
@Controller('orion')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class OrionController {
  constructor(private readonly orionService: OrionService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get ORION dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard overview data' })
  getOverview() {
    return this.orionService.getOverview();
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Real-time event stream (SSE)' })
  stream(): Observable<MessageEvent> {
    return this.orionService.getEventStream().pipe(
      map(
        (event) =>
          ({
            data: JSON.stringify(event),
            type: event.type,
          }) as MessageEvent,
      ),
    );
  }

  @Get('agents')
  @ApiOperation({ summary: 'List all ORION agents' })
  @ApiResponse({ status: 200, description: 'List of agents' })
  getAgents() {
    return this.orionService.getAgents();
  }

  @Get('agents/:id')
  @ApiOperation({ summary: 'Get agent details' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: 'Agent details' })
  getAgent(@Param('id') id: string) {
    return this.orionService.getAgent(id);
  }

  @Put('agents/:id')
  @ApiOperation({ summary: 'Update agent configuration' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: 'Updated agent' })
  updateAgent(@Param('id') id: string, @Body() body: UpdateAgentDto) {
    return this.orionService.updateAgent(id, body);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default agents' })
  @ApiResponse({ status: 201, description: 'Agents seeded' })
  seedAgents() {
    return this.orionService.seedAgents();
  }

  @Get('health-scores')
  @ApiOperation({ summary: 'Get customer health scores' })
  @ApiResponse({ status: 200, description: 'Health scores list' })
  getHealthScores(@Query() query: GetHealthScoresQueryDto) {
    return this.orionService.getHealthScores({
      churnRisk: query.churnRisk,
      limit: query.limit,
    });
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get ORION insights' })
  @ApiResponse({ status: 200, description: 'Insights list' })
  getInsights(@Query() query: GetInsightsQueryDto) {
    return this.orionService.getInsights({
      agentType: query.agentType,
      isRead: query.isRead,
      limit: query.limit,
    });
  }

  @Put('insights/:id/read')
  @ApiOperation({ summary: 'Mark insight as read' })
  @ApiParam({ name: 'id', description: 'Insight ID' })
  @ApiResponse({ status: 200, description: 'Insight marked as read' })
  markInsightRead(@Param('id') id: string) {
    return this.orionService.markInsightRead(id);
  }

  @Put('insights/:id/archive')
  @ApiOperation({ summary: 'Archive insight' })
  @ApiParam({ name: 'id', description: 'Insight ID' })
  @ApiResponse({ status: 200, description: 'Insight archived' })
  archiveInsight(@Param('id') id: string) {
    return this.orionService.archiveInsight(id);
  }

  @Get('actions')
  @ApiOperation({ summary: 'Get ORION recommended actions' })
  @ApiResponse({ status: 200, description: 'Actions list' })
  getActions(@Query() query: GetActionsQueryDto) {
    return this.orionService.getActions({
      agentType: query.agentType,
      status: query.status,
      limit: query.limit,
    });
  }

  @Post('actions/:id/execute')
  @ApiOperation({ summary: 'Execute recommended action' })
  @ApiParam({ name: 'id', description: 'Action ID' })
  @ApiResponse({ status: 200, description: 'Action executed' })
  executeAction(@Param('id') id: string) {
    return this.orionService.executeAction(id);
  }

  @Post('actions/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss recommended action' })
  @ApiParam({ name: 'id', description: 'Action ID' })
  @ApiResponse({ status: 200, description: 'Action dismissed' })
  dismissAction(@Param('id') id: string) {
    return this.orionService.dismissAction(id);
  }

  @Get('activity-feed')
  @ApiOperation({ summary: 'Get ORION activity feed' })
  @ApiResponse({ status: 200, description: 'Activity feed entries' })
  getActivityFeed(@Query() query: GetActivityFeedQueryDto) {
    return this.orionService.getActivityFeed(query.limit ?? 30);
  }

  @Get('analytics/dashboard')
  @ApiOperation({ summary: 'Get analytics dashboard data' })
  @ApiResponse({ status: 200, description: 'Analytics dashboard' })
  async getAnalyticsDashboard() {
    const overview = await this.orionService.getOverview();
    return { success: true, data: overview };
  }
}
