import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AgentTemplatesService } from './agent-templates.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { AgentCategory, Plan } from '@prisma/client';

@ApiTags('Agent Templates')
@Controller('agent-templates')
@UseGuards(JwtAuthGuard)
export class AgentTemplatesController {
  constructor(private readonly agentTemplatesService: AgentTemplatesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all public agent templates' })
  @ApiResponse({ status: 200, description: 'List of agent templates' })
  @ApiQuery({ name: 'category', enum: AgentCategory, required: false })
  @ApiQuery({ name: 'requiredPlan', enum: Plan, required: false })
  findAll(
    @Query('category') category?: AgentCategory,
    @Query('requiredPlan') requiredPlan?: Plan,
  ) {
    return this.agentTemplatesService.findAll({ category, requiredPlan });
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get an agent template by slug' })
  @ApiResponse({ status: 200, description: 'Agent template details' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.agentTemplatesService.findBySlug(slug);
  }
}
