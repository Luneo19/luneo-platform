// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuickWinsService } from './quick-wins.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@/common/compat/v1-enums';

@Controller('orion/quick-wins')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class QuickWinsController {
  constructor(private readonly quickWinsService: QuickWinsService) {}

  @Get('status')
  getStatus() {
    return this.quickWinsService.getStatus();
  }

  @Post('welcome-setup')
  setupWelcome() {
    return this.quickWinsService.setupWelcomeAutomation();
  }

  @Get('low-credits')
  getLowCredits() {
    return this.quickWinsService.checkLowCredits();
  }

  @Get('inactive')
  getInactive(@Query('days') days?: string) {
    const daysThreshold = days ? parseInt(days, 10) : 14;
    return this.quickWinsService.checkInactiveUsers(
      Number.isNaN(daysThreshold) ? 14 : daysThreshold,
    );
  }

  @Get('trial-ending')
  getTrialEnding() {
    return this.quickWinsService.checkTrialEnding();
  }
}
