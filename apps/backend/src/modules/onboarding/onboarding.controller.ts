import { Controller, Get, Post, Param, Body, UseGuards, Request, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import { PlaybooksService } from './playbooks.service';

interface AuthRequest {
  user: { id: string };
}

@ApiTags('Onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly playbooksService: PlaybooksService,
  ) {}

  @Get('progress')
  @ApiOperation({ summary: 'Get onboarding progress for current user' })
  @ApiResponse({ status: 200, description: 'Onboarding progress with currentStep and step data' })
  async getProgress(@Request() req: AuthRequest) {
    return this.onboardingService.getProgress(req.user.id);
  }

  @Post('step/:stepNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save onboarding step data' })
  @ApiParam({ name: 'stepNumber', type: Number, description: 'Step number (1-5)' })
  @ApiResponse({ status: 200, description: 'Step saved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid step number or data' })
  async saveStep(
    @Request() req: AuthRequest,
    @Param('stepNumber', ParseIntPipe) stepNumber: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.onboardingService.saveStep(req.user.id, stepNumber, body);
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark onboarding as completed' })
  @ApiResponse({ status: 200, description: 'Onboarding completed' })
  async complete(@Request() req: AuthRequest) {
    return this.onboardingService.complete(req.user.id);
  }

  @Post('skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip onboarding' })
  @ApiResponse({ status: 200, description: 'Onboarding skipped' })
  async skip(@Request() req: AuthRequest) {
    return this.onboardingService.skip(req.user.id);
  }

  @Get('playbooks')
  @ApiOperation({ summary: 'Get all onboarding vertical playbooks' })
  @ApiResponse({ status: 200, description: 'List of vertical playbooks' })
  async getPlaybooks() {
    return { data: this.playbooksService.getAll() };
  }

  @Get('playbooks/:industry')
  @ApiOperation({ summary: 'Get playbook by industry' })
  @ApiParam({ name: 'industry', type: String })
  @ApiResponse({ status: 200, description: 'Vertical playbook' })
  async getPlaybookByIndustry(@Param('industry') industry: string) {
    return { data: this.playbooksService.getByIndustry(industry) };
  }
}
