/**
 * White-Label API under /white-label (alias for enterprise white-label)
 * POST /white-label/theme, POST /white-label/domain use current user's organizationId (was brandId in V1).
 *
 * V2 NOTE: CustomTheme / CustomDomain models don't exist yet.
 * Endpoints are kept alive but return stubbed / null responses.
 */

import { BadRequestException, Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { WhiteLabelService } from './services/white-label.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { CreateCustomDomainDto } from './dto/create-custom-domain.dto';
import { Request as ExpressRequest } from 'express';
import { CurrentUser } from '@/common/types/user.types';

@ApiTags('white-label')
@Controller('white-label')
@UseGuards(JwtAuthGuard)
export class WhiteLabelController {
  constructor(private readonly whiteLabel: WhiteLabelService) {}

  @Post('theme')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configure custom theme (uses current user organization)' })
  @ApiResponse({ status: 201, description: 'Theme created (stubbed in V2)' })
  async createTheme(@Body() dto: CreateThemeDto, @Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = (req.user as any).organizationId ?? (req.user as any).brandId ?? dto.brandId;
    if (!brandId) throw new BadRequestException('Organization context required');
    return this.whiteLabel.createTheme({ ...dto, brandId });
  }

  @Post('domain')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configure custom domain (uses current user organization)' })
  @ApiResponse({ status: 201, description: 'Domain created (stubbed in V2)' })
  async createDomain(@Body() dto: CreateCustomDomainDto, @Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = (req.user as any).organizationId ?? (req.user as any).brandId ?? dto.brandId;
    if (!brandId) throw new BadRequestException('Organization context required');
    return this.whiteLabel.createCustomDomain({ ...dto, brandId });
  }

  @Get('theme')
  @ApiOperation({ summary: 'Get active theme by organization (for theme provider)' })
  @ApiResponse({ status: 200, description: 'Theme or null' })
  async getThemeByBrand(@Request() req: ExpressRequest & { query?: { brandId?: string }; user?: CurrentUser }) {
    const brandId = req.query?.brandId ?? (req.user as any)?.organizationId ?? (req.user as any)?.brandId;
    if (!brandId) throw new BadRequestException('brandId / organizationId required');
    return this.whiteLabel.getActiveTheme(brandId);
  }

  @Get('theme-by-domain')
  @Public()
  @ApiOperation({ summary: 'Get active theme by custom domain (public, for theme provider)' })
  @ApiResponse({ status: 200, description: 'Theme or null' })
  async getThemeByDomain(@Query('domain') domain: string) {
    return this.whiteLabel.getActiveThemeByDomain(domain ?? '');
  }
}
