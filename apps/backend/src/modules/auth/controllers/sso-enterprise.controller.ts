/**
 * SSO Enterprise Controller
 * API endpoints for managing SAML and OIDC SSO configurations
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { SSOEnterpriseService, CreateSSODto } from '../services/sso-enterprise.service';
import { UserRole } from '@prisma/client';

@ApiTags('SSO Enterprise')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sso')
export class SSOEnterpriseController {
  constructor(private readonly ssoService: SSOEnterpriseService) {}

  @Post()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BRAND_ADMIN)
  @ApiOperation({ summary: 'Create SSO configuration for a brand' })
  @ApiResponse({ status: 201, description: 'SSO configuration created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid SSO configuration' })
  async createSSOConfiguration(@Body() dto: CreateSSODto, @Request() req: any) {
    // Ensure user can only create SSO for their own brand (unless platform admin)
    if (req.user.role !== UserRole.PLATFORM_ADMIN) {
      dto.brandId = req.user.brandId;
    }

    return this.ssoService.createSSOConfiguration(dto);
  }

  @Get('brand/:brandId')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BRAND_ADMIN)
  @ApiOperation({ summary: 'Get SSO configurations for a brand' })
  @ApiResponse({ status: 200, description: 'SSO configurations retrieved successfully' })
  async getSSOConfigurations(@Param('brandId') brandId: string, @Request() req: any) {
    // Ensure user can only access their own brand (unless platform admin)
    if (req.user.role !== UserRole.PLATFORM_ADMIN) {
      brandId = req.user.brandId;
    }

    const samlConfig = await this.ssoService.getSSOConfiguration(brandId, 'saml');
    const oidcConfig = await this.ssoService.getSSOConfiguration(brandId, 'oidc');

    return {
      success: true,
      data: {
        saml: samlConfig,
        oidc: oidcConfig,
      },
    };
  }

  @Get(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BRAND_ADMIN)
  @ApiOperation({ summary: 'Get SSO configuration by ID' })
  @ApiResponse({ status: 200, description: 'SSO configuration retrieved successfully' })
  async getSSOConfiguration(@Param('id') id: string) {
    // Implementation would fetch from database
    return { success: true, data: null };
  }

  @Put(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BRAND_ADMIN)
  @ApiOperation({ summary: 'Update SSO configuration' })
  @ApiResponse({ status: 200, description: 'SSO configuration updated successfully' })
  async updateSSOConfiguration(
    @Param('id') id: string,
    @Body() updates: Partial<CreateSSODto>,
  ) {
    return this.ssoService.updateSSOConfiguration(id, updates);
  }

  @Delete(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BRAND_ADMIN)
  @ApiOperation({ summary: 'Delete SSO configuration' })
  @ApiResponse({ status: 200, description: 'SSO configuration deleted successfully' })
  async deleteSSOConfiguration(@Param('id') id: string) {
    await this.ssoService.deleteSSOConfiguration(id);
    return { success: true, message: 'SSO configuration deleted' };
  }

  @Post(':id/test')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BRAND_ADMIN)
  @ApiOperation({ summary: 'Test SSO configuration' })
  @ApiResponse({ status: 200, description: 'SSO configuration test completed' })
  async testSSOConfiguration(@Param('id') id: string) {
    return this.ssoService.testSSOConfiguration(id);
  }
}
