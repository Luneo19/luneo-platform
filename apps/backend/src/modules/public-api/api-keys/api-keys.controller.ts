import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService, CreateApiKeyDto, UpdateApiKeyDto } from './api-keys.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('API Keys Management')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid API key data' })
  async createApiKey(@Body() createApiKeyDto: CreateApiKeyDto) {
    // Extract brandId from authenticated user context
    const brandId = this.getCurrentBrandId();
    return this.apiKeysService.createApiKey(brandId, createApiKeyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all API keys for the current brand' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  async getApiKeys() {
    const brandId = this.getCurrentBrandId();
    return this.apiKeysService.listApiKeys(brandId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API key by ID' })
  @ApiResponse({ status: 200, description: 'API key retrieved successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async getApiKey(@Param('id') id: string) {
    const brandId = this.getCurrentBrandId();
    return this.apiKeysService.getApiKey(id, brandId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update API key' })
  @ApiResponse({ status: 200, description: 'API key updated successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async updateApiKey(@Param('id') id: string, @Body() updateApiKeyDto: UpdateApiKeyDto) {
    const brandId = this.getCurrentBrandId();
    return this.apiKeysService.updateApiKey(id, brandId, updateApiKeyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete API key' })
  @ApiResponse({ status: 204, description: 'API key deleted successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async deleteApiKey(@Param('id') id: string) {
    const brandId = this.getCurrentBrandId();
    await this.apiKeysService.deleteApiKey(id, brandId);
  }

  @Post(':id/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate API key secret' })
  @ApiResponse({ status: 200, description: 'API key secret regenerated successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async regenerateSecret(@Param('id') id: string) {
    const brandId = this.getCurrentBrandId();
    return this.apiKeysService.regenerateSecret(id, brandId);
  }

  private getCurrentBrandId(): string {
    // This would be extracted from the authenticated user context
    // In a real implementation, this would come from the JWT token or session
    return (global as any).currentBrandId || 'default-brand-id';
  }
}
