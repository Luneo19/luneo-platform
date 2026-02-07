import { Controller, Get, Post, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { SaveStepDto } from './dto/save-step.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('progress')
  @ApiOperation({ summary: 'Get current onboarding progress' })
  async getProgress(@Req() req: { user: { id: string; brandId?: string | null } }) {
    return this.onboardingService.getProgress(req.user.id, req.user.brandId ?? null);
  }

  @Post('step/:stepNumber')
  @ApiOperation({ summary: 'Save a step (1-5)' })
  async saveStep(
    @Req() req: { user: { id: string; brandId?: string | null } },
    @Param('stepNumber') stepNumber: string,
    @Body() body: SaveStepDto,
  ) {
    const num = parseInt(stepNumber, 10);
    if (Number.isNaN(num) || num < 1 || num > 5) {
      throw new BadRequestException('stepNumber must be 1-5');
    }
    return this.onboardingService.saveStep(
      req.user.id,
      req.user.brandId ?? null,
      num,
      body.data,
    );
  }

  @Post('complete')
  @ApiOperation({ summary: 'Mark onboarding as completed' })
  async complete(@Req() req: { user: { id: string; brandId?: string | null } }) {
    return this.onboardingService.complete(req.user.id, req.user.brandId ?? null);
  }

  @Post('skip')
  @ApiOperation({ summary: 'Skip onboarding with defaults' })
  async skip(@Req() req: { user: { id: string; brandId?: string | null } }) {
    return this.onboardingService.skip(req.user.id, req.user.brandId ?? null);
  }
}
