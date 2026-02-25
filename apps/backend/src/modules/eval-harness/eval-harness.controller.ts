import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { EvalHarnessService } from './eval-harness.service';
import { EvalScenario } from './golden-set';

class RunEvalDto {
  scenarios?: EvalScenario[];
}

@ApiTags('eval-harness')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('eval-harness')
export class EvalHarnessController {
  constructor(private readonly evalHarnessService: EvalHarnessService) {}

  @Post('run')
  @ApiOperation({ summary: 'Exécuter le golden set de régression IA' })
  @ApiResponse({ status: 201, description: 'Rapport d’évaluation généré' })
  async run(@Body() dto: RunEvalDto) {
    return this.evalHarnessService.runGoldenSet(dto?.scenarios);
  }
}

