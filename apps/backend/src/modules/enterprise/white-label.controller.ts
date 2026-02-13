/**
 * White-Label API under /white-label (alias for enterprise white-label)
 * POST /white-label/theme, POST /white-label/domain use current user's brandId.
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
  @ApiOperation({ summary: 'Configure custom theme (uses current user brand)' })
  @ApiResponse({ status: 201, description: 'Theme created' })
  async createTheme(@Body() dto: CreateThemeDto, @Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId ?? dto.brandId;
    if (!brandId) throw new BadRequestException('Brand context required');
    return this.whiteLabel.createTheme({ ...dto, brandId });
  }

  @Post('domain')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configure custom domain (uses current user brand)' })
  @ApiResponse({ status: 201, description: 'Domain created' })
  async createDomain(@Body() dto: CreateCustomDomainDto, @Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId ?? dto.brandId;
    if (!brandId) throw new BadRequestException('Brand context required');
    return this.whiteLabel.createCustomDomain({ ...dto, brandId });
  }

  @Get('theme')
  @ApiOperation({ summary: 'Get active theme by brand (for theme provider)' })
  @ApiResponse({ status: 200, description: 'Theme' })
  async getThemeByBrand(@Request() req: ExpressRequest & { query?: { brandId?: string }; user?: CurrentUser }) {
    const brandId = req.query?.brandId ?? req.user?.brandId;
    if (!brandId) throw new BadRequestException('brandId required');
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
