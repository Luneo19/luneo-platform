import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RequestWithUser } from '@/common/types/user.types';
import { AutomationService } from './automation.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';

@ApiTags('automation')
@Controller('automation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('workflows')
  @ApiOperation({ summary: 'Lister les workflows de l organisation courante' })
  async list(@Request() req: RequestWithUser) {
    return { data: await this.automationService.list(req.user) };
  }

  @Post('workflows')
  @ApiOperation({ summary: 'Creer un workflow' })
  async create(@Request() req: RequestWithUser, @Body() dto: CreateWorkflowDto) {
    return { data: await this.automationService.create(req.user, dto) };
  }

  @Patch('workflows/:id')
  @ApiOperation({ summary: 'Mettre a jour un workflow' })
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return { data: await this.automationService.update(req.user, id, dto) };
  }

  @Post('workflows/:id/toggle')
  @ApiOperation({ summary: 'Activer/desactiver un workflow' })
  async toggle(@Request() req: RequestWithUser, @Param('id') id: string) {
    return { data: await this.automationService.toggle(req.user, id) };
  }

  @Post('workflows/execute')
  @ApiOperation({ summary: 'Executer un workflow (test runtime)' })
  async execute(@Request() req: RequestWithUser, @Body() dto: ExecuteWorkflowDto) {
    return { data: await this.automationService.execute(req.user, dto) };
  }
}
