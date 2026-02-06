import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsService, IntegrationType } from './integrations.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all integrations for the current brand' })
  @ApiResponse({ status: 200, description: 'Integrations retrieved successfully' })
  async getIntegrations(@CurrentUser() user: CurrentUserType) {
    const brandId = this.extractBrandId(user);
    return this.integrationsService.getIntegrations(brandId);
  }

  @Post(':type/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable an integration' })
  @ApiResponse({ status: 200, description: 'Integration enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid integration configuration' })
  async enableIntegration(
    @CurrentUser() user: CurrentUserType,
    @Param('type') type: IntegrationType,
    @Body() config: Record<string, any>,
  ) {
    const brandId = this.extractBrandId(user);
    return this.integrationsService.enableIntegration(brandId, type, config);
  }

  @Delete(':type')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disable an integration' })
  @ApiResponse({ status: 204, description: 'Integration disabled successfully' })
  async disableIntegration(
    @CurrentUser() user: CurrentUserType,
    @Param('type') type: IntegrationType,
  ) {
    const brandId = this.extractBrandId(user);
    await this.integrationsService.disableIntegration(brandId, type);
  }

  @Post(':type/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test integration connection' })
  @ApiResponse({ status: 200, description: 'Integration test completed' })
  async testIntegration(
    @CurrentUser() user: CurrentUserType,
    @Param('type') type: IntegrationType,
    @Body() config: Record<string, any>,
  ) {
    const brandId = this.extractBrandId(user);
    return this.integrationsService.testIntegration(brandId, type, config);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get integration statistics' })
  @ApiResponse({ status: 200, description: 'Integration stats retrieved successfully' })
  async getStats(@CurrentUser() user: CurrentUserType) {
    const brandId = this.extractBrandId(user);
    return this.integrationsService.getIntegrationStats(brandId);
  }

  /**
   * API-04: Extract brandId from authenticated user (not global)
   */
  private extractBrandId(user: CurrentUserType): string {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand to manage integrations');
    }
    return user.brandId;
  }
}



