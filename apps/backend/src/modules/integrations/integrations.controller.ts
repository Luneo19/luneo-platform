import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsService, IntegrationType } from './integrations.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all integrations for the current brand' })
  @ApiResponse({ status: 200, description: 'Integrations retrieved successfully' })
  async getIntegrations() {
    const brandId = this.getCurrentBrandId();
    return this.integrationsService.getIntegrations(brandId);
  }

  @Post(':type/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable an integration' })
  @ApiResponse({ status: 200, description: 'Integration enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid integration configuration' })
  async enableIntegration(
    @Param('type') type: IntegrationType,
    @Body() config: Record<string, any>,
  ) {
    const brandId = this.getCurrentBrandId();
    return this.integrationsService.enableIntegration(brandId, type, config);
  }

  @Delete(':type')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disable an integration' })
  @ApiResponse({ status: 204, description: 'Integration disabled successfully' })
  async disableIntegration(@Param('type') type: IntegrationType) {
    const brandId = this.getCurrentBrandId();
    await this.integrationsService.disableIntegration(brandId, type);
  }

  @Post(':type/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test integration connection' })
  @ApiResponse({ status: 200, description: 'Integration test completed' })
  async testIntegration(
    @Param('type') type: IntegrationType,
    @Body() config: Record<string, any>,
  ) {
    const brandId = this.getCurrentBrandId();
    return this.integrationsService.testIntegration(brandId, type, config);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get integration statistics' })
  @ApiResponse({ status: 200, description: 'Integration stats retrieved successfully' })
  async getStats() {
    const brandId = this.getCurrentBrandId();
    return this.integrationsService.getIntegrationStats(brandId);
  }

  private getCurrentBrandId(): string {
    return (global as any).currentBrandId || 'default-brand-id';
  }
}



