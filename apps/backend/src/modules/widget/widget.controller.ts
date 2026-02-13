import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@/common/decorators/public.decorator';
import { WidgetService, DesignData } from './widget.service';
import { ApiKeyGuard } from '../public-api/guards/api-key.guard';
import { SaveWidgetDesignDto } from './dto/save-design.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Widget API')
@Controller('widget')
@UseGuards(JwtAuthGuard)
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  @Get('products/:id')
  @Public() // Public: Called from embedded product widgets
  @ApiOperation({ summary: 'Get product configuration for widget' })
  @ApiResponse({ status: 200, description: 'Product configuration retrieved' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  async getProductConfig(@Param('id') productId: string) {
    return this.widgetService.getProductConfig(productId);
  }

  @Post('designs')
  @Public()
  @ApiOperation({ summary: 'Save design from widget' })
  @ApiResponse({ status: 201, description: 'Design saved successfully' })
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  async saveDesign(
    @Body() dto: SaveWidgetDesignDto,
    @Request() req: Request & { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    return this.widgetService.saveDesign(dto.productId, dto.designData as unknown as DesignData, userId);
  }

  @Get('designs/:id')
  @Public() // Public: Called from embedded product widgets
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Load design with layers' })
  @ApiResponse({ status: 200, description: 'Design loaded successfully' })
  @ApiResponse({ status: 404, description: 'Design not found' })
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  async loadDesign(@Param('id') designId: string) {
    return this.widgetService.loadDesign(designId);
  }
}

