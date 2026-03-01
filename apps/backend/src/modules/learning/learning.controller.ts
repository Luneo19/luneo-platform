import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RequestWithUser } from '@/common/types/user.types';
import { CreateLearningSignalDto } from './dto/create-learning-signal.dto';
import { LearningGapQueryDto } from './dto/learning-gap-query.dto';
import { LearningService } from './learning.service';
import { WeeklyAnalyzerService } from './weekly-analyzer.service';
import { AutoImproverService } from './auto-improver.service';

@ApiTags('learning')
@Controller('learning')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LearningController {
  constructor(
    private readonly learningService: LearningService,
    private readonly weeklyAnalyzerService: WeeklyAnalyzerService,
    private readonly autoImproverService: AutoImproverService,
  ) {}

  @Post('signals')
  @ApiOperation({ summary: 'Enregistrer un signal d apprentissage' })
  async createSignal(@Request() req: RequestWithUser, @Body() dto: CreateLearningSignalDto) {
    return { data: await this.learningService.recordSignal(req.user, dto) };
  }

  @Get('gaps')
  @ApiOperation({ summary: 'Lister les knowledge gaps' })
  async listGaps(@Request() req: RequestWithUser, @Query() query: LearningGapQueryDto) {
    return { data: await this.learningService.listGaps(req.user, query) };
  }

  @Post('gaps/:id/approve')
  @ApiOperation({ summary: 'Approuver un knowledge gap' })
  async approveGap(@Request() req: RequestWithUser, @Param('id') id: string) {
    return { data: await this.learningService.approveGap(req.user, id) };
  }

  @Get('weekly-summary')
  @ApiOperation({ summary: 'Retourner un resume weekly du flywheel learning' })
  async weeklySummary() {
    return { data: await this.weeklyAnalyzerService.generateWeeklySummary() };
  }

  @Post('auto-improve')
  @ApiOperation({ summary: 'Declencher la proposition d ameliorations automatiques' })
  async autoImprove(@Body() body: { limit?: number }) {
    return { data: await this.autoImproverService.proposeTopImprovements(body.limit ?? 10) };
  }
}
