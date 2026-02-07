import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { OnboardingGuard } from '@/common/guards/onboarding.guard';
import { IndustryConfigGuard } from '@/common/guards/industry-config.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('config')
  @UseGuards(OnboardingGuard, IndustryConfigGuard)
  @ApiOperation({ summary: 'Get merged dashboard config (industry + user preferences)' })
  async getConfig(@Req() req: { user: { id: string; brandId?: string | null } }) {
    return this.dashboardService.getConfig(req.user.id, req.user.brandId ?? null);
  }

  @Get('kpis')
  @UseGuards(OnboardingGuard, IndustryConfigGuard)
  @ApiOperation({ summary: 'Get KPI values for current org' })
  async getKpis(@Req() req: { user: { id: string; brandId?: string | null } }) {
    if (!req.user.brandId) {
      return [];
    }
    return this.dashboardService.getKpiValues(req.user.brandId);
  }

  @Get('widgets/:slug/data')
  @UseGuards(OnboardingGuard, IndustryConfigGuard)
  @ApiOperation({ summary: 'Get data for a specific widget' })
  async getWidgetData(
    @Req() req: { user: { brandId?: string | null } },
    @Param('slug') slug: string,
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('Brand required');
    }
    return this.dashboardService.getWidgetData(req.user.brandId, slug);
  }

  @Patch('preferences')
  @UseGuards(OnboardingGuard, IndustryConfigGuard)
  @ApiOperation({ summary: 'Save user widget/sidebar preferences' })
  async updatePreferences(
    @Req() req: { user: { id: string; brandId?: string | null } },
    @Body() dto: UpdatePreferencesDto,
  ) {
    if (!req.user.brandId) throw new BadRequestException('Brand required');
    const orgId = await this.dashboardService.getOrganizationIdByBrand(req.user.brandId);
    return this.dashboardService.updatePreferences(req.user.id, orgId, dto);
  }

  @Post('preferences/reset')
  @UseGuards(OnboardingGuard, IndustryConfigGuard)
  @ApiOperation({ summary: 'Reset preferences to industry defaults' })
  async resetPreferences(@Req() req: { user: { id: string; brandId?: string | null } }) {
    if (!req.user.brandId) throw new BadRequestException('Brand required');
    const orgId = await this.dashboardService.getOrganizationIdByBrand(req.user.brandId);
    return this.dashboardService.resetPreferences(req.user.id, orgId);
  }
}
