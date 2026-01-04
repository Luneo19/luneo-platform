import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WidgetService, DesignData } from './widget.service';
import { ApiKeyGuard } from '../public-api/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Widget API')
@Controller('api/widget')
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product configuration for widget' })
  @ApiResponse({ status: 200, description: 'Product configuration retrieved' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  async getProductConfig(@Param('id') productId: string) {
    return this.widgetService.getProductConfig(productId);
  }

  @Post('designs')
  @ApiOperation({ summary: 'Save design from widget' })
  @ApiResponse({ status: 201, description: 'Design saved successfully' })
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  async saveDesign(
    @Body() body: { productId: string; designData: DesignData },
    @Request() req: Request & { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    return this.widgetService.saveDesign(body.productId, body.designData, userId);
  }

  @Get('designs/:id')
  @ApiOperation({ summary: 'Load design with layers' })
  @ApiResponse({ status: 200, description: 'Design loaded successfully' })
  @ApiResponse({ status: 404, description: 'Design not found' })
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  async loadDesign(@Param('id') designId: string) {
    return this.widgetService.loadDesign(designId);
  }
}

