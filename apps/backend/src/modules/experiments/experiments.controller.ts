import { Body, Controller, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ExperimentsService, ExperimentVariant } from './experiments.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { Request as ExpressRequest } from 'express';
import { CurrentUser } from '@/common/types/user.types';

@ApiTags('experiments')
@Controller('experiments')
@UseGuards(JwtAuthGuard)
export class ExperimentsController {
  constructor(private readonly experiments: ExperimentsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create experiment' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateExperimentDto) {
    return this.experiments.createExperiment(dto.name, dto.variants as ExperimentVariant[], {
      description: dto.description,
      type: dto.type,
    });
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List experiments' })
  async findAll() {
    return this.experiments.findAll();
  }

  @Get('assignment/:experimentName')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get or create variant assignment for current user' })
  async getAssignment(
    @Param('experimentName') experimentName: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    return this.experiments.getAssignment(req.user.id, experimentName);
  }

  @Get('results/:experimentName')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get experiment results' })
  async getResults(@Param('experimentName') experimentName: string) {
    return this.experiments.getResults(experimentName);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get experiment by id' })
  async findOne(@Param('id') id: string) {
    return this.experiments.findOne(id);
  }

  @Put(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update experiment status (draft|running|paused|completed)' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.experiments.updateStatus(id, body.status);
  }

  @Post('conversion')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record conversion for current user' })
  async recordConversion(
    @Body() body: { experimentName: string; value?: number; sessionId?: string; eventType?: string },
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    return this.experiments.recordConversion(req.user.id, body.experimentName, {
      value: body.value,
      sessionId: body.sessionId,
      eventType: body.eventType,
    });
  }
}
