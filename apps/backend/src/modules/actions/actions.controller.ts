import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RequestWithUser } from '@/common/types/user.types';
import { ExecuteActionDto } from './dto/execute-action.dto';
import { ActionsService } from './actions.service';

@ApiTags('actions')
@Controller('actions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Recuperer le catalogue des actions executables' })
  async catalog() {
    return { data: this.actionsService.listCatalog() };
  }

  @Post('execute')
  @ApiOperation({ summary: 'Executer une action metier' })
  async execute(@Request() req: RequestWithUser, @Body() dto: ExecuteActionDto) {
    return { data: await this.actionsService.execute(req.user, dto) };
  }
}
